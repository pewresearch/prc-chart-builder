# Server-Side Migration Analysis

**Date**: December 4, 2025
**Issue**: Need for PHP/Server-Side Migration Strategy
**Status**: ⚠️ **NOT IN CURRENT PLAN**

---

## Problem

The current migration strategy relies **entirely** on WordPress's block deprecation system, which only runs when:

1. A block is **loaded in the editor**
2. A user **manually opens and saves** each chart

### Limitations

| Scenario                   | Works?    | Issue                        |
| -------------------------- | --------- | ---------------------------- |
| User edits chart in editor | ✅ Yes    | Migration runs automatically |
| Chart displays on frontend | ❌ **NO** | Deprecation doesn't run      |
| REST API requests          | ❌ **NO** | Deprecation doesn't run      |
| Programmatic block parsing | ❌ **NO** | Deprecation doesn't run      |
| Bulk operations            | ❌ **NO** | Requires manual editing      |

---

## Current Architecture

```
Frontend Request
       ↓
   WordPress renders post
       ↓
   parse_blocks() [PHP]
       ↓
   Block attributes used AS-IS
       ↓
   ❌ Flat v1 attributes sent to view.js
       ↓
   Chart fails or renders incorrectly
```

### The Deprecation Gap

WordPress block deprecation **ONLY** runs in the **Block Editor** (Gutenberg):

```javascript
// This ONLY runs in the editor:
registerBlockType('prc-chart-builder/chart', {
	deprecated: [v1Deprecation], // ← Never runs on frontend
	// ...
});
```

---

## Impact Assessment

### Affected Charts

Based on the spec:

- **Hundreds** of existing chart blocks use v1 (flat attributes)
- These charts **must** continue working on the frontend
- Users won't manually edit all charts

### What Breaks

**Frontend Rendering**:

- `get-config.js` expects nested attributes
- v1 blocks send flat attributes
- Chart rendering fails with missing/incorrect data

**REST API**:

- Block data returned with v1 attributes
- API consumers expect v2 structure
- Integration breaks

**Search & Programmatic Access**:

- Any code parsing block content gets v1 format
- No migration happens
- Data structure mismatches

---

## Solution Options

### Option 1: Server-Side Migration Hook (Recommended)

Add a PHP filter that runs during block parsing to migrate v1 → v2 **before** rendering.

**Pros**:

- ✅ Works on frontend, REST API, everywhere
- ✅ No manual intervention required
- ✅ Transparent to users
- ✅ Backward compatible

**Cons**:

- ⚠️ Adds server-side processing overhead
- ⚠️ Requires PHP implementation of migration logic
- ⚠️ Must keep PHP and JS migration in sync

**Implementation**:

```php
// Add filter to migrate blocks during parsing
add_filter('render_block', 'migrate_chart_block_v1_to_v2', 10, 2);

function migrate_chart_block_v1_to_v2($block_content, $block) {
  if ('prc-chart-builder/chart' !== $block['blockName']) {
    return $block_content;
  }

  $attrs = $block['attrs'];

  // Check if v1 (no _version or _version === 'v1')
  if (!isset($attrs['_version']) || $attrs['_version'] === 'v1') {
    // Migrate flat → nested
    $attrs = migrate_to_nested_structure($attrs);

    // Re-render with migrated attributes
    return render_chart_with_nested_attrs($attrs);
  }

  return $block_content;
}
```

---

### Option 2: WP-CLI Batch Migration Command

Create a WP-CLI command to migrate all charts programmatically.

**Pros**:

- ✅ One-time migration of all charts
- ✅ Can be run during deployment
- ✅ Permanent fix (saves migrated data)

**Cons**:

- ⚠️ Requires manual execution
- ⚠️ Doesn't help with old cached content
- ⚠️ Risk if migration has bugs

**Implementation**:

```php
// wp chart-builder migrate-to-v2 [--dry-run]
class Chart_Migration_Command {
  public function migrate_to_v2($args, $assoc_args) {
    $dry_run = isset($assoc_args['dry-run']);

    // Find all posts with chart blocks
    $posts = get_posts(['post_type' => 'any', 'numberposts' => -1]);

    foreach ($posts as $post) {
      // Parse blocks
      $blocks = parse_blocks($post->post_content);

      // Migrate chart blocks
      $migrated = migrate_chart_blocks_in_content($blocks);

      if (!$dry_run) {
        wp_update_post([
          'ID' => $post->ID,
          'post_content' => serialize_blocks($migrated)
        ]);
      }
    }
  }
}
```

---

### Option 3: Hybrid Approach (Best)

Combine both strategies:

1. **Server-side filter** - Immediate solution for frontend rendering
2. **WP-CLI command** - Permanent migration for optimization

