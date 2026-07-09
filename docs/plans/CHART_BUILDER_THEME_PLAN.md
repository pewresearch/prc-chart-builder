---
title: "feat: Chart Builder theme (PRC-528 / chart.json)"
linear: PRC-528
status: complete
date: 2026-06-29
progress: "Slices 1–16 landed; PRC-528 theme complete"
---

# Chart Builder Theme / chart.json (PRC-528)

> **Canonical master plan** for the per-site chart theme. **Slices 1–16 are landed** (PRC-528 theme complete).

Linear: [PRC-528](https://linear.app/pewresearch/issue/PRC-528/settings-panel-chartjson)

## How this plan is structured (read first)

Per the always-on anti-horizontal-slicing rule, this is **not** a sequence of "build layer, then test layer" phases. It is an ordered list of **vertical tracer-bullet slices**. Each slice:

- Touches the full stack it needs (option/storage -> PHP delivery -> JS resolve -> render -> UI) for **one** behavior.
- Is built **test-first**: write one failing test (RED), make it pass (GREEN), then let what you learned shape the next slice. Never write a slice's whole test set up front, then its whole implementation.
- Ends green and is **independently shippable** (its own changeset).

Slice 1 is the skeleton: it proves the entire wire end-to-end with minimal new code by reusing the Phase 0 resolve layer. Every later slice thickens one capability.

**Progress (2026-07): slices 1–16 landed.** PRC-528 chart theme is complete.

## Slice status

| Slice | Summary | Status |
| --- | --- | --- |
| 0 | Resolve layer + `DEFAULT_FONT_FAMILY` | Done |
| 1 | Option + `window.prcChartBuilderTheme` delivery | Done |
| 2 | Palette delivery end-to-end | Done |
| 3 | Editor default-injection (layout pilot) | Done |
| 4 | Server default-injection parity | Done |
| 5 | Curated groups default-injection | Done |
| 6 | De-Pew-ify defaults + font fallbacks | Done |
| 7 | REST GET `/theme` | Done |
| 8 | REST POST + validate + cache purge | Done |
| 9 | Legacy theme seeder + CLI | Done |
| 10 | Genericize shipped defaults | Done |
| 11 | Read-only theme admin UI | Done |
| 12 | One editable field (layout padding top) | Done |
| 13 | Config grid + field registry + reset | Done |
| 14 | Palette designer UI | Done |
| 15 | Per-role typography pickers | Done |
| 16 | Release hardening | Done |

## Mental model: three buckets (not full Global Styles)

A single **active chart theme per site**, but deliberately NOT the full Global Styles "deviation-tracking" model. Behavior splits into three consistent buckets, each matching how a designer expects a theme to behave:

1. **Bucket 1 - Fonts live in theme.json and percolate.** The actual font families/webfonts are owned by [theme.json](../../../../themes/prc-design-system/theme.json) `typography.fontFamilies` (`sans-serif`, `serif`, `georgia`). A chart names a family; the browser loads whatever theme.json provides, so swapping the webfont behind a family re-skins every chart for free via the CSS cascade. The chart theme owns **no** font definitions.
2. **Bucket 2 - Palettes are retroactive named tokens.** Indirected through `io.colorValue` -> palette lookup at render, so redefining a palette re-skins every chart referencing it by name (`io.customColors` opts out). This is the only intentionally-retroactive chart-theme value.
3. **Bucket 3 - Base config applies to NEW charts only.** Everything in `theme.config` (layout, axes, and **per-role `fontFamily`**) is injected as a default at insert (slices 3-5). Existing charts keep their saved attributes, so changing a default never causes "unanticipated displays" on already-published charts. Render uses the **static shipped base** (not live `theme.config`) so missing keys on legacy charts fall back to shipped defaults.

Why this matters for ordering: block attributes carry block.json defaults explicitly, and in `get-config.js` (`{ ...baseConfig.x, ...attributes.x }`) **attributes win** over static base. So base config (Bucket 3) is observable only on **new** charts via default-injection (slices 3-5); it does not re-skin existing charts. Palette-by-name (Bucket 2, slice 2) is the one that re-skins existing charts at render. Fonts (Bucket 1) re-skin existing charts at the theme.json/webfont level **and** when charts store preset tokens (see below).

### Font preset tokens (palette-by-name for typography)

Per-role `fontFamily` values are stored as **WordPress preset tokens** (`var:preset|font-family|<slug>`), not concrete stacks. At render, `resolveFontFamily()` in [resolve-font-family.js](../../src/chart/utils/resolve-font-family.js) expands tokens to var-free stacks using `window.prcChartBuilderTheme.fontFamilies` (delivered from theme.json on every request). This mirrors palette-by-name for colors:

- **Token in saved attributes** → resolves live from theme.json → redefining a slug's stack re-skins every chart referencing that token (Bucket 1 lever).
- **Literal custom stack** → passthrough unchanged → editor intent preserved.
- **Missing key on legacy charts** → static `DEFAULT_FONT_FAMILY` shipped fallback (Bucket 3 guard).

The theme editor font picker stores tokens; new charts freeze the token at insert. Chart-theme per-role changes remain new-charts-only (the token choice is frozen, not the resolved stack). Legacy literal stacks can be migrated to tokens via `wp prc-chart-builder font-tokens-audit` / `font-tokens-migrate --dry-run`.

Token helpers: [font-family-tokens.js](../../src/chart/utils/font-family-tokens.js). Migration utilities: [class-theme-font-tokens-migration.php](../../includes/settings/class-theme-font-tokens-migration.php) (CLI: `WP_CLI_Commands::font_tokens_audit` / `font_tokens_migrate`).

## Storage & guardrails

- Per-site `wp_option` `prc_chart_builder_theme`, shape `{ config: PartialAttributes, palettes: {...} }`. `config` carries per-role `fontFamily` defaults (Bucket 3); there is **no** separate single-font `typography` token. DB-backed (VIP plugin FS is read-only; the ticket's `chart.json` is conceptual).
- **Zero render change for existing Pew charts:** ship genericized fallbacks (slice 10) only AFTER seeding the active theme from a frozen snapshot of today's PRC values (slice 9). Empty/unseeded option == today's shipped behavior at every slice.
- One active theme; structure option + REST so a multi-theme switcher can layer on later.
- **Access control (admins + designers only):** the theme editor and its write path are gated on the `edit_theme_options` capability. In [user-roles.json](../../../../client-mu-plugins/user-roles.json) the `designer` role inherits `editor` and adds `edit_theme_options`; core grants it to `administrator`. Editors/authors/contributors ("writers") do NOT have it, so they cannot view or change the active theme. Use `current_user_can( 'edit_theme_options' )` for the admin menu cap (slice 11), the REST GET permission (slice 7), and the REST POST permission (slice 8) — NOT `manage_options` (admin-only; would lock out designers). Delivery of `window.prcChartBuilderTheme` (slice 1) stays unauthenticated — it is read-only render data already public in chart output; only editing is gated.

## Key existing files

- Resolve layer (DONE): [resolve-defaults.js](../../src/chart/utils/resolve-defaults.js); consumed by [get-config.js](../../src/chart/utils/get-config.js) and [color-controls.jsx](../../src/chart/edit/color-controls.jsx).
- Shipped config default: [baseConfig.ts](../../../../plugins/prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/baseConfig.ts).
- Shipped palettes: [colors.js](../../src/chart/utils/colors.js).
- Frontend path: [view.js](../../src/chart/view.js) -> [build-chart-inputs.js](../../src/chart/utils/build-chart-inputs.js).
- Attribute surface / defaults: [chart/block.json](../../src/chart/block.json).
- Pew-default sources to de-Pew-ify: [trait-chart-block-defaults.php](../../includes/trait-chart-block-defaults.php).
- Bootstrap: [class-plugin-bootstrap.php](../../includes/class-plugin-bootstrap.php).
- Theme editor (slices 11–15): [src/settings/](../../src/settings/), [class-theme-admin.php](../../includes/settings/class-theme-admin.php), [class-theme-rest-controller.php](../../includes/settings/class-theme-rest-controller.php).
- Config attribute docs (field descriptions): [README.md Configuration Reference](../../README.md) (Attribute / Type / Default / Notes tables per group).
- Settings-page infra: `@prc/components` settings-page; precedents in `prc-block-bits`, `prc-social-builder`.

## Theme editor UI (slices 11–15)

Agreed UX for the Chart Theme admin page (`Charts > Chart Theme`, `edit_theme_options` only):

### Structure

- **Accordions** = curated `theme.config` groups (`Theme_Block_Defaults::CURATED_THEME_CONFIG_GROUPS`), nested object shape preserved.
- **Inside each accordion** = indented **table/grid** (one row per dot-path, e.g. `padding.top`).
- **Palettes** = separate **Color Settings** tab with the palette designer (slice 14, done). Do **not** mix `theme.palettes` into the config grid.

### Table columns

| Column | Source |
| --- | --- |
| Attribute name | Dot-path (`layout.padding.top`), indented for nesting |
| Value | Control by inferred type (toggle, number, select, text, color, range pair, read-only for non-themeable) |
| Type | Inferred from shipped default (`boolean`, `number`, `string`, `array`, `object`, …) |
| Description | Field registry seeded from [README.md](../../README.md) Configuration Reference **Notes** column |

Implementation backbone: **`chart-theme-field-registry`** (JSON/TS), keyed by dot-path, extended one curated group per slice-13 cycle. Mark paths `themeable: false` for internals (`layout.name`), functions (`customLabelFormat`), and complex arrays deferred to advanced/JSON UI.

### Save model (unified draft)

- **One Redux draft** holds the full theme (`config` + `palettes`) after REST GET.
- **Any Save** — section footer **or** global page save — POSTs the **entire** current draft to `POST /prc-chart-builder/v1/theme` (same operation; different entry points). Editing layout then metadata then Save in metadata must persist **both** sections.
- **Page-level dirty state** (“unsaved changes”), not per-accordion.
- After save, re-hydrate store from POST response (existing `createSettingsClient` pattern).
- Label consistently: **“Save changes”** (not section-scoped names like “Save layout defaults”).

### Empty = inherit shipped default

- Cleared/blank control → **omit** that key from `theme.config.{group}` before POST (deep-unset), not write `null`/`""`.
- UI shows shipped default (`block.json`) as placeholder or “Default: …” hint.
- Override indicator when stored theme value ≠ shipped default.
- **Reset to shipped default** (slice 13) = remove override key(s), same as clear.

### Control hints (by type)

- `boolean` → Toggle; `number` → NumberControl; enum `string` → SelectControl; `font` → theme.json family SelectControl; plain `string` → TextControl; color-like keys → color picker; `[min,max]` domain → pair of numbers; unsupported/function/complex array → read-only or nested sub-table later.

### Typography (slice 15)

- Per-role **`fontFamily` fields in the existing config grid** use a `font` control type: SelectControl options from `theme.json` `typography.fontFamilies` (delivered via `window.prcChartBuilderThemeEditor.fontFamilies`, var-free stacks). Same unified save; new charts only (Bucket 3).

## Testing harness (per-slice toolbox)

- **JS unit (Jest):** `npm test -w @prc/chart-builder` -> [jest.config.js](../../jest.config.js), specs in `tests/unit/*.test.js`.
- **PHPUnit:** [phpunit.xml.dist](../../phpunit.xml.dist); new tests in `tests/test-*.php`.
- **E2E (Playwright):** root [playwright.config.js](../../../../playwright.config.js); VIP dev-env preferred for theme admin verification.

---

## Slice 1 - Skeleton tracer bullet: option + delivery

- [class-settings.php](../../includes/settings/class-settings.php): `get_active_theme()` + `window.prcChartBuilderTheme` on `wp_head` / `admin_head`.
- **STATUS (DONE):** landed. PHPUnit [test-theme-settings.php](../../tests/test-theme-settings.php).

## Slice 2 - Palette token end-to-end

- **STATUS (DONE):** [theme-palette-delivery.test.js](../../tests/unit/theme-palette-delivery.test.js).

## Slice 3 - Theme as default source: editor

- **STATUS (DONE):** [apply-theme-block-defaults.js](../../src/chart/utils/apply-theme-block-defaults.js).

## Slice 4 - Server parity

- **STATUS (DONE):** [class-theme-block-defaults.php](../../includes/settings/class-theme-block-defaults.php).

## Slice 5 - Curated default-injection

- **STATUS (DONE):** editor + server loop over curated groups.

## Slice 6 - De-Pew-ify defaults

- **STATUS (DONE):** trait + AI/import fallbacks; charting-library font audit.

## Slice 7 - REST GET

- **STATUS (DONE):** [class-theme-rest-controller.php](../../includes/settings/class-theme-rest-controller.php).

## Slice 8 - REST POST

- **STATUS (DONE):** Theme_Validator + cache invalidator.

## Slice 9 - Legacy seeder

- **STATUS (DONE):** [prc-legacy-theme.json](../../includes/settings/prc-legacy-theme.json), `wp prc-chart-builder seed-theme` / `repair-theme`.

## Slice 10 - Genericize shipped defaults

- **STATUS (DONE):** neutral shipped defaults; legacy seeder preserves PRC look.

## Slice 11 - Read-only theme admin UI

- **STATUS (DONE):** [src/settings/](../../src/settings/), Charts > Chart Theme.

## Slice 12 - Edit one field end-to-end

- **STATUS (DONE):** `layout.padding.top` + full theme POST.

## Slice 13 - Config grid + field registry + reset (**DONE**)

- Indented table per accordion; unified save via `GlobalSaveBar` + section footers; empty inherits shipped default; reset per row.
- **`bin/sync-field-registry.mjs`** keeps `README.md` Configuration Reference, `block.json`, and `field-registry/generated.json` aligned. Runs automatically before `build:settings` / `start:settings`.
- All curated `theme.config` groups wired to `ConfigGroupGrid`. Schema-owned groups source enums/types from `field-registry/schema.mjs`; un-migrated groups render as empty sections (no README backstop).
- Palettes live on the dedicated Color Settings tab (slice 14), not in the config grid.

## Slice 13a - Editor attribute schema as sole source of truth (**DONE, tracer: layout + legend + shapes**)

Superseded both the README-parsing pipeline and the earlier "TS oracle" experiment (which sourced `type`/`enum` from the runtime `charting-utilities/types/*.ts`). The runtime types are the wrong master for the editor: they serve the frontend and legitimately diverge (e.g. `legend.fontWeight` is `string` at runtime), so deriving editor controls from them dropped curated selects. README prose is documentation, not a schema, and using it as a backstop made the panel's contents impossible to cross-check against any single file.

- **`src/settings/field-registry/schema.mjs`** is the authored, editor-facing source of truth: dot-path → `{ type, enum?, themeable, description }`. `type: 'enum'` compiles to a `string` field + `enum` array (the control vocabulary). It is free to be stricter than runtime — `legend.fontWeight` is an editor enum (`'normal' | 'bold'`) that `get-config.js` still merges down to a runtime string.
- **Three shapes, three owners:** `block.json` owns default _values_; `schema.mjs` owns _editor behavior_; `charting-utilities/types/*.ts` owns the _runtime_ config. No file serves all three.
- **Pipeline:** schema → `validate-schema.mjs` (parity ⊆/⊇ `block.json` defaults + enum-default membership + scalar-kind checks) → `generated.json` (settings panel) + README Configuration Reference table (generated, spliced in place; only the table snippet is run through Prettier). README is an _output_ for schema-owned groups, never an input.
- **No README backstop:** `generated.json` is built entirely from `schema.mjs`. Curated groups not yet migrated render as empty panel sections by design, so the schema is exactly what the panel shows (1:1, trivially cross-checkable). The README-parsing modules (`parse-readme.mjs`, `build-registry.mjs`) and the TS-oracle stack were removed.
- **Fail-loudly:** the canonical `build` runs `sync --check` before the settings webpack; any schema ↔ block.json drift aborts the build. `build:settings` / `start:settings` write the outputs during development.
- **Excluding fields:** mark a field `themeable: false` to keep it visible-but-locked (e.g. `tooltip.rlsFormat`, the entire `shapes` group). The parity guard still forces every block.json path to be acknowledged, so nothing falls through silently.
- Result for `legend`: full enum unions, `borderStroke` corrected to a `color` picker, and `fontWeight` restored as an editor enum (the regression that motivated the pivot).
- Result for `layout`: full `type`/`overflowX` enum lists authored in the schema (replacing the runtime `overrides.js` + `layout-enums.js` patch layer).
- Result for `shapes`: all paths present and locked (`themeable: false`) — per-chart override buckets, not theme defaults.
- All curated groups are now in `schema.mjs` (empty panel sections are gone).

## Slice 14 - Palette designer (**DONE**)

- **STATUS (DONE):** dedicated **Color Settings** tab on Charts > Chart Theme — create / rename (live slug rekey) / delete (confirm dialog) / reorder / pick swatches from localized `theme.json` palette; unified full-theme POST. Components: `palette-designer.jsx`, `palette-editor.jsx`, `palette-list.jsx`.
- **Delete guard:** slug re-type confirmation only (slice 14); reference-count blocking not implemented.

## Slice 15 - Typography: inline font selects (**DONE**)

- Per-role `fontFamily` leaves in the config grid (`legend`, `labels`, axis tick/label, `tooltip`, diverging-bar net labels) use `type: 'font'` selects populated from theme.json; PHP resolves preset CSS vars to concrete stacks; persisted to `theme.config` (new charts only).

## Slice 16 - Release hardening (**DONE**)

- **Smoke tests:** [theme-release-hardening.test.js](../../tests/unit/theme-release-hardening.test.js) — Distributor cross-site palette-by-name (destination theme resolves same slug); serif preset token resolves in `getConfig` legend path.
- **Docs:** Chart Theme section in [README.md](../../README.md); test commands documented. Palette delete uses slug re-type confirmation (slice 14).

## Notes / risks

- Deep-merge treats arrays as replace; palette/config arrays overwrite wholesale.
- Use `window.prcChartBuilderTheme` (distinct from `window.prcChartBuilder` debug surface).
- **Canvas-measurement constraint:** per-role `fontFamily` must be a concrete family stack, not a CSS var / slug.
- **Bucket boundaries:** base config is new-charts-only; only palette-by-name re-skins existing charts.
