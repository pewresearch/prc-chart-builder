# Data Model: Nested Block Attributes Schema

**Feature**: issue/1386 | **Date**: 2025-11-06
**Purpose**: Define the complete nested attribute structure for Chart block v2, mapping from PRC Charting Library's baseConfig

## Overview

The Chart block's attributes are restructured into 12 top-level nested objects that directly mirror the PRC Charting Library's baseConfig structure, plus 2 WordPress-specific objects (io, \_legacy). This eliminates the flat 100+ attribute schema and enables direct passthrough to the charting library.

## Attribute Schema Hierarchy

```
attributes (root)
├── _version (string) - Version marker for migration tracking
├── layout (object) - Chart dimensions, overflow, padding
├── metadata (object) - Title, subtitle, note, source, tag
├── colors (array) - Color palette
├── plotBands (object) - Plot band configuration and items
├── independentAxis (object) - X-axis configuration
├── dependentAxis (object) - Y-axis configuration
├── dataRender (object) - Data sorting, categories, scales
├── animate (object) - Animation settings
├── tooltip (object) - Tooltip behavior and styling
├── legend (object) - Legend configuration
├── bar (object) - Bar chart specific settings
├── line (object) - Line/area chart settings
├── dotPlot (object) - Dot plot specific settings
├── explodedBar (object) - Exploded bar settings
├── pie (object) - Pie chart settings
├── nodes (object) - Node/point rendering
├── labels (object) - Data label configuration
├── map (object) - Map chart settings
├── divergingBar (object) - Diverging bar configuration
├── diffColumn (object) - Difference column settings
├── annotations (object) - Annotation configuration
├── custom (object) - Custom chart type settings
├── io (object) - WordPress block metadata
└── _legacy (object) - Deprecated attributes with no mapping
```

## Detailed Object Schemas

### \_version

**Purpose**: Track which version of the attribute schema this block uses

**Type**: `string`
**Default**: `"v2"`
**Allowed Values**: `"v1"`, `"v2"`

```json
{
	"_version": {
		"type": "string",
		"default": "v2",
		"enum": ["v1", "v2"]
	}
}
```

---

### layout

**Purpose**: Chart dimensions, container styling, responsive behavior

**Type**: `object`
**Default**:

```json
{
	"name": "wp-block-prc-block-chart-builder-controller",
	"parentClass": undefined,
	"type": "bar",
	"orientation": "vertical",
	"width": 640,
	"height": 400,
	"padding": { "top": 0, "bottom": 0, "left": 0, "right": 0 },
	"overflowX": "responsive",
	"horizontalRules": true,
	"mobileBreakpoint": 480
}
```

**Fields**:

- `name` (string): Block identifier
- `parentClass` (string|undefined): CSS class for parent container
- `type` (string enum): Chart type - bar, line, area, pie, map-usa, etc.
- `orientation` (string enum): vertical | horizontal
- `width` (integer): Chart width in pixels
- `height` (integer): Chart height in pixels
- `padding` (object): { top, right, bottom, left } padding values
- `overflowX` (string enum): scroll | responsive | scroll-fixed-y-axis
- `horizontalRules` (boolean): Show horizontal grid lines
- `mobileBreakpoint` (integer): Width threshold for mobile layout

**Migration from v1**:

- `chartType` → `layout.type`
- `chartOrientation` → `layout.orientation`
- `width` → `layout.width`
- `height` → `layout.height`
- `paddingTop/Right/Bottom/Left` → `layout.padding.{top/right/bottom/left}`
- `overflowX` → `layout.overflowX`
- `mobileBreakpoint` → `layout.mobileBreakpoint`
- `horizontalRules` → `layout.horizontalRules`
- `parentClass` → `layout.parentClass`

---

### metadata

**Purpose**: Chart title, subtitle, notes, source attribution

**Type**: `object`
**Default**:

```json
{
	"active": false,
	"title": "",
	"subtitle": "",
	"note": "",
	"source": "",
	"tag": "PEW RESEARCH CENTER",
	"alt": ""
}
```

**Fields**:

- `active` (boolean): Enable/disable metadata display
- `title` (string): Chart title
- `subtitle` (string): Chart subtitle
- `note` (string): Additional notes
- `source` (string): Data source attribution
- `tag` (string): Organization tag/branding
- `alt` (string): Accessibility alt text

**Migration from v1**:

- `metaTextActive` → `metadata.active`
- `metaTitle` → `metadata.title`
- `metaSubtitle` → `metadata.subtitle`
- `metaNote` → `metadata.note`
- `metaSource` → `metadata.source`
- `metaTag` → `metadata.tag`
- `metaAlt` → `metadata.alt`

---

### colors

**Purpose**: Color palette for chart elements

**Type**: `array` of strings (hex colors)
**Default**: `["#436983", "#bf3927", "#756a7e", "#ea9e2c", "#bc7b2b", "#eeece4"]`

**Migration from v1**:

- `customColors` → `colors`

---

### plotBands

**Purpose**: Shaded regions/bands on chart axes

**Type**: `object`
**Default**:

```json
{
	"active": false,
	"allowDrag": false,
	"allowResize": false,
	"dimension": "x",
	"bands": []
}
```

**Fields**:

- `active` (boolean): Enable plot bands
- `allowDrag` (boolean): Allow dragging bands in editor
- `allowResize` (boolean): Allow resizing bands in editor
- `dimension` (string enum): x | y - axis dimension
- `bands` (array): Array of band objects `{ from, to, color, label }`

**Migration from v1**:

- `plotBandsActive` → `plotBands.active`
- `plotBands` (array) → `plotBands.bands`

---

### independentAxis (X-Axis)

**Purpose**: Configuration for independent/x-axis

**Type**: `object`
**Default**:

```json
{
	"active": true,
	"label": "",
	"scale": "linear",
	"dateFormat": "%-m/%Y",
	"domain": [0, 100],
	"domainPadding": 20,
	"showZero": false,
	"padding": 60,
	"tickAngle": 0,
	"tickCount": 5,
	"tickValues": undefined,
	"tickFormat": null,
	"ticksToLocaleString": false,
	"abbreviateTicks": false,
	"abbreviateTicksDecimals": 0,
	"tickUnit": "",
	"tickUnitPosition": "end",
	"tickLabels": {
		"fontSize": 12,
		"padding": 0,
		"angle": 0,
		"dx": 0,
		"dy": 0,
		"textAnchor": "middle",
		"verticalAnchor": "start",
		"fill": "rgba(35, 31, 32, 0.7)",
		"fontFamily": "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
		"maxWidth": 50
	},
	"axisLabel": {
		"fontSize": 12,
		"fill": "rgba(35, 31, 32, 0.7)",
		"padding": 15,
		"angle": 0,
		"dx": 0,
		"dy": 0,
		"textAnchor": "end",
		"verticalAnchor": "middle",
		"fontFamily": "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
		"maxWidth": 200
	},
	"axis": {
		"stroke": "gray",
		"strokeWidth": 1
	},
	"ticks": {
		"stroke": "gray",
		"size": 5,
		"strokeWidth": 0
	},
	"grid": {
		"stroke": "#d3d3d3",
		"strokeOpacity": 1,
		"strokeWidth": 2,
		"strokeDasharray": ".3,6"
	}
}
```

**Migration from v1** (23 attributes):