**Timeline**:

```
Phase 1 (MVP): Server-side filter only
  ↓ Charts work everywhere immediately
  ↓ No performance issues (filter is fast)

Phase 2 (Later): Add WP-CLI command
  ↓ Migrate all charts permanently
  ↓ Remove server-side filter after migration complete
```

---

## Recommended Additions to Task List

### New Phase 3.5: Server-Side Migration

Add after T061 (before Phase 4):

```markdown
### Server-Side Migration Support

**Purpose**: Enable migration on frontend and REST API, not just in editor

- [ ] T061a [US1] Create PHP migration class in includes/class-block-migration.php
- [ ] T061b [US1] Implement PHP migrate_to_nested() function matching v1.js logic
- [ ] T061c [US1] Add render_block filter to auto-migrate v1 blocks during rendering
- [ ] T061d [US1] Add block_type_metadata filter to migrate REST API responses
- [ ] T061e [US1] Test frontend rendering with v1 blocks (should auto-migrate)
- [ ] T061f [US1] Test REST API with v1 blocks (should return v2 structure)
- [ ] T061g [US1] Add performance monitoring for migration filter
```

### New Phase 8: Batch Migration (Optional)

Add after Phase 7:

```markdown
## Phase 8: Batch Migration (Optional)

**Purpose**: Permanent migration of all existing charts

- [ ] T141 Create WP-CLI command class in includes/class-wp-cli-commands.php
- [ ] T142 Implement `wp chart-builder migrate-to-v2` command
- [ ] T143 Add --dry-run flag for testing without modifications
- [ ] T144 Add --post-id flag for single post migration
- [ ] T145 Add progress reporting and error handling
- [ ] T146 Test migration command on staging with sample charts
- [ ] T147 Document migration command in MIGRATION.md
- [ ] T148 Run migration on production (scheduled maintenance window)
```

---

## Migration Logic Parity

### Critical Requirement

PHP migration **MUST** produce **identical** output to JavaScript migration:

| Input                   | JavaScript (v1.js)                  | PHP (class-block-migration.php)     | Match? |
| ----------------------- | ----------------------------------- | ----------------------------------- | ------ |
| `{xAxisActive: true}`   | `{independentAxis: {active: true}}` | `{independentAxis: {active: true}}` | ✅     |
| `{customColors: [...]}` | `{colors: [...]}`                   | `{colors: [...]}`                   | ✅     |
| All 232 attributes      | Nested v2 structure                 | **MUST MATCH**                      | ⚠️     |

### Testing Strategy

1. Create shared test fixtures (JSON files)
2. Run same fixtures through both migrations
3. Assert output is identical
4. Add to CI/CD pipeline

---

## Performance Considerations

### Server-Side Filter

```php
// Fast path: Skip migration if already v2
if (isset($attrs['_version']) && $attrs['_version'] === 'v2') {
  return $block_content; // No overhead
}

// Migration path: Only runs for v1 blocks
// Executes 1x per page load, then cached
```

**Impact**:

- v2 blocks: ~0ms overhead (early return)
- v1 blocks: ~1-5ms migration + render
- Acceptable for production use

### After Batch Migration

Once all charts migrated via WP-CLI:

- Remove server-side filter
- All blocks are v2
- Zero overhead

---

## Recommendation

**Implement Option 3 (Hybrid)**:

1. **NOW (Phase 3.5)**: Add server-side migration filter
    - Tasks T061a-T061g (~4 hours)
    - Enables frontend/API immediately
    - Critical for MVP

2. **LATER (Phase 8)**: Add WP-CLI batch command
    - Tasks T141-T148 (~3 hours)
    - Optional optimization
    - Can be done post-launch

---

## Files to Create

1. **`includes/class-block-migration.php`**
    - PHP class with `migrate_to_nested()` method
    - Matches JavaScript v1.js migration logic
    - Used by both filter and WP-CLI

2. **Test fixtures** (shared)
    - JSON files with v1 attributes
    - Used by both JS and PHP tests
    - Ensures parity

3. **`includes/class-wp-cli-commands.php`** (if exists, extend)
    - Add migration command
    - Batch processing logic

---

## Success Criteria

- [ ] v1 charts render correctly on frontend without editor
- [ ] REST API returns v2 structure for v1 blocks
- [ ] No performance degradation on page load
- [ ] PHP and JS migrations produce identical output
- [ ] All existing charts work everywhere (editor, frontend, API)

---

## Next Steps

1. ✅ Update tasks.md with Phase 3.5
2. ⏭️ Implement T061a: Create PHP migration class
3. ⏭️ Add server-side filter for immediate fix
4. ⏭️ Test with production-like data
