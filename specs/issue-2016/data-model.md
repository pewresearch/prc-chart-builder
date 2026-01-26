# Data Model: Chart Type Transitions

**Issue**: `issue-2016`
**Created**: 2025-12-11

## Overview

This document defines how chart block attributes should be transformed when switching between chart types. The goal is to preserve user customizations where applicable while ensuring the new chart type renders correctly.

## Chart Type Families

Chart types are grouped into families based on their scale and data requirements:

### Family Definitions

```javascript
// Transformable chart types - can switch between each other
const CHART_FAMILIES = {
	ordinal: [
		'bar',
		'column',
		'stacked-bar',
		'stacked-column',
		'dot-plot',
		'exploded-bar',
		'diverging-bar',
	],
	time: ['line', 'area', 'stacked-area'],
	scatter: ['scatter'],
	pie: ['pie'],
};

// Non-transformable chart types - excluded from switching entirely
const NON_TRANSFORMABLE_TYPES = [
	'us-map', // State FIPS codes (2-digit)
	'us-map-county', // County FIPS codes (5-digit)
	'us-map-block', // State FIPS codes (cartogram)
	'world-map', // ISO 3166-1 numeric codes
];
```

### Why Maps Are Excluded

Map chart types are **not transformable** — neither to/from other chart types, nor between map types:

1. **Different data structure**: Maps require a geocode column (FIPS or ISO) that standard charts don't have
2. **Incompatible code systems**: US FIPS codes have no meaning in world maps, and vice versa
3. **Different granularities**: State FIPS (2-digit) vs County FIPS (5-digit) are incompatible
4. **No reliable auto-mapping**: Fuzzy matching country/state names to codes is error-prone

Users who need a different map type should create a new chart with the appropriate data structure.

### Family Compatibility (Transformable Types Only)

| Transition Type | Complexity | Strategy                                     |
| --------------- | ---------- | -------------------------------------------- |
| Same family     | Low        | Update layout.type, preserve most attributes |
| ordinal ↔ time | Medium     | Reset scale config, preserve metadata        |
| Any ↔ pie      | Medium     | Pie has no axes, reset axis configs          |
| Any ↔ scatter  | Medium     | Scatter needs numeric X and Y                |
| Any ↔ map      | N/A        | **Blocked** — not supported                  |
| map ↔ map      | N/A        | **Blocked** — incompatible code systems      |

## Attribute Categories

### Always Preserved

These attributes are preserved regardless of chart type transition:

```javascript
const ALWAYS_PRESERVE = {
	metadata: {
		active: true,
		title: '',
		subtitle: '',
		note: '',
		source: '',
		tag: 'PEW RESEARCH CENTER',
		alt: '',
	},
	colors: [], // User's custom color palette
	io: {
		chartData: [], // Table-derived data
		availableCategories: [],
		independentVariable: '',
		// All other io properties preserved
	},
};
```

### Reset to Variation Defaults

These attributes must be reset when the chart type changes:

```javascript
const RESET_TO_DEFAULTS = [
	'layout.type', // Must match new chart type
	'layout.orientation', // Bar vs column orientation
	'layout.padding', // Different types need different padding
	'layout.width', // Some types have different default sizes
	'layout.height',
	'independentAxis.scale', // ordinal vs time vs linear
	'independentAxis.domain', // Domain values depend on scale type
	'legend.markerStyle', // rect for bars, line for line charts
];
```

### Chart-Type-Specific Attributes

These are only relevant for specific chart types and should be included/excluded based on target type:

| Attribute Group  | Applicable Chart Types                                 | Notes             |
| ---------------- | ------------------------------------------------------ | ----------------- |
| `bar.*`          | bar, stacked-bar, column, stacked-column, exploded-bar |                   |
| `line.*`         | line, area, stacked-area                               |                   |
| `nodes.*`        | line, area, scatter, dot-plot                          |                   |
| `pie.*`          | pie                                                    |                   |
| `dotPlot.*`      | dot-plot                                               |                   |
| `divergingBar.*` | diverging-bar                                          |                   |
| `explodedBar.*`  | exploded-bar                                           |                   |
| `map.*`          | us-map, us-map-county, us-map-block, world-map         | Not transformable |

## Transformation Mapping

### Ordinal → Ordinal (Same Family)

Example: bar → stacked-bar

```javascript
function transformOrdinalToOrdinal(oldAttrs, newType) {
	return {
		...oldAttrs,
		layout: {
			...oldAttrs.layout,
			type: newType,
			orientation: getDefaultOrientation(newType),
			padding: getDefaultPadding(newType),
		},
		legend: {
			...oldAttrs.legend,
			markerStyle: 'rect',
		},
		// Bar-specific settings preserved as they're compatible
	};
}
```

### Ordinal → Time (Cross-Family)

Example: bar → line

