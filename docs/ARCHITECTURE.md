# Chart Builder Architecture & State Management

*Last Updated: April 2026 · Version 3.8.0*

---

## System Overview

PRC Chart Builder is composed of three tiers that work together:

```
┌─────────────────────────────────────────────┐
│           Admin (Chart Library)             │  wp-admin/edit.php?post_type=chart
│  DataViews gallery · Create modal · AI gen  │
└─────────────────────┬───────────────────────┘
                      │ creates / edits
┌─────────────────────▼───────────────────────┐
│         Block Editor (Chart CPT post)       │  Gutenberg
│  Controller block · Chart block · Popover   │
└─────────────────────┬───────────────────────┘
                      │ renders via
┌─────────────────────▼───────────────────────┐
│        Charting Library + Utilities         │  prc-charting-library / @prc/charting-utilities
│  @visx components · D3 helpers              │
└─────────────────────────────────────────────┘
```

---

## Tier 1: Admin (Chart Library)

Introduced in 3.5.0 (issue #1400). Lives in `includes/admin/`.

### Responsibilities

- Lists and manages all `chart` CPT posts via `@wordpress/dataviews`
- Provides the "Create New Chart" modal with three entry paths: blank template, pattern picker, and AI generation
- Handles CSV drag-and-drop to bootstrap new chart posts from data

### Key components


| Component             | File                                        | Role                                                              |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| `ChartLibrary`        | `src/chart-library.jsx`                     | Page root; composes DataViews + modal + dropzone                  |
| `DataViews`           | `src/components/dataviews.jsx`              | Filterable/searchable chart grid with live block previews         |
| `CreateNewChartModal` | `src/components/create-new-chart-modal.jsx` | Multi-step creation flow; chart type picker → template/pattern/AI |
| `AICreateStep`        | `src/components/ai-create-step.jsx`         | AI generation panel (text + image + CSV → block markup)           |
| `DropZone`            | `src/components/dropzone.jsx`               | Page-level CSV drop target                                        |


### AI generation flow

```
User input (text description + optional PNG + optional CSV)
  ↓
REST request to AI experiment endpoint (Claude Sonnet by default)
  ↓
Block markup string returned
  ↓
parse_blocks() → BlockPreview rendered live
  ↓
Accept → post created with that markup | Regenerate → retry
```

The AI feature is gated by `window.prcChartBuilderLibrary.aiEnabled`, set server-side by `Chart_AI_Experiment`. It is off by default.

---

## Tier 2: Block Editor

### Block structure

```
prc-chart-builder/controller   (outer, provides context + data table)
  └── prc-chart-builder/chart  (inner, holds all chart config in attributes)
  └── core/table               (optional, canonical data source)
```

`prc-chart-builder/synced-chart` is a reference block used when embedding a chart CPT post into an article. It holds a `ref` (post ID) and delegates rendering to the chart CPT's controller block.

**Visibility of the referenced chart:** Anonymous visitors only see charts whose CPT post is `publish`. Logged-in users and preview requests may also see `draft`, `future` (scheduled), and `private` charts, so embedded synced charts can resolve before a chart’s publish date. Password-protected chart posts never render for anonymous users.

### Data flow

```
core/table (source of truth for data)
  ↓ formatCellContent()
io.chartData (derived, stored in chart block attributes)
  ↓
prc-charting-library components (render)
  ↓
SVG output
```

Chart configuration (axes, colors, labels, layout, etc.) is stored entirely in the `chart` block attribute object on `prc-chart-builder/chart`. See `README.md` at the plugin root for the full attribute reference.

### Element-level customizations

As of 3.5.0, per-element style overrides (label colors, shape fills, line styles, etc.) are stored in **separate top-level block attributes** using a `{x}::{category}` key format:

```json
{
	"labels": {
		"customLabels": { "2020::Democrats": "52%" },
		"customVisibility": { "2020::Democrats": false },
		"customStyles": {
			"2020::Democrats": { "color": "#ff0000", "fontWeight": "bold" }
		},
		"customPositions": { "2020::Democrats": { "dx": 10, "dy": -5 } }
	},
	"shapes": {
		"customStyles": {
			"2020::Democrats": { "fill": "#ff0000", "opacity": 0.8 }
		},
		"segmentStyles": {
			"2020::2024::Democrats": {
				"stroke": "#ff0000",
				"strokeDasharray": "5,5"
			}
		}
	}
}
```

**Key normalization:** Date values are always converted to ISO strings before key generation to ensure consistency between the editor (where dates are JS `Date` objects) and the frontend (where they are ISO strings from JSON serialization).

This approach was explicitly considered and deferred in the v1.3.12 architecture document as "Option 2: Separate Attribute with Key-Based Lookup." It was ultimately adopted over the `__labelPositions`-in-chartData approach because:

- Customizations survive all data changes (not just x-value-matching ones)
- Clean separation of concerns — data and presentation are distinct
- The orphaned-key concern is manageable at the scale of typical chart data

### Element popover system

The popover system (`src/chart/edit/popover/`) is the primary editing paradigm for per-element customization.

```
User clicks element in chart canvas
  ↓
wpEditorFunctions.{type}.onClick() fires
  ↓
handleElementClick() in edit/index.jsx
  ↓
setSelectedElement({ elementType, dataPoint, ... })
  ↓
ChartElementPopover renders appropriate panel (Label / Shape / LineSegment / TickLabel / ...)
  ↓
User makes changes → hook.handleStyleChange() updates local state
  ↓
onUpdate() → setAttributes() → chart re-renders
```

**Viewport awareness:** All customizations respect the current device preview context (Desktop / Tablet / Mobile) via `useViewportAttributes`. The same element can carry different overrides per viewport.

### State management

The block editor tier uses only WordPress-native patterns:


| Need                                                         | Solution                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------- |
| Persisting chart config                                      | Block attributes on `prc-chart-builder/chart`                 |
| Persisting per-element overrides                             | Separate top-level block attributes (key-based)               |
| Parent → child communication                                 | Block Context via `ChartContext.Provider` in the controller   |
| Editor-only UI state (popover open/closed, selected element) | `src/chart/edit/store.js` — a local `@wordpress/data` store   |
| Frontend runtime state                                       | WordPress Interactivity API (for freeform/interactive charts) |
| Real-time collaboration                                      | Automatic — Gutenberg syncs block attributes natively         |


No external Redux or React state management libraries are used.

### PNG generation pipeline

As of 3.6.0, PNGs are generated **server-side** via the ScreenshotOne API. When a chart post is saved (or a WP-CLI backfill is run), an Action Scheduler job calls `PNG_Export::generate_png()`, which screenshots the chart's public URL, sideloads the result into the media library as the chart post's featured image, and writes the URL/attachment ID/attributes hash to post meta (`_chart_png_url`, `_chart_png_attachment_id`, `_chart_attributes_hash`).

### Export filenames and downloads

User-facing downloads use a shared sanitization rule: **chart metadata title** (from `metadata.title` on the chart block) is normalized to a filename stem—lowercase, spaces → underscores, punctuation stripped, Unicode letters and digits kept—via `sanitizeChartExportFilename()` in `src/chart/utils/sanitize-chart-export-filename.js`. Empty or invalid input falls back to `chart`.


| Surface                                                               | Filename pattern                           | Notes                                                                                                                                          |
| --------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Server PNG sideload (`PNG_Export` in `includes/class-png-export.php`) | `{stem}-{post_id}-{time}.png`              | ScreenshotOne API → media library on post save / WP-CLI backfill. `stem` from `metadata.title` or `post_title` as fallback.                            |
| Context-menu PNG download (`view.js`)                                 | `{stem}.png`                               | Uses pre-generated `pngUrl` (featured image); name is cosmetic                                                                                 |
| CSV download (`downloadData` in `view.js`)                            | `{stem}_data_{postPubDate}.csv`            | `postPubDate` from controller context                                                                                                          |
| Featured-image download                                               | `{stem}.png`                               |                                                                                                                                                |
| SVG download                                                          | `chart-{id}.svg` or `chart-{clientId}.svg` | Not title-based                                                                                                                                |


**Social share URLs:** The Interactivity API context exposes both `postUrl` (the page where the chart is embedded) and `chartPostUrl` (the chart CPT permalink when different). Share actions (`shareTwitter`, `shareBluesky`, `shareFacebook`) use `chartPostUrl || postUrl` so links point at the chart post when the controller is synced into an article.

---

## Tier 3: Charting Library & Utilities

### prc-charting-library

React component library built on `@visx` and D3 that renders SVG charts. Consumed by `prc-chart-builder/chart` at render time (both in the editor and on the frontend via `view.js`).

Chart types available as of 3.5.0:


| Type                                         | Notes                                                                |
| -------------------------------------------- | -------------------------------------------------------------------- |
| Bar (vertical, horizontal, stacked, grouped) |                                                                      |
| Diverging Bar                                |                                                                      |
| Line                                         |                                                                      |
| Scatter                                      | Supports grouping and regression lines (3.5.0)                       |
| Dot Plot                                     |                                                                      |
| Pie                                          |                                                                      |
| Stacked Area                                 |                                                                      |
| US Block Map                                 | Responsive scaling fixed in 3.5.0                                    |
| US County Map                                |                                                                      |
| World Map                                    | Missing territories (Somaliland, Western Sahara etc.) added in 3.5.0 |
| Sankey                                       | New in 3.5.0                                                         |
| Treemap                                      | New in 3.5.0                                                         |
| Radar                                        | Work in progress; not yet in type picker                             |


### @prc/charting-utilities

Shared utilities consumed by both `prc-charting-library` and `prc-chart-builder`. Includes:

- `chart-types.js` — centralized chart type constants (introduced 3.5.0; import from here, not locally)
- Color resolution (`getColor`) — returns `light-dark(value, value)` CSS strings for dark mode support
- Data formatting helpers (`formatNum`, `formatCellContent`)
- Regression line calculation utilities

---

## Dark Mode

As of 3.5.0, charts respond automatically to the OS/browser dark mode preference via CSS `light-dark()`.

**How it works:** `getColor()` in charting-utilities checks if a resolved color is a plain hex. If so, it looks up that hex in `theme.json`'s color palette and returns the full `light-dark(light-value, dark-value)` string. No editor action is required.

**Exception:** Linear (continuous gradient) map color scales do not participate in dark mode. Gradient interpolation doesn't translate cleanly to the light-dark swap approach.

---

## PHP Rendering (Server Side)

- `class-chart.php` — registers the `prc-chart-builder/chart` block, handles render callback for freeform/static chart variants
- `class-controller.php` — registers `prc-chart-builder/controller`, manages the synced chart relationship and data resolution
- `class-markdown-for-agents-integration.php` — registers markdown callbacks with `prc-markdown-for-agents` so charts render as structured Markdown tables (title + data table + metadata) rather than SVG/HTML when processed by AI agent workflows

---

## Decision Matrix

### Use block attributes when:

- Data needs to persist with the post
- Standard chart config (axes, colors, layout, metadata)
- Per-element style overrides (key-based, separate from data)

### Use Block Context when:

- Parent → child communication within the controller/chart relationship
- Passing callbacks or functions to inner blocks

### Use the local `@wordpress/data` store (`edit/store.js`) when:

- Editor-only ephemeral UI state (which element is selected, popover position)
- State that should not persist across saves

### Use the Interactivity API when:

- Frontend-only runtime interactions (hover, scroll, click on published charts)
- Lightweight state that doesn't need to persist

### Do not use:

- External Redux or global React state — WordPress-native patterns cover all current needs
- `__labelPositions` inside `chartData` — superseded by the key-based attribute approach in 3.5.0

---

## Related Documentation

- [README.md](../README.md) — full block attribute reference
- [docs/VIEWPORT_ATTRIBUTES.md](VIEWPORT_ATTRIBUTES.md) — viewport-aware attribute system
- [docs/VIEWPORT_USAGE_GUIDE.md](VIEWPORT_USAGE_GUIDE.md) — practical guide to responsive customizations
- [docs/release-notes/3_5_0.md](release-notes/3_5_0.md) — 3.5.0 release notes
- [src/chart/edit/popover/panels/README.md](../src/chart/edit/popover/panels/README.md) — element popover system internals
- [WordPress Data Package](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/)
- [WordPress Interactivity API](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/)

