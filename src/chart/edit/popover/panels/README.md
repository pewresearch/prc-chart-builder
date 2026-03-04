# Chart Element Popover Panels

This folder contains the panel components for the chart element customization popover system. Each panel provides a specialized UI for customizing different types of chart elements.

## Architecture Overview

The popover system uses a modular architecture where:

1. **ChartElementPopover** (`../index.jsx`) - The main container that:

    - Handles positioning and click-outside behavior
    - Routes to the appropriate panel based on `elementType`
    - Manages the popover lifecycle

2. **Panels** (this folder) - Specialized UI components for each element type:

    - `LabelPanel` - Customize data point labels
    - `ShapePanel` - Customize shapes (bars, circles, pie slices)
    - `LineSegmentPanel` - Customize individual line segments

3. **Hooks** (`../hooks/`) - State management for each panel type:

    - `useLabelCustomizations`
    - `useShapeCustomizations`
    - `useSegmentCustomizations`

4. **Utilities** (`../utils.js`) - Shared functions for key generation and constants

## Panels

### LabelPanel

Customizes data point labels on any chart type.

**Controls:**

- Custom label text (override the default formatted value)
- Visibility toggle (hide specific labels)
- Color picker (override label color)
- Font family selector
- Font weight selector
- Font style selector (normal/italic)

**Key format:** `{x}::{category}`

### ShapePanel

Customizes individual shapes like bars, circles, and pie slices.

**Controls:**

- Fill color picker
- Stroke color picker
- Opacity slider (0-1)
- Stroke width control

**Key format:** `{x}::{category}`

**Supported chart types:**

- Bar charts (horizontal, vertical, stacked, diverging, exploded)
- Pie charts
- Line charts (data point circles)
- Scatter plots
- Dot plots

### LineSegmentPanel

Customizes individual line segments between data points.

**Controls:**

- Stroke color picker
- Stroke width control
- Opacity slider (0-1)
- Line style selector (solid, dashed, dotted, long dash, dash-dot)

**Key format:** `{startX}::{endX}::{category}`

**Features:**

- Click directly on line segments to open popover
- Hover feedback highlights segments in editor mode
- 16px invisible hit areas for easy clicking of thin lines

## Key Generation

Keys are used to store and retrieve customizations from block attributes. All keys are normalized to ensure consistency between the editor and frontend:

```javascript
// For shapes and labels
generateElementKey(x, category) → "{x}::{category}"

// For line segments
generateSegmentKey(startX, endX, category) → "{startX}::{endX}::{category}"
```

**Important:** Date objects are converted to ISO strings (e.g., `"2020-01-01T05:00:00.000Z"`) to ensure consistent keys across:

- Editor (where dates are JavaScript Date objects)
- Frontend (where dates are ISO strings from JSON serialization)

## Data Flow

```
User clicks element
        ↓
wpEditorFunctions.{type}.onClick()
        ↓
handleElementClick() in edit/index.jsx
        ↓
setSelectedElement({ elementType, dataPoint, ... })
        ↓
ChartElementPopover renders appropriate panel
        ↓
Panel uses hook for state management
        ↓
User makes changes
        ↓
hook.handleStyleChange() updates local state
        ↓
onUpdate() propagates to block attributes
        ↓
Chart re-renders with new styles
```

## Block Attributes

Customizations are stored in the block's attributes:

```json
{
  "labels": {
    "customLabels": { "{key}": "Custom Text" },
    "customVisibility": { "{key}": false },
    "customStyles": { "{key}": { "color": "#ff0000", ... } },
    "customPositions": { "{key}": { "dx": 10, "dy": -5 } }
  },
  "shapes": {
    "customStyles": { "{key}": { "fill": "#ff0000", "stroke": "#000", ... } },
    "segmentStyles": { "{key}": { "stroke": "#ff0000", "strokeDasharray": "5,5", ... } }
  }
}
```

## Adding a New Panel

To add support for a new element type:

1. Create a new panel component in this folder (e.g., `NewElementPanel.jsx`)
2. Create a corresponding hook in `../hooks/` (e.g., `useNewElementCustomizations.js`)
3. Export from `./index.js` and `../hooks/index.js`
4. Add the element type to `ELEMENT_TYPES` in `../index.jsx`
5. Add a case in `getPanelTitle()` and `renderPanel()` in `ChartElementPopover`
6. Add handlers in `wp-editor-functions.js`
7. Update the chart component to trigger the click handler

## Viewport Awareness

All customizations support viewport-specific overrides. The system respects:

- Desktop (base attributes)
- Tablet (overrides in `attributes.tablet.*`)
- Mobile (overrides in `attributes.mobile.*`)

This allows different customizations per viewport for responsive chart editing.
