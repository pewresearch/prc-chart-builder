# Migration Transformations Audit

**Date**: December 5, 2025
**Purpose**: Verify that all transformations in `get-config.js` are correctly handled by the migration

---

## ✅ Transformations Verified

### 1. Tick Values Parsing ✅

**Location**: `get-config.js` lines 262-269

**Transformation**:

```javascript
const independentAxisTickValues =
	independentAxis.scale === 'time'
		? stringToArray(independentAxis.tickValues)
		: stringToArrayOfNums(independentAxis.tickValues);
```

**Migration Status**: ✅ **CORRECT**

- **JavaScript (v1.js line 120-122)**:
    ```javascript
    tickValues: attributes.xTickExact
      ? parseTickValues(attributes.xTickExact)
      : null,
    ```
- **PHP (class-block-migration.php line 911)**:
    ```php
    'tickValues' => self::parse_tick_values( $attributes['xTickExact'] ?? null ),
    ```

**Result**: Old `xTickExact`/`yTickExact` (strings) are parsed into arrays during migration. `get-config.js` receives arrays and applies additional type-based parsing (time vs numeric).

---

### 2. Alt Text Generation ✅

**Location**: `get-config.js` lines 282-285

**Transformation**:

```javascript
alt: alt && alt.length > 0
  ? alt
  : generateDefaultAltText(chartType, title),
```

**Migration Status**: ✅ **CORRECT**

- **JavaScript (v1.js line 82)**:
    ```javascript
    alt: attributes.metaAlt || '',
    ```
- **PHP (class-block-migration.php line ~744)**:
    ```php
    'alt' => $attributes['metaAlt'] ?? '',
    ```

**Result**: Migration preserves `metaAlt` as-is (empty string if not set). `get-config.js` generates default alt text if empty, which is correct behavior.

---

### 3. Legend Categories Logic ✅

**Location**: `get-config.js` lines 395-421

**Transformation**:

```javascript
categories: (() => {
  if (legend.categories && legend.categories.length > 0) {
    return legend.categories;
  }
  if (chartType === 'diverging-bar') {
    return neutralBar.active
      ? [...divergingBar.negativeCategories, ...divergingBar.positiveCategories, neutralBar.category]
      : [...divergingBar.negativeCategories, ...divergingBar.positiveCategories];
  }
  if (dataRender.mapScale === 'ordinal') {
    return dataRender.mapScaleDomain;
  }
  return dataRender.categories || [];
})(),
```

**Migration Status**: ✅ **CORRECT**

- **legendCategories** (v1.js line 289): `categories: attributes.legendCategories || []`
- **divergingBar.positiveCategories** (v1.js line 408): `positiveCategories: attributes.positiveCategories || []`
- **divergingBar.negativeCategories** (v1.js line 409): `negativeCategories: attributes.negativeCategories || []`
- **divergingBar.neutralBar.category** (v1.js line 415): `category: attributes.neutralCategory || ''`
- **dataRender.mapScaleDomain** (v1.js line 471): `mapScaleDomain: attributes.mapScaleDomain || [10, 20, 30, 40, 50]`
- **dataRender.categories** (v1.js line 459): `categories: attributes.categories || []`

**Result**: All required attributes for dynamic legend category calculation are migrated correctly.

---

### 4. Area Chart Type Conversion ✅

**Location**: `get-config.js` lines 277, 431

**Transformation**:

```javascript
layout: {
  type: 'area' === chartType ? 'line' : chartType,
},
line: {
  showArea: 'area' === chartType || line.showArea,
}
```

**Migration Status**: ✅ **CORRECT**

- **JavaScript (v1.js line 342)**:
    ```javascript
    showArea: attributes.chartType === 'area',
    ```
- **PHP (class-block-migration.php line 777)**:
    ```php
    'showArea' => ( isset( $attributes['chartType'] ) && 'area' === $attributes['chartType'] ),
    ```

**Result**: Migration sets `line.showArea = true` for area charts. `get-config.js` converts type from 'area' to 'line' and ensures `showArea` is set.

