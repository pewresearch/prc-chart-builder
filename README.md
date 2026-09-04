# PRC Chart Builder

Version 3.14.0

A WordPress plugin for building, managing, and embedding interactive SVG charts on the Pew Research Center platform. Charts are authored as a custom post type (`chart`) using the Gutenberg block editor and rendered via the PRC Charting Library (`prc-charting-library`), which is built on `@visx` and D3.

> **Breaking change — Chart Builder 3.0:** The plugin's block namespace was updated to follow the `{plugin-name}/{block-name}` convention. References should use `prc-chart-builder/chart`, `prc-chart-builder/controller`, and `prc-chart-builder/synced-chart`. The npm package is `@prc/chart-builder`. A WP-CLI command is included to aid bulk migration of legacy data.

---

## Overview

### How charts are built

1. Open **Charts** in wp-admin (the Chart Library is **All Charts** — `wp-admin/edit.php?post_type=chart`)
2. **Add New Chart** opens a new chart post. When the site-level creation UI is on, the CPT wizard runs Pattern → Data → Configure → Preview. When it is off, the classic type picker still appears.
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

See `[docs/release-notes/3_5_0.md](../../docs/plugins/prc-chart-builder/release-notes/3_5_0.md)` for the full release notes.

### Key systems introduced in 3.14.0

| System | What it does |
| --- | --- |
| Chart Creation wizard | Pattern → Data → Configure → Preview on the chart CPT (site-level rollout toggle) |
| Chart Theme | Site-owned `chart-theme.json` defaults and palettes, with scoped frontend delivery |
| Small Multiples (BETA) | One panel per series or group with shared scales |
| Waffle / Beeswarm / Heat Map Table | New chart types for grid, distribution, and demographic × category encodings |
| Color swatch picker | Combine palettes, click swatches, drag to set series order |
| Tooltip templates | RichText token templates, unified hover, and `minDisplayValue` floors |

See `[docs/release-notes/3_14_0.md](../../docs/plugins/prc-chart-builder/release-notes/3_14_0.md)` for the full 3.14.0 release notes.

---

## Usage

Charts are managed through the **Chart Library** admin page (`wp-admin/edit.php?post_type=chart`). The chart editor is the standard Gutenberg block editor.

**Embedding a chart in an article:**

Use the `prc-chart-builder/synced-chart` block and select the chart post to embed. This creates a live reference — updates to the chart post are reflected everywhere it is embedded.

**Viewport-responsive customization:**

All chart attributes support per-viewport overrides via the `mobile` and `tablet` top-level attribute groups. Switch the editor to Tablet or Mobile preview to apply breakpoint-specific values. See [viewport usage guide](../../docs/plugins/prc-chart-builder/viewport-usage-guide.md).

**Per-element styling:**

Click any bar, label, line segment, pie slice, map region, axis tick label, or legend item in the editor canvas to open the element popover. Changes update live and are stored in per-element attribute maps (`labels.customLabels`, `shapes.customStyles`, `customTickLabels`, `customLegendLabels`, and others) keyed by `{x}::{category}` or category name.

**Row filtering (Data tab):**

Exclude table rows from the plot without deleting CSV data. Set `dataRender.rowFilter.exclude` to first-column values (the inspector always writes `rowFilter.column` as `"x"`). Filtered rows stay in the data table; only the chart omits them.

---

## Development

```bash
# Build (cache-aware; also builds upstream @prc/* dependencies first)
npx turbo build --filter=@prc/chart-builder

# Watch
npm run start -w @prc/chart-builder

# Build the charting library on its own
npx turbo build --filter=@prc/charting-library
```

The plugin depends on `@prc/charting-library` and `@prc/charting-utilities`. Changes to those packages require a rebuild before they are reflected in the chart editor or frontend — Turbo's `^build` dependency handles this for you when you build `@prc/chart-builder`. Avoid `npm run build -w @prc/chart-builder`, which bypasses both the local and remote Turbo cache.

**PHP:** Requires PHP 8.1+. Key classes are in `src/chart/class-chart.php` and `src/controller/class-controller.php`.

**Tests:**

```bash
# JavaScript unit tests (theme + chart utils)
npm test -w @prc/chart-builder

# PHP unit tests (requires wp-phpunit bootstrap)
composer test -d plugins/prc-chart-builder
```

---

## Chart Theme (PRC-528)

Each site stores one active chart theme in the `prc_chart_builder_theme` option:

```json
{
	"config": { "...": "per-role defaults for newly inserted charts" },
	"palettes": { "colors": { "general": ["#…"], "brand-blue": ["#…"] } }
}
```

**Admin UI:** `Charts > Chart Theme` (`manage_options` — administrators only).

| Tab            | What it edits                                            | Retroactive?                                                                     |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Chart Settings | `theme.config` defaults (layout, axes, legend, fonts, …) | **No** — new charts only                                                         |
| Color Settings | `theme.palettes` (palette designer)                      | **Yes** — charts referencing a palette by `io.colorValue` slug re-skin at render |

**Runtime delivery:** `window.prcChartBuilderTheme` is attached via `wp_add_inline_script` only when a chart-builder bundle is enqueued (frontend chart render, block editor, Chart Library admin). Palettes resolve by slug via `getResolvedPalettes()`; per-role `fontFamily` preset tokens (`var:preset\|font-family\|<slug>`) resolve to concrete stacks via `window.prcChartBuilderTheme.fontFamilies`.

**WP-CLI:**

```bash
wp prc-chart-builder seed-theme          # seed fallback theme from chart-theme.json
wp prc-chart-builder repair-theme        # validate + re-seed if corrupt
wp prc-chart-builder font-tokens-audit   # audit literal font stacks in chart blocks
wp prc-chart-builder font-tokens-migrate --dry-run
wp prc-chart-builder font-tokens-migrate --batch-size=100 --sleep=1
```

