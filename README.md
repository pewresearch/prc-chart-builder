# PRC Chart Builder

Version 3.5.1

A WordPress plugin for building, managing, and embedding interactive SVG charts on the Pew Research Center platform. Charts are authored as a custom post type (`chart`) using the Gutenberg block editor and rendered via the PRC Charting Library (`prc-charting-library`), which is built on `@visx` and D3.

> **Breaking change — Chart Builder 3.0:** The plugin's block namespace was updated to follow the `{plugin-name}/{block-name}` convention. References should use `prc-chart-builder/chart`, `prc-chart-builder/controller`, and `prc-chart-builder/synced-chart`. The npm package is `@prc/chart-builder`. A WP-CLI command is included to aid bulk migration of legacy data.

---

## Overview

### How charts are built

1. Open **Charts** in wp-admin (the Chart Library — `wp-admin/edit.php?post_type=chart`)
2. Create a new chart via the **Create New Chart** modal — choose a chart type, start from a pattern template, or use the AI generation tool
3. The chart opens in the block editor as a `prc-chart-builder/controller` block containing a `prc-chart-builder/chart` inner block
4. Paste or type CSV data into the data table; the chart renders live in the editor
5. Use the sidebar panels and the **click-to-style element popover** (click any bar, label, line, or map region) for fine-grained customization
6. Publish — the chart is now available to embed in articles via the `prc-chart-builder/synced-chart` block

### Block structure

```
prc-chart-builder/controller   (outer — data table, context, freeform chart hosting)
  └── prc-chart-builder/chart  (inner — all chart config stored here as attributes)
  └── core/table               (optional — canonical CSV data source)
```

When embedding a chart into an article, editors use `prc-chart-builder/synced-chart`, which holds a reference (`ref`) to the chart CPT post and delegates rendering to the controller block inside it.

### Key systems introduced in 3.5.0


| System              | What it does                                                                       |
| ------------------- | ---------------------------------------------------------------------------------- |
| Chart Library admin | DataViews-based gallery with filtering, previews, and multi-path creation          |
| AI generation       | Text + image + CSV → complete chart block, with live preview before accepting      |
| Element popover     | Click any chart element in the editor to open a per-element style panel            |
| Dark mode           | Charts automatically respond to OS/browser color scheme via CSS `light-dark()`     |
| Sankey chart        | New chart type for flow/allocation data                                            |
| Treemap chart       | New chart type for hierarchical part-to-whole data                                 |
| Scatter grouping    | Color-code scatter points by a secondary variable; legend reflects groups          |
| Regression lines    | Overlay linear/exponential/polynomial/log/power/quadratic fits on scatter plots    |
| Map improvements    | US block map responsive scaling, missing world map territories, per-region popover |


See `[docs/release-notes/3_5_0.md](docs/release-notes/3_5_0.md)` for the full release notes.

---

## Usage

Charts are managed through the **Chart Library** admin page (`wp-admin/edit.php?post_type=chart`). The chart editor is the standard Gutenberg block editor.

**Embedding a chart in an article:**

Use the `prc-chart-builder/synced-chart` block and select the chart post to embed. This creates a live reference — updates to the chart post are reflected everywhere it is embedded.

**Viewport-responsive customization:**

All chart attributes support per-viewport overrides via the `mobile` and `tablet` top-level attribute groups. Switch the editor to Tablet or Mobile preview to apply breakpoint-specific values. See `[docs/VIEWPORT_USAGE_GUIDE.md](docs/VIEWPORT_USAGE_GUIDE.md)`.

**Per-element styling:**

Click any bar, label, line segment, pie slice, map region, or axis tick label in the editor canvas to open the element popover. Changes update live and are stored in the `labels.custom`* and `shapes.custom*` block attributes using a `{x}::{category}` key.

---

## Development

```bash
# Build
npm run build -w @prc/chart-builder

# Watch
npm run start -w @prc/chart-builder

# Build the charting library (required after library changes)
npm run build:library -w @prc/block-library
```

The plugin depends on `prc-charting-library` and `@prc/charting-utilities`. Changes to those packages require a rebuild before they are reflected in the chart editor or frontend.

**PHP:** Requires PHP 8.1+. Key classes are in `src/chart/class-chart.php` and `src/controller/class-controller.php`.

**Tests:** Playwright e2e tests live in `tests/`. Visual regression tests are in `tests/visual-regression/`.

---

## Documentation