- `xAxisActive` → `independentAxis.active`
- `xLabel` → `independentAxis.label`
- `xScale` → `independentAxis.scale`
- `xDateFormat` → `independentAxis.dateFormat`
- `xMinDomain`, `xMaxDomain` → `independentAxis.domain: [min, max]`
- `showXMinDomainLabel` → `independentAxis.showZero`
- `xLabelPadding` → `independentAxis.padding`
- `xTickLabelAngle` → `independentAxis.tickAngle`
- `xTickNum` → `independentAxis.tickCount`
- `xTickExact` → `independentAxis.tickValues` (parsed array)
- `xTicksToLocaleString` → `independentAxis.ticksToLocaleString`
- `xAbbreviateTicks` → `independentAxis.abbreviateTicks`
- `xAbbreviateTicksDecimals` → `independentAxis.abbreviateTicksDecimals`
- `xTickUnit` → `independentAxis.tickUnit`
- `xTickUnitPosition` → `independentAxis.tickUnitPosition`
- `xLabelFontSize` → `independentAxis.tickLabels.fontSize`
- `xLabelTextFill` → `independentAxis.tickLabels.fill`
- `xTickLabelMaxWidth` → `independentAxis.tickLabels.maxWidth`
- `xTickLabelDX` → `independentAxis.tickLabels.dx`
- `xTickLabelDY` → `independentAxis.tickLabels.dy`
- `xTickLabelTextAnchor` → `independentAxis.tickLabels.textAnchor`
- `xTickLabelVerticalAnchor` → `independentAxis.tickLabels.verticalAnchor`
- `xAxisStroke` → `independentAxis.axis.stroke`
- `xGridStroke` → `independentAxis.grid.stroke`
- `xGridStrokeDasharray` → `independentAxis.grid.strokeDasharray`
- `xGridOpacity` → `independentAxis.grid.strokeOpacity`
- `xTickMarksActive` → controls `independentAxis.ticks.size` (5 if true, 0 if false)

---

### dependentAxis (Y-Axis)

**Purpose**: Configuration for dependent/y-axis (mirror structure of independentAxis)

**Type**: `object`
**Default**: Similar to independentAxis with y-specific defaults

**Migration from v1** (20 attributes):

- `yAxisActive` → `dependentAxis.active`
- `yLabel` → `dependentAxis.label`
- `yScale` → `dependentAxis.scale`
- ... (follows same pattern as independentAxis)

---

### tooltip

**Purpose**: Tooltip behavior, formatting, and styling

**Type**: `object`
**Default**:

```json
{
	"active": true,
	"activeOnMobile": true,
	"headerActive": true,
	"headerValue": "independentValue",
	"format": "{{row}}: {{value}}",
	"offsetX": 10,
	"offsetY": 10,
	"abbreviateValue": false,
	"absoluteValue": false,
	"toFixedDecimal": 0,
	"toLocaleString": true,
	"customFormat": null,
	"rlsFormat": false,
	"dateFormat": "%-m/%Y",
	"caretPosition": "bottom",
	"deemphasizeSiblings": false,
	"deemphasizeOpacity": 0.5,
	"emphasizeStrokeActive": false,
	"emphasizeStrokeColor": "black",
	"emphasizeStrokeWidth": 1,
	"style": {
		"minWidth": 50,
		"maxWidth": 150,
		"maxHeight": 400,
		"minHeight": 20,
		"width": "100%",
		"height": "auto",
		"fontSize": "13px",
		"fontFamily": "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
		"background": "white",
		"border": "1px solid black",
		"padding": "10px",
		"borderRadius": "5px",
		"color": "black"
	}
}
```

**Migration from v1** (15 attributes):

- `tooltipActive` → `tooltip.active`
- `tooltipActiveOnMobile` → `tooltip.activeOnMobile`
- `tooltipHeaderActive` → `tooltip.headerActive`
- `tooltipHeaderValue` → `tooltip.headerValue`
- `tooltipFormat` → `tooltip.format`
- `tooltipOffsetX` → `tooltip.offsetX`
- `tooltipOffsetY` → `tooltip.offsetY`
- `tooltipFormatValue` → `tooltip.toLocaleString`
- `tooltipAbsoluteValue` → `tooltip.absoluteValue`
- `tooltipDateFormat` → `tooltip.dateFormat`
- `deemphasizeSiblings` → `tooltip.deemphasizeSiblings`
- `deemphasizeOpacity` → `tooltip.deemphasizeOpacity`
- `emphasizeStrokeActive` → `tooltip.emphasizeStrokeActive`
- `emphasizeStrokeColor` → `tooltip.emphasizeStrokeColor`
- `emphasizeStrokeWidth` → `tooltip.emphasizeStrokeWidth`
- `tooltipMaxWidth`, `tooltipMinWidth`, `tooltipMaxHeight`, `tooltipMinHeight`, `tooltipFontSize` → `tooltip.style.*`

