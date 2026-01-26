# Viewport-Aware Attributes Architecture

## Overview

The chart builder supports viewport-specific customization, allowing different presentation settings for desktop, tablet, and mobile viewports. However, **not all attributes should be viewport-aware**. This document outlines the architectural decision to separate **content attributes** (what data to show) from **presentation attributes** (how to show it).

## Core Principle

**The same data should be shown across all viewports; only the presentation should adapt.**

This ensures:

- **Data integrity**: The chart represents the same story across all devices
- **Editorial consistency**: One set of findings, not three different datasets
- **User trust**: Shared links show the same data regardless of device
- **Simpler mental model**: "The data is constant; the presentation adapts"

## Attribute Categories

### Content Attributes (NOT Viewport-Aware)

Content attributes define **WHAT data to show** and should be consistent across all viewports. These are accessed directly from `attributes` and updated using `setAttributes()`.

| Attribute      | Description                                                    | Access Pattern             |
| -------------- | -------------------------------------------------------------- | -------------------------- |
| `io`           | Data source, color palette, chart family, available categories | `attributes.io`            |
| `dataRender`   | Categories to render, sorting order, scales, date formats      | `attributes.dataRender`    |
| `divergingBar` | Positive/negative category assignments, neutral bar config     | `attributes.divergingBar`  |
| `colors`       | Color palette (stored in `io.colorValue`, `io.customColors`)   | `attributes.io.colorValue` |

**Example Usage:**

```jsx
// ✅ CORRECT: Direct access for content attributes
const io = attributes.io || {};
const dataRender = attributes.dataRender || {};

// Update content attributes directly
setAttributes({
	dataRender: {
		...dataRender,
		categories: newCategories,
	},
});
```

### Presentation Attributes (Viewport-Aware)

Presentation attributes define **HOW to show the data** and can vary by viewport. These use the `useViewportAttributes` hook with `getCurrentValue()` and `updateAttributeForDevice()`.

| Attribute         | Description                                          | Access Pattern                                    |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `layout`          | Width, height, padding, orientation                  | `getCurrentValue('layout', 'width')`              |
| `labels`          | Font size, positioning, visibility, custom positions | `getCurrentValue('labels', 'fontSize')`           |
| `legend`          | Orientation, position, alignment, offset             | `getCurrentValue('legend', 'alignment')`          |
| `annotations`     | Text, positioning, styling                           | `getCurrentValue('annotations', 'items')`         |
| `tooltip`         | Positioning, sizing, formatting                      | `getCurrentValue('tooltip', 'active')`            |
| `independentAxis` | Tick counts, label sizes, positioning                | `getCurrentValue('independentAxis', 'tickCount')` |
| `dependentAxis`   | Tick counts, label sizes, positioning                | `getCurrentValue('dependentAxis', 'tickCount')`   |
| `metadata`        | Title, subtitle (for space constraints)              | `getCurrentValue('metadata', 'title')`            |
| `bar`             | Bar padding, group padding                           | `getCurrentValue('bar', 'barPadding')`            |
| `line`            | Interpolation, stroke width, area fill               | `getCurrentValue('line', 'strokeWidth')`          |
| `dotPlot`         | Connecting line styles                               | `getCurrentValue('dotPlot', 'connectPoints')`     |
| `map`             | Projection, boundaries, zoom                         | `getCurrentValue('map', 'showStateBoundaries')`   |
| `diffColumn`      | Styling, positioning                                 | `getCurrentValue('diffColumn', 'style')`          |
| `plotBands`       | Band configuration, styling                          | `getCurrentValue('plotBands', 'bands')`           |

**Example Usage:**

```jsx
// ✅ CORRECT: Use hook for presentation attributes
const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
	attributes,
	setAttributes
);

// Read viewport-aware value
const fontSize = getCurrentValue('labels', 'fontSize');

// Update viewport-aware value
updateAttributeForDevice('labels', {
	fontSize: 14,
});
```

## Implementation Guide

### Setting Up a Control Component

1. **Import the hook:**

    ```jsx
    import { useViewportAttributes } from './use-viewport-attributes';
    ```

2. **Initialize for presentation attributes:**

    ```jsx
    const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
    	attributes,
    	setAttributes
    );
    ```

3. **Access content attributes directly:**

    ```jsx
    // Content attributes - NOT viewport-aware
    const io = attributes.io || {};
    const dataRender = attributes.dataRender || {};
    ```