---

### 5. Available Categories Fallback ✅

**Location**: `get-config.js` lines 358-361

**Transformation**:

```javascript
categories: 0 < dataRender?.categories?.length
  ? dataRender.categories
  : availableCategories,
```

**Migration Status**: ✅ **CORRECT**

- **dataRender.categories** (v1.js line 459): `categories: attributes.categories || []`
- **io.availableCategories** (v1.js line 517): `availableCategories: attributes.availableCategories || []`

**Result**: Both `dataRender.categories` and `io.availableCategories` are migrated, allowing the fallback logic to work.

---

### 6. Chart Type Preserved at Root ✅

**Location**: `get-config.js` line 47

**Transformation**:

```javascript
const { type: chartType } = layout;
```

**Migration Status**: ✅ **CORRECT**

- **Root chartType preserved** (v1.js line 71): `chartType: attributes.chartType || 'bar'`
- **Also in layout.type** (v1.js line 55): `type: attributes.chartType || 'bar'`

**Result**: Both locations are set, ensuring `get-config.js` can access `chartType` from `layout.type`.

---

### 7. Scale Values in DataRender ✅

**Location**: `get-config.js` lines 362-363

**Transformation**:

```javascript
xScale: iScale,
yScale: dScale,
```

**Migration Status**: ✅ **CORRECT**

- Migration doesn't set `dataRender.xScale`/`yScale`
- `get-config.js` pulls from `independentAxis.scale` and `dependentAxis.scale` (lines 49-50)
- Then sets them in `dataRender` during config generation

**Result**: Correct - scales live in axis objects, `get-config.js` copies them to `dataRender` for library compatibility.

---

### 8. Custom Colors Fallback ✅

**Location**: `get-config.js` lines 287-290

**Transformation**:

```javascript
colors: customColors && customColors.length > 0
  ? customColors
  : colorPalette[colorValue],
```

**Migration Status**: ✅ **CORRECT**

- **colors array** (v1.js lines 86-96): Uses `customColors` if present, else default palette
- **io.customColors** (v1.js line 505): `customColors: attributes.customColors || []`
- **io.colorValue** (v1.js line 504): `colorValue: attributes.colorValue || 'general'`

**Result**: Migration sets `colors` array at root AND preserves `io.customColors`/`colorValue` for `get-config.js` to use.

---

### 9. Diverging Bar Percent Conversion ✅

**Location**: Not in get-config.js, but in migration

**Migration Status**: ✅ **CORRECT**

- **JavaScript (v1.js lines 410-412)**:
    ```javascript
    percentOfInnerWidth: attributes.divergingBarPercentOfInnerWidth
      ? attributes.divergingBarPercentOfInnerWidth / 100
      : 0.7,
    ```
- **PHP (class-block-migration.php lines ~1241-1243)**:
    ```php
    $percent = isset( $attributes['divergingBarPercentOfInnerWidth'] )
      ? $attributes['divergingBarPercentOfInnerWidth'] / 100
      : 0.7;
    'percentOfInnerWidth' => $percent,
    ```

**Result**: Old value stored as integer (e.g., 70), migrated to decimal (0.7) as required by charting library.

---

## Summary

**Status**: ✅ **ALL TRANSFORMATIONS VERIFIED**

All transformations in `get-config.js` that depend on attribute values are correctly handled by the migration:

1. ✅ Tick values parsing (xTickExact/yTickExact → tickValues arrays)
2. ✅ Alt text generation (empty string fallback)
3. ✅ Legend categories (multiple sources for dynamic calculation)
4. ✅ Area chart type conversion (area → line + showArea)
5. ✅ Available categories fallback
6. ✅ Chart type at root level
7. ✅ Scale values copied to dataRender
8. ✅ Custom colors fallback
9. ✅ Diverging bar percent conversion (integer → decimal)

**No additional migration fixes needed for get-config.js transformations.**

---

**Verification Date**: December 5, 2025