---

### legend

**Purpose**: Legend configuration for chart

**Type**: `object`
**Default**:

```json
{
	"active": false,
	"orientation": "row",
	"title": "",
	"alignment": "center",
	"offsetX": 0,
	"offsetY": 0,
	"markerStyle": "rect",
	"borderStroke": "black",
	"fill": "white",
	"categories": [],
	"labelDelimiter": "to",
	"labelLower": "Less than ",
	"labelUpper": "More than ",
	"fontSize": 12,
	"margin": {
		"top": 0,
		"right": 5,
		"bottom": 0,
		"left": 0
	}
}
```

**Migration from v1** (13 attributes):

- `legendActive` → `legend.active`
- `legendOrientation` → `legend.orientation`
- `legendTitle` → `legend.title`
- `legendAlignment` → `legend.alignment`
- `legendOffsetX` → `legend.offsetX`
- `legendOffsetY` → `legend.offsetY`
- `legendMarkerStyle` → `legend.markerStyle`
- `legendBorderStroke` → `legend.borderStroke`
- `legendFill` → `legend.fill`
- `legendCategories` → `legend.categories`
- `legendLabelDelimiter` → `legend.labelDelimiter`
- `legendLabelLower` → `legend.labelLower`
- `legendLabelUpper` → `legend.labelUpper`
- `legendFontSize` → `legend.fontSize`
- `legendMargin` → `legend.margin`

---

### labels

**Purpose**: Data label configuration

**Type**: `object`
**Default**:

```json
{
	"active": false,
	"showFirstLastPointsOnly": false,
	"color": "inherit",
	"fontWeight": 200,
	"fontSize": 12,
	"fontFamily": "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
	"labelPositionBar": "inside",
	"labelCutoff": 5,
	"labelCutoffMobile": 10,
	"labelPositionDX": -25,
	"labelPositionDY": 0,
	"pieLabelRadius": 60,
	"abbreviateValue": false,
	"absoluteValue": false,
	"toLocaleString": true,
	"truncateDecimal": true,
	"toFixedDecimal": 0,
	"labelUnit": "",
	"labelUnitPosition": "end",
	"textAnchor": "middle",
	"customLabelFormat": null
}
```

**Migration from v1** (12 attributes):

- `labelsActive` → `labels.active`
- `showFirstLastPointsOnly` → `labels.showFirstLastPointsOnly`
- `labelColor` → `labels.color`
- `labelFontWeight` → `labels.fontWeight`
- `labelFontSize` → `labels.fontSize`
- `barLabelPosition` → `labels.labelPositionBar`
- `labelCutoff` (barLabelCutoff) → `labels.labelCutoff`
- `labelCutoffMobile` (barLabelCutoffMobile) → `labels.labelCutoffMobile`
- `labelPositionDX` → `labels.labelPositionDX`
- `labelPositionDY` → `labels.labelPositionDY`
- `labelAbsoluteValue` → `labels.absoluteValue`
- `labelFormatValue` → `labels.toLocaleString`
- `labelTruncateDecimal` → `labels.truncateDecimal`
- `labelToFixedDecimal` → `labels.toFixedDecimal`
- `labelUnit` → `labels.labelUnit`
- `labelUnitPosition` → `labels.labelUnitPosition`

---

### io (WordPress Block Metadata)