| Document                                                                             | Description                                                       |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)`                                       | System architecture, data flow, state management, decision matrix |
| `[docs/VIEWPORT_ATTRIBUTES.md](docs/VIEWPORT_ATTRIBUTES.md)`                         | Viewport-aware attribute system internals                         |
| `[docs/VIEWPORT_USAGE_GUIDE.md](docs/VIEWPORT_USAGE_GUIDE.md)`                       | Practical guide to responsive chart customization                 |
| `[docs/release-notes/3_5_0.md](docs/release-notes/3_5_0.md)`                         | Chart Builder 3.5.0 release notes                                 |
| `[src/chart/edit/popover/panels/README.md](src/chart/edit/popover/panels/README.md)` | Element popover system internals and extension guide              |


---

## Configuration Reference

All chart configuration is stored as a single `chart` block attribute object on the `prc-chart-builder/chart` inner block. The tables below document every sub-attribute, its parent group, accepted type, default value (sourced from `block.json` and `baseConfig.ts`), and a short description.

> **Note:** Defaults shown here reflect the `block.json` defaults. `baseConfig.ts` (used at runtime in the charting library) may carry different defaults for some fields; any significant divergence is noted.

All chart configuration is stored as a single `chart` block attribute object. The tables below document every sub-attribute, its parent group, accepted type, default value (sourced from `block.json` and `baseConfig.ts`), and a short description.

> **Note:** Defaults shown here reflect the `block.json` defaults. `baseConfig.ts` (used at runtime in the charting library) may carry different defaults for some fields; any significant divergence is noted.

---

### `layout` — General Layout

Controls chart dimensions, type, orientation, and overflow behaviour.


| Attribute                 | Type           | Default                                         | Notes                                                                  |
| ------------------------- | -------------- | ----------------------------------------------- | ---------------------------------------------------------------------- |
| `layout.name`             | string         | `"wp-block-prc-block-chart-builder-controller"` | Internal block name identifier; not user-editable                      |
| `layout.type`             | `'bar'`        | `'diverging-bar'`                               | `'line'`                                                               |
| `layout.orientation`      | `'vertical'`   | `'horizontal'`                                  | `"horizontal"` (block.json) / `"vertical"` (baseConfig)                |
| `layout.theme`            | `'light'`      | `'dark'`                                        | `"light"`                                                              |
| `layout.width`            | number         | `640`                                           | Rendered chart width in pixels                                         |
| `layout.height`           | number         | `400`                                           | Rendered chart height in pixels                                        |
| `layout.padding.top`      | number         | `20`                                            | Top inner padding of the SVG canvas                                    |
| `layout.padding.bottom`   | number         | `25`                                            | Bottom inner padding of the SVG canvas                                 |
| `layout.padding.left`     | number         | `60`                                            | Left inner padding of the SVG canvas                                   |
| `layout.padding.right`    | number         | `0`                                             | Right inner padding of the SVG canvas                                  |
| `layout.overflowX`        | `'responsive'` | `'scroll'`                                      | `'scroll-fixed-y-axis'`                                                |
| `layout.mobileBreakpoint` | number         | `480`                                           | (DEPRECATED) Viewport width (px) at which mobile layout rules activate |
| `layout.horizontalRules`  | boolean        | `true`                                          | Show horizontal grid rules behind the chart                            |
| `layout.parentClass`      | string         | `"wp-chart-builder-wrapper"`                    | CSS class applied to the outermost wrapper element                     |


---

### `metadata` — Chart Titles & Attribution

Text displayed above/below the chart canvas.


| Attribute           | Type    | Default                 | Notes                                        |
| ------------------- | ------- | ----------------------- | -------------------------------------------- |
| `metadata.active`   | boolean | `true`                  | Show/hide the metadata block entirely        |
| `metadata.title`    | string  | `"Title"`               | Primary chart headline                       |
| `metadata.subtitle` | string  | `"Subtitle"`            | Secondary line below the title               |
| `metadata.note`     | string  | `"Note: ..."`           | Footnote displayed at the bottom             |
| `metadata.source`   | string  | `"Source: ..."`         | Source attribution line                      |
| `metadata.tag`      | string  | `"PEW RESEARCH CENTER"` | Institutional tag/brand label                |
| `metadata.alt`      | string  | `""`                    | Accessible alt-text for static image exports |


---

### `colors` — color Palette


| Attribute | Type     | Default                                                         | Notes                                             |
| --------- | -------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `colors`  | string[] | `["#456A83","#BF3B27","#756a7e","#ea9e2c","#BB792A","#eeece4"]` | Ordered list of hex colors applied to data series |


---

### `plotBands` — Reference Bands

Shaded regions overlaid on the chart to highlight ranges.


| Attribute               | Type     | Default | Notes                                              |
| ----------------------- | -------- | ------- | -------------------------------------------------- |
| `plotBands.active`      | boolean  | `false` | Enable/disable all plot bands                      |
| `plotBands.allowDrag`   | boolean  | `false` | Allow user to drag band positions (editor only)    |
| `plotBands.allowResize` | boolean  | `false` | Allow user to resize bands (editor only)           |
| `plotBands.dimension`   | `'x'`    | `'y'`   | `"x"`                                              |
| `plotBands.bands`       | object[] | `[]`    | Array of band objects (`{ from, to, color, ... }`) |


---

### `independentAxis` — X-Axis (Category / Independent)


| Attribute                                   | Type              | Default                   | Notes                                                          |
| ------------------------------------------- | ----------------- | ------------------------- | -------------------------------------------------------------- |
| `independentAxis.active`                    | boolean           | `true`                    | Show/hide the axis                                             |
| `independentAxis.label`                     | string            | `""`                      | Axis title label                                               |
| `independentAxis.scale`                     | `'linear'`        | `'time'`                  | `'log'`                                                        |
| `independentAxis.dateFormat`                | string (strftime) | `"%Y"`                    | Format applied when `scale` is `"time"` (e.g. `"%-m/%Y"`)      |
| `independentAxis.domain`                    | [number, number]  | `[0, 100]`                | Explicit axis extent; `[min, max]`                             |
| `independentAxis.domainPadding`             | number            | `20`                      | Extra padding added beyond the domain edges                    |
| `independentAxis.showZero`                  | boolean           | `true`                    | Force zero to appear in the domain                             |
| `independentAxis.padding`                   | number            | `30`                      | Space between axis line and chart edge (px)                    |
| `independentAxis.tickMarksActive`           | boolean           | `false`                   | Show tick mark lines on the axis                               |
| `independentAxis.tickCount`                 | number            | `5`                       | Suggested number of tick marks                                 |
| `independentAxis.tickValues`                | number[]          | null                      | `null`                                                         |
| `independentAxis.tickFormat`                | null              | `null`                    | Reserved for runtime format function                           |
| `independentAxis.ticksToLocaleString`       | boolean           | `false`                   | Format tick values with `toLocaleString()`                     |
| `independentAxis.abbreviateTicks`           | boolean           | `false`                   | Abbreviate large numbers (e.g. 1K, 1M)                         |
| `independentAxis.abbreviateTicksDecimals`   | number            | `0`                       | Decimal places when abbreviating                               |
| `independentAxis.tickUnit`                  | string            | `""`                      | Unit suffix/prefix appended to tick labels (e.g. `"%"`, `"$"`) |
| `independentAxis.tickUnitPosition`          | `'start'`         | `'end'`                   | `"end"`                                                        |
| `independentAxis.tickLabels.fontSize`       | number            | `12`                      | Tick label font size (px)                                      |
| `independentAxis.tickLabels.padding`        | number            | `0`                       | Gap between tick mark and label (px)                           |
| `independentAxis.tickLabels.angle`          | number            | `0`                       | Rotation of tick labels (degrees)                              |
| `independentAxis.tickLabels.dx`             | number            | `0`                       | Horizontal nudge for tick labels                               |
| `independentAxis.tickLabels.dy`             | number            | `0`                       | Vertical nudge for tick labels                                 |
| `independentAxis.tickLabels.textAnchor`     | `'start'`         | `'middle'`                | `'end'`                                                        |
| `independentAxis.tickLabels.verticalAnchor` | `'start'`         | `'middle'`                | `'end'`                                                        |
| `independentAxis.tickLabels.fill`           | string (hex)      | `"#2a2a2a"`               | Tick label color                                               |
| `independentAxis.tickLabels.fontFamily`     | string            | Franklin Gothic / Verdana | Label font stack                                               |
| `independentAxis.tickLabels.maxWidth`       | number            | `50`                      | Max label width before wrapping (px)                           |
| `independentAxis.axisLabel.fontSize`        | number            | `12`                      | Axis title font size (px)                                      |
| `independentAxis.axisLabel.fill`            | string (hex)      | `"#2a2a2a"`               | Axis title color                                               |
| `independentAxis.axisLabel.padding`         | number            | `15`                      | Gap between axis line and title                                |
| `independentAxis.axisLabel.angle`           | number            | `0`                       | Rotation of the axis title                                     |
| `independentAxis.axisLabel.dx`              | number            | `0`                       | Horizontal nudge for the axis title                            |
| `independentAxis.axisLabel.dy`              | number            | `0`                       | Vertical nudge for the axis title                              |
| `independentAxis.axisLabel.textAnchor`      | `'start'`         | `'middle'`                | `'end'`                                                        |
| `independentAxis.axisLabel.verticalAnchor`  | `'start'`         | `'middle'`                | `'end'`                                                        |
| `independentAxis.axisLabel.maxWidth`        | number            | `100`                     | Max axis title width before wrapping (px)                      |
| `independentAxis.axis.stroke`               | string (hex)      | `"#818181"`               | color of the axis line                                         |
| `independentAxis.axis.strokeWidth`          | number            | `1`                       | Width of the axis line (px)                                    |
| `independentAxis.ticks.stroke`              | string (hex)      | `"#818181"`               | color of tick marks                                            |
| `independentAxis.ticks.size`                | number            | `5`                       | Length of tick marks (px)                                      |
| `independentAxis.ticks.strokeWidth`         | number            | `0`                       | Width of tick mark lines                                       |
| `independentAxis.grid.stroke`               | string (hex)      | `""`                      | color of grid lines (empty = inherit / none)                   |
| `independentAxis.grid.strokeOpacity`        | number            | `0.2`                     | Opacity of grid lines                                          |
| `independentAxis.grid.strokeWidth`          | number            | `2`                       | Width of grid lines (px)                                       |
| `independentAxis.grid.strokeDasharray`      | string            | `""`                      | SVG dash pattern for grid lines                                |


---

### `dependentAxis` — Y-Axis (Value / Dependent)


| Attribute                                 | Type             | Default                   | Notes                                                       |
| ----------------------------------------- | ---------------- | ------------------------- | ----------------------------------------------------------- |
| `dependentAxis.active`                    | boolean          | `true`                    | Show/hide the axis                                          |
| `dependentAxis.label`                     | string           | `""`                      | Axis title label                                            |
| `dependentAxis.scale`                     | `'linear'`       | `'time'`                  | `'log'`                                                     |
| `dependentAxis.domain`                    | [number, number] | `[0, 100]`                | Explicit axis extent; `[min, max]`                          |
| `dependentAxis.showZero`                  | boolean          | `false`                   | Force zero to appear in the domain                          |
| `dependentAxis.tickMarksActive`           | boolean          | `true`                    | Show tick mark lines on the axis                            |
| `dependentAxis.tickCount`                 | number           | `5`                       | Suggested number of tick marks                              |
| `dependentAxis.tickValues`                | number[]         | null                      | `null`                                                      |
| `dependentAxis.tickFormat`                | null             | `null`                    | Reserved for runtime format function                        |
| `dependentAxis.tickAngle`                 | number           | `0`                       | Rotation of tick labels (degrees)                           |
| `dependentAxis.ticksToLocaleString`       | boolean          | `false`                   | Format tick values with `toLocaleString()`                  |
| `dependentAxis.abbreviateTicks`           | boolean          | `true`                    | Abbreviate large numbers (e.g. 1K, 1M)                      |
| `dependentAxis.abbreviateTicksDecimals`   | number           | `0`                       | Decimal places when abbreviating                            |
| `dependentAxis.tickUnit`                  | string           | `""`                      | Unit suffix/prefix appended to tick labels                  |
| `dependentAxis.tickUnitPosition`          | `'start'`        | `'end'`                   | `"end"`                                                     |
| `dependentAxis.tickLabels.fontSize`       | number           | `12`                      | Tick label font size (px)                                   |
| `dependentAxis.tickLabels.padding`        | number           | `15`                      | Gap between tick mark and label (px)                        |
| `dependentAxis.tickLabels.angle`          | number           | `0`                       | Rotation of tick labels (degrees)                           |
| `dependentAxis.tickLabels.dx`             | number           | `0`                       | Horizontal nudge for tick labels                            |
| `dependentAxis.tickLabels.dy`             | number           | `0`                       | Vertical nudge for tick labels                              |
| `dependentAxis.tickLabels.textAnchor`     | `'start'`        | `'middle'`                | `'end'`                                                     |
| `dependentAxis.tickLabels.verticalAnchor` | `'start'`        | `'middle'`                | `'end'`                                                     |
| `dependentAxis.tickLabels.fill`           | string (hex)     | `"#565656"`               | Tick label color                                            |
| `dependentAxis.tickLabels.fontFamily`     | string           | Franklin Gothic / Verdana | Label font stack                                            |
| `dependentAxis.tickLabels.maxWidth`       | number           | `50`                      | Max label width before wrapping (px)                        |
| `dependentAxis.axisLabel.fontSize`        | number           | `12`                      | Axis title font size (px)                                   |
| `dependentAxis.axisLabel.fill`            | string (hex)     | `"#565656"`               | Axis title color                                            |
| `dependentAxis.axisLabel.padding`         | number           | `30`                      | Gap between axis line and title                             |
| `dependentAxis.axisLabel.angle`           | number           | `270`                     | Rotation of the axis title (rotated for Y-axis readability) |
| `dependentAxis.axisLabel.dx`              | number           | `0`                       | Horizontal nudge for the axis title                         |
| `dependentAxis.axisLabel.dy`              | number           | `0`                       | Vertical nudge for the axis title                           |
| `dependentAxis.axisLabel.textAnchor`      | `'start'`        | `'middle'`                | `'end'`                                                     |
| `dependentAxis.axisLabel.verticalAnchor`  | `'start'`        | `'middle'`                | `'end'`                                                     |
| `dependentAxis.axisLabel.maxWidth`        | number           | `200`                     | Max axis title width before wrapping (px)                   |
| `dependentAxis.axis.stroke`               | string (hex)     | `"#818181"`               | color of the axis line                                      |
| `dependentAxis.axis.strokeWidth`          | number           | `1`                       | Width of the axis line (px)                                 |
| `dependentAxis.ticks.stroke`              | string (hex)     | `"#818181"`               | color of tick marks                                         |
| `dependentAxis.ticks.size`                | number           | `5`                       | Length of tick marks (px)                                   |
| `dependentAxis.ticks.strokeWidth`         | number           | `0`                       | Width of tick mark lines                                    |
| `dependentAxis.grid.stroke`               | string (hex)     | `""`                      | color of grid lines (empty = none)                          |
| `dependentAxis.grid.strokeOpacity`        | number           | `0.2`                     | Opacity of grid lines                                       |
| `dependentAxis.grid.strokeWidth`          | number           | `1`                       | Width of grid lines (px)                                    |
| `dependentAxis.grid.strokeDasharray`      | string           | `""`                      | SVG dash pattern for grid lines                             |


---

### `dataRender` — Data Binding & Sorting

Maps data columns to chart axes and controls sort order, group breaks, and scale types.


| Attribute                                            | Type                   | Default            | Notes                                                 |
| ---------------------------------------------------- | ---------------------- | ------------------ | ----------------------------------------------------- |
| `dataRender.x`                                       | string                 | `"x"`              | Column key used as the independent (X) variable       |
| `dataRender.y`                                       | string                 | `"y"`              | Column key used as the primary dependent (Y) variable |
| `dataRender.sortKey`                                 | string                 | `"x"`              | Data column to sort rows by before rendering          |
| `dataRender.sortOrder`                               | `'ascending'`          | `'descending'`     | `'reverse'`                                           |
| `dataRender.categories`                              | string[]               | `[]`               | Ordered list of Y-variable column keys (series names) |
| `dataRender.xScale`                                  | `'linear'`             | `'time'`           | `'log'`                                               |
| `dataRender.yScale`                                  | `'linear'`             | `'time'`           | `'log'`                                               |
| `dataRender.xFormat`                                 | null                   | `null`             | Reserved for runtime X-value format function          |
| `dataRender.yFormat`                                 | null                   | `null`             | Reserved for runtime Y-value format function          |
| `dataRender.numberFormat`                            | string (BCP 47 locale) | `"en-US"`          | Locale used for number formatting                     |
| `dataRender.isHighlightedColor`                      | string (hex)           | `"#ECDBAC"`        | Background color applied to highlighted data rows     |
| `dataRender.mapScale`                                | `'ordinal'`            | `'threshold'`      | `'quantile'`                                          |
| `dataRender.mapScaleDomain`                          | number[]               | `[10,20,30,40,50]` | Breakpoints for the map color scale                   |
| `dataRender.groupBreaksActive`                       | boolean                | `false`            | Enable visual group breaks between data clusters      |
| `dataRender.groupBreaksCategory`                     | string                 | `"Continent"`      | Data column used to define group break clusters       |
| `dataRender.groupBreaksCategoryValues`               | string[]               | `[]`               | Ordered list of group break category values           |
| `dataRender.groupBreaks.breakStyles.variation`       | `'empty'`              | `'solid'`          | `'dotted'`                                            |
| `dataRender.groupBreaks.breakStyles.stroke`          | string (hex)           | `"#A4A4A4"`        | color of the break line                               |
| `dataRender.groupBreaks.breakStyles.strokeWidth`     | number                 | `1.4`              | Width of the break line (px)                          |
| `dataRender.groupBreaks.breakStyles.height`          | number                 | `30`               | Height of the break row (px)                          |
| `dataRender.groupBreaks.breakStyles.strokeDasharray` | string                 | `"none"`           | SVG dash pattern for break line                       |
| `dataRender.groupBreaks.labelStyles.fill`            | string                 | `"black"`          | color of the group break label text                   |
| `dataRender.groupBreaks.labelStyles.fontStyle`       | `'normal'`             | `'italic'`         | `'bold'`                                              |


---

### `tooltip` — Hover Tooltips


| Attribute                       | Type              | Default                | Notes                                                 |
| ------------------------------- | ----------------- | ---------------------- | ----------------------------------------------------- |
| `tooltip.active`                | boolean           | `true`                 | Enable/disable tooltips                               |
| `tooltip.activeOnMobile`        | boolean           | `true`                 | Enable tooltips on touch/mobile                       |
| `tooltip.headerActive`          | boolean           | `true`                 | Show a header row inside the tooltip                  |
| `tooltip.headerValue`           | `'categoryValue'` | `'independentValue'`   | `"categoryValue"`                                     |
| `tooltip.format`                | string            | `"{{row}}: {{value}}"` | Mustache-style template for each tooltip row          |
| `tooltip.offsetX`               | number            | `10`                   | Horizontal pixel offset of the tooltip box            |
| `tooltip.offsetY`               | number            | `10`                   | Vertical pixel offset of the tooltip box              |
| `tooltip.abbreviateValue`       | boolean           | `false`                | Abbreviate the displayed value (e.g. 1K, 1M)          |
| `tooltip.absoluteValue`         | boolean           | `false`                | Show absolute (non-negative) values                   |
| `tooltip.toFixedDecimal`        | number            | `0`                    | Decimal places for numeric values                     |
| `tooltip.toLocaleString`        | boolean           | `true`                 | Format numbers with locale-aware thousands separators |
| `tooltip.customFormat`          | null              | `null`                 | Reserved for runtime custom format function           |
| `tooltip.rlsFormat`             | boolean           | `false`                | Use RLS (relative-to-last-series) formatting          |
| `tooltip.dateFormat`            | string (strftime) | `"%-m/%Y"`             | Date format when axis scale is `"time"`               |
| `tooltip.caretPosition`         | `'top'`           | `'bottom'`             | `'left'`                                              |
| `tooltip.deemphasizeSiblings`   | boolean           | `false`                | Fade non-hovered series when hovering                 |
| `tooltip.deemphasizeOpacity`    | number (0–1)      | `0.5`                  | Opacity applied to de-emphasised elements             |
| `tooltip.emphasizeStrokeActive` | boolean           | `false`                | Highlight hovered element with a stroke               |
| `tooltip.emphasizeStrokeColor`  | string            | `"black"`              | Stroke color for emphasis                             |
| `tooltip.emphasizeStrokeWidth`  | number            | `1`                    | Stroke width for emphasis (px)                        |
| `tooltip.style.minWidth`        | number            | `50`                   | Minimum tooltip box width (px)                        |
| `tooltip.style.maxWidth`        | number            | `200`                  | Maximum tooltip box width (px)                        |
| `tooltip.style.minHeight`       | number            | `20`                   | Minimum tooltip box height (px)                       |
| `tooltip.style.maxHeight`       | number            | `100`                  | Maximum tooltip box height (px)                       |
| `tooltip.style.fontSize`        | number            | `13`                   | Tooltip text size (px)                                |
| `tooltip.style.background`      | string            | `"white"`              | Tooltip background color                              |
| `tooltip.style.border`          | string            | `"1px solid #CBCBCB"`  | Tooltip border CSS shorthand                          |
| `tooltip.style.padding`         | string            | `"10px"`               | Tooltip inner padding CSS shorthand                   |
| `tooltip.style.borderRadius`    | string            | `"0px"`                | Tooltip corner radius CSS shorthand                   |
| `tooltip.style.color`           | string            | `"black"`              | Tooltip text color                                    |


---

### `legend` — Chart Legend


| Attribute               | Type           | Default        | Notes                                                               |
| ----------------------- | -------------- | -------------- | ------------------------------------------------------------------- |
| `legend.active`         | boolean        | `false`        | Show/hide the legend                                                |
| `legend.orientation`    | `'row'`        | `'column'`     | `'row-reverse'`                                                     |
| `legend.title`          | string         | `""`           | Optional legend heading                                             |
| `legend.alignment`      | `'flex-start'` | `'flex-end'`   | `'center'`                                                          |
| `legend.offsetX`        | number         | `0`            | Horizontal position offset (px)                                     |
| `legend.offsetY`        | number         | `0`            | Vertical position offset (px)                                       |
| `legend.markerStyle`    | `'rect'`       | `'circle'`     | `'line'`                                                            |
| `legend.borderStroke`   | string         | `""`           | Border color of the legend box (empty = none)                       |
| `legend.fill`           | string         | `""`           | Background fill of the legend box (empty = transparent)             |
| `legend.categories`     | string[]       | `[]`           | Override legend item order; uses `dataRender.categories` by default |
| `legend.labelDelimiter` | string         | `"to"`         | Text between lower and upper bound labels in map legends            |
| `legend.labelLower`     | string         | `"Less than "` | Prefix label for the bottom range in map legends                    |
| `legend.labelUpper`     | string         | `"More than "` | Prefix label for the top range in map legends                       |
| `legend.fontSize`       | number         | `12`           | Legend label font size (px)                                         |
| `legend.margin.top`     | number         | `0`            | Top margin around the legend (px)                                   |
| `legend.margin.right`   | number         | `5`            | Right margin around the legend (px)                                 |
| `legend.margin.bottom`  | number         | `0`            | Bottom margin around the legend (px)                                |
| `legend.margin.left`    | number         | `0`            | Left margin around the legend (px)                                  |


---

### `labels` — Data Labels

Inline value labels rendered on chart elements.


| Attribute                        | Type        | Default                   | Notes                                                             |
| -------------------------------- | ----------- | ------------------------- | ----------------------------------------------------------------- |
| `labels.active`                  | boolean     | `false`                   | Show/hide data labels                                             |
| `labels.showFirstLastPointsOnly` | boolean     | `false`                   | Only label the first and last data point (useful for line charts) |
| `labels.color`                   | `'inherit'` | `'contrast'`              | `'black'`                                                         |
| `labels.fontWeight`              | number      | `200`                     | CSS font-weight for labels                                        |
| `labels.fontSize`                | number      | `10`                      | Label font size (px)                                              |
| `labels.fontFamily`              | string      | Franklin Gothic / Verdana | Label font stack                                                  |
| `labels.labelPositionBar`        | `'inside'`  | `'outside'`               | `'center'`                                                        |
| `labels.labelCutoff`             | number      | `10`                      | Min bar value to display a label (smaller bars are unlabelled)    |
| `labels.labelCutoffMobile`       | number      | `5`                       | Mobile-specific cutoff value                                      |
| `labels.labelPositionDX`         | number      | `0`                       | Horizontal pixel nudge for label placement                        |
| `labels.labelPositionDY`         | number      | `0`                       | Vertical pixel nudge for label placement                          |
| `labels.pieLabelRadius`          | number      | `60`                      | Distance of pie/donut labels from the center (px)                 |
| `labels.abbreviateValue`         | boolean     | `false`                   | Abbreviate displayed values (e.g. 1K, 1M)                         |
| `labels.absoluteValue`           | boolean     | `false`                   | Show absolute (non-negative) values                               |
| `labels.toLocaleString`          | boolean     | `true`                    | Format numbers with locale-aware thousands separators             |
| `labels.truncateDecimal`         | boolean     | `true`                    | Drop trailing zeros after the decimal point                       |
| `labels.toFixedDecimal`          | number      | `3`                       | Maximum decimal places shown                                      |
| `labels.labelUnit`               | string      | `""`                      | Unit string appended to label values (e.g. `"%"`)                 |
| `labels.labelUnitPosition`       | `'start'`   | `'end'`                   | `"end"`                                                           |
| `labels.textAnchor`              | `'start'`   | `'middle'`                | `'end'`                                                           |
| `labels.customLabelFormat`       | null        | `null`                    | Reserved for runtime custom format function                       |
| `labels.customPositions`         | object      | `{}`                      | Per-datum position overrides keyed by data row index              |
| `labels.customLabels`            | object      | `{}`                      | Per-datum label text overrides keyed by data row index            |
| `labels.customVisibility`        | object      | `{}`                      | Per-datum visibility overrides keyed by data row index            |
| `labels.customStyles`            | object      | `{}`                      | Per-datum inline style overrides keyed by data row index          |


---

### `shapes` — Element Style Overrides

Per-series or per-segment style customisation applied to rendered shapes.


| Attribute              | Type   | Default | Notes                                                          |
| ---------------------- | ------ | ------- | -------------------------------------------------------------- |
| `shapes.customStyles`  | object | `{}`    | Style overrides keyed by series/category name                  |
| `shapes.segmentStyles` | object | `{}`    | Style overrides keyed by segment identifier (e.g. stacked bar) |


---

### `animate` — Animations


| Attribute                    | Type     | Default | Notes                                         |
| ---------------------------- | -------- | ------- | --------------------------------------------- |
| `animate.active`             | boolean  | `false` | Enable chart entrance animations              |
| `animate.animationWhitelist` | string[] | `[]`    | Restrict animations to named chart components |
| `animate.duration`           | number   | `2000`  | Animation duration in milliseconds            |


---

### Chart-Type Attribute Groups

Each group below only affects rendering when `layout.type` matches the indicated chart type(s).

#### `bar` — Bar Charts

Applies to: `bar`, `stacked-bar`, `single-stacked-bar`, `grouped-bar`.


| Attribute             | Type     | Default    | Notes                                                       |
| --------------------- | -------- | ---------- | ----------------------------------------------------------- |
| `bar.barPadding`      | number   | `0.2`      | Inner padding between individual bars (0–1 fraction)        |
| `bar.barGroupPadding` | number   | `0.2`      | Padding between bar groups in grouped charts (0–1 fraction) |
| `bar.hasRectStroke`   | boolean  | `false`    | Apply a border stroke around each bar rectangle             |
| `bar.stackOffset`     | `'none'` | `'expand'` | `'wiggle'`                                                  |


> `rectStrokeColor` and `rectStrokeWidth` are defined in `baseConfig.ts` (`"white"`, `1`) but are not stored in `block.json`; they use their runtime defaults.

#### `line` — Line & Area Charts

Applies to: `line`, `area`, `stacked-area`.


| Attribute              | Type    | Default         | Notes                                                           |
| ---------------------- | ------- | --------------- | --------------------------------------------------------------- |
| `line.interpolation`   | string  | `"curveLinear"` | D3 curve factory name (e.g. `"curveBasis"`, `"curveMonotoneX"`) |
| `line.strokeDasharray` | string  | `""`            | SVG dash pattern for the line (e.g. `"4,2"`)                    |
| `line.strokeWidth`     | number  | `3`             | Line stroke width (px)                                          |
| `line.showPoints`      | boolean | `true`          | Render data point markers on the line                           |
| `line.showArea`        | boolean | `false`         | Fill the area beneath the line                                  |
| `line.areaFillOpacity` | number  | `0.4`           | Opacity of the area fill (0–1)                                  |


#### `dotPlot` — Dot Plot Charts

Applies to: `dot-plot`.


| Attribute                                | Type    | Default     | Notes                                    |
| ---------------------------------------- | ------- | ----------- | ---------------------------------------- |
| `dotPlot.connectPoints`                  | boolean | `true`      | Draw a connecting line between dot pairs |
| `dotPlot.connectingLine.stroke`          | string  | `"#E6E7E8"` | color of the connecting line             |
| `dotPlot.connectingLine.strokeWidth`     | number  | `6`         | Width of the connecting line (px)        |
| `dotPlot.connectingLine.strokeDasharray` | string  | `""`        | SVG dash pattern for the connecting line |
| `dotPlot.connectingLine.strokeOpacity`   | number  | `1`         | Opacity of the connecting line (0–1)     |


#### `nodes` — Scatter & Dot Plot Markers

Applies to: `scatter`, `dot-plot`.


| Attribute                | Type   | Default     | Notes                                                 |
| ------------------------ | ------ | ----------- | ----------------------------------------------------- |
| `nodes.pointSize`        | number | `3`         | Radius of scatter/dot plot markers (px)               |
| `nodes.pointFill`        | string | `"inherit"` | Fill color of markers (`"inherit"` uses series color) |
| `nodes.pointStrokeWidth` | number | `1`         | Stroke width around markers (px)                      |
| `nodes.pointStroke`      | string | `"inherit"` | Stroke color of markers                               |


#### `explodedBar` — Exploded Bar Charts

Applies to: `exploded-bar`.


| Attribute               | Type   | Default | Notes                                            |
| ----------------------- | ------ | ------- | ------------------------------------------------ |
| `explodedBar.columnGap` | number | `16`    | Horizontal gap between exploded bar columns (px) |


#### `pie` — Pie Charts

Applies to: `pie`.


| Attribute                           | Type    | Default     | Notes                                                        |
| ----------------------------------- | ------- | ----------- | ------------------------------------------------------------ |
| `pie.hasPathStroke`                 | boolean | `false`     | Apply a stroke between pie segments                          |
| `pie.pathStrokeColor`               | string  | `"white"`   | color of inter-segment strokes                               |
| `pie.pathStrokeWidth`               | number  | `1`         | Width of inter-segment strokes (px)                          |
| `pie.showCategoryLabels`            | boolean | `true`      | Render category name labels outside segments                 |
| `pie.innerRadius`                   | number  | `0`         | Inner radius for donut charts (0 = solid pie)                |
| `pie.padAngle`                      | number  | `0`         | Padding angle between segments (radians)                     |
| `pie.cornerRadius`                  | number  | `0`         | Corner rounding radius for segments (px)                     |
| `pie.sortByValue`                   | boolean | `false`     | Sort segments by value (largest first) instead of data order |
| `pie.groupGapAngle`                 | number  | `10`        | Angular gap between segment groups (degrees)                 |
| `pie.showGroupArcs`                 | boolean | `false`     | Render arc indicators around segment groups                  |
| `pie.groupArcStyle.stroke`          | string  | `"#666666"` | color of group arc lines                                     |
| `pie.groupArcStyle.strokeWidth`     | number  | `1`         | Width of group arc lines (px)                                |
| `pie.groupArcStyle.strokeDasharray` | string  | `"4,4"`     | Dash pattern for group arc lines                             |


#### `divergingBar` — Diverging Bar Charts

Applies to: `diverging-bar`.


| Attribute                                  | Type     | Default | Notes                                                      |
| ------------------------------------------ | -------- | ------- | ---------------------------------------------------------- |
| `divergingBar.positiveCategories`          | string[] | `[]`    | Column keys plotted on the positive side                   |
| `divergingBar.negativeCategories`          | string[] | `[]`    | Column keys plotted on the negative side                   |
| `divergingBar.netPositiveCategory`         | string   | `""`    | Column key for the net positive bar (optional summary bar) |
| `divergingBar.netNegativeCategory`         | string   | `""`    | Column key for the net negative bar                        |
| `divergingBar.percentOfInnerWidth`         | number   | `0.7`   | Fraction of chart width used for the diverging bars (0–1)  |
| `divergingBar.neutralBar.active`           | boolean  | `true`  | Show a center neutral bar                                  |
| `divergingBar.neutralBar.category`         | string   | `""`    | Column key for the neutral bar                             |
| `divergingBar.neutralBar.offsetX`          | number   | `0`     | Horizontal offset of the neutral bar (px)                  |
| `divergingBar.neutralBar.separator`        | boolean  | `true`  | Draw a separator line at the neutral bar                   |
| `divergingBar.neutralBar.separatorOffsetX` | number   | `-1`    | Horizontal offset of the separator line (px)               |


#### `regression` — Regression Lines

Applies to: `scatter`.


| Attribute                     | Type       | Default        | Notes                                              |
| ----------------------------- | ---------- | -------------- | -------------------------------------------------- |
| `regression.active`           | boolean    | `false`        | Overlay a regression line on the chart             |
| `regression.type`             | `'linear'` | `'polynomial'` | `'power'`                                          |
| `regression.stroke`           | string     | `"#2a2a2a"`    | color of the regression line                       |
| `regression.strokeWidth`      | number     | `2`            | Width of the regression line (px)                  |
| `regression.strokeDasharray`  | string     | `""`           | SVG dash pattern for the regression line           |
| `regression.perGroupBreak`    | boolean    | `false`        | Compute a separate regression for each group break |
| `regression.groupBreakStyles` | object     | `{}`           | Per-group style overrides for regression lines     |


#### `diffColumn` — Difference Column

Renders a calculated difference column alongside bar/grouped-bar charts.


| Attribute                          | Type    | Default     | Notes                                                    |
| ---------------------------------- | ------- | ----------- | -------------------------------------------------------- |
| `diffColumn.active`                | boolean | `false`     | Show/hide the diff column                                |
| `diffColumn.category`              | string  | `""`        | Column key whose values are displayed in the diff column |
| `diffColumn.columnHeader`          | string  | `"Diff"`    | Header label for the column                              |
| `diffColumn.dx`                    | number  | `0`         | Horizontal nudge of the column (px)                      |
| `diffColumn.dy`                    | number  | `0`         | Vertical nudge of the column (px)                        |
| `diffColumn.style.rectStrokeWidth` | number  | `0`         | Border width of column cells (px)                        |
| `diffColumn.style.rectStrokeColor` | string  | `"white"`   | Border color of column cells                             |
| `diffColumn.style.rectFill`        | string  | `"none"`    | Background fill of column cells                          |
| `diffColumn.style.fontWeight`      | string  | `"normal"`  | Font weight of cell text                                 |
| `diffColumn.style.fontStyle`       | string  | `"normal"`  | Font style of cell text                                  |
| `diffColumn.style.fontAppearance`  | string  | `"default"` | Semantic appearance variant (e.g. colored diffs)         |
| `diffColumn.style.fontSize`        | string  | `"10px"`    | Cell font size                                           |
| `diffColumn.style.headerFontSize`  | string  | `"12px"`    | Column header font size                                  |
| `diffColumn.style.marginLeft`      | number  | `10`        | Left margin before the column (px)                       |
| `diffColumn.style.width`           | number  | `30`        | Column width (px)                                        |
| `diffColumn.style.heightOffset`    | number  | `0`         | Vertical adjustment to cell height (px)                  |


#### `treemap` — Treemap Charts

Applies to: `treemap`.


| Attribute                 | Type             | Default        | Notes                                             |
| ------------------------- | ---------------- | -------------- | ------------------------------------------------- |
| `treemap.tile`            | `'squarify'`     | `'resquarify'` | `'binary'`                                        |
| `treemap.rectStroke`      | string           | `"#ffffff"`    | Border color between treemap cells                |
| `treemap.rectStrokeWidth` | number           | `2`            | Border width between treemap cells (px)           |
| `treemap.labelMinArea`    | number           | `1600`         | Minimum cell area (px²) required to show a label  |
| `treemap.paddingInner`    | number           | `2`            | Inner padding between leaf cells (px)             |
| `treemap.paddingOuter`    | number           | `4`            | Outer padding around the treemap boundary (px)    |
| `treemap.showGroupLabels` | boolean          | `true`         | Show parent group labels                          |
| `treemap.scaleOpacity`    | boolean          | `false`        | Scale cell opacity by value                       |
| `treemap.opacityRange`    | [number, number] | `[0.4, 1]`     | Min/max opacity range when `scaleOpacity` is true |
| `treemap.borderRadius`    | number           | `0`            | Corner radius for treemap cells (px)              |
| `treemap.showValues`      | boolean          | `false`        | Render the numeric value inside each cell         |


#### `sankey` — Sankey / Flow Diagrams

Applies to: `sankey`.


| Attribute            | Type         | Default    | Notes                                    |
| -------------------- | ------------ | ---------- | ---------------------------------------- |
| `sankey.nodeAlign`   | `'justify'`  | `'left'`   | `'right'`                                |
| `sankey.nodeWidth`   | number       | `12`       | Width of node rectangles (px)            |
| `sankey.nodePadding` | number       | `10`       | Vertical padding between nodes (px)      |
| `sankey.linkOpacity` | number (0–1) | `0.5`      | Opacity of flow links                    |
| `sankey.nodeRadius`  | number       | `0`        | Corner radius of node rectangles (px)    |
| `sankey.sourceKey`   | string       | `"x"`      | Data column key for the link source node |
| `sankey.targetKey`   | string       | `"target"` | Data column key for the link target node |
| `sankey.valueKey`    | string       | `"value"`  | Data column key for the link flow value  |


---

### `map` — Map Charts

Applies to: `map-usa`, `map-usa-counties`, `map-usa-block`, `map-world`.


| Attribute                    | Type     | Default     | Notes                                                                         |
| ---------------------------- | -------- | ----------- | ----------------------------------------------------------------------------- |
| `map.ignoreSmallStateLabels` | boolean  | `false`     | Suppress labels on small states/territories (RI, DC, etc.)                    |
| `map.ignoredLabels`          | string[] | `[]`        | Additional state/country codes whose labels are suppressed                    |
| `map.abbreviateLabels`       | boolean  | `true`      | Use abbreviated state/country names                                           |
| `map.blockRectSize`          | number   | `44`        | Cell size for block-style cartogram maps (px)                                 |
| `map.pathBackgroundFill`     | string   | `"#f7f7f7"` | Fill for regions with no data                                                 |
| `map.pathStroke`             | string   | `"#d3d3d3"` | Border color between regions                                                  |
| `map.pathStrokeWidth`        | number   | `0.5`       | Border width between regions (px)                                             |
| `map.showCountyBoundaries`   | boolean  | `true`      | Overlay county boundary lines (`map-usa-counties` only)                       |
| `map.showStateBoundaries`    | boolean  | `true`      | Overlay state boundary lines on county and world maps                         |
| `map.zoomActive`             | boolean  | `false`     | Enable pan/zoom interaction                                                   |
| `map.projectionPreset`       | string   | `"default"` | For world maps, pre-defined areas for render (eg. Europe, South Asia, Africa) |
| `map.topologyRegion`         | string   | `"default"` | Which regional topology file to load for world maps                           |
| `map.centerLongitude`        | number   | `0`         | Projection center longitude (degrees)                                         |
| `map.centerLatitude`         | number   | `0`         | Projection center latitude (degrees)                                          |
| `map.rotateLambda`           | number   | `0`         | Projection λ (longitude) rotation                                             |
| `map.rotatePhi`              | number   | `0`         | Projection φ (latitude) rotation                                              |
| `map.rotateGamma`            | number   | `0`         | Projection γ (roll) rotation                                                  |
| `map.customScale`            | number   | `1`         | Scale multiplier applied on top of the projection's default scale             |


---

### `annotations` — Chart Annotations

Text or arrow callouts drawn on top of the chart.


| Attribute                    | Type     | Default | Notes                                |
| ---------------------------- | -------- | ------- | ------------------------------------ |
| `annotations.active`         | boolean  | `false` | Enable/disable annotations           |
| `annotations.activeOnMobile` | boolean  | `false` | Show annotations on mobile viewports |
| `annotations.items`          | object[] | `[]`    | Array of annotation objects          |


---

### `drawings` — Free-Form Drawings

SVG drawing elements overlaid on the chart.


| Attribute  | Type     | Default | Notes                                     |
| ---------- | -------- | ------- | ----------------------------------------- |
| `drawings` | object[] | `[]`    | Array of drawing shape definition objects |


---

### `customTickLabels` — Custom Tick Label Overrides

Replace auto-generated axis tick labels with custom text.


| Attribute                      | Type   | Default | Notes                                               |
| ------------------------------ | ------ | ------- | --------------------------------------------------- |
| `customTickLabels.independent` | object | `{}`    | Key-value map of tick value → custom label (X-axis) |
| `customTickLabels.dependent`   | object | `{}`    | Key-value map of tick value → custom label (Y-axis) |


---

### `customLegendLabels` — Custom Legend Label Overrides

Replace auto-generated legend item labels with custom text.


| Attribute            | Type   | Default | Notes                                         |
| -------------------- | ------ | ------- | --------------------------------------------- |
| `customLegendLabels` | object | `{}`    | Key-value map of category key → display label |


---

### `io` — Input / Output & Chart State

Stores the chart's data payload, static image fallback, and miscellaneous I/O flags.


| Attribute                     | Type     | Default     | Notes                                                                                  |
| ----------------------------- | -------- | ----------- | -------------------------------------------------------------------------------------- |
| `io.isConvertedChart`         | boolean  | `false`     | Marks charts migrated from the legacy chart builder                                    |
| `io.isStaticChart`            | boolean  | `false`     | Render a static image instead of an interactive SVG                                    |
| `io.isFreeformChart`          | boolean  | `false`     | Marks charts created outside the structured builder UI                                 |
| `io.staticImageId`            | string   | `""`        | WordPress attachment ID of the static fallback image                                   |
| `io.staticImageUrl`           | string   | `""`        | URL of the static fallback image                                                       |
| `io.staticImageInnerHTML`     | string   | `""`        | (Deprecated in v2) Rendered html from image used in static image variation             |
| `io.staticImageAltText`       | string   | `""`        | (Deprecated in v2) Alt text for the static image variation                             |
| `io.chartConverted.converted` | boolean  | `false`     | Whether a conversion from Highcharts has been performed                                |
| `io.chartConverted.requester` | string   | `""`        | User or process that triggered the conversion                                          |
| `io.chartConverted.timestamp` | string   | `""`        | ISO timestamp of the conversion                                                        |
| `io.defaultShouldRender`      | boolean  | `true`      | Whether the chart should render on page load by default                                |
| `io.pngUrl`                   | string   | `""`        | URL to a rendered PNG export of the chart                                              |
| `io.pngId`                    | string   | `""`        | WordPress attachment ID of the PNG export                                              |
| `io.colorValue`               | string   | `"general"` | Named color palette variant (e.g. `"general"`, `"sequential"`)                         |
| `io.customColors`             | string[] | `[]`        | Editor-supplied color overrides (takes precedence over `colors`)                       |
| `io.chartFamily`              | string   | `"chart"`   | Top-level chart family used for routing in the charting library (eg. "map" or "chart") |
| `io.chartData`                | object[] | `[]`        | The raw chart data rows                                                                |
| `io.tableData`                | string   | `""`        | Serialised table data (used for accessible data table view)                            |
| `io.availableCategories`      | string[] | `[]`        | All column keys present in `chartData`                                                 |
| `io.independentVariable`      | string   | `""`        | Column key treated as the independent variable (mirrors `dataRender.x`)                |
| `io.hasPreformattedData`      | boolean  | `false`     | Skip data normalisation when data is already in chart-ready format                     |
| `io.preformattedData`         | object[] | `[]`        | Pre-normalised data rows used when `hasPreformattedData` is `true`                     |
| `io.questionWordingActive`    | boolean  | `false`     | Show survey question wording below the chart                                           |
| `io.questionWording`          | string   | `""`        | Survey question text                                                                   |
| `io.tabsActive`               | boolean  | `false`     | Enable tabbed chart views (e.g. chart / table toggle)                                  |
| `io.allowDataDownload`        | boolean  | `true`      | Show a data download button                                                            |
| `io.elementHasStroke`         | boolean  | `false`     | Apply a stroke to rendered chart elements (bars, segments)                             |
| `io.isCustomChart`            | boolean  | `false`     | Enable custom chart type rendering path                                                |
| `io.customAttributes`         | object   | `{}`        | Free-form attributes passed to a custom chart renderer                                 |
| `io.preserveStringKeys`       | string[] | `[]`        | Column keys that should remain as strings during data parsing                          |


---

### `mobile` / `tablet` — Responsive Breakpoint Overrides

Deep-partial overrides applied at mobile (`≤ layout.mobileBreakpoint`) and tablet breakpoints. Any attribute from the groups above can be nested here to override its value at that breakpoint.


| Attribute | Type   | Default | Notes                                            |
| --------- | ------ | ------- | ------------------------------------------------ |
| `mobile`  | object | `{}`    | Partial attribute overrides for mobile viewports |
| `tablet`  | object | `{}`    | Partial attribute overrides for tablet viewports |


---

### Internal / Migration Attributes

These attributes are managed automatically and should not be edited directly.


| Attribute                         | Type    | Default   | Notes                                                     |
| --------------------------------- | ------- | --------- | --------------------------------------------------------- |
| `_version`                        | `'v1'`  | `'v2'`    | —                                                         |
| `id`                              | string  | —         | Unique block instance identifier                          |
| `_legacy`                         | object  | `{}`      | Preserved raw v1 attribute data for migration rollback    |
| `_v1Original`                     | object  | `{}`      | Snapshot of original v1 attributes before migration       |
| `_migrationMeta.migratedAt`       | string  | `""`      | ISO timestamp of the last migration run                   |
| `_migrationMeta.migrationVersion` | string  | `"1.0.0"` | Version of the migration script applied                   |
| `_migrationMeta.forceRemigrate`   | boolean | `false`   | Set to `true` to force a re-run of migration on next load |


## License

GPL-2.0-or-later. See the PRC Platform repository for full license terms.