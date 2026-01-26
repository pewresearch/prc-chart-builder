# Quickstart: Chart Type Switching Implementation

**Issue**: `issue-2016`
**Created**: 2025-12-11

## Overview

This guide helps developers understand and implement the chart type switching feature for the PRC Chart Builder WordPress plugin.

## Problem Summary

Users cannot change an existing chart's type (e.g., bar → line) without encountering JavaScript errors. The root cause is that WordPress's variation picker only updates the parent controller block's `chartType` attribute, not the inner chart block's configuration.

## Key Files to Modify

| File                                        | Purpose                 | Changes Needed                |
| ------------------------------------------- | ----------------------- | ----------------------------- |
| `src/controller/Edit.jsx`                   | Controller block editor | Add chart type change handler |
| `src/chart/edit/index.jsx`                  | Chart block editor      | Add parent context sync       |
| `src/chart/utils/chart-type-transformer.js` | **NEW**                 | Transformation logic          |
| `src/controller/variations.js`              | Variation definitions   | No changes (reference only)   |

## Implementation Steps

### Step 1: Create Transformation Utility

Create `src/chart/utils/chart-type-transformer.js`:

```javascript
/**
 * Transforms chart block attributes when switching chart types.
 * Preserves user customizations while applying new type defaults.
 */

import {
	barTemplate,
	lineTemplate,
	// ... other templates
} from '../../../.shared/variation-templates';

// Chart type to family mapping
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
	map: ['us-map', 'us-map-county', 'us-map-block', 'world-map'],
};

// Get template defaults for a chart type
const getTemplateDefaults = (chartType) => {
	// Map chartType to template
	const templateMap = {
		bar: barTemplate,
		line: lineTemplate,
		// ... map all types
	};

	const template = templateMap[chartType];
	if (!template) return null;

	// Find chart block in template (second element)
	const chartBlockTemplate = template.find(
		([blockName]) => blockName === 'prc-chart-builder/chart'
	);

	return chartBlockTemplate ? chartBlockTemplate[1] : null;
};

// Get family for a chart type
const getFamily = (chartType) => {
	for (const [family, types] of Object.entries(CHART_FAMILIES)) {
		if (types.includes(chartType)) return family;
	}
	return null;
};

// Main transformation function
export const transformChartType = (currentAttrs, newChartType) => {
	const currentType = currentAttrs.layout?.type;
	const currentFamily = getFamily(currentType);
	const newFamily = getFamily(newChartType);

	const templateDefaults = getTemplateDefaults(newChartType);
	if (!templateDefaults) {
		console.warn(`No template found for chart type: ${newChartType}`);
		return currentAttrs;
	}

	// Always preserve these
	const preserved = {
		metadata: currentAttrs.metadata,
		colors: currentAttrs.colors,
		io: currentAttrs.io,
	};

	// Merge strategy based on family transition
	if (currentFamily === newFamily) {
		// Same family: preserve more settings
		return {
			...currentAttrs,
			...templateDefaults,
			...preserved,
			tooltip: currentAttrs.tooltip,
			legend: {
				...templateDefaults.legend,
				...currentAttrs.legend,
				markerStyle: templateDefaults.legend?.markerStyle,
			},
		};
	}

	// Cross-family: use more template defaults
	return {
		...templateDefaults,
		...preserved,
		legend: {
			...templateDefaults.legend,
			active: currentAttrs.legend?.active ?? true,
		},
	};
};

export { CHART_FAMILIES, getFamily, getTemplateDefaults };
```

### Step 2: Add Chart Type Sync in Chart Editor

Modify `src/chart/edit/index.jsx` to detect and handle chart type changes:

```javascript
import { transformChartType } from '../utils/chart-type-transformer';

// Inside the Edit component, add:
const controllerChartType = context['prc-chart-builder/chartType'];

useEffect(() => {
	const currentLayoutType = attrs.layout?.type;

	// If controller's chartType differs from chart's layout.type
	if (controllerChartType && currentLayoutType !== controllerChartType) {
		// Transform attributes for new chart type
		const newAttrs = transformChartType(attrs, controllerChartType);
		setAttributes(newAttrs);
	}
}, [controllerChartType]);
```

### Step 3: Provide Chart Type Context

Modify `src/controller/block.json` to provide chartType context:

```json
{
	"providesContext": {
		"prc-chart-builder/id": "id",
		"prc-chart-builder/align": "align",
		"prc-chart-builder/chartType": "chartType"
	}
}
```

### Step 4: Add Error Boundary

Wrap chart rendering in an error boundary to gracefully handle edge cases:

```javascript
// In src/chart/edit/index.jsx
import { ErrorBoundary } from '@wordpress/components';

// Wrap the chart render:
<ErrorBoundary>
	<ChartBuilderEditor
		data={chartData}
		config={config}
		// ...
	/>
</ErrorBoundary>;
```

## Testing

### Manual Testing Steps

1. Create a new bar chart with sample data
2. Use the block toolbar to switch to "Line" variation
3. Verify chart re-renders without errors
4. Check that metadata (title, source) is preserved
5. Verify scale changes appropriately (ordinal → time)

### Test Scenarios

| From | To          | Expected Behavior                            |
| ---- | ----------- | -------------------------------------------- |
| Bar  | Stacked Bar | Bars stack, same axis config                 |
| Bar  | Line        | Scale changes to time, legend marker to line |
| Line | Area        | Fill added, same scale                       |
| Line | Bar         | Scale reverts to ordinal                     |
| Any  | Pie         | Axes hidden, circular layout                 |

## Debugging

If chart type switching fails:

1. Check browser console for JavaScript errors
2. Verify `layout.type` matches controller's `chartType`
3. Check `independentAxis.scale` is appropriate for chart type
4. Verify variation template exists for target type

## Files Reference

```
src/
├── controller/
│   ├── block.json          # Add chartType to providesContext
│   ├── Edit.jsx            # No changes needed
│   └── variations.js       # Reference for chart types
├── chart/
│   ├── block.json          # Add usesContext for chartType
│   ├── edit/
│   │   └── index.jsx       # Add type sync logic
│   └── utils/
│       ├── chart-type-transformer.js  # NEW: transformation logic
│       └── helpers.js      # Existing helpers
└── .shared/
    └── variation-templates/  # Template defaults
```