**Purpose**: WordPress-specific block management data not related to chart rendering

**Type**: `object`
**Default**:

```json
{
	"id": undefined,
	"parentClass": "wp-chart-builder-wrapper",
	"isConvertedChart": false,
	"isStaticChart": false,
	"isFreeformChart": false,
	"staticImageId": undefined,
	"staticImageUrl": undefined,
	"staticImageInnerHTML": undefined,
	"chartConverted": {
		"converted": false,
		"requester": "",
		"timestamp": ""
	},
	"defaultShouldRender": true,
	"lock": {
		"move": true,
		"remove": false
	}
}
```

**Fields**:

- `id` (string): Block unique identifier
- `parentClass` (string): CSS class for wrapper
- `isConvertedChart` (boolean): Flag for legacy conversion
- `isStaticChart` (boolean): Is this a static image chart
- `isFreeformChart` (boolean): Is this a freeform/custom chart
- `staticImageId` (string): Media library ID for static image
- `staticImageUrl` (string): URL of static chart image
- `staticImageInnerHTML` (string): Inner HTML for static chart
- `chartConverted` (object): Conversion tracking metadata
- `defaultShouldRender` (boolean): Should chart render by default
- `lock` (object): WordPress block locking settings

**Migration from v1**:

- `id` → `id`
- `parentClass` → `io.parentClass` (also copied to layout.parentClass for charting library)
- `isConvertedChart` → `io.isConvertedChart`
- `isStaticChart` → `io.isStaticChart`
- `isFreeformChart` → `io.isFreeformChart`
- `staticImageId` → `io.staticImageId`
- `staticImageUrl` → `io.staticImageUrl`
- `staticImageInnerHTML` → `io.staticImageInnerHTML`
- `chartConverted` → `io.chartConverted`
- `defaultShouldRender` → `io.defaultShouldRender`
- `lock` → `io.lock`

---

### \_legacy

**Purpose**: Preserve deprecated charting attributes that have no equivalent in nested structure

**Type**: `object`
**Default**: `{}`

**Behavior**:

- During migration, any attribute that doesn't map to nested structure OR io is placed here
- Console warning emitted in development mode listing legacy attributes
- Allows manual review and potential data recovery if needed
- Example: removed experimental features, renamed attributes, deprecated options

**Migration Logic**:

```javascript
migrate(oldAttributes) {
  const newAttributes = { /* mapped attributes */ };
  const _legacy = {};

  // Check for unmapped attributes
  Object.keys(oldAttributes).forEach(key => {
    if (!isMappedAttribute(key)) {
      _legacy[key] = oldAttributes[key];
      console.warn(`Legacy attribute preserved: ${key}`, oldAttributes[key]);
    }
  });

  if (Object.keys(_legacy).length > 0) {
    newAttributes._legacy = _legacy;
  }

  return newAttributes;
}
```

---

## Validation Rules

1. **Required Fields**: `_version`, `layout.type`, `layout.width`, `layout.height`
2. **Enum Validation**: WordPress block.json enforces enum values for string union types
3. **Domain Constraints**:
    - Width/Height > 0
    - Domain arrays must have exactly 2 elements
    - Opacity values 0-1
4. **Type Safety**: TypeScript in editor code enforces nested object shapes; block.json only validates primitive types

## Migration Mapping Summary

**Total Attributes**:

- v1 Flat: ~100 attributes at root level
- v2 Nested: ~12 charting objects + 2 WordPress objects + 1 version marker

**Coverage**:

- Mapped to nested charting objects: ~85 attributes
- Mapped to io (WordPress metadata): ~11 attributes
- Deprecated/removed (potential \_legacy): ~4 attributes
- New attributes (v2 only): 1 (\_version)

## Next Steps

- Define deprecation function contract (see contracts/v1-deprecation-schema.json)
- Create test fixtures representing each nested object combination
- Document type mapping conventions for developers (see type-mapping.md)