```javascript
function transformOrdinalToTime(oldAttrs, newType) {
	return {
		...oldAttrs,
		layout: {
			...oldAttrs.layout,
			type: newType,
			orientation: 'vertical', // Lines are always "vertical"
			padding: { top: 10, left: 30, bottom: 30, right: 20 },
		},
		independentAxis: {
			...DEFAULT_INDEPENDENT_AXIS,
			scale: 'time',
			domain: { min: null, max: null }, // Will be auto-calculated
		},
		legend: {
			...oldAttrs.legend,
			markerStyle: 'line',
		},
		line: DEFAULT_LINE_CONFIG,
		nodes: DEFAULT_NODES_CONFIG,
		dataRender: {
			...oldAttrs.dataRender,
			sortOrder: 'ascending', // Time series typically ascending
			xScale: 'time',
		},
	};
}
```

### Time → Ordinal (Cross-Family)

Example: line → bar

```javascript
function transformTimeToOrdinal(oldAttrs, newType) {
	return {
		...oldAttrs,
		layout: {
			...oldAttrs.layout,
			type: newType === 'column' ? 'bar' : newType, // Column uses bar type
			orientation: newType === 'column' ? 'vertical' : 'horizontal',
			padding:
				newType === 'column'
					? { left: 20, bottom: 30, right: 20 }
					: { left: 100 },
		},
		independentAxis: {
			...DEFAULT_INDEPENDENT_AXIS,
			scale: undefined, // Ordinal is implicit
			domain: undefined,
			tickCount: null,
			domainPadding: 16,
		},
		dependentAxis: {
			active: false, // Bars typically hide dependent axis
		},
		legend: {
			...oldAttrs.legend,
			markerStyle: 'rect',
		},
		bar: DEFAULT_BAR_CONFIG,
		labels: {
			...oldAttrs.labels,
			active: true,
			color: 'contrast',
		},
		dataRender: {
			...oldAttrs.dataRender,
			sortOrder: 'descending', // Bars typically descending
			xScale: undefined,
		},
	};
}
```

### Any → Pie

```javascript
function transformToPie(oldAttrs) {
	return {
		...oldAttrs,
		layout: {
			type: 'pie',
			width: 420,
			height: 420,
		},
		// Axes not applicable
		independentAxis: DEFAULT_INDEPENDENT_AXIS,
		dependentAxis: DEFAULT_DEPENDENT_AXIS,
		pie: DEFAULT_PIE_CONFIG,
		legend: {
			...oldAttrs.legend,
			active: true,
			markerStyle: 'rect',
		},
	};
}
```

### Any → Map (NOT SUPPORTED)

Map transformations are blocked entirely. See "Why Maps Are Excluded" above.

```javascript
function canTransform(fromType, toType) {
	const fromIsMap = NON_TRANSFORMABLE_TYPES.includes(fromType);
	const toIsMap = NON_TRANSFORMABLE_TYPES.includes(toType);

	// Block any transformation involving maps
	if (fromIsMap || toIsMap) {
		return false;
	}
	return true;
}
```

## Default Configurations by Chart Type

Reference the variation templates in `.shared/variation-templates/` for complete default configurations:

| Chart Type    | Template File       | Key Differences                                  | Transformable |
| ------------- | ------------------- | ------------------------------------------------ | ------------- |
| bar           | `bar.js`            | `orientation: 'horizontal'`, `padding.left: 100` | ✓             |
| column        | `column.js`         | `orientation: 'vertical'`, `layout.type: 'bar'`  | ✓             |
| stacked-bar   | `stackedBar.js`     | Similar to bar                                   | ✓             |
| line          | `line.js`           | `scale: 'time'`, `width: 420`, `height: 356`     | ✓             |
| area          | `area.js`           | Same as line with fill                           | ✓             |
| dot-plot      | `dotPlot.js`        | `layout.type: 'dot-plot'`                        | ✓             |
| pie           | `pie.js`            | No axes, circular layout                         | ✓             |
| scatter       | `scatter.js`        | Both axes numeric                                | ✓             |
| us-map        | `map-usa.js`        | Geographic, state FIPS codes                     | ✗             |
| us-map-county | `map-usa-county.js` | Geographic, county FIPS codes                    | ✗             |
| us-map-block  | `map-usa-block.js`  | Cartogram, state FIPS codes                      | ✗             |
| world-map     | `map-world.js`      | Geographic, ISO 3166-1 codes                     | ✗             |

## State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Actions                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Select Variation]                                              │
│        │                                                         │
│        ▼                                                         │
│  ┌──────────────┐    Is innerBlocks    ┌─────────────────────┐  │
│  │ Placeholder  │───── empty? ────────▶│ replaceInnerBlocks  │  │
│  │   (initial)  │       Yes            │  (existing logic)   │  │
│  └──────────────┘                      └─────────────────────┘  │
│        │                                                         │
│        │ No (existing chart)                                     │
│        ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Chart Type Transform Flow                    │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  1. Detect chart family transition type                   │   │
│  │  2. Get target variation template defaults                │   │
│  │  3. Merge preserved attrs with new defaults               │   │
│  │  4. Update chart block attributes                         │   │
│  │  5. Re-render chart                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Rules

Before applying a chart type transition:

1. **Required**: New `layout.type` must be a valid chart type
2. **Required**: Resulting attributes must pass block schema validation
3. **Warning**: If transitioning between incompatible families, log warning
4. **Fallback**: If transformation fails, preserve original attributes and show error notice