4. **Access presentation attributes via hook:**
    ```jsx
    // Presentation attributes - viewport-aware
    const layout = getCurrentValue('layout') || {};
    const fontSize = getCurrentValue('labels', 'fontSize');
    ```

### Updating Attributes

**Content Attributes:**

```jsx
// ✅ CORRECT: Direct setAttributes for content
setAttributes({
	dataRender: {
		...dataRender,
		categories: newCategories,
	},
});
```

**Presentation Attributes:**

```jsx
// ✅ CORRECT: Use updateAttributeForDevice for presentation
updateAttributeForDevice('labels', {
	fontSize: 14,
});
```

### Common Patterns

#### Reading a Single Value

```jsx
// Content attribute
const colorValue = attributes.io?.colorValue;

// Presentation attribute
const fontSize = getCurrentValue('labels', 'fontSize');
```

#### Reading an Entire Group

```jsx
// Content attribute
const dataRender = attributes.dataRender || {};

// Presentation attribute
const labels = getCurrentValue('labels') || {};
```

#### Updating with Spread

```jsx
// Content attribute
setAttributes({
	dataRender: {
		...dataRender,
		categories: newCategories,
	},
});

// Presentation attribute
const currentLabels = getCurrentValue('labels') || {};
updateAttributeForDevice('labels', {
	...currentLabels,
	fontSize: 14,
});
```

## Why This Separation?

### Problems Solved

1. **Data Consistency**: Users expect the same data regardless of device
2. **Editorial Integrity**: Charts represent research findings that shouldn't vary by viewport
3. **Simplified Mental Model**: Clear distinction between "what" and "how"
4. **Reduced Bugs**: No need to sync data attributes across viewports
5. **Better UX**: Users can customize presentation without worrying about data integrity

### What This Means for Users

- **Content attributes** (data, categories, colors) are set once and apply everywhere
- **Presentation attributes** (sizes, positions, visibility) can be customized per viewport
- When adding new data columns, they automatically appear in all viewports
- Users can optimize layout and typography for each screen size independently

## Migration Notes

If you're updating existing code:

1. **Check the attribute category** - Is it content or presentation?
2. **Content attributes**: Remove `getCurrentValue()` and `updateAttributeForDevice()`, use direct `attributes` access
3. **Presentation attributes**: Ensure they use `getCurrentValue()` and `updateAttributeForDevice()`
4. **Never mix patterns**: Don't use viewport-aware helpers for content attributes

## Examples of Correct Usage

### ✅ Correct: Content Attribute

```jsx
function DataControls({ attributes, setAttributes }) {
	// Content attribute - direct access
	const dataRender = attributes.dataRender || {};

	return (
		<SelectControl
			value={dataRender.xScale}
			onChange={(value) =>
				setAttributes({
					dataRender: {
						...dataRender,
						xScale: value,
					},
				})
			}
		/>
	);
}
```

### ✅ Correct: Presentation Attribute

```jsx
function LabelControls({ attributes, setAttributes }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	return (
		<NumberControl
			value={getCurrentValue('labels', 'fontSize')}
			onChange={(value) =>
				updateAttributeForDevice('labels', {
					fontSize: value,
				})
			}
		/>
	);
}
```

### ❌ Incorrect: Using Viewport-Aware for Content

```jsx
// ❌ WRONG: dataRender is content, not presentation
const dataRender = getCurrentValue('dataRender') || {};
updateAttributeForDevice('dataRender', { categories: [...] });
```

### ❌ Incorrect: Direct Access for Presentation

```jsx
// ❌ WRONG: labels is presentation, should be viewport-aware
const fontSize = attributes.labels?.fontSize;
setAttributes({ labels: { ...attributes.labels, fontSize: 14 } });
```

## Related Files

- `src/chart/edit/use-viewport-attributes.js` - Hook implementation
- `src/chart/utils/get-config.js` - Config merging logic
- `src/chart/class-chart.php` - Server-side attribute merging

## Questions?

If you're unsure whether an attribute should be viewport-aware, ask:

1. **Does this change WHAT data is shown?** → Content attribute (NOT viewport-aware)
2. **Does this change HOW the data is presented?** → Presentation attribute (viewport-aware)

When in doubt, err on the side of content (NOT viewport-aware) to maintain data consistency.
