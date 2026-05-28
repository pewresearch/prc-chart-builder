# Chart Element Popover Panels

Panel components for the chart element customization popover. Each panel edits one `ELEMENT_TYPES` value from `../index.jsx`.

## Architecture

```
User click on canvas element
        ↓
wpEditorFunctions.{feature}.onClick()  (wp-editor-functions.js)
        ↓
handleElementClick() in edit/index.jsx → setSelectedElement(...)
        ↓
ChartElementPopover → renderPanel() by elementType
        ↓
Panel (+ optional shared section) → hook (or inline state)
        ↓
onUpdate() → block attributes via updateAttributeForDevice
        ↓
Chart re-renders
```

| Layer | Location | Role |
| ----- | -------- | ---- |
| Container | `../index.jsx` | Popover chrome, `ELEMENT_TYPES`, routing |
| Panels | This folder | Element-specific UI |
| Hooks | `../hooks/` | Read/write block attrs for most panels |
| Shared UI | `TextStyleControls.jsx`, `TooltipPanelSection.jsx` | Reused typography / tooltip sections |
| Utilities | `../utils.js` | Keys, constants, feature rollout gates |

## Panel inventory

| Panel | `ELEMENT_TYPES` | Hook | Primary block attribute(s) |
| ----- | ---------------- | ---- | -------------------------- |
| `LabelPanel` | `label`, `netValueLabel` | `useLabelCustomizations` | `labels.customLabels`, `customVisibility`, `customStyles`, `customPositions` |
| `ShapePanel` | `shape` | `useShapeCustomizations` | `shapes.customStyles` |
| `LineSegmentPanel` | `segment` | `useSegmentCustomizations` | `shapes.segmentStyles` |
| `RegressionLinePanel` | `regression` | *(inline in panel)* | `regression.groupBreakStyles[category]` |
| `AnnotationPanel` | `annotation` | `useAnnotationCustomizations` | `annotations[i]` (full annotation object) |
| `TickLabelPanel` | `tickLabel` | `useTickLabelCustomizations` | `customTickLabels[independent\|dependent][tickValue]` |
| `LegendItemPanel` | `legendItem` | `useLegendItemCustomizations` | `legend.customLegendLabels[categoryValue]` |
| `ErrorBarPanel` | `errorBar` | `useErrorBarCustomizations` | `dotPlot.customStyles[elementKey]` |
| `DiffColumnHeaderPanel` | `diffColumnHeader` | `useDiffColumnHeaderCustomizations` | `diffColumn.columnHeader`, `diffColumn.style.*` |
| `DiffColumnLabelPanel` | `diffColumnLabel` | `useDiffColumnLabelCustomizations` | `diffColumn.customLabels[rowKey]` |

### Shared components (not routed by `elementType`)

| Component | Used by | Role |
| --------- | ------- | ---- |
| `TextStyleControls` | Label, Tick, Legend, Annotation (compact), Diff column panels | Shared text, typography, color, outline controls |
| `TooltipPanelSection` | `LabelPanel`, `ShapePanel` | Per-point tooltip body/header overrides |

## Hooks

| Hook | Storage shape | Notes |
| ---- | ------------- | ----- |
| `useLabelCustomizations` | Split across `labels.*` maps | Text, visibility, position, style per key |
| `useShapeCustomizations` | `shapes.customStyles[key]` | Fill, stroke, opacity, strokeWidth |
| `useSegmentCustomizations` | `shapes.segmentStyles[key]` | Stroke, width, opacity, dash |
| `useTickLabelCustomizations` | `customTickLabels[axis][tick]` object | Legacy string entries normalized to `{ text }` |
| `useAnnotationCustomizations` | Partial updates on annotation object | Full + compact variants |
| `useLegendItemCustomizations` | `legend.customLegendLabels[key]` object | Text, color, typography, marker, detached offsets |
| `useErrorBarCustomizations` | `dotPlot.customStyles[key]` | Stroke styling for whiskers |
| `useTooltipCustomizations` | `customTooltips[key]` | `{ body, header }`; used by `TooltipPanelSection` |
| `useDiffColumnHeaderCustomizations` | Maps to `diffColumn` + `diffColumn.style` | Adapts column header fields to `TextStyleControls` shape |
| `useDiffColumnLabelCustomizations` | `diffColumn.customLabels[rowKey]` object | Per-cell text, color, typography, outline |

`RegressionLinePanel` keeps state in the component and writes `regression.groupBreakStyles` directly (no dedicated hook).

## Key generation

All data-point keys use `generateElementKey(x, category, groupValue)` from `../utils.js`:

```text
{x}::{category}                    — no grouping
{x}::{category}::{groupValue}      — when groupBreaksActive
```

Line segments use `generateSegmentKey(startX, endX, category)` → `{startX}::{endX}::{category}`.

Date `x` values are normalized to ISO strings so editor and frontend keys match.

**Diff column** uses the same `generateElementKey` for `diffColumn.customLabels`. Pass `groupValue` from the chart component when group breaks are active.

**Tick labels** key by raw `tickValue` under `customTickLabels.independent` or `.dependent` (not `generateElementKey`).

