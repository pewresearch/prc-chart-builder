# Attributes to KEEP in block.json (Nested Structure)

**Date**: December 5, 2025
**Purpose**: List of attributes that will NOT be removed from block.json

---

## ✅ NESTED STRUCTURE ATTRIBUTES (KEEP - Lines 11-492)

These are the v2 nested objects that should remain:

### Core Structure

1. **`_version`** (line 11) - Version flag for migration detection
2. **`layout`** (line 15) - Layout configuration object
3. **`metadata`** (line 34) - Metadata object (title, subtitle, note, source, tag, alt)
4. **`colors`** (line 46) - Colors array
5. **`plotBands`** (line 57) - Plot bands configuration
6. **`independentAxis`** (line 67) - X-axis configuration object
7. **`dependentAxis`** (line 128) - Y-axis configuration object
8. **`tooltip`** (line 187) - Tooltip configuration object
9. **`legend`** (line 227) - Legend configuration object
10. **`labels`** (line 252) - Labels configuration object
11. **`bar`** (line 278) - Bar chart specific configuration
12. **`line`** (line 287) - Line chart specific configuration
13. **`dotPlot`** (line 298) - Dot plot specific configuration
14. **`explodedBar`** (line 310) - Exploded bar specific configuration
15. **`pie`** (line 316) - Pie chart specific configuration
16. **`nodes`** (line 329) - Node/point configuration
17. **`map`** (line 338) - Map chart specific configuration
18. **`divergingBar`** (line 361) - Diverging bar specific configuration
19. **`diffColumn`** (line 378) - Diff column configuration
20. **`annotations`** (line 401) - Annotations configuration
21. **`dataRender`** (line 409) - Data rendering configuration
22. **`animate`** (line 443) - Animation configuration
23. **`io`** (line 451) - WordPress-specific I/O attributes
24. **`_legacy`** (line 489) - Legacy attributes container

### Root-Level Convenience Attributes (KEEP)

These are kept at root level for convenience but also exist nested:

25. **`chartType`** (line 550) - Chart type enum (also in `layout.type`)
26. **`chartOrientation`** (line 578) - Chart orientation (also in `layout.orientation`)

---

## ❌ FLAT ATTRIBUTES TO REMOVE (Lines 493-1570)

All attributes from line 493 onwards that are NOT in the list above should be removed.

### Summary of Removals (by category):

**IO Attributes** (moved to `io.*`):

- `id`, `parentClass`, `isConvertedChart`, `isStaticChart`, `isFreeformChart`
- `staticImageId`, `staticImageUrl`, `staticImageInnerHTML`
- `chartConverted`, `chartData`, `tableData`
- `hasPreformattedData`, `preformattedData`
- `svgUrl`, `svgId`, `pngUrl`, `pngId`
- `colorValue`, `elementHasStroke`, `tabsActive`
- `allowDataDownload`, `isCustomChart`, `customAttributes`
- `defaultShouldRender`, `lock`
- `independentVariable`, `availableCategories`
- `questionWordingActive`, `questionWording` (as `metaQuestionWording*`)

**Layout Attributes** (moved to `layout.*`):

- `width`, `height`, `overflowX`, `mobileBreakpoint`
- `horizontalRules`
- `paddingTop`, `paddingLeft`, `paddingBottom`, `paddingRight`

**Metadata Attributes** (moved to `metadata.*`):

- `metaTextActive`, `metaTitle`, `metaSubtitle`
- `metaNote`, `metaSource`, `metaTag`, `metaAlt`
- `metaQuestionWordingActive`, `metaQuestionWording`

**Independent Axis (X-axis)** (moved to `independentAxis.*`):

- All `x*` attributes (xAxisActive, xLabel, xScale, xDateFormat, etc.)

**Dependent Axis (Y-axis)** (moved to `dependentAxis.*`):

- All `y*` attributes (yAxisActive, yLabel, yScale, etc.)

**Chart Type Specific**:

- `barPadding`, `barGroupPadding` → `bar.*`
- `lineInterpolation`, `lineStrokeWidth`, `lineNodes` → `line.*`
- `nodeSize`, `nodeFill`, `nodeStrokeWidth` → `nodes.*`
- `pieCategoryLabelsActive` → `pie.showCategoryLabels`
- `dotPlotConnectPoints*` → `dotPlot.connectingLine.*`
- `explodedBarColumnGap` → `explodedBar.columnGap`
- `divergingBarPercentOfInnerWidth` → `divergingBar.percentOfInnerWidth`
- All `neutralBar*` → `divergingBar.neutralBar.*`
- `positiveCategories`, `negativeCategories` → `divergingBar.*`
- `diffColumn*` → `diffColumn.*`

**Data Render** (moved to `dataRender.*`):

- `dataRenderX`, `dataRenderY` → `dataRender.x`, `dataRender.y`
- `dateInputFormat` → `dataRender.xFormat`
- `sortOrder`, `sortKey` → `dataRender.*`
- `categories` → `dataRender.categories`
- `groupBreaks*` → `dataRender.groupBreaks*`
- `mapScale`, `mapScaleDomain` → `dataRender.mapScale*`

**Map Attributes** (moved to `map.*`):

- All `map*` attributes (mapAbbreviateLabels, mapIgnoreSmallStateLabels, etc.)
- `showCountyBoundaries`, `mapShowStateBoundaries`

**Tooltip Attributes** (moved to `tooltip.*`):

- All `tooltip*` attributes

**Labels Attributes** (moved to `labels.*`):

- `labelsActive`, `showFirstLastPointsOnly`
- `barLabelPosition`, `barLabelCutoff`, `barLabelCutoffMobile`
- All `label*` attributes

**Legend Attributes** (moved to `legend.*`):

- All `legend*` attributes

**Other**:

- `plotBandsActive` → `plotBands.active`
- `annotationsActive` → `annotations.active`
- `drawings` → `_legacy.drawings`
- `chartFamily` → `io.chartFamily`
- `areaFillOpacity` → `line.areaFillOpacity`
- `test` (line 493) - Test attribute, should be removed

---

## 📊 Count Summary

**KEEP**: 26 attributes

- 24 nested objects/arrays
- 2 root-level convenience attributes (`chartType`, `chartOrientation`)

**REMOVE**: ~230+ flat attributes (all v1 flat keys)

---

## ✅ Verification Checklist

After removal, `block.json` should ONLY contain:

- [x] `_version`
- [x] `layout` (object)
- [x] `metadata` (object)
- [x] `colors` (array)
- [x] `plotBands` (object)
- [x] `independentAxis` (object)
- [x] `dependentAxis` (object)
- [x] `tooltip` (object)
- [x] `legend` (object)
- [x] `labels` (object)
- [x] `bar` (object)
- [x] `line` (object)
- [x] `dotPlot` (object)
- [x] `explodedBar` (object)
- [x] `pie` (object)
- [x] `nodes` (object)
- [x] `map` (object)
- [x] `divergingBar` (object)
- [x] `diffColumn` (object)
- [x] `annotations` (object)
- [x] `dataRender` (object)
- [x] `animate` (object)
- [x] `io` (object)
- [x] `_legacy` (object)
- [x] `chartType` (string enum - root level)
- [x] `chartOrientation` (string enum - root level)

**Total**: 26 attributes (down from ~256)

---

## 🎯 Expected Result

After removal:

- ✅ Only nested v2 structure remains
- ✅ Migration must work (no fallback to flat keys)
- ✅ PHP render must use nested structure
- ✅ JavaScript already uses nested structure
- ✅ Clean, maintainable schema
