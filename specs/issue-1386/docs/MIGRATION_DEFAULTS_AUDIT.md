# Migration Default Values Audit

**Issue**: Migration is setting default values for attributes that had no defaults in v1, causing unexpected behavior changes.

**Root Cause**: Using `||` operator and unnecessary fallback values when the charting library already provides defaults via `baseConfig` and `get-config.js`.

## Attributes That Should NOT Have Defaults in Migration

These attributes had **no default** in old flat structure and should remain `undefined` if not explicitly set:

### Labels

- ❌ `labelColor` - Currently sets `'inherit'`, should be `undefined`
    - Old: no default → charting library used its own
    - Migration: forces `'inherit'` → changes appearance

### Legend

- ❌ `legendBorderStroke` - Currently sets `'black'`, should be `undefined`
- ❌ `legendFill` - Currently sets `'white'`, should be `undefined`

### Tooltip

- ❌ `tooltipCaretPosition` - Currently sets `'bottom'`, should be `undefined`

### Grid (Already Fixed ✅)

- ✅ `xGridStroke` - Fixed to `''`
- ✅ `yGridStroke` - Fixed to `''`
- ✅ `xGridStrokeDasharray` - Fixed to `''`

## Strategy

1. **Keep `??` operator** instead of `||` to preserve empty strings
2. **Remove fallback values** for attributes that had no old defaults
3. **Only set defaults** for attributes that explicitly had defaults in old block.json
4. **Let charting library handle defaults** via `baseConfig` spreading in `get-config.js`

## Changes Needed

### JavaScript (v1.js)

```javascript
// WRONG (adds unexpected defaults):
color: attributes.labelColor || 'inherit',
legendBorderStroke: attributes.legendBorderStroke || 'black',

// CORRECT (preserves undefined, lets charting library decide):
color: attributes.labelColor,
legendBorderStroke: attributes.legendBorderStroke,
```

### PHP (class-block-migration.php)

```php
// WRONG:
'color' => $attributes['labelColor'] ?? 'inherit',
'borderStroke' => $attributes['legendBorderStroke'] ?? 'black',

// CORRECT:
'color' => $attributes['labelColor'] ?? null,
'borderStroke' => $attributes['legendBorderStroke'] ?? null,
```

## Impact

Removing these defaults will:

- ✅ Restore original appearance for migrated charts
- ✅ Let charting library apply consistent defaults
- ✅ Avoid unexpected visual changes during migration
- ✅ Match behavior of new v2 charts