**Import / export:** On Charts → Chart Theme, use **Download JSON** to export the in-editor draft as `chart-theme.json`, or **Upload JSON** to replace the draft from a file (then Save). Uploads are validated against the editor field registry (unknown keys, bad types/enums, and invalid palette swatches are rejected). The committed `includes/settings/chart-theme.json` is only the empty-site / repair fallback seed — it is not synced from the DB. It is typed via `$schema` pointing at the generated schema on [`pewresearch/prc-chart-builder`](https://github.com/pewresearch/prc-chart-builder) trunk (built from `src/settings/field-registry/schema.mjs` by `npm run sync:field-registry`); CI fails if the seed drifts from the editor schema.

**Distributor:** Chart blocks keep palette slugs in `io.colorValue`; the destination site resolves colors from its own `theme.palettes` — the theme option is not distributed.

---

## Documentation

| Document | Description |
| -------- | ----------- |
| [docs landing page](../../docs/plugins/prc-chart-builder/index.md) | Plugin docs hub (editors + maintainers) |
| [user guide](../../docs/plugins/prc-chart-builder/user-guide.md) | Editorial workflow and chart creation |
| [architecture](../../docs/plugins/prc-chart-builder/architecture.md) | System architecture, data flow, state management |
| [REST API](../../docs/plugins/prc-chart-builder/rest-api.md) | Custom `prc-chart-builder/v1` routes |
| [Abilities](../../docs/plugins/prc-chart-builder/abilities.md) | `prc-chart-builder/generate` AI ability |
| [viewport attributes](../../docs/plugins/prc-chart-builder/viewport-attributes.md) | Viewport-aware attribute system internals |
| [viewport usage guide](../../docs/plugins/prc-chart-builder/viewport-usage-guide.md) | Practical guide to responsive chart customization |
| [viewport breakpoints](../../docs/plugins/prc-chart-builder/viewport-breakpoints.md) | Breakpoint values, detection logic, and fallback behavior |
| [reactive store](../../docs/plugins/prc-chart-builder/reactive-store.md) | The `prc-chart-builder/chart` interactivity store and its actions |
| [console helpers](../../docs/plugins/prc-chart-builder/console-helpers.md) | `window.prcChartBuilder.*` devtools handles |
| [release notes](../../docs/plugins/prc-chart-builder/release-notes/) | Per-version release notes (3.5.0 → 3.14.0) |
| [element popover README](src/chart/edit/popover/panels/README.md) | Element popover system internals and extension guide |

---

## Configuration Reference

All chart configuration is stored as a single `chart` block attribute object on the `prc-chart-builder/chart` inner block. The tables below document every sub-attribute, its parent group, accepted type, default value (sourced from `block.json` and `baseConfig.ts`), and a short description.

> **Note:** Defaults shown here reflect the `block.json` defaults. `baseConfig.ts` (used at runtime in the charting library) may carry different defaults for some fields; any significant divergence is noted.

---

### `layout` — General Layout

Controls chart dimensions, type, orientation, and overflow behaviour.

| Attribute                 | Type                                                                                                                                                                                                                                                                                                                                                                                                                          | Default                                         | Notes                                                                                                                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.height`           | number                                                                                                                                                                                                                                                                                                                                                                                                                        | `400`                                           | Rendered chart height in pixels.                                                                                                                                                                                                                   |
| `layout.horizontalRules`  | boolean                                                                                                                                                                                                                                                                                                                                                                                                                       | `true`                                          | Show horizontal grid rules behind the chart.                                                                                                                                                                                                       |
| `layout.mobileBreakpoint` | number                                                                                                                                                                                                                                                                                                                                                                                                                        | `480`                                           | (DEPRECATED) Viewport width (px) at which mobile layout rules activate. _(read-only)_                                                                                                                                                              |
| `layout.name`             | string                                                                                                                                                                                                                                                                                                                                                                                                                        | `"wp-block-prc-block-chart-builder-controller"` | Internal block name identifier; not user-editable. _(read-only)_                                                                                                                                                                                   |
| `layout.orientation`      | `'vertical' \| 'horizontal'`                                                                                                                                                                                                                                                                                                                                                                                                  | `"horizontal"`                                  | Rarely used. Controls the orientation of the chart. 'vertical' will display the chart vertically, and 'horizontal' will display the chart horizontally.                                                                                            |
| `layout.overflowX`        | `'responsive' \| 'scroll' \| 'preserve-aspect-ratio'`                                                                                                                                                                                                                                                                                                                                                                         | `"responsive"`                                  | Controls the overflow behavior of the chart. 'responsive' will scale the chart to fit the container, 'scroll' will allow the chart to scroll if it exceeds the container, and 'preserve-aspect-ratio' will preserve the aspect ratio of the chart. |
| `layout.padding.bottom`   | number                                                                                                                                                                                                                                                                                                                                                                                                                        | `25`                                            | Bottom inner padding of the SVG canvas (px).                                                                                                                                                                                                       |
| `layout.padding.left`     | number                                                                                                                                                                                                                                                                                                                                                                                                                        | `60`                                            | Left inner padding of the SVG canvas (px).                                                                                                                                                                                                         |
| `layout.padding.right`    | number                                                                                                                                                                                                                                                                                                                                                                                                                        | `0`                                             | Right inner padding of the SVG canvas (px).                                                                                                                                                                                                        |
| `layout.padding.top`      | number                                                                                                                                                                                                                                                                                                                                                                                                                        | `20`                                            | Top inner padding of the SVG canvas (px).                                                                                                                                                                                                          |
| `layout.parentClass`      | string                                                                                                                                                                                                                                                                                                                                                                                                                        | `"wp-chart-builder-wrapper"`                    | CSS class applied to the outermost wrapper element.                                                                                                                                                                                                |
| `layout.type`             | `'bar' \| 'diverging-bar' \| 'line' \| 'area' \| 'scatter' \| 'pie' \| 'dot-plot' \| 'stacked-bar' \| 'single-stacked-bar' \| 'grouped-bar' \| 'exploded-bar' \| 'stacked-area' \| 'map-usa' \| 'map-usa-counties' \| 'map-usa-cbsa' \| 'map-usa-block' \| 'map-usa-hex' \| 'map-world' \| 'map-world-orthographic' \| 'map-europe' \| 'treemap' \| 'sankey' \| 'radar' \| 'small-multiples' \| 'waffle' \| 'heat-map-table'` | `"bar"`                                         | The chart type.                                                                                                                                                                                                                                    |
| `layout.width`            | number                                                                                                                                                                                                                                                                                                                                                                                                                        | `640`                                           | Rendered chart width in pixels.                                                                                                                                                                                                                    |

---

### `metadata` — Chart Titles & Attribution

Text displayed above/below the chart canvas.

| Attribute           | Type    | Default | Notes                                                       |
| ------------------- | ------- | ------- | ----------------------------------------------------------- |
| `metadata.active`   | boolean | `true`  | Show/hide the metadata block entirely.                      |
| `metadata.alt`      | string  | `""`    | Accessible alt-text for static image exports. _(read-only)_ |
| `metadata.note`     | string  | `""`    | Footnote displayed at the bottom.                           |
| `metadata.source`   | string  | `""`    | Source attribution line.                                    |
| `metadata.subtitle` | string  | `""`    | Secondary line below the title.                             |
| `metadata.tag`      | string  | `""`    | Institutional tag or brand label.                           |
| `metadata.title`    | string  | `""`    | Primary chart headline.                                     |

---

### `colors` — color Palette

| Attribute | Type     | Default                                                         | Notes                                             |
| --------- | -------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `colors`  | string[] | `["#456A83","#BF3B27","#756a7e","#ea9e2c","#BB792A","#eeece4"]` | Ordered list of hex colors applied to data series |

---

### `plotBands` — Reference Bands

Shaded regions overlaid on the chart to highlight ranges.

| Attribute               | Type         | Default | Notes                                                                                                 |
| ----------------------- | ------------ | ------- | ----------------------------------------------------------------------------------------------------- |
| `plotBands.active`      | boolean      | `false` | Enable/disable all plot bands. _(read-only)_                                                          |
| `plotBands.allowDrag`   | boolean      | `false` | Allow user to drag band positions (editor only). _(read-only)_                                        |
| `plotBands.allowResize` | boolean      | `false` | Allow user to resize bands (editor only). _(read-only)_                                               |
| `plotBands.bands`       | string       | `[]`    | Array of band objects ({ from, to, color, … }); managed per-chart, not a theme default. _(read-only)_ |
| `plotBands.dimension`   | `'x' \| 'y'` | `"x"`   | `"x"`. _(read-only)_                                                                                  |

---

### `independentAxis` — X-Axis (Category / Independent)

| Attribute                                   | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Default      | Notes                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `independentAxis.abbreviateTicks`           | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`      | Abbreviate large numbers (e.g. 1K, 1M).                                           |
| `independentAxis.abbreviateTicksDecimals`   | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Decimal places when abbreviating tick labels.                                     |
| `independentAxis.active`                    | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`       | Show/hide the axis.                                                               |
| `independentAxis.axis.stroke`               | color (hex)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `"#818181"`  | Color of the axis line.                                                           |
| `independentAxis.axis.strokeWidth`          | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `1`          | Width of the axis line (px).                                                      |
| `independentAxis.axisLabel.angle`           | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Rotation of the axis title (degrees).                                             |
| `independentAxis.axisLabel.dx`              | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Horizontal nudge for the axis title.                                              |
| `independentAxis.axisLabel.dy`              | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Vertical nudge for the axis title.                                                |
| `independentAxis.axisLabel.fill`            | color (hex)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `"#2a2a2a"`  | Axis title color.                                                                 |
| `independentAxis.axisLabel.fontFamily`      | font                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `"var:preset | font-family                                                                       | sans-serif"` | Axis title font stack (theme.json family picker; new charts only). |
| `independentAxis.axisLabel.fontSize`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `12`         | Axis title font size (px).                                                        |
| `independentAxis.axisLabel.maxWidth`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `100`        | Max axis title width before wrapping (px).                                        |
| `independentAxis.axisLabel.padding`         | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `15`         | Gap between axis line and title (px).                                             |
| `independentAxis.axisLabel.textAnchor`      | `'start' \| 'middle' \| 'end'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `"end"`      | Axis label text alignment.                                                        |
| `independentAxis.axisLabel.verticalAnchor`  | `'start' \| 'middle' \| 'end'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `"middle"`   | Axis label vertical alignment.                                                    |
| `independentAxis.dateFormat`                | `'%Y' \| ''%y' \| '%-m/%Y' \| '%-m/%y' \| '%m/%Y' \| '%m/%y' \| '%B %Y' \| '%b %Y' \| '%B '%y' \| '%b '%y' \| '%-m/%-d/%Y' \| '%-d/%-m/%Y' \| '%-m/%-d/%y' \| '%-d/%-m/%y' \| '%-m/%-d' \| '%-d/%-m' \| '%m/%d/%Y' \| '%d/%m/%Y' \| '%m/%d/%y' \| '%d/%m/%y' \| '%m/%-d' \| '%-d/%m' \| '%B %-d, %Y' \| '%B %-d %Y' \| '%b %-d, %Y' \| '%b %-d %Y' \| '%-d %B, %Y' \| '%-d %B %Y' \| '%-d %b, %Y' \| '%-d %b %Y' \| '%B %-d '%y' \| '%-d %B '%y' \| '%b %-d '%y' \| '%-d %b '%y' \| '%B %-d' \| '%-d %B' \| '%b %-d' \| '%-d %b' \| '%B' \| '%b'` | `"%Y"`       | Format applied when scale is "time" (strftime, e.g. "%-m/%Y").                    |
| `independentAxis.domain`                    | [number, number]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `null`       | Explicit axis extent [min, max], or null to infer from data.                      |
| `independentAxis.domainPadding`             | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `20`         | Extra padding added beyond the domain edges.                                      |
| `independentAxis.grid.stroke`               | color (hex)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `""`         | Color of grid lines (empty = inherit / none).                                     |
| `independentAxis.grid.strokeDasharray`      | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `""`         | SVG dash pattern for grid lines.                                                  |
| `independentAxis.grid.strokeOpacity`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0.2`        | Opacity of grid lines.                                                            |
| `independentAxis.grid.strokeWidth`          | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `2`          | Width of grid lines (px).                                                         |
| `independentAxis.label`                     | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `""`         | Axis title label.                                                                 |
| `independentAxis.padding`                   | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `30`         | Space between axis line and chart edge (px).                                      |
| `independentAxis.scale`                     | `'linear' \| 'time' \| 'log' \| 'sqrt'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `"linear"`   | The axis's scale type.                                                            |
| `independentAxis.showZero`                  | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`       | Force zero to appear in the domain.                                               |
| `independentAxis.tickCount`                 | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `5`          | Suggested number of tick marks.                                                   |
| `independentAxis.tickFormat`                | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `null`       | Reserved for runtime format function. _(read-only)_                               |
| `independentAxis.tickLabels.angle`          | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Rotation of tick labels (degrees).                                                |
| `independentAxis.tickLabels.dx`             | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Horizontal nudge for tick labels.                                                 |
| `independentAxis.tickLabels.dy`             | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Vertical nudge for tick labels.                                                   |
| `independentAxis.tickLabels.fill`           | color (hex)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `"#2a2a2a"`  | Tick label color.                                                                 |
| `independentAxis.tickLabels.fontFamily`     | font                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `"var:preset | font-family                                                                       | sans-serif"` | Tick label font stack (theme.json family picker; new charts only). |
| `independentAxis.tickLabels.fontSize`       | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `12`         | Tick label font size (px).                                                        |
| `independentAxis.tickLabels.maxWidth`       | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `50`         | Max label width before wrapping (px).                                             |
| `independentAxis.tickLabels.padding`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Gap between tick mark and label (px).                                             |
| `independentAxis.tickLabels.textAnchor`     | `'start' \| 'middle' \| 'end'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `"middle"`   | 'end'`.                                                                           |
| `independentAxis.tickLabels.verticalAnchor` | `'start' \| 'middle' \| 'end'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `"end"`      | 'end'`.                                                                           |
| `independentAxis.tickMarksActive`           | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`      | Show tick mark lines on the axis.                                                 |
| `independentAxis.ticks.size`                | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `5`          | Length of tick marks (px).                                                        |
| `independentAxis.ticks.stroke`              | color (hex)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `"#818181"`  | Color of tick marks.                                                              |
| `independentAxis.ticks.strokeWidth`         | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`          | Width of tick mark lines (px).                                                    |
| `independentAxis.ticksToLocaleString`       | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`      | Format tick values with toLocaleString().                                         |
| `independentAxis.tickUnit`                  | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `""`         | Unit suffix/prefix appended to tick labels (e.g. "%", "$").                       |
| `independentAxis.tickUnitPosition`          | `'start' \| 'end'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `"end"`      | `"end"`.                                                                          |
| `independentAxis.tickValues`                | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `null`       | Explicit tick values array; managed per-chart, not a theme default. _(read-only)_ |

---

### `dependentAxis` — Y-Axis (Value / Dependent)

| Attribute                                 | Type                                    | Default      | Notes                                                                                                                                                                |
| ----------------------------------------- | --------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `dependentAxis.abbreviateTicks`           | boolean                                 | `true`       | Abbreviate large numbers (e.g. 1K, 1M).                                                                                                                              |
| `dependentAxis.abbreviateTicksDecimals`   | number                                  | `0`          | Decimal places when abbreviating tick labels.                                                                                                                        |
| `dependentAxis.active`                    | boolean                                 | `true`       | Show/hide the axis.                                                                                                                                                  |
| `dependentAxis.axis.stroke`               | color (hex)                             | `"#818181"`  | Color of the axis line.                                                                                                                                              |
| `dependentAxis.axis.strokeWidth`          | number                                  | `1`          | Width of the axis line (px).                                                                                                                                         |
| `dependentAxis.axisLabel.angle`           | number                                  | `270`        | Rotation of the axis title (typically 270° for Y-axis readability).                                                                                                  |
| `dependentAxis.axisLabel.dx`              | number                                  | `0`          | Horizontal nudge for the axis title.                                                                                                                                 |
| `dependentAxis.axisLabel.dy`              | number                                  | `0`          | Vertical nudge for the axis title.                                                                                                                                   |
| `dependentAxis.axisLabel.fill`            | color (hex)                             | `"#565656"`  | Axis title color.                                                                                                                                                    |
| `dependentAxis.axisLabel.fontFamily`      | font                                    | `"var:preset | font-family                                                                                                                                                          | sans-serif"` | Axis title font stack (theme.json family picker; new charts only). |
| `dependentAxis.axisLabel.fontSize`        | number                                  | `12`         | Axis title font size (px).                                                                                                                                           |
| `dependentAxis.axisLabel.maxWidth`        | number                                  | `200`        | Max axis title width before wrapping (px).                                                                                                                           |
| `dependentAxis.axisLabel.padding`         | number                                  | `30`         | Gap between axis line and title (px).                                                                                                                                |
| `dependentAxis.axisLabel.textAnchor`      | `'start' \| 'middle' \| 'end'`          | `"middle"`   | 'end'`.                                                                                                                                                              |
| `dependentAxis.axisLabel.verticalAnchor`  | `'start' \| 'middle' \| 'end'`          | `"middle"`   | 'end'`.                                                                                                                                                              |
| `dependentAxis.domain`                    | [number, number]                        | `null`       | Explicit axis extent [min, max], or null to infer from data.                                                                                                         |
| `dependentAxis.grid.stroke`               | color (hex)                             | `""`         | Color of grid lines (empty = inherit / none).                                                                                                                        |
| `dependentAxis.grid.strokeDasharray`      | string                                  | `""`         | SVG dash pattern for grid lines.                                                                                                                                     |
| `dependentAxis.grid.strokeOpacity`        | number                                  | `0.2`        | Opacity of grid lines.                                                                                                                                               |
| `dependentAxis.grid.strokeWidth`          | number                                  | `1`          | Width of grid lines (px).                                                                                                                                            |
| `dependentAxis.label`                     | string                                  | `""`         | Axis title label.                                                                                                                                                    |
| `dependentAxis.nice`                      | boolean                                 | `true`       | Round the axis domain to clean tick values (d3 nice). On by default to match how published charts have always rendered; disable to honor editor-set domains exactly. |
| `dependentAxis.scale`                     | `'linear' \| 'time' \| 'log' \| 'sqrt'` | `"linear"`   | 'log' \.                                                                                                                                                             |
| `dependentAxis.showZero`                  | boolean                                 | `false`      | Force zero to appear in the domain.                                                                                                                                  |
| `dependentAxis.tickAngle`                 | number                                  | `0`          | Rotation of tick labels (degrees).                                                                                                                                   |
| `dependentAxis.tickCount`                 | number                                  | `5`          | Suggested number of tick marks.                                                                                                                                      |
| `dependentAxis.tickFormat`                | string                                  | `null`       | Reserved for runtime format function. _(read-only)_                                                                                                                  |
| `dependentAxis.tickLabels.angle`          | number                                  | `0`          | Rotation of tick labels (degrees).                                                                                                                                   |
| `dependentAxis.tickLabels.dx`             | number                                  | `0`          | Horizontal nudge for tick labels.                                                                                                                                    |
| `dependentAxis.tickLabels.dy`             | number                                  | `0`          | Vertical nudge for tick labels.                                                                                                                                      |
| `dependentAxis.tickLabels.fill`           | color (hex)                             | `"#565656"`  | Tick label color.                                                                                                                                                    |
| `dependentAxis.tickLabels.fontFamily`     | font                                    | `"var:preset | font-family                                                                                                                                                          | sans-serif"` | Tick label font stack (theme.json family picker; new charts only). |
| `dependentAxis.tickLabels.fontSize`       | number                                  | `12`         | Tick label font size (px).                                                                                                                                           |
| `dependentAxis.tickLabels.maxWidth`       | number                                  | `50`         | Max label width before wrapping (px).                                                                                                                                |
| `dependentAxis.tickLabels.padding`        | number                                  | `15`         | Gap between tick mark and label (px).                                                                                                                                |
| `dependentAxis.tickLabels.textAnchor`     | `'start' \| 'middle' \| 'end'`          | `"end"`      | 'end'`.                                                                                                                                                              |
| `dependentAxis.tickLabels.verticalAnchor` | `'start' \| 'middle' \| 'end'`          | `"middle"`   | 'end'`.                                                                                                                                                              |
| `dependentAxis.tickMarksActive`           | boolean                                 | `true`       | Show tick mark lines on the axis.                                                                                                                                    |
| `dependentAxis.ticks.size`                | number                                  | `5`          | Length of tick marks (px).                                                                                                                                           |
| `dependentAxis.ticks.stroke`              | color (hex)                             | `"#818181"`  | Color of tick marks.                                                                                                                                                 |
| `dependentAxis.ticks.strokeWidth`         | number                                  | `0`          | Width of tick mark lines (px).                                                                                                                                       |
| `dependentAxis.ticksToLocaleString`       | boolean                                 | `false`      | Format tick values with toLocaleString().                                                                                                                            |
| `dependentAxis.tickUnit`                  | string                                  | `""`         | Unit suffix/prefix appended to tick labels (e.g. "%", "$").                                                                                                          |
| `dependentAxis.tickUnitPosition`          | `'start' \| 'end'`                      | `"end"`      | `"end"`.                                                                                                                                                             |
| `dependentAxis.tickValues`                | string                                  | `null`       | Explicit tick values array; managed per-chart, not a theme default. _(read-only)_                                                                                    |

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
| `dataRender.rowFilter.column`                        | string                 | `"x"`              | Column used to match exclude tokens. Inspector always writes `"x"` (first table column). |
| `dataRender.rowFilter.exclude`                       | string[]               | `[]`               | First-column values omitted from the plot. Those rows stay in the table. |
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

| Attribute                       | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Default                | Notes                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------- |
| `tooltip.abbreviateValue`       | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                | Abbreviate the displayed value (e.g. 1K, 1M).                                                                                                 |
| `tooltip.absoluteValue`         | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                | Show absolute (non-negative) values.                                                                                                          |
| `tooltip.active`                | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                | Enable/disable tooltips.                                                                                                                      |
| `tooltip.caretPosition`         | `'top' \| 'bottom' \| 'left' \| 'right'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `"bottom"`             | `'left'`.                                                                                                                                     |
| `tooltip.customFormat`          | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `null`                 | Reserved for runtime custom format function. _(read-only)_                                                                                    |
| `tooltip.dateFormat`            | `'%Y' \| ''%y' \| '%-m/%Y' \| '%-m/%y' \| '%m/%Y' \| '%m/%y' \| '%B %Y' \| '%b %Y' \| '%B '%y' \| '%b '%y' \| '%-m/%-d/%Y' \| '%-d/%-m/%Y' \| '%-m/%-d/%y' \| '%-d/%-m/%y' \| '%-m/%-d' \| '%-d/%-m' \| '%m/%d/%Y' \| '%d/%m/%Y' \| '%m/%d/%y' \| '%d/%m/%y' \| '%m/%-d' \| '%-d/%m' \| '%B %-d, %Y' \| '%B %-d %Y' \| '%b %-d, %Y' \| '%b %-d %Y' \| '%-d %B, %Y' \| '%-d %B %Y' \| '%-d %b, %Y' \| '%-d %b %Y' \| '%B %-d '%y' \| '%-d %B '%y' \| '%b %-d '%y' \| '%-d %b '%y' \| '%B %-d' \| '%-d %B' \| '%b %-d' \| '%-d %b' \| '%B' \| '%b'` | `"%-m/%Y"`             | Date format when axis scale is `"time"`.                                                                                                      |
| `tooltip.deemphasizeOpacity`    | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0.5`                  | Opacity applied to de-emphasised elements.                                                                                                    |
| `tooltip.deemphasizeSiblings`   | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                | Fade non-hovered series when hovering.                                                                                                        |
| `tooltip.emphasizeStrokeActive` | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                | Highlight hovered element with a stroke.                                                                                                      |
| `tooltip.emphasizeStrokeColor`  | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"black"`              | Stroke color for emphasis.                                                                                                                    |
| `tooltip.emphasizeStrokeWidth`  | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `1`                    | Stroke width for emphasis (px).                                                                                                               |
| `tooltip.format`                | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"{{row}}: {{value}}"` | Mustache-style template for each tooltip row.                                                                                                 |
| `tooltip.headerActive`          | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                 | Show a header row inside the tooltip.                                                                                                         |
| `tooltip.headerValue`           | `'categoryValue' \| 'independentValue'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `"categoryValue"`      | `"categoryValue"`.                                                                                                                            |
| `tooltip.minDisplayValue`       | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `null`                 | Values below this read as `<value` rather than rounding to zero. Null (the default) formats every value normally. _(read-only)_               |
| `tooltip.mode`                  | `'point' \| 'unified'`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"point"`              | `point` resolves one data point per hover. `unified` reports every series plotted at the hovered x.                                           |
| `tooltip.offsetX`               | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `10`                   | Horizontal pixel offset of the tooltip box.                                                                                                   |
| `tooltip.offsetY`               | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `10`                   | Vertical pixel offset of the tooltip box.                                                                                                     |
| `tooltip.rlsFormat`             | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                | Use RLS (relative-to-last-series) formatting.                                                                                                 |
| `tooltip.style.background`      | color (hex)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `"white"`              | Tooltip background color.                                                                                                                     |
| `tooltip.style.border`          | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"1px solid #CBCBCB"`  | Tooltip border CSS shorthand.                                                                                                                 |
| `tooltip.style.borderRadius`    | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"0px"`                | Tooltip corner radius CSS shorthand.                                                                                                          |
| `tooltip.style.color`           | color (hex)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `"black"`              | Tooltip text color.                                                                                                                           |
| `tooltip.style.fontFamily`      | font                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `"var:preset           | font-family                                                                                                                                   | sans-serif"` | Tooltip font stack (theme.json family picker; new charts only). |
| `tooltip.style.fontSize`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `13`                   | Tooltip text size (px).                                                                                                                       |
| `tooltip.style.height`          | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"auto"`               | Tooltip box height CSS value (e.g. `auto`).                                                                                                   |
| `tooltip.style.maxHeight`       | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `100`                  | Maximum tooltip box height (px).                                                                                                              |
| `tooltip.style.maxWidth`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `200`                  | Maximum tooltip box width (px).                                                                                                               |
| `tooltip.style.minHeight`       | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `20`                   | Minimum tooltip box height (px).                                                                                                              |
| `tooltip.style.minWidth`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `50`                   | Minimum tooltip box width (px).                                                                                                               |
| `tooltip.style.padding`         | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"10px"`               | Tooltip inner padding CSS shorthand.                                                                                                          |
| `tooltip.style.width`           | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `"auto"`               | Tooltip box width CSS value (e.g. `auto`).                                                                                                    |
| `tooltip.template`              | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `null`                 | Rich HTML tooltip body. When non-null, takes precedence over format. Null keeps the legacy mustache format path. _(read-only)_                |
| `tooltip.toFixedDecimal`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `0`                    | Exact decimal places rendered, so 20 at 3 places reads `20.000`. Zero keeps each number as it is.                                             |
| `tooltip.toLocaleString`        | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`                 | Format numbers with locale-aware thousands separators.                                                                                        |
| `tooltip.truncateDecimal`       | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `false`                | Legacy. Charts saved before Decimal Places became authoritative keep their old trailing-zero trimming. Cleared when Decimal Places is edited. |

---

### `legend` — Chart Legend

| Attribute               | Type                                                     | Default        | Notes                                                                              |
| ----------------------- | -------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| `legend.active`         | boolean                                                  | `false`        | Show/hide the legend.                                                              |
| `legend.alignment`      | `'flex-start' \| 'center' \| 'flex-end' \| 'none'`       | `"center"`     | 'center' \.                                                                        |
| `legend.borderStroke`   | color (hex)                                              | `""`           | Border color of the legend box (empty = none).                                     |
| `legend.categories`     | string                                                   | `[]`           | Override legend item order; uses `dataRender.categories` by default. _(read-only)_ |
| `legend.fill`           | color (hex)                                              | `""`           | Background fill of the legend box (empty = transparent).                           |
| `legend.fontFamily`     | font                                                     | `"var:preset   | font-family                                                                        | sans-serif"` | Legend label font stack (theme.json family picker; new charts only). |
| `legend.fontSize`       | number                                                   | `12`           | Legend label font size (px).                                                       |
| `legend.fontWeight`     | `'normal' \| 'bold' \| '600' \| '700'`                   | `"normal"`     | `"normal"`.                                                                        |
| `legend.labelDelimiter` | string                                                   | `"to"`         | Text between the lower and upper bound labels in map legends.                      |
| `legend.labelLower`     | string                                                   | `"Less than "` | Prefix label for the bottom range in map legends.                                  |
| `legend.labelUpper`     | string                                                   | `"More than "` | Prefix label for the top range in map legends.                                     |
| `legend.margin.bottom`  | number                                                   | `0`            | Bottom margin around the legend (px).                                              |
| `legend.margin.left`    | number                                                   | `0`            | Left margin around the legend (px).                                                |
| `legend.margin.right`   | number                                                   | `5`            | Right margin around the legend (px).                                               |
| `legend.margin.top`     | number                                                   | `0`            | Top margin around the legend (px).                                                 |
| `legend.markerFill`     | `'solid' \| 'outline'`                                   | `"solid"`      | `"solid"`.                                                                         |
| `legend.markerStyle`    | `'rect' \| 'circle' \| 'line' \| 'none' \| 'label'`      | `"rect"`       | 'line' \.                                                                          |
| `legend.offsetX`        | number                                                   | `0`            | Horizontal position offset (px).                                                   |
| `legend.offsetY`        | number                                                   | `0`            | Vertical position offset (px).                                                     |
| `legend.orientation`    | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'` | `"row"`        | 'row-reverse' \.                                                                   |
| `legend.title`          | string                                                   | `""`           | Optional legend heading.                                                           |
| `legend.variation`      | `'grouped' \| 'detached' \| 'direct'`                    | `"grouped"`    | 'direct'`.                                                                         |

---

### `labels` — Data Labels

Inline value labels rendered on chart elements.

| Attribute                        | Type                                            | Default      | Notes                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------- |
| `labels.abbreviateValue`         | boolean                                         | `false`      | Abbreviate displayed values (e.g. 1K, 1M).                                                                                                                                                               |
| `labels.absoluteValue`           | boolean                                         | `false`      | Show absolute (non-negative) values.                                                                                                                                                                     |
| `labels.active`                  | boolean                                         | `false`      | Show/hide data labels.                                                                                                                                                                                   |
| `labels.autoDeclutter`           | boolean                                         | `false`      | Automatically resolve overlapping data labels.                                                                                                                                                           |
| `labels.color`                   | `'contrast' \| 'inherit' \| 'black' \| 'white'` | `"inherit"`  | Label color token (`contrast` picks bar-aware fill; `inherit` uses series color).                                                                                                                        |
| `labels.customLabelFormat`       | string                                          | `null`       | Reserved for runtime custom format function. _(read-only)_                                                                                                                                               |
| `labels.customLabels`            | string                                          | `{}`         | Per-datum label text overrides keyed by data row index. _(read-only)_                                                                                                                                    |
| `labels.customPositions`         | string                                          | `{}`         | Per-datum position overrides keyed by data row index. _(read-only)_                                                                                                                                      |
| `labels.customStyles`            | string                                          | `{}`         | Per-datum inline style overrides keyed by data row index. _(read-only)_                                                                                                                                  |
| `labels.customVisibility`        | string                                          | `{}`         | Per-datum visibility overrides keyed by data row index. _(read-only)_                                                                                                                                    |
| `labels.declutterLeaderLines`    | boolean                                         | `false`      | Draw leader lines from decluttered labels to their anchor points.                                                                                                                                        |
| `labels.declutterOmitEdgeWithin` | number                                          | `0`          | Omit the remaining label in a crowded cluster when its anchor is this close to a plot edge (0 disables).                                                                                                 |
| `labels.declutterOmitWithin`     | number                                          | `0`          | Omit labels whose anchors sit within this many pixels of a kept label (0 disables).                                                                                                                      |
| `labels.declutterPadding`        | number                                          | `4`          | Minimum padding between labels when auto-decluttering (px).                                                                                                                                              |
| `labels.firstLastLabelLayout`    | `'default' \| 'outside'`                        | `"default"`  | Placement for first/last labels on line-family charts. `outside` puts the first label left of its point and the last label right; labelPositionDX/DY still apply on top.                                 |
| `labels.fontFamily`              | font                                            | `"var:preset | font-family                                                                                                                                                                                              | sans-serif"` | Label font stack (theme.json family picker; new charts only). |
| `labels.fontSize`                | number                                          | `10`         | Label font size (px).                                                                                                                                                                                    |
| `labels.fontWeight`              | number                                          | `200`        | CSS font-weight for labels.                                                                                                                                                                              |
| `labels.labelCutoff`             | number                                          | `0`          | Min bar value to display a label (smaller bars are unlabelled).                                                                                                                                          |
| `labels.labelPositionBar`        | `'inside' \| 'center' \| 'outside'`             | `"inside"`   | `'center'`.                                                                                                                                                                                              |
| `labels.labelPositionDX`         | number                                          | `0`          | Horizontal pixel nudge for label placement.                                                                                                                                                              |
| `labels.labelPositionDY`         | number                                          | `0`          | Vertical pixel nudge for label placement.                                                                                                                                                                |
| `labels.labelUnit`               | string                                          | `""`         | Unit string appended to label values (e.g. `"%"`).                                                                                                                                                       |
| `labels.labelUnitPosition`       | `'start' \| 'end'`                              | `"end"`      | `"end"`.                                                                                                                                                                                                 |
| `labels.minDisplayValue`         | number                                          | `null`       | Values below this read as `<value` rather than rounding to zero. Null (the default) formats every value normally. Unrelated to labelCutoff, which decides whether a label is drawn at all. _(read-only)_ |
| `labels.pieLabelRadius`          | number                                          | `60`         | Distance of pie/donut labels from the center (px).                                                                                                                                                       |
| `labels.showFirstLastPointsOnly` | boolean                                         | `false`      | Only label the first and last data point (useful for line charts).                                                                                                                                       |
| `labels.textAnchor`              | `'start' \| 'middle' \| 'end'`                  | `"middle"`   | `'end'`.                                                                                                                                                                                                 |
| `labels.textOutline`             | boolean                                         | `false`      | Draw a contrasting outline around label text for readability.                                                                                                                                            |
| `labels.textOutlineMode`         | `'background' \| 'contrast'`                    | `"contrast"` | Outline halo color strategy when textOutline is enabled (`background` = chart moat; `contrast` = opposite of label fill).                                                                                |
| `labels.toFixedDecimal`          | number                                          | `0`          | Exact decimal places rendered, so 20 at 3 places reads `20.000`. Zero keeps each number as it is.                                                                                                        |
| `labels.toLocaleString`          | boolean                                         | `true`       | Format numbers with locale-aware thousands separators.                                                                                                                                                   |
| `labels.truncateDecimal`         | boolean                                         | `false`      | Legacy. Charts saved before Decimal Places became authoritative keep their old trailing-zero trimming. Cleared when Decimal Places is edited.                                                            |

---

### `shapes` — Element Style Overrides

Per-series or per-segment style customisation applied to rendered shapes.

| Attribute               | Type    | Default | Notes                                                                                                                |
| ----------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `shapes.customStyles`   | string  | `{}`    | Per-series/category style overrides (keyed object; managed per-chart, not a theme default). _(read-only)_            |
| `shapes.segmentsActive` | boolean | `false` | Whether per-segment styling is active (managed per-chart, not a theme default). _(read-only)_                        |
| `shapes.segmentStyles`  | string  | `{}`    | Per-segment style overrides for stacked charts (keyed object; managed per-chart, not a theme default). _(read-only)_ |

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

| Attribute             | Type                                             | Default  | Notes                                                        |
| --------------------- | ------------------------------------------------ | -------- | ------------------------------------------------------------ |
| `bar.barGroupPadding` | number                                           | `0.2`    | Padding between bar groups in grouped charts (0–1 fraction). |
| `bar.barPadding`      | number                                           | `0.2`    | Inner padding between individual bars (0–1 fraction).        |
| `bar.hasRectStroke`   | boolean                                          | `false`  | Apply a border stroke around each bar rectangle.             |
| `bar.stackOffset`     | `'none' \| 'expand' \| 'wiggle' \| 'silhouette'` | `"none"` | `'wiggle'`.                                                  |

> `rectStrokeColor` and `rectStrokeWidth` are defined in `baseConfig.ts` (`"white"`, `1`) but are not stored in `block.json`; they use their runtime defaults.

#### `line` — Line & Area Charts

Applies to: `line`, `area`, `stacked-area`.

| Attribute                      | Type                                                                                                                                                                                                                                                                                                                                                                                                                                      | Default         | Notes                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------- |
| `line.areaFillOpacity`         | number                                                                                                                                                                                                                                                                                                                                                                                                                                    | `0.4`           | Opacity of the area fill (0–1).                                         |
| `line.interpolation`           | `'curveBasis' \| 'curveBasisClosed' \| 'curveBasisOpen' \| 'curveStep' \| 'curveStepAfter' \| 'curveStepBefore' \| 'curveBundle' \| 'curveLinear' \| 'curveLinearClosed' \| 'curveCardinal' \| 'curveCardinalClosed' \| 'curveCardinalOpen' \| 'curveCatmullRom' \| 'curveCatmullRomClosed' \| 'curveCatmullRomOpen' \| 'curveMonotoneX' \| 'curveMonotoneY' \| 'curveNatural' \| 'curvemonotoneX' \| 'curvemonotoneY' \| 'curvenatural'` | `"curveLinear"` | D3 curve factory name (e.g. `"curveBasis"`, `"curveMonotoneX"`).        |
| `line.showArea`                | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                   | `false`         | Fill the area beneath the line.                                         |
| `line.showFirstLastPointsOnly` | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                   | `false`         | Only render markers on the first and last plotted point in each series. |
| `line.showPoints`              | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                   | `true`          | Render data point markers on the line.                                  |
| `line.strokeDasharray`         | string                                                                                                                                                                                                                                                                                                                                                                                                                                    | `""`            | SVG dash pattern for the line (e.g. `"4,2"`).                           |
| `line.strokeWidth`             | number                                                                                                                                                                                                                                                                                                                                                                                                                                    | `3`             | Line stroke width (px).                                                 |

#### `dotPlot` — Dot Plot Charts

Applies to: `dot-plot`.

| Attribute                                | Type        | Default     | Notes                                     |
| ---------------------------------------- | ----------- | ----------- | ----------------------------------------- |
| `dotPlot.connectingLine.stroke`          | color (hex) | `"#E6E7E8"` | color of the connecting line.             |
| `dotPlot.connectingLine.strokeDasharray` | string      | `""`        | SVG dash pattern for the connecting line. |
| `dotPlot.connectingLine.strokeOpacity`   | number      | `1`         | Opacity of the connecting line (0–1).     |
| `dotPlot.connectingLine.strokeWidth`     | number      | `6`         | Width of the connecting line (px).        |
| `dotPlot.connectPoints`                  | boolean     | `true`      | Draw a connecting line between dot pairs. |

#### `beeSwarm` — Beeswarm Charts

Applies to: `bee-swarm`.

| Attribute                | Type                 | Default   | Notes                                                                            |
| ------------------------ | -------------------- | --------- | -------------------------------------------------------------------------------- |
| `beeSwarm.forceStrength` | number               | `0.1`     | Force layout: pull strength for x/y forces (0–1).                                |
| `beeSwarm.groupBy`       | string               | `null`    | Force layout: column whose values cluster around separate y centers.             |
| `beeSwarm.layoutMode`    | `'dodge' \| 'force'` | `"dodge"` | Beeswarm layout algorithm (dodge = precise x, force = clustered).                |
| `beeSwarm.swarmSpread`   | number               | `24`      | Dodge layout: max horizontal drift from anchor x (px). 0 = vertical stacks only. |

#### `errorBars` — Error Bars

| Attribute                                 | Type        | Default     | Notes                                                                                          |
| ----------------------------------------- | ----------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `errorBars.categories`                    | string      | `{}`        | Per-category error bar style overrides (managed per-chart, not a theme default). _(read-only)_ |
| `errorBars.customStyles`                  | string      | `{}`        | Per-datum error bar style overrides (managed per-chart, not a theme default). _(read-only)_    |
| `errorBars.defaultStyles.stroke`          | color (hex) | `"#E6E7E8"` | Color of default error bar whiskers.                                                           |
| `errorBars.defaultStyles.strokeDasharray` | string      | `""`        | SVG dash pattern for error bars.                                                               |
| `errorBars.defaultStyles.strokeOpacity`   | number      | `1`         | Opacity of error bars (0–1).                                                                   |
| `errorBars.defaultStyles.strokeWidth`     | number      | `6`         | Width of default error bar whiskers (px).                                                      |
| `errorBars.enabled`                       | boolean     | `false`     | Enable error bar overlays.                                                                     |

#### `nodes` — Scatter, Beeswarm & Dot Plot Markers

Applies to: `scatter`, `bee-swarm`, `dot-plot`.

| Attribute                | Type                          | Default     | Notes                                                                        |
| ------------------------ | ----------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `nodes.maxPointSize`     | number                        | `24`        | Maximum marker radius when sizeCategory is set (px).                         |
| `nodes.minPointSize`     | number                        | `4`         | Minimum marker radius when sizeCategory is set (px).                         |
| `nodes.pointFill`        | `'inherit' \| 'white'`        | `"inherit"` | Fill color of markers (`"inherit"` uses series color).                       |
| `nodes.pointFillOpacity` | number                        | `1`         | Fill opacity of markers (0–1).                                               |
| `nodes.pointSize`        | number                        | `3`         | Radius of scatter/dot plot markers (px).                                     |
| `nodes.pointStroke`      | string                        | `"inherit"` | Stroke color of markers.                                                     |
| `nodes.pointStrokeWidth` | number                        | `1`         | Stroke width around markers (px).                                            |
| `nodes.sizeCategory`     | string                        | `null`      | Table column used for proportional marker radius (null = uniform pointSize). |
| `nodes.sizeScale`        | `'sqrt' \| 'linear' \| 'log'` | `"sqrt"`    | Scale type mapping sizeCategory values to radius.                            |

#### `explodedBar` — Exploded Bar Charts

Applies to: `exploded-bar`.

| Attribute               | Type   | Default | Notes                                             |
| ----------------------- | ------ | ------- | ------------------------------------------------- |
| `explodedBar.columnGap` | number | `16`    | Horizontal gap between exploded bar columns (px). |

#### `pie` — Pie Charts

Applies to: `pie`.

| Attribute                           | Type                                | Default     | Notes                                                         |
| ----------------------------------- | ----------------------------------- | ----------- | ------------------------------------------------------------- |
| `pie.cornerRadius`                  | number                              | `0`         | Corner rounding radius for segments (px).                     |
| `pie.groupArcStyle.stroke`          | color (hex)                         | `"#666666"` | color of group arc lines.                                     |
| `pie.groupArcStyle.strokeDasharray` | `'none' \| '4,4' \| '2,2' \| '8,4'` | `"4,4"`     | Dash pattern for group arc lines.                             |
| `pie.groupArcStyle.strokeWidth`     | number                              | `1`         | Width of group arc lines (px).                                |
| `pie.groupGapAngle`                 | number                              | `10`        | Angular gap between segment groups (degrees).                 |
| `pie.hasPathStroke`                 | boolean                             | `false`     | Apply a stroke between pie segments.                          |
| `pie.innerRadius`                   | number                              | `0`         | Inner radius for donut charts (0 = solid pie).                |
| `pie.padAngle`                      | number                              | `0`         | Padding angle between segments (radians).                     |
| `pie.pathStrokeColor`               | string                              | `"white"`   | color of inter-segment strokes.                               |
| `pie.pathStrokeWidth`               | number                              | `1`         | Width of inter-segment strokes (px).                          |
| `pie.showCategoryLabels`            | boolean                             | `true`      | Render category name labels outside segments.                 |
| `pie.showGroupArcs`                 | boolean                             | `false`     | Render arc indicators around segment groups.                  |
| `pie.sortByValue`                   | boolean                             | `false`     | Sort segments by value (largest first) instead of data order. |

#### `divergingBar` — Diverging Bar Charts

Applies to: `diverging-bar`.

| Attribute                                   | Type        | Default     | Notes                                                                                                   |
| ------------------------------------------- | ----------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| `divergingBar.negativeCategories`           | string      | `[]`        | Column keys plotted on the negative side. _(read-only)_                                                 |
| `divergingBar.netNegativeCategory`          | string      | `""`        | Column key for the net negative bar.                                                                    |
| `divergingBar.netPositiveCategory`          | string      | `""`        | Column key for the net positive bar (optional summary bar).                                             |
| `divergingBar.neutralBar.active`            | boolean     | `true`      | Show a center neutral bar.                                                                              |
| `divergingBar.neutralBar.category`          | string      | `""`        | Column key for the neutral bar.                                                                         |
| `divergingBar.neutralBar.offsetX`           | number      | `0`         | Horizontal offset of the neutral bar (px).                                                              |
| `divergingBar.neutralBar.separator`         | boolean     | `true`      | Draw a separator line at the neutral bar.                                                               |
| `divergingBar.neutralBar.separatorOffsetX`  | number      | `-1`        | Horizontal offset of the separator line (px).                                                           |
| `divergingBar.percentOfInnerWidth`          | number      | `0.7`       | Fraction of chart width used for the diverging bars (0–1).                                              |
| `divergingBar.positiveCategories`           | string      | `[]`        | Column keys plotted on the positive side. _(read-only)_                                                 |
| `divergingBar.secondary.active`             | boolean     | `false`     | Show a secondary diverging bar layer.                                                                   |
| `divergingBar.secondary.categoryStyles`     | string      | `{}`        | Per-category style overrides for secondary bars (managed per-chart, not a theme default). _(read-only)_ |
| `divergingBar.secondary.fill`               | color (hex) | `"#D9D9D9"` | Fill color of secondary bars.                                                                           |
| `divergingBar.secondary.negativeCategories` | string      | `[]`        | Column keys plotted on the secondary negative side. _(read-only)_                                       |
| `divergingBar.secondary.opacity`            | number      | `0.4`       | Opacity of secondary bars (0–1).                                                                        |
| `divergingBar.secondary.positiveCategories` | string      | `[]`        | Column keys plotted on the secondary positive side. _(read-only)_                                       |
| `divergingBar.secondary.showInLegend`       | boolean     | `false`     | Include secondary bars in the legend.                                                                   |
| `divergingBar.secondary.stroke`             | color (hex) | `"#000000"` | Stroke color of secondary bars.                                                                         |
| `divergingBar.secondary.strokeWidth`        | number      | `0.5`       | Stroke width of secondary bars (px).                                                                    |

#### `regression` — Regression Lines

Applies to: `scatter`.

| Attribute                     | Type                                                                                              | Default     | Notes                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------- |
| `regression.active`           | boolean                                                                                           | `false`     | Overlay a regression line on the chart.                       |
| `regression.groupBreakStyles` | string                                                                                            | `{}`        | Per-group style overrides for regression lines. _(read-only)_ |
| `regression.perGroupBreak`    | boolean                                                                                           | `false`     | Compute a separate regression for each group break.           |
| `regression.stroke`           | color (hex)                                                                                       | `"#2a2a2a"` | color of the regression line.                                 |
| `regression.strokeDasharray`  | string                                                                                            | `""`        | SVG dash pattern for the regression line.                     |
| `regression.strokeWidth`      | number                                                                                            | `2`         | Width of the regression line (px).                            |
| `regression.type`             | `'linear' \| 'exponential' \| 'polynomial' \| 'logarithmic' \| 'power' \| 'quadratic' \| 'loess'` | `"linear"`  | `'power'`.                                                    |

#### `diffColumn` — Difference Column

Renders a calculated difference column alongside bar-family and dot-plot charts (not pie).

| Attribute                            | Type                                               | Default      | Notes                                                                            |
| ------------------------------------ | -------------------------------------------------- | ------------ | -------------------------------------------------------------------------------- | ------------ | --------------------------------------------- |
| `diffColumn.active`                  | boolean                                            | `false`      | Show/hide the diff column.                                                       |
| `diffColumn.category`                | string                                             | `""`         | Column key whose values are displayed in the diff column.                        |
| `diffColumn.columnHeader`            | string                                             | `"Diff"`     | Header label for the column.                                                     |
| `diffColumn.customLabels`            | string                                             | `{}`         | Per-cell overrides keyed by `x::category` or `x::category::group`. _(read-only)_ |
| `diffColumn.dx`                      | number                                             | `0`          | Horizontal nudge of the column (px).                                             |
| `diffColumn.dy`                      | number                                             | `0`          | Vertical nudge of the column (px).                                               |
| `diffColumn.style.fill`              | color (hex)                                        | `"#2a2a2a"`  | Default cell text color.                                                         |
| `diffColumn.style.fontAppearance`    | `'default' \| 'bold' \| 'italic' \| 'bold-italic'` | `"default"`  | Semantic appearance variant (e.g. colored diffs).                                |
| `diffColumn.style.fontSize`          | string                                             | `"10px"`     | Cell font size.                                                                  |
| `diffColumn.style.fontStyle`         | `'normal' \| 'italic'`                             | `"normal"`   | Font style of cell text.                                                         |
| `diffColumn.style.fontWeight`        | `'normal' \| 'bold'`                               | `"normal"`   | Font weight of cell text.                                                        |
| `diffColumn.style.headerFill`        | color (hex)                                        | `"#2a2a2a"`  | Header text color.                                                               |
| `diffColumn.style.headerFontFamily`  | string                                             | `"var:preset | font-family                                                                      | sans-serif"` | Header font family (separate from cell text). |
| `diffColumn.style.headerFontSize`    | string                                             | `"12px"`     | Column header font size.                                                         |
| `diffColumn.style.headerFontStyle`   | `'normal' \| 'italic'`                             | `"normal"`   | Header font style (separate from cell text).                                     |
| `diffColumn.style.headerFontWeight`  | `'normal' \| 'bold'`                               | `"normal"`   | Header font weight (separate from cell text).                                    |
| `diffColumn.style.headerTextOutline` | boolean                                            | `false`      | Column-wide header text outline toggle.                                          |
| `diffColumn.style.heightOffset`      | number                                             | `0`          | Vertical adjustment to cell height (px).                                         |
| `diffColumn.style.marginLeft`        | number                                             | `10`         | Left margin before the column (px).                                              |
| `diffColumn.style.rectFill`          | color (hex)                                        | `"none"`     | Background fill of column cells.                                                 |
| `diffColumn.style.rectStrokeColor`   | string                                             | `"white"`    | Border color of column cells.                                                    |
| `diffColumn.style.rectStrokeWidth`   | number                                             | `0`          | Border width of column cells (px).                                               |
| `diffColumn.style.textOutline`       | boolean                                            | `false`      | Column-wide cell text outline toggle.                                            |
| `diffColumn.style.width`             | number                                             | `30`         | Column width (px).                                                               |

#### `netValues` — Net Value Labels

| Attribute                              | Type                           | Default      | Notes                                                                                        |
| -------------------------------------- | ------------------------------ | ------------ | -------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------- |
| `netValues.active`                     | boolean                        | `false`      | Show net positive/negative value labels on stacked charts.                                   |
| `netValues.negative.abbreviateValue`   | boolean                        | `false`      | Abbreviate the negative net value (e.g. 1K, 1M).                                             |
| `netValues.negative.absoluteValue`     | boolean                        | `false`      | Show absolute (non-negative) negative net values.                                            |
| `netValues.negative.active`            | boolean                        | `false`      | Show the negative net value label.                                                           |
| `netValues.negative.category`          | string                         | `""`         | Column key whose values feed the negative net label.                                         |
| `netValues.negative.color`             | `'black' \| 'white'`           | `"black"`    | Color of the negative net value label.                                                       |
| `netValues.negative.fontFamily`        | font                           | `"var:preset | font-family                                                                                  | sans-serif"` | Font stack for negative net labels (theme.json family picker; new charts only). |
| `netValues.negative.fontSize`          | number                         | `12`         | Font size of the negative net value label (px).                                              |
| `netValues.negative.fontWeight`        | number                         | `700`        | CSS font-weight of the negative net value label.                                             |
| `netValues.negative.labelPositionDX`   | number                         | `0`          | Horizontal nudge for the negative net value label.                                           |
| `netValues.negative.labelPositionDY`   | number                         | `0`          | Vertical nudge for the negative net value label.                                             |
| `netValues.negative.labelUnit`         | string                         | `""`         | Unit suffix/prefix appended to negative net values.                                          |
| `netValues.negative.labelUnitPosition` | `'start' \| 'end'`             | `"end"`      | Whether labelUnit appears before or after negative net values.                               |
| `netValues.negative.margin`            | number                         | `5`          | Margin around the negative net value label (px).                                             |
| `netValues.negative.textAnchor`        | `'start' \| 'middle' \| 'end'` | `"middle"`   | SVG text-anchor for the negative net value label.                                            |
| `netValues.negative.toFixedDecimal`    | number                         | `0`          | Decimal places shown on negative net values.                                                 |
| `netValues.negative.toLocaleString`    | boolean                        | `false`      | Format negative net values with locale-aware thousands separators.                           |
| `netValues.negative.truncateDecimal`   | boolean                        | `false`      | Legacy trailing-zero trimming on negative net values. Cleared when Decimal Places is edited. |
| `netValues.positive.abbreviateValue`   | boolean                        | `false`      | Abbreviate the positive net value (e.g. 1K, 1M).                                             |
| `netValues.positive.absoluteValue`     | boolean                        | `false`      | Show absolute (non-negative) positive net values.                                            |
| `netValues.positive.active`            | boolean                        | `true`       | Show the positive net value label.                                                           |
| `netValues.positive.category`          | string                         | `""`         | Column key whose values feed the positive net label.                                         |
| `netValues.positive.color`             | `'black' \| 'white'`           | `"black"`    | Color of the positive net value label.                                                       |
| `netValues.positive.fontFamily`        | font                           | `"var:preset | font-family                                                                                  | sans-serif"` | Font stack for positive net labels (theme.json family picker; new charts only). |
| `netValues.positive.fontSize`          | number                         | `12`         | Font size of the positive net value label (px).                                              |
| `netValues.positive.fontWeight`        | number                         | `700`        | CSS font-weight of the positive net value label.                                             |
| `netValues.positive.labelPositionDX`   | number                         | `0`          | Horizontal nudge for the positive net value label.                                           |
| `netValues.positive.labelPositionDY`   | number                         | `0`          | Vertical nudge for the positive net value label.                                             |
| `netValues.positive.labelUnit`         | string                         | `""`         | Unit suffix/prefix appended to positive net values.                                          |
| `netValues.positive.labelUnitPosition` | `'start' \| 'end'`             | `"end"`      | Whether labelUnit appears before or after positive net values.                               |
| `netValues.positive.margin`            | number                         | `5`          | Margin around the positive net value label (px).                                             |
| `netValues.positive.textAnchor`        | `'start' \| 'middle' \| 'end'` | `"middle"`   | SVG text-anchor for the positive net value label.                                            |
| `netValues.positive.toFixedDecimal`    | number                         | `0`          | Decimal places shown on positive net values.                                                 |
| `netValues.positive.toLocaleString`    | boolean                        | `false`      | Format positive net values with locale-aware thousands separators.                           |
| `netValues.positive.truncateDecimal`   | boolean                        | `false`      | Legacy trailing-zero trimming on positive net values. Cleared when Decimal Places is edited. |

#### `treemap` — Treemap Charts

Applies to: `treemap`.

| Attribute                 | Type                                                                         | Default      | Notes                                              |
| ------------------------- | ---------------------------------------------------------------------------- | ------------ | -------------------------------------------------- |
| `treemap.borderRadius`    | number                                                                       | `0`          | Corner radius for treemap cells (px).              |
| `treemap.labelMinArea`    | number                                                                       | `1600`       | Minimum cell area (px²) required to show a label.  |
| `treemap.opacityRange`    | [number, number]                                                             | `[0.4,1]`    | Min/max opacity range when `scaleOpacity` is true. |
| `treemap.paddingInner`    | number                                                                       | `2`          | Inner padding between leaf cells (px).             |
| `treemap.paddingOuter`    | number                                                                       | `4`          | Outer padding around the treemap boundary (px).    |
| `treemap.rectStroke`      | string                                                                       | `"#ffffff"`  | Border color between treemap cells.                |
| `treemap.rectStrokeWidth` | number                                                                       | `2`          | Border width between treemap cells (px).           |
| `treemap.scaleOpacity`    | boolean                                                                      | `false`      | Scale cell opacity by value.                       |
| `treemap.showValues`      | boolean                                                                      | `false`      | Render the numeric value inside each cell.         |
| `treemap.tile`            | `'squarify' \| 'binary' \| 'dice' \| 'slice' \| 'sliceDice' \| 'resquarify'` | `"squarify"` | `'binary'`.                                        |

#### `sankey` — Sankey / Flow Diagrams

Applies to: `sankey`.

| Attribute            | Type                                         | Default     | Notes                                     |
| -------------------- | -------------------------------------------- | ----------- | ----------------------------------------- |
| `sankey.linkOpacity` | number                                       | `0.5`       | Opacity of flow links.                    |
| `sankey.nodeAlign`   | `'justify' \| 'left' \| 'right' \| 'center'` | `"justify"` | `'right'`.                                |
| `sankey.nodePadding` | number                                       | `10`        | Vertical padding between nodes (px).      |
| `sankey.nodeRadius`  | number                                       | `0`         | Corner radius of node rectangles (px).    |
| `sankey.nodeWidth`   | number                                       | `12`        | Width of node rectangles (px).            |
| `sankey.sourceKey`   | string                                       | `"x"`       | Data column key for the link source node. |
| `sankey.targetKey`   | string                                       | `"target"`  | Data column key for the link target node. |
| `sankey.valueKey`    | string                                       | `"value"`   | Data column key for the link flow value.  |

#### `waffle` — Waffle Charts

Applies to: `waffle` (`displayMode`: `whole` | `portion`).

| Attribute             | Type                           | Default     | Notes                                                                                                                  |
| --------------------- | ------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `waffle.cellGap`      | number                         | `0.1`       | Padding between cells as a fraction of cell size.                                                                      |
| `waffle.cellRadius`   | number                         | `3`         | Corner radius for square cells (px).                                                                                   |
| `waffle.cellShape`    | `'square' \| 'circle'`         | `"square"`  | Shape used for each waffle cell.                                                                                       |
| `waffle.cellSize`     | number                         | `14`        | Preferred cell size in px (used by fixed and clamp modes).                                                             |
| `waffle.cellSizeMode` | `'fixed' \| 'auto' \| 'clamp'` | `"clamp"`   | fixed = exact size; auto = always fit; clamp = preferred size until overflow then scale down.                          |
| `waffle.columns`      | number                         | `10`        | Number of cells across (grid width).                                                                                   |
| `waffle.displayMode`  | `'whole' \| 'portion'`         | `"whole"`   | Whole uses one grid; portion uses one mini grid per category. _(read-only)_                                            |
| `waffle.emptyFill`    | string                         | `"#E6E7E8"` | Fill color for empty waffle cells.                                                                                     |
| `waffle.max`          | number                         | `null`      | Domain ceiling: what a full grid represents. Fill = value / max. Null uses sum (whole) or 100 (portion). _(read-only)_ |
| `waffle.rows`         | number                         | `10`        | Number of cells tall (grid height).                                                                                    |

#### `heatMapTable` — Heat Map Table

Applies to: `heat-map-table`.

| Attribute                         | Type    | Default     | Notes                                                                                                 |
| --------------------------------- | ------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| `heatMapTable.cellGap`            | number  | `0`         | Space between cells (px).                                                                             |
| `heatMapTable.cellRadius`         | number  | `0`         | Corner radius for each cell (px).                                                                     |
| `heatMapTable.columnHeaderHeight` | number  | `48`        | Height reserved for the dependent axis band when it is active (px).                                   |
| `heatMapTable.emptyFill`          | string  | `"#F5F5F5"` | Fill color for empty or missing cells.                                                                |
| `heatMapTable.minCellHeight`      | number  | `28`        | Minimum height for each data cell (px).                                                               |
| `heatMapTable.minCellWidth`       | number  | `40`        | Minimum width for each data cell (px).                                                                |
| `heatMapTable.rowLabelWidth`      | number  | `0`         | Optional gap between the independent axis line and the heat grid (px). Labels use chart left padding. |
| `heatMapTable.showValues`         | boolean | `true`      | Show numeric values inside each cell.                                                                 |

#### `smallMultiples` — Small Multiples

Applies to: `small-multiples`.

| Attribute                              | Type                                               | Default        | Notes                                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------ |
| `smallMultiples.axisTreatment`         | `'minimal' \| 'full'`                              | `"minimal"`    | `"minimal"` shows y-axis on the first column and x labels on every panel; `"full"` draws complete axes (incl. independent grid) on every panel. _(read-only)_ |
| `smallMultiples.columns`               | number                                             | `3`            | Number of panel columns in the grid (desktop). _(read-only)_                                                                                                  |
| `smallMultiples.emphasisMode`          | `'own-series' \| 'highlight'`                      | `"own-series"` | `"own-series"` draws only the panel column; `"highlight"` ghosts sibling series (line panels only in MVP). _(read-only)_                                      |
| `smallMultiples.ghost.opacity`         | number                                             | `1`            | Opacity for ghosted sibling series.                                                                                                                           |
| `smallMultiples.ghost.stroke`          | color (hex)                                        | `"#E6E7E8"`    | Stroke color for ghosted sibling series.                                                                                                                      |
| `smallMultiples.ghost.strokeWidth`     | number                                             | `1.5`          | Stroke width for ghosted sibling series (px).                                                                                                                 |
| `smallMultiples.minPanelWidth`         | number                                             | `120`          | Minimum panel cell width in px. When the container is narrower, columns restack until each panel meets this width.                                            |
| `smallMultiples.panelGap.x`            | number                                             | `24`           | Horizontal gap between panels (px).                                                                                                                           |
| `smallMultiples.panelGap.y`            | number                                             | `32`           | Vertical gap between panels (px).                                                                                                                             |
| `smallMultiples.panelHeight`           | number                                             | `184`          | Locked cell height in px (title + plot). Total SVG height is derived from panelHeight × rowCount.                                                             |
| `smallMultiples.panelTitle.active`     | boolean                                            | `true`         | Show the column-name title above each panel.                                                                                                                  |
| `smallMultiples.panelTitle.fill`       | color (hex)                                        | `"#2a2a2a"`    | Panel title text color.                                                                                                                                       |
| `smallMultiples.panelTitle.fontFamily` | font                                               | `"var:preset   | font-family                                                                                                                                                   | sans-serif"` | Panel title font family. |
| `smallMultiples.panelTitle.fontSize`   | number                                             | `13`           | Panel title font size (px).                                                                                                                                   |
| `smallMultiples.panelTitle.fontWeight` | number                                             | `700`          | Panel title font weight.                                                                                                                                      |
| `smallMultiples.panelTitle.padding`    | number                                             | `8`            | Space reserved below the panel title (px).                                                                                                                    |
| `smallMultiples.panelTitle.textAlign`  | string                                             | `"center"`     | Horizontal alignment of the panel title (left\|center\|right).                                                                                                |
| `smallMultiples.panelType`             | `'line' \| 'column' \| 'bar' \| 'pie' \| 'waffle'` | `"line"`       | Chart mark drawn in each panel. _(read-only)_                                                                                                                 |
| `smallMultiples.sharedScale`           | boolean                                            | `true`         | Share one y-domain across all panels. _(read-only)_                                                                                                           |

---

### `map` — Map Charts

Applies to: `map-usa`, `map-usa-counties`, `map-usa-block`, `map-world`.

| Attribute                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default     | Notes                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `map.abbreviateLabels`       | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `true`      | Use abbreviated state/country names.                                           |
| `map.blockRectSize`          | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `44`        | Cell size for block-style cartogram maps (px).                                 |
| `map.centerLatitude`         | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `0`         | Projection center latitude (degrees).                                          |
| `map.centerLongitude`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `0`         | Projection center longitude (degrees).                                         |
| `map.customScale`            | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `1`         | Scale multiplier applied on top of the projection's default scale.             |
| `map.ignoredLabels`          | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `[]`        | Additional state/country codes whose labels are suppressed. _(read-only)_      |
| `map.ignoreSmallStateLabels` | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `false`     | Suppress labels on small states/territories (RI, DC, etc.).                    |
| `map.pathBackgroundFill`     | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `"#f7f7f7"` | Fill for regions with no data.                                                 |
| `map.pathStroke`             | string                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `"#d3d3d3"` | Border color between regions.                                                  |
| `map.pathStrokeWidth`        | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `0.5`       | Border width between regions (px).                                             |
| `map.projectionPreset`       | `'default' \| 'americas' \| 'asia' \| 'europe' \| 'middle-east-north-africa' \| 'sub-saharan-africa' \| 'africa' \| 'asia-pacific' \| 'latin-america-and-the-caribbean' \| 'middle-east' \| 'north-america' \| 'caribbean' \| 'central-america' \| 'central-asia' \| 'east-asia' \| 'eastern-europe' \| 'north-africa' \| 'oceania' \| 'south-america' \| 'south-asia' \| 'western-europe' \| 'continent-africa' \| 'continent-asia' \| 'continent-europe' \| 'continent-north-america' \| 'continent-south-america' \| 'continent-oceania' \| 'custom'` | `"default"` | For world maps, pre-defined areas for render (eg. Europe, South Asia, Africa). |
| `map.rotateGamma`            | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `0`         | Projection γ (roll) rotation.                                                  |
| `map.rotateLambda`           | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `0`         | Projection λ (longitude) rotation.                                             |
| `map.rotatePhi`              | number                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `0`         | Projection φ (latitude) rotation.                                              |
| `map.showCountyBoundaries`   | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `true`      | Overlay county boundary lines (`map-usa-counties` only).                       |
| `map.showStateBoundaries`    | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `true`      | Overlay state boundary lines on county and world maps.                         |
| `map.topologyRegion`         | `'default' \| 'americas' \| 'asia' \| 'europe' \| 'middle-east-north-africa' \| 'sub-saharan-africa' \| 'africa' \| 'asia-pacific' \| 'latin-america-and-the-caribbean' \| 'middle-east' \| 'north-america' \| 'caribbean' \| 'central-america' \| 'central-asia' \| 'east-asia' \| 'eastern-europe' \| 'north-africa' \| 'oceania' \| 'south-america' \| 'south-asia' \| 'western-europe' \| 'continent-africa' \| 'continent-asia' \| 'continent-europe' \| 'continent-north-america' \| 'continent-south-america' \| 'continent-oceania' \| 'custom'` | `"default"` | Which regional topology file to load for world maps.                           |
| `map.zoomActive`             | boolean                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `false`     | Enable pan/zoom interaction.                                                   |

---

### `annotations` — Chart Annotations

Text or arrow callouts drawn on top of the chart.

| Attribute            | Type    | Default | Notes                                      |
| -------------------- | ------- | ------- | ------------------------------------------ |
| `annotations.active` | boolean | `false` | Enable/disable annotations.                |
| `annotations.items`  | string  | `[]`    | Array of annotation objects. _(read-only)_ |

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

### `customLegendLabels` — Per-legend-item overrides

Click a legend item in the editor to open the legend popover. Each category key maps to an object (not just a string label).

| Field on `customLegendLabels[category]` | Type | Notes |
| --- | --- | --- |
| `text` | string | Display label override |
| `color` | string (hex) | Swatch / label color |
| `fontFamily`, `fontSize`, `fontWeight`, `fontStyle` | typography | Same controls as other popover panels |
| `outlineColor`, `outlineWidth` | string / number | Label outline |
| `markerStyle`, `markerFill` | enum | Marker shape and fill mode |
| `offsetX`, `offsetY` | number | Detached legend position (when `legend.variation` is `detached`) |

Grouped legend chrome opens the panel for the whole legend; individual swatches open `LegendItemPanel` for one category. See `src/chart/edit/popover/panels/README.md` for the full popover inventory.

---

### `io` — Input / Output & Chart State

Stores the chart's data payload, static image fallback, and miscellaneous I/O flags.

| Attribute                     | Type     | Default     | Notes                                                                                                                          |
| ----------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `io.isConvertedChart`         | boolean  | `false`     | Marks charts migrated from the legacy chart builder                                                                            |
| `io.isStaticChart`            | boolean  | `false`     | Render a static image instead of an interactive SVG                                                                            |
| `io.isFreeformChart`          | boolean  | `false`     | Marks charts created outside the structured builder UI                                                                         |
| `io.staticImageId`            | string   | `""`        | WordPress attachment ID of the static fallback image                                                                           |
| `io.staticImageUrl`           | string   | `""`        | URL of the static fallback image                                                                                               |
| `io.staticImageInnerHTML`     | string   | `""`        | (Deprecated in v2) Rendered html from image used in static image variation                                                     |
| `io.staticImageAltText`       | string   | `""`        | (Deprecated in v2) Alt text for the static image variation                                                                     |
| `io.chartConverted.converted` | boolean  | `false`     | Whether a conversion from Highcharts has been performed                                                                        |
| `io.chartConverted.requester` | string   | `""`        | User or process that triggered the conversion                                                                                  |
| `io.chartConverted.timestamp` | string   | `""`        | ISO timestamp of the conversion                                                                                                |
| `io.defaultShouldRender`      | boolean  | `true`      | Whether the chart should render on page load by default                                                                        |
| `io.pngUrl`                   | string   | `""`        | URL of the server-generated PNG (3.6.0+). Set automatically by `PNG_Export` via ScreenshotOne on post save or WP-CLI backfill. |
| `io.pngId`                    | string   | `""`        | WordPress attachment ID of the server-generated PNG. Set alongside `io.pngUrl` by `PNG_Export`.                                |
| `io.colorValue`               | string   | `"general"` | Named color palette variant (e.g. `"general"`, `"sequential"`)                                                                 |
| `io.customColors`             | string[] | `[]`        | Editor-supplied color overrides (takes precedence over `colors`)                                                               |
| `io.chartFamily`              | string   | `"chart"`   | Top-level chart family used for routing in the charting library (eg. "map" or "chart")                                         |
| `io.chartData`                | object[] | `[]`        | The raw chart data rows                                                                                                        |
| `io.tableData`                | string   | `""`        | Serialised table data (used for accessible data table view)                                                                    |
| `io.availableCategories`      | string[] | `[]`        | All column keys present in `chartData`                                                                                         |
| `io.independentVariable`      | string   | `""`        | Column key treated as the independent variable (mirrors `dataRender.x`)                                                        |
| `io.hasPreformattedData`      | boolean  | `false`     | Skip data normalisation when data is already in chart-ready format                                                             |
| `io.preformattedData`         | object[] | `[]`        | Pre-normalised data rows used when `hasPreformattedData` is `true`                                                             |
| `io.questionWordingActive`    | boolean  | `false`     | Show survey question wording below the chart                                                                                   |
| `io.questionWording`          | string   | `""`        | Survey question text                                                                                                           |
| `io.tabsActive`               | boolean  | `false`     | Enable tabbed chart views (e.g. chart / table toggle)                                                                          |
| `io.allowDataDownload`        | boolean  | `true`      | Show a data download button                                                                                                    |
| `io.elementHasStroke`         | boolean  | `false`     | Apply a stroke to rendered chart elements (bars, segments)                                                                     |
| `io.isCustomChart`            | boolean  | `false`     | Enable custom chart type rendering path                                                                                        |
| `io.customAttributes`         | object   | `{}`        | Free-form attributes passed to a custom chart renderer                                                                         |
| `io.preserveStringKeys`       | string[] | `[]`        | Column keys that should remain as strings during data parsing                                                                  |

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
