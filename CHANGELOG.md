# Changelog

All notable changes to the PRC Chart Builder plugin are documented in this file.

For detailed narrative release notes, see [`docs/plugins/prc-chart-builder/release-notes/`](../../docs/plugins/prc-chart-builder/release-notes/).

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.16.0] — October 2026

Narrative notes: [`docs/plugins/prc-chart-builder/release-notes/3_16_0.md`](../../docs/plugins/prc-chart-builder/release-notes/3_16_0.md). Tracking: [PRC-921](https://linear.app/pewresearch/issue/PRC-921/chart-builder-ux-improvements-cb-316).

### Added

- Desktop, Tablet, and Mobile buttons under the Style Chart preview. Layout and axis controls edit that viewport's values ([PRC-1123](https://linear.app/pewresearch/issue/PRC-1123/expose-viewport-values-to-chart-wizard)).
- "Enable public preview" and the share link in the Preview Chart step's Workflow panel ([PRC-1007](https://linear.app/pewresearch/issue/PRC-1007/display-enable-public-preview-in-step-4)).
- Low-contrast warnings in chart color pickers: 4.5:1 for text, 3:1 for lines and shapes. Backgrounds, fills, and data labels on marks do not warn ([PRC-930](https://linear.app/pewresearch/issue/PRC-930/warn-users-of-low-contrast-colors)).
- Bar stroke color picker and stroke width for stacked bar, diverging bar, and column small multiples charts.
- Wizard Line Stroke Width, tick units and tick unit position, and a Supplemental columns section in the Data tab.

### Changed

- Wizard steps are centered and show a hover and focus state; the Style Chart tab bar stays visible; narrow screens show one row of step numbers ([PRC-922](https://linear.app/pewresearch/issue/PRC-922/center-wizard-steps), [PRC-925](https://linear.app/pewresearch/issue/PRC-925/make-tabs-sticky-in-step-3), [PRC-926](https://linear.app/pewresearch/issue/PRC-926/emphasize-that-steps-are-clickable-in-wizard)).
- "Layout" is now "Chart layout" with matching labels ([PRC-1004](https://linear.app/pewresearch/issue/PRC-1004/standardize-setting-label-formats-under-layout)). Adding an annotation opens it and collapses the others ([PRC-924](https://linear.app/pewresearch/issue/PRC-924/collapse-prior-annotations-when-new-one-opens)).
- Panels show their toggle first and hide dependent settings while it is off; many panels drop the "Attributes" menu ([PRC-1005](https://linear.app/pewresearch/issue/PRC-1005/only-show-conditional-settings-if-toggle-is-active)).
- Wizard panels open one at a time; right rail panels keep their open state across selection, chart switches, and reloads ([PRC-1006](https://linear.app/pewresearch/issue/PRC-1006/collapse-previously-opened-dropdown-when-user-opens-a-new-dropdown), [PRC-923](https://linear.app/pewresearch/issue/PRC-923/remember-menu-selection-in-right-rail)).
- Palette swatches use theme color names, and chart settings save palette colors as `light-dark()` values. Import accepts hex and `light-dark()` swatches.
- The Plot Bands panel uses one collapsible row per band.
- Admin and editor screens use the design system's light and dark colors. Wizard styles load only in the editor; the public chart stylesheet is about 90% smaller.

### Fixed

- Color pickers named every light and dark theme color "UI White" ([PRC-1124](https://linear.app/pewresearch/issue/PRC-1124/color-pickers-show-the-wrong-swatch-name-for-light-dark-colors)).
- Custom picker colors (hex, rgb, hsl, hex with alpha) and colors from older hex palettes did not render on the chart.
- The default white bar stroke did not follow dark mode.
- Sankey charts broke when the first table column was chosen as a source, target, or value column.
- Diverging bar ghost bars take keyboard focus.

## [3.15.0] — October 2026

Narrative notes: [`docs/plugins/prc-chart-builder/release-notes/3_15_0.md`](../../docs/plugins/prc-chart-builder/release-notes/3_15_0.md). Tracking: [PRC-906](https://linear.app/pewresearch/issue/PRC-906/chart-builder-315-tracking).

### Added

- Series styles: fill, stroke, opacity, hatch pattern, nodes, and value labels stored per series name in `seriesStyles`, so a data reorder does not move colors ([PRC-869](https://linear.app/pewresearch/issue/PRC-869/replace-color-array-with-color-object-and-category-keys)).
- Hatch patterns on bars, areas, pie, waffle, sankey, treemap, maps, bubbles, and heat map cells, with matching legend swatches.
- "Color Bubbles By Group" for USA, county, CBSA, and world bubble maps.
- "Color each panel separately" for line, column, and bar small multiples (`smallMultiples.colorMode`, `smallMultiples.panelStyles`) ([PRC-871](https://linear.app/pewresearch/issue/PRC-871/allow-individual-plots-in-small-mutltiples-to-have-their-own-color)).
- Annotation copy and paste, and collapsible annotation lists ([PRC-956](https://linear.app/pewresearch/issue/PRC-956/annotation-copypaste-collapsible-inspector-controls)).
- Grouped color pickers (UI colors, then each palette), and every picker except the drawing stroke can be cleared.
- USA CBSA map in the chart wizard.
- Legend click-to-hide on published diverging bar and scatter charts (first shipped in PRC Platform 1.17.0).
- Rich text in chart labels: annotations, data labels, tick labels, legend items, the legend title, axis titles, and small multiples panel titles take bold, italic, underline, strikethrough, text color, and links ([PRC-891](https://linear.app/pewresearch/issue/PRC-891/add-rich-text-support-to-chart-labels)).
- Offset X and Offset Y fields in the tick label popover move one tick label (`customTickLabels[…].offsetX` / `offsetY`) ([PRC-823](https://linear.app/pewresearch/issue/PRC-823/add-xy-coordinate-fields-to-annotationtick-labelslegend)).

### Changed

- The wizard and the block sidebar share one color section: pick palettes, then set each series color.
- All seven maps and the heat map table build fills, hatch, labels, and legends from one shared value scale. Regions with a value of `0` take a scale color.
- Heat map cell values follow the Labels panel. The "Show cell values", "Grid Inset", and "Column Header Height" options are gone.
- Small multiples size from Panel Height for every panel type, and labels and custom tick labels save per panel ([PRC-915](https://linear.app/pewresearch/issue/PRC-915/edit-mini-multiple-labels-independently)).
- The wizard preview grows with the chart width and stacks into one page below 782px.
- Copy and paste styles carries `seriesStyles` and `smallMultiples.panelStyles` when the series match.

### Removed

- Color sorter, wizard swatch-picking step, Custom Colors field, Colors panel Stroke toggle, and category highlight controls. Saved values still render.

### Fixed

- Freeform charts keep the media upload handler, so image upload works inside the controller ([PRC-967](https://linear.app/pewresearch/issue/PRC-967/fix-broken-media-upload-for-freeform-charts)).
- The wizard shows the "Import from pewplots" link again.
- Screenshot exports capture a padded, full-height frame.
- Series colors stay on the right series after a legend reorder.
- `PRC_CHART_BUILDER_VERSION` now matches the plugin header (was `3.8.0`).

## [3.14.0] — August 2026

Narrative notes: [`docs/plugins/prc-chart-builder/release-notes/3_14_0.md`](../../docs/plugins/prc-chart-builder/release-notes/3_14_0.md). Tracking: [PRC-626](https://linear.app/pewresearch/issue/PRC-626/chart-builder-314-tracking).

### Added

- Guided Chart Creation wizard (Pattern → Data → Configure → Preview), gated behind a site-level rollout toggle ([PRC-527](https://linear.app/pewresearch/issue/PRC-527/chart-creation-ui), [PRC-684](https://linear.app/pewresearch/issue/PRC-684/chart-creation-ui-pass-2-ux-review)).
- Chart Library as the All Charts admin destination, with static PNG thumbnails and list/grid/table layouts.
- Site-level Chart Theme (`chart-theme.json`) with registry-bound import/export and scoped frontend delivery ([PRC-560](https://linear.app/pewresearch/issue/PRC-560/standardize-prc-legacy-theme-as-chart-themejson), [PRC-628](https://linear.app/pewresearch/issue/PRC-628/chart-theme-delivery-trim-inline-payload-scope-edge-purge-harden)).
- Small Multiples (BETA), Waffle, Beeswarm, and Heat Map Table chart types ([PRC-637](https://linear.app/pewresearch/issue/PRC-637/small-multiples-but-for-real), [PRC-52](https://linear.app/pewresearch/issue/PRC-52/enhancement-beeswarm-chart-type), [PRC-268](https://linear.app/pewresearch/issue/PRC-268/enhancement-heat-map-table)).
- Variable scatter / beeswarm node sizing from a numeric column ([PRC-433](https://linear.app/pewresearch/issue/PRC-433/add-variable-dot-sizing-to-scatter-plots)).
- Multi-palette color swatch picker in Style Chart ([PRC-710](https://linear.app/pewresearch/issue/PRC-710/chart-color-swatch-revamp)).
- RichText tooltip templates, unified tooltip mode, and `minDisplayValue` floors ([PRC-709](https://linear.app/pewresearch/issue/PRC-709/tooltip-formatting-field-revamp)).
- Detached-legend paragraph alignment ([PRC-485](https://linear.app/pewresearch/issue/PRC-485/add-paragraph-styling-options-for-detached-legends)).
- Nice-domain toggle, first/last line-label layout, first/last line nodes, and Power Table map-data validation ([PRC-541](https://linear.app/pewresearch/issue/PRC-541/option-to-toggle-off-nice-rounding-for-domains), [PRC-530](https://linear.app/pewresearch/issue/PRC-530/move-map-requirements-to-power-table-expand-column-name-catchers), [PRC-660](https://linear.app/pewresearch/issue/PRC-660/add-first-and-last-only-nodes-option-for-line-charts)).

### Changed

- Synced-chart usage tracking moves off the frontend render path onto the post-publish pipeline.
- `dependentAxis.nice` defaults to `true` so existing charts keep v1.12 tick rounding.
- `@prc/chart-builder` and `@prc/charting-library` declare MIT consistently.

### Fixed

- Mirrored `labelPositionDX` on negative diverging bars ([PRC-437](https://linear.app/pewresearch/issue/PRC-437)).
- Grouped bar, stacked, diverging, and exploded charts keep even bar thickness when a group has one item ([PRC-640](https://linear.app/pewresearch/issue/PRC-640/bar-height-is-shorter-for-single-item-groups-in-chart-builder)).
- Bar charts grow from zero when the dependent axis min is below zero, with a solid zero line when the domain crosses it ([PRC-553](https://linear.app/pewresearch/issue/PRC-553/bar-chart-negative-values-render-from-axis-minimum)).
- Floated synced charts no longer crop on mobile (`max-width: 100%`).
- Duplicate sibling Chart IDs prompt Regenerate / Keep.
- Node Fill "White" and net-value font tokens resolve through the shared color/font helpers.

---

## [3.8.1] - Late April 2026

## Added

- **Custom tooltip text** ([#2923](https://github.com/pewresearch/prc-platform/issues/2923)). TK more context

---

## [3.8.0] — April 2026

### Added

- **Table data validation & typed columns** (`#2565`) — the Power Table block now supports per-column data types (`number`, `date`, `currency`, `percentage`, `url`, `fips`, `iso3alpha`, `iso3numeric`, plus `auto`/`text`) with live per-cell validation, an inspector "Data validation" panel that surfaces error details, and a block-toolbar error-count button that jumps editors to the problem. Chart Builder registers five named validation schemas via the new `prc_table_validation_schemas` filter (`geo-state`, `geo-county`, `geo-country`, `geo-country-numeric`, `timeseries`) so a chart that requires FIPS codes, ISO-3 codes, or a date+number pairing can enforce it at the table level. Chart Builder's chart block reads the table's `isValid` flag and the active `validationSchema` and **refuses to sync invalid data into the chart**, showing an inline warning instead.
- **Multi-user editor presence & locking** — new `useDeclarePresence` and `usePresenceUsers` hooks (shipped from `@prc/hooks`) let chart authors see when other users are editing the same chart, and the controller disables block editing mode when a lock is detected. Per-panel presence tracking surfaces which inspector panel another user is focused on.
- **Error bars on dot plots** — per-point `ErrorBarPanel` in the ShapePanel popover with stroke color, width, opacity, and dasharray controls. A `useErrorBarCustomizations` hook manages state, and a new voronoi hit model on DotPlot improves label-trigger accuracy around error-bar whiskers.
- **Net value labels for bar charts** — new `NetValueLabels` component renders net totals on diverging bar charts (horizontal and vertical) with per-side color, font-size, and positioning controls in a dedicated `net-value-controls.jsx` inspector panel. Labels are dark-mode-aware via the standardized `getLabelFill` helper.
- **Chart/Data view toggle** — new `view-mode-controls.jsx` adds a block-toolbar "Switch to data/chart" button and an inspector "Show both" toggle. View state is held in a new controller Redux store keyed by controller id so chart, data, and controller stay in sync without attribute round-trips. Per-user editor preference only; does not affect the published view.
- **Synced chart auto-publish** — new `Synced_Chart_Auto_Publish` class hooks into `prc_platform_on_publish` and `prc_platform_on_update` to automatically publish any draft chart CPT posts referenced by a post's `synced-chart` blocks when that post is published or updated.
- **JSON-LD `isPartOf`** — `Dataset` schema now includes an `isPartOf` array listing every published post that references the chart CPT, surfacing the post→chart relationship to search engines.

### Changed

- **JSON-LD `Dataset.description`** prefers `alt_text` when present, falling back to the subtitle-based description for charts without alt text.
- **Synced chart reference panel** filters out post revisions so the list only shows live referencing posts.
- **Treemap** — sort, label, and category rendering refined; variation template updated. `data-controls.jsx` reorganized for treemap-specific controls.
- **Label fill resolution** consolidated — `resolveLabelFill` folded into a single `getLabelFill` helper used across every chart component for consistent dark-mode behavior.
- **Pie chart** refactored — `Pie.tsx` reduced from ~1280 to ~530 lines, consolidating rendering paths. No user-visible behavior change.
- **Chart block migration script** tweaked; label controls and contrast adjustments in the migration path.
- **Version constants aligned** — `PRC_CHART_BUILDER_VERSION` bumped from the stale `3.1.0` to `3.8.0` to match the plugin header.

### Removed

- **Editor-side canvas PNG generation** — `chart-png-panel.js` and the editor-side `createPNG` flow are gone. The server-side PNG pipeline introduced in 3.6.0 is now the sole path for chart images.

### Fixed

- Label controls rendering against the wrong contrast value in certain theme contexts.
- Synced chart reference panel showing post revisions alongside the canonical post.

---

## [3.7.0] — April 2026

### Added

- **PCH import pipeline** — one-way handoff from pewplots (R) to Chart Builder via `.pch.json` files. Upload a PCH file in the Chart Builder admin to create a fully configured draft chart post.
- **REST endpoint** `POST /prc-chart-builder/v1/import-pch` — validates, converts, and creates a chart post from a PCH payload. Returns `post_id` and `edit_url`.
- **Tidy-to-wide data pivot** — PCH stores data in R-native long/tidy format; the importer pivots it to the wide format expected by the Chart Builder table block and charting library.
- **Chart type mapping** — resolves PCH `chartType` + `orientation` to the correct Chart Builder variation type (e.g. `bar + vertical` → `column`; `stacked-bar + vertical` → `stacked-column`).
- **3-layer attribute merge** — PCH overrides apply on top of `block.json` defaults and chart-type variation templates, so type-specific defaults (sort order, axis tick labels, etc.) are preserved unless explicitly overridden by PCH.
- **PCH JSON Schema** at `includes/chart-handoff/src/schema.json` (schema ID `prc-chart-handoff/v1`).
- **JS converter** at `includes/chart-handoff/src/pch-to-chart-builder.js` with full unit-test coverage (`tests/integration/chart-handoff/`).
- **Test fixtures** for bar, column, stacked bar, diverging bar, line, area, dot-plot, and scatter chart types.
- **PCH technical reference** at `includes/chart-handoff/README.md`.

### Fixed

- **v1 block re-migration** — `deprecations/v1.js` `isEligible` now short-circuits immediately when `attributes._version === 'v2'`, preventing v2 blocks from being flagged as needing migration every time the editor opens.

---

## [3.6.0] — March 2026

### Added

- **Server-side PNG export** — charts are automatically screenshotted via ScreenshotOne, stored as WordPress media attachments, and served as static fallback images on the frontend.
- **Static fallback image** — renders `<img class="chart-fallback chart-fallback--png">` when a PNG is available; `<div class="chart-fallback chart-fallback--placeholder">` otherwise.
- **Synced chart (refId) PNG resolution** — fallback image and Download button correctly resolve PNG meta from the source chart post for synced chart instances.
- **WP-CLI backfill command** — `wp prc chart-builder backfill_pngs` for bulk PNG generation with dry-run support.

### Changed

- **Viewer toolbar layout** — Chart/Data tabs left-aligned; Download image and Share right-aligned.
- **Active tab display** — switched from `inline-block` to `block` to remove phantom line-box gap above toolbar.
- **Figure margin** — stripped browser default figure margin from `figure.wp-chart-builder`.
- **Subtitle/note spacing** — reduced `margin-bottom` / `margin-top` to `4px`.

### Fixed

- `backfill_pngs` processed 0 charts — subcommand name uses underscore, not hyphen; multisite requires `--url`.
- Export URL built from local permalink on alpha — `generate_png()` now accepts `$base_url` / `$export_url_override`.
- `$export_url` overwritten in CLI loop — renamed per-iteration display variable.
- Removed alpha-testing `qm/debug` action and success-path `error_log` calls from PNG generation.

---

## [3.5.0] — February – March 2026

### Added

- **Chart Library admin dashboard** — rebuilt on `@wordpress/dataviews` with a live block preview gallery, visual chart type picker, and drag-and-drop CSV import.
- **AI chart generation** — generate a fully configured chart from a natural-language prompt via OpenAI.
- **Click-to-style element popover** — click any chart element in the editor to open a targeted style panel for that element.
- **Sankey chart type** — flow/relationship diagrams.
- **Treemap chart type** — hierarchical data visualizations.
- **Dark mode** — supported across all standard chart types.
- **Scatter plot grouping and regression lines** — group scatter points by category; overlay linear or polynomial regression lines.
- **Map enhancements** — significant improvements to choropleth and symbol map rendering.
- **Axis, label, and annotation improvements** — comprehensive additions to axis configuration, data labels, and callout annotations.
- **Pattern-based chart creation** — new charts are seeded from variation templates rather than a blank slate.
- **WP-CLI tooling** — rewritten CLI commands for bulk operations and chart type backfills.
