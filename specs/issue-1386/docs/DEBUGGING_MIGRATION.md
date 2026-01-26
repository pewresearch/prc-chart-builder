# Debugging Server-Side Migration

**Date**: December 4, 2025
**Purpose**: Track attribute flow through server-side migration using Query Monitor

---

## 🔍 Query Monitor Debug Points

The migration system now includes comprehensive Query Monitor debugging at these key points:

### 1. **Render Callback Entry** (`src/chart/class-chart.php`)

**Location**: Start of `render_block_callback()`

**Debug Output**:

```
=== CHART RENDER START ===
Incoming _version: [value or "NOT SET"]
Incoming chartType: [value or "NOT SET"]
Has nested layout?: [YES/NO]
Has nested metadata?: [YES/NO]
Has flat metaTitle?: [YES/NO]
Total attribute keys: [count]
```

**What to check**:

- If `_version` is already `v2`, migration should be skipped
- If nested `layout` and `metadata` exist, it's already v2
- If flat attributes like `metaTitle` exist, it needs migration

### 2. **Migration Decision Point**

**Debug Output**:

```
Migration needed?: [YES/NO]
```

**What to check**:

- Should be `YES` for v1 blocks
- Should be `NO` for v2 blocks

### 3. **Migration Function Check**

**Debug Output**:

```
✅ Migration method exists, calling now...
OR
❌ Migration method does NOT exist!
```

**What to check**:

- If method doesn't exist, the `Block_Migration` class may not be loaded
- Check `includes/class-plugin-bootstrap.php` to ensure class is required

### 4. **Migration Function Entry** (`includes/class-block-migration.php`)

**Location**: Start of `migrate_attributes_v1_to_v2()`

**Debug Output**:

```
🔄 MIGRATION FUNCTION CALLED
Input attributes count: [count]
Input _version: [value or "NOT SET"]
```

**What to check**:

- Verify correct number of attributes are being passed
- Confirm `_version` is not `v2` (or is missing)

### 5. **Early Return Check**

**Debug Output** (if v2):

```
✅ Already v2, early return
```

**What to check**:

- This should only appear if block was already migrated or saved as v2

### 6. **Migration Start**

**Debug Output**:

```
⚙️ Starting v1→v2 migration...
```

**What to check**:

- Confirms migration is actually running
- Should see this for v1 blocks only

### 7. **Migration Completion**

**Debug Output** (success):

```
✅ Migration completed successfully
Output attributes count: [count]
Output _version: v2
Output has layout?: YES
Output has metadata?: YES
```

**Debug Output** (error):

```
❌ Migration failed: [error message]
Exception trace: [stack trace]
```

**What to check**:

- Output should have `_version: v2`
- Should have nested `layout` and `metadata` objects
- Attribute count should be similar to input (slightly higher due to nesting)

### 8. **Post-Migration State** (`src/chart/class-chart.php`)

**Debug Output**:

```
--- AFTER MIGRATION ---
After _version: v2
After has nested layout?: YES
After has nested metadata?: YES
After total keys: [count]
```

**What to check**:

- Verify attributes were actually modified by migration
- Confirm nested structure exists

---

## 📊 How to Use Query Monitor

### Step 1: Install Query Monitor

```bash
# If not already installed
composer require --dev johnbillion/query-monitor
```

Or install via WordPress admin: Plugins → Add New → "Query Monitor"

### Step 2: Enable Query Monitor

1. Activate Query Monitor plugin
2. Visit any page on the frontend
3. Look for the Query Monitor toolbar at the top of the page

### Step 3: View Debug Logs

1. Click on **Query Monitor** in admin toolbar
2. Click on **Logs** tab
3. Filter by **Debug** to see migration flow

### Step 4: Test with a V1 Chart

1. Find a chart post with v1 attributes (created before migration)
2. View it on the **frontend** (not in editor)
3. Check Query Monitor logs for the sequence:

```
=== CHART RENDER START ===
Has nested layout?: NO          <-- Confirms v1 block
Migration needed?: YES          <-- Confirms migration will run
✅ Migration method exists...   <-- Migration function found
🔄 MIGRATION FUNCTION CALLED    <-- Migration starting
⚙️ Starting v1→v2 migration...  <-- Actually migrating
✅ Migration completed...       <-- Success!
After has nested layout?: YES   <-- Attributes now nested
```

### Step 5: Test with a V2 Chart

1. Create a new chart or edit an existing v1 chart
2. Save it (this makes it v2)
3. View on frontend
4. Check Query Monitor logs for early return:

```
=== CHART RENDER START ===
Incoming _version: v2           <-- Already v2
Has nested layout?: YES         <-- Already nested
Migration needed?: NO           <-- Skip migration
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Migration method does NOT exist"

**Symptom**:

```
❌ Migration method does NOT exist!
```

**Cause**: `Block_Migration` class not loaded or migration function not defined

**Solution**:

1. Check `includes/class-plugin-bootstrap.php` loads `class-block-migration.php`
2. Verify function exists in class:
    ```bash
    grep -n "migrate_attributes_v1_to_v2" includes/class-block-migration.php
    ```
3. Clear opcache if on production:
    ```bash
    wp cache flush
    ```

### Issue 2: Migration runs but attributes unchanged

**Symptom**:

```
⚙️ Starting v1→v2 migration...
✅ Migration completed successfully
After has nested layout?: NO    <-- Still flat!
```

**Cause**: Migration function returns value but it's not assigned back to `$attributes`

**Solution**:
Check line in `class-chart.php`:

```php
// Should be:
$attributes = \PRC\Platform\Chart_Builder\Block_Migration::migrate_attributes_v1_to_v2( $attributes );

// NOT:
\PRC\Platform\Chart_Builder\Block_Migration::migrate_attributes_v1_to_v2( $attributes );
```

### Issue 3: Migration throws exception

**Symptom**:

```
❌ Migration failed: Call to undefined function...
Exception trace: ...
```

**Cause**: Helper function not defined or class not autoloaded

**Solution**:

1. Check all helper functions are defined in `Block_Migration` class
2. Verify `private static` methods exist:
    - `migrate_independent_axis()`
    - `migrate_dependent_axis()`
    - `parse_tick_values()`
    - etc. (11 total helper methods)

### Issue 4: Chart still breaks on frontend

**Symptom**:

```
✅ Migration completed successfully
After has nested layout?: YES
[But chart doesn't render]
```

**Cause**: Migration ran but attributes not passed to `wp_interactivity_state` correctly

**Solution**:

1. Check that migrated `$attributes` are used (not original)
2. Verify `wp_interactivity_state` receives migrated attributes:
    ```php
    // Find this in class-chart.php
    wp_interactivity_state( $target_namespace, array( 'attributes' => $attributes ) );
    ```

### Issue 5: No debug output appears

**Symptom**: Query Monitor shows no debug logs at all

**Cause**: Query Monitor not active or debug mode disabled

**Solution**:

1. Verify Query Monitor is active:
    ```bash
    wp plugin list | grep query-monitor
    ```
2. Check WordPress debug mode in `wp-config.php`:
    ```php
    define( 'WP_DEBUG', true );
    define( 'QM_ENABLE_DEBUG_BAR', true );
    ```
3. Try browser console for PHP errors

---

## 📈 Expected Performance

### V2 Blocks (Already Migrated)

- **Migration check**: ~0.01ms (early return)
- **Total overhead**: Negligible

### V1 Blocks (Need Migration)

- **Migration time**: 2-5ms per request
- **Total overhead**: Acceptable for legacy support

### After Editor Save

- V1 blocks become V2 permanently
- Future requests have zero migration overhead

---

## 🧪 Testing Checklist

Use this checklist to verify migration is working:

- [ ] Query Monitor installed and active
- [ ] Debug mode enabled in wp-config.php
- [ ] View v1 chart on frontend
- [ ] See "Migration needed?: YES" in QM logs
- [ ] See "✅ Migration completed successfully"
- [ ] See "After has nested layout?: YES"
- [ ] Chart renders correctly on frontend
- [ ] No JavaScript errors in browser console
- [ ] View v2 chart on frontend
- [ ] See "Migration needed?: NO" in QM logs
- [ ] Chart renders correctly (no regression)
- [ ] Edit v1 chart in editor
- [ ] Save (should become v2)
- [ ] View again on frontend
- [ ] Migration should now be skipped (already v2)

---

## 📝 Sample Complete Output

Here's what a successful v1 migration should look like in Query Monitor:

```
=== CHART RENDER START ===
Incoming _version: NOT SET
Incoming chartType: stacked-area
Has nested layout?: NO
Has nested metadata?: NO
Has flat metaTitle?: YES
Total attribute keys: 178
Migration needed?: YES
✅ Migration method exists, calling now...
🔄 MIGRATION FUNCTION CALLED
Input attributes count: 178
Input _version: NOT SET
⚙️ Starting v1→v2 migration...
✅ Migration completed successfully
Output attributes count: 25
Output _version: v2
Output has layout?: YES
Output has metadata?: YES
--- AFTER MIGRATION ---
After _version: v2
After has nested layout?: YES
After has nested metadata?: YES
After total keys: 25
```

**Key observations**:

- Started with 178 flat attributes
- Ended with 25 nested objects/arrays
- `_version` changed from "NOT SET" to "v2"
- Nested structure confirmed (layout, metadata)

---

## 🚀 Next Steps

Once you see successful migration in Query Monitor:

1. **Remove debug code** (after testing is complete)
2. **Add unit tests** to verify migration logic
3. **Test with production data** (sample of real v1 charts)
4. **Monitor error logs** for any migration failures
5. **Document migration patterns** for future reference

---

## 📞 Support

If migration is still not working after reviewing these debug points:

1. Copy complete Query Monitor output
2. Check PHP error logs: `wp-content/debug.log`
3. Verify WordPress and PHP versions
4. Test with minimal theme (Twenty Twenty-Four)
5. Disable other plugins to rule out conflicts
