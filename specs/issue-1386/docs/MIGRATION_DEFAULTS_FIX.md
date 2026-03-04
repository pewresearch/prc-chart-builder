# Migration Default Values Fix

**Date**: December 5, 2025
**Issue**: Migration was adding default values for attributes that had no defaults in v1, causing unexpected visual changes.

---

## Problem

The migration was using `||` operator and setting fallback values for attributes that originally had **no defaults**. This caused:

1. ❌ Bar chart grids appearing where none existed (`xGridStroke`, `yGridStroke`)
2. ❌ Label colors changing from black to inherit (`labelColor`)
3. ❌ Legend borders/fills being added where none existed

**Root Cause**: Migration was trying to be helpful by setting defaults, but the charting library already handles defaults via `baseConfig` and `get-config.js` spreading.

---

## Solution

**Strategy**: Migration should ONLY preserve existing values, NOT add defaults. Let the charting library handle defaults consistently.

### Changes Made

#### 1. Grid Stroke Attributes (Fixed ✅)

**JavaScript (v1.js)**:

```javascript
// BEFORE:
grid: {
  stroke: attributes.xGridStroke || '#d3d3d3',  // ❌ Added grid where none existed
  strokeDasharray: attributes.xGridStrokeDasharray || '.3,6',
}

// AFTER:
grid: {
  stroke: attributes.xGridStroke ?? '',  // ✅ Preserves empty string (no grid)
  strokeDasharray: attributes.xGridStrokeDasharray ?? '',
}
```

**PHP (class-block-migration.php)**:

```php
// BEFORE:
'stroke' => $attributes['xGridStroke'] ?? '#d3d3d3',  // ❌ Added grid
'strokeDasharray' => $attributes['xGridStrokeDasharray'] ?? '.3,6',

// AFTER:
'stroke' => $attributes['xGridStroke'] ?? '',  // ✅ Preserves empty (no grid)
'strokeDasharray' => $attributes['xGridStrokeDasharray'] ?? '',
```

#### 2. Label Color (Fixed ✅)

**JavaScript (v1.js)**:

```javascript
// BEFORE:
color: attributes.labelColor || 'inherit',  // ❌ Forced inherit color

// AFTER:
color: attributes.labelColor,  // ✅ undefined → charting library uses default
```

**PHP (class-block-migration.php)**:

```php
// BEFORE:
'color' => $attributes['labelColor'] ?? 'inherit',  // ❌ Forced inherit

// AFTER:
'color' => $attributes['labelColor'] ?? null,  // ✅ null → charting library uses default
```

#### 3. Legend Border/Fill (Fixed ✅)

**JavaScript (v1.js)**:

```javascript
// BEFORE:
borderStroke: attributes.legendBorderStroke || 'black',  // ❌ Added border
fill: attributes.legendFill || 'white',  // ❌ Added fill

// AFTER:
borderStroke: attributes.legendBorderStroke,  // ✅ undefined → no unwanted borders
fill: attributes.legendFill,  // ✅ undefined → no unwanted fills
```

**PHP (class-block-migration.php)**:

```php
// BEFORE:
'borderStroke' => $attributes['legendBorderStroke'] ?? 'black',  // ❌ Added border
'fill' => $attributes['legendFill'] ?? 'white',  // ❌ Added fill

// AFTER:
'borderStroke' => $attributes['legendBorderStroke'] ?? null,  // ✅ null → no borders
'fill' => $attributes['legendFill'] ?? null,  // ✅ null → no fills
```

#### 4. Tooltip Caret Position (Fixed ✅)

**JavaScript (v1.js)**:

```javascript
// BEFORE:
caretPosition: attributes.tooltipCaretPosition || 'bottom',  // ❌ Forced default

// AFTER:
caretPosition: attributes.tooltipCaretPosition,  // ✅ undefined → charting library decides
```

**PHP (class-block-migration.php)**:

```php
// BEFORE:
'caretPosition' => $attributes['tooltipCaretPosition'] ?? 'bottom',  // ❌ Forced default

// AFTER:
'caretPosition' => $attributes['tooltipCaretPosition'] ?? null,  // ✅ null → charting library decides
```

---

## Files Modified

1. **`src/chart/deprecations/v1.js`**

    - Fixed grid stroke defaults (lines 163-168, 225-230)
    - Fixed label color (line 305)
    - Fixed legend borderStroke/fill (lines 285-286)
    - Fixed tooltip caretPosition (line 250)

2. **`includes/class-block-migration.php`**
    - Fixed grid stroke defaults (lines ~952, ~1020)
    - Fixed label color (line ~1174)
    - Fixed legend borderStroke/fill (lines ~1147-1148)
    - Fixed tooltip caretPosition (line ~1107)

---

## Testing

**Before Fix**:

- Bar charts show unwanted grid lines
- Labels have different colors (inherit vs black)
- Legends have borders/fills where none existed

**After Fix**:

- Charts render exactly as they did in v1
- No unexpected visual changes during migration
- Charting library applies consistent defaults

---

## Key Principle

**Migration should be transparent**: A migrated chart should look and behave exactly the same as before migration. The only changes should be the internal attribute structure, not the visual output.

**Default handling**:

- ✅ Old flat defaults → Migrate those explicitly
- ✅ No old default → Don't add one, leave undefined/null
- ✅ Let `baseConfig` and `get-config.js` handle defaults consistently for both v1 (migrated) and v2 (new) charts

---

**Status**: ✅ **COMPLETE** (December 5, 2025)