**Legend items** key by category/domain string in `customLegendLabels`.

## Panel summaries

### LabelPanel

Data point labels (also used for `netValueLabel` clicks).

- Custom text, visibility, offset X/Y (disabled on treemap)
- Typography via `TextStyleControls` (color, weight, style, family, size, outline)
- Max width
- Optional `TooltipPanelSection`

### ShapePanel

Bars, points, pie slices, etc.

- Fill, stroke, opacity, stroke width
- Optional `TooltipPanelSection`

### LineSegmentPanel

Individual line/area segments between two x values.

- Stroke color, width, opacity, dash pattern
- 16px hit target in editor

### RegressionLinePanel

Regression overlay lines (combined or per-series).

- Stroke color, width, dash
- Stored in `regression.groupBreakStyles[category]`

### AnnotationPanel

Free-floating chart annotations.

- Full variant: text, typography, position, delete
- Compact variant: typography only (reuses `TextStyleControls`)

### TickLabelPanel

Independent or dependent axis tick labels.

- Custom text + typography via `TextStyleControls`
- Gated by `TICK_LABEL_POPOVER_CHART_TYPES` in `../utils.js` (`null` = all types)

### LegendItemPanel

Single legend entry (grouped or detached).

- Label text + typography via `TextStyleControls`
- Marker style/fill; max width; text outline
- Offset X/Y when `legendVariation === 'detached'`

### ErrorBarPanel

Dot plot error whiskers.

- Stroke color, width, opacity, dash

### DiffColumnHeaderPanel

Difference column header (bar-family + dot-plot charts).

- Header text, color, typography, outline via `TextStyleControls`
- Writes column-level `diffColumn` fields (not per-cell)
- Gated by `DIFF_COLUMN_POPOVER_CHART_TYPES`

### DiffColumnLabelPanel

Single diff column cell.

- Custom cell text + typography + outline via `TextStyleControls`
- Per-cell overrides in `diffColumn.customLabels`
- Same chart-type gate as header panel

## Block attributes (customization maps)

```json
{
  "labels": {
    "customLabels": { "{key}": "text" },
    "customVisibility": { "{key}": false },
    "customStyles": { "{key}": { "color": "#ff0000", "fontWeight": "bold", ... } },
    "customPositions": { "{key}": { "dx": 10, "dy": -5 } }
  },
  "shapes": {
    "customStyles": { "{key}": { "fill": "#ff0000", "stroke": "#000", ... } },
    "segmentStyles": { "{key}": { "stroke": "#ff0000", "strokeDasharray": "5,5", ... } }
  },
  "customTickLabels": {
    "independent": { "{tickValue}": { "text": "...", "fill": "...", ... } },
    "dependent": { "{tickValue}": { ... } }
  },
  "legend": {
    "customLegendLabels": { "{category}": { "text": "...", "color": "...", "offsetX": 0, ... } }
  },
  "dotPlot": {
    "customStyles": { "{key}": { "stroke": "...", ... } }
  },
  "customTooltips": {
    "{key}": { "body": "<b>HTML</b>", "header": "Override" }
  },
  "diffColumn": {
    "columnHeader": "Diff",
    "style": { "fill": "#2a2a2a", "headerFill": "#2a2a2a", "textOutline": false, ... },
    "customLabels": {
      "{key}": { "text": "...", "fill": "...", "fontWeight": "bold", "textOutline": true, ... }
    }
  },
  "regression": {
    "groupBreakStyles": { "{category}": { "stroke": "...", "strokeWidth": 2, ... } }
  }
}
```

Per-element overrides are **not** included in style copy/paste (`get-copyable-style-attributes.js`); only chart-level defaults (e.g. `diffColumn.style`, `labels.color`) copy across charts.

## Feature rollout constants (`../utils.js`)

| Constant | Purpose |
| -------- | ------- |
| `ANNOTATION_POPOVER_CHART_TYPES` | Annotation click-to-edit (`null` = all) |
| `TICK_LABEL_POPOVER_CHART_TYPES` | Tick label popover (`null` = all) |
| `DIFF_COLUMN_POPOVER_CHART_TYPES` | Diff column header/cell popover (bar types + dot-plot) |
| `POSITION_DISABLED_CHART_TYPES` | Hide label drag offsets (treemap) |

## Adding a new panel

1. Add `NewElementPanel.jsx` and (usually) `useNewElementCustomizations.js`
2. Export from `./index.js` and `../hooks/index.js`
3. Add `ELEMENT_TYPES.NEW_ELEMENT` in `../index.jsx`
4. Add cases in `getPanelTitle()` and `renderPanel()`
5. Wire `handleElementClick`, `getUpdateHandler`, and `getCurrentCustomizations` in `edit/index.jsx`
6. Add `wpEditorFunctions` click handler in `wp-editor-functions.js`
7. Trigger click from the charting-library component
8. Document the panel and hook in this README

Prefer `TextStyleControls` for typography instead of duplicating font/color pickers.

## Viewport awareness

Customizations use `updateAttributeForDevice` / `getCurrentValue` so overrides can differ by desktop, tablet (`attributes.tablet.*`), and mobile (`attributes.mobile.*`).
