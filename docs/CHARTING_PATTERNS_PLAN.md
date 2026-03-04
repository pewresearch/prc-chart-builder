# Charting Library — Block Patterns Plan

## Goal

Build a library of pre-configured, ready-to-use charts (customized colors, axes, sizing, etc.) that designers and developers can drop into posts as starting points for new charts. Modifications to a chart after insertion should be fully independent — no sync back to the source.

---

## Chosen Approach: Unsynced Block Patterns

### What They Are

Unsynced patterns are WordPress block patterns that act as **one-time copies**. When a user inserts a pattern, they receive a fully independent instance. Edits to the source pattern have zero effect on already-inserted copies.

### Why This Fits

| Requirement | Unsynced Pattern Behavior |
|---|---|
| Drop-in starting points | Yes — insert and own immediately |
| Customize colors, axes, size freely | Yes — no constraints after insertion |
| Source updates don't affect existing charts | Yes — instances are fully decoupled |
| Discoverable in the block inserter | Yes — organized by category |

### Why Not Synced / Partially Synced

- **Synced patterns** (`wp:block`) — all instances update when the source changes. Useful for legal disclaimers or global UI elements, not for charts where post-insertion divergence is expected and intentional.
- **Partially synced** (`contentOnly` lock or Block Bindings) — structure stays synced, only content is editable. Only worth considering if charts need to pull data dynamically from an API at render time. Not applicable to a static chart library.

---

## Authoring Workflow (Designer-Driven)

Designers build and save patterns entirely within the WordPress admin — no PHP required.

### Step-by-Step

1. **Build** the chart in the block editor (post, page, or Site Editor)
2. **Select** all the chart blocks
3. **Create pattern** via the block toolbar (three-dot menu → "Create pattern")
4. **Name** it descriptively (e.g., "Bar Chart — Dark Theme")
5. **Set sync to "Not synced"** (unsynced)
6. **Assign a category** (e.g., `charts`) for inserter organization
7. Pattern is saved to the database (`wp_block` post type, `wp_pattern_sync_status = 'unsynced'`) and immediately available in the inserter sitewide

Patterns can also be created and managed directly in **Appearance → Editor → Patterns** without needing to be inside a specific post.

---

## Integration with the Chart Gallery

User-created unsynced patterns appear in the **"Add New Chart" modal** inside the DataViews gallery (`Library (BETA)` admin page). The modal fetches patterns at runtime via two concurrent REST API calls:

1. `/wp/v2/wp_pattern_category` — fetches all pattern categories and builds a slug→ID map
2. `/wp/v2/blocks?per_page=100&context=edit` — fetches all saved `wp_block` posts (user-created patterns)

Patterns are then filtered client-side: only patterns whose `wp_pattern_category` terms include a category matching the selected chart type slug are shown in Step 2 of the modal.

### Pattern Category Naming Convention

For a pattern to appear under a given chart type in the modal, assign it a category whose slug matches the chart type slug exactly (e.g., `bar`, `sankey`, `map-usa`). PHP registers these categories via `register_block_pattern_category()` in `includes/class-chart-patterns.php` so they appear as options in the editor UI.

### The "Blank" Option

The modal always shows a **Blank** card first in the pattern picker. Selecting it serializes the matching variation template from `.shared/variation-templates/` directly into a new chart post — no saved pattern required. This is the "start from scratch" path.

---

## Promoting Patterns to Code (Optional)

Database-stored patterns and file-based PHP patterns coexist in WordPress — both appear in the inserter. Once a chart pattern is polished and approved, it can be moved to version control:

1. Developer exports the pattern from the database to a PHP file using the **`create-block-theme`** plugin (already present in this repo at `plugins/create-block-theme/`)
2. PHP file lands in the appropriate `/patterns/` directory (theme or plugin)
3. Pattern is now version-controlled and deployable across environments

> **Note:** PHP-registered file-based patterns do **not** appear in the "Add New Chart" modal. The modal intentionally queries only `wp_block` (database-stored) patterns so the gallery reflects what editors have curated in the current environment. File-based patterns continue to appear in the standard block inserter.

---

## Summary

| Phase | Who | Where |
|---|---|---|
| Build & iterate | Designer | Block editor / Site Editor |
| Save as unsynced pattern | Designer | "Create pattern" UI — assign category matching chart type slug |
| Available in modal | Anyone | "Add New Chart" modal Step 2 |
| Available in inserter | Anyone | Block inserter (Patterns tab) |
| Promote to codebase (optional) | Developer | `create-block-theme` export → `/patterns/` PHP file |
| Version control & deploy | Developer | Git |
