# Chart Builder Admin — DataViews Gallery

A React-powered admin page that replaces the default WordPress post list table for `chart` posts. Lives at **Charts → Library (BETA)** in the WordPress admin sidebar.

---

## What it does

- Displays all chart posts (published and draft) in a searchable, filterable, sortable grid or table
- Lets editors filter by chart type and status, search by title or design slug, sort by date/modified
- Clicking a chart card opens its block editor
- Actions per chart: Edit, View, Duplicate, Move to Trash (supports bulk selection)
- **Add New Chart** modal — pick a chart type, preview saved block patterns, name and create the chart
- **Chart Wizard (AI)** — optional AI-assisted tab in the Add New modal: describe a chart in text, upload a reference image, and/or paste CSV data; the wizard generates a draft chart for review before creation

---

## File structure

```
includes/admin/
├── class-admin.php          # PHP: registers admin page, enqueues all required scripts/styles
├── webpack.config.js        # Points to the root platform webpack config (dependency extraction)
├── package.json             # Standalone sub-package (build scripts + non-WordPress deps)
├── src/
│   ├── index.js             # Entry point — calls registerCoreBlocks(), mounts React app
│   ├── chart-library.jsx    # Root layout (header + DataViews + DropZone)
│   ├── style.scss           # Admin page + modal styles
│   ├── components/
│   │   ├── index.js
│   │   ├── create-new-chart-modal.jsx  # "Add New Chart" modal — type picker + pattern picker + Chart Wizard tab
│   │   ├── ai-create-step.jsx          # Chart Wizard — text/image/CSV input, AI generation, preview, accept/regenerate
│   │   ├── csv-data-input.jsx          # Shared CSV paste/upload input used by the Chart Wizard
│   │   ├── dataviews.jsx               # DataViews wrapper (view state, data fetching, fields, actions)
│   │   └── dropzone.jsx                # CSV drop-to-create (stub — Phase 5)
│   ├── utils/
│   │   └── csv.js                      # CSV parsing utilities (used by csv-data-input)
└── build/                   # Compiled output — do not edit
```

---

## How it works end-to-end

### 1. PHP: registering the page and enqueuing assets

**`class-admin.php`** hooks into `admin_menu` and `admin_enqueue_scripts`.

It localizes `prcChartBuilderLibrary` onto the page:

```php
wp_localize_script( 'prc-chart-builder-library', 'prcChartBuilderLibrary', [
    'nonce'          => wp_create_nonce( 'wp_rest' ),
    'restUrl'        => esc_url_raw( rest_url() ),   // subsite-aware REST URL
    'chartTypeTerms' => $this->get_chart_type_terms(), // id, slug, label, count
] );
```

`restUrl` is localized from PHP rather than constructed in JS so it's correct on multisite — `apiFetch` defaults to the primary site's REST URL, not the current subsite.

### 2. Block Preview: loading block types on a plain admin page

The **"Add New Chart"** modal previews saved block patterns using `BlockPreview` from `@wordpress/block-editor`. This is the same component used by the Site Editor's Patterns screen, but it requires specific setup that doesn't exist on a plain admin page.

**The problem:** `parse()` from `@wordpress/blocks` returns empty arrays (or `core/missing` blocks) when the block types referenced in the markup aren't registered in the JS registry. The block editor and site editor call `registerCoreBlocks()` and load all block scripts during their boot sequence. A plain admin page does neither.

**The solution (three parts):**

#### Part A — `class-admin.php`: enqueue block scripts

```php
// Load wp-block-library so registerCoreBlocks() is available in JS.
// The script ships the function but does NOT auto-call it.
wp_enqueue_script( 'wp-block-library' );
wp_enqueue_style( 'wp-block-library' );
wp_enqueue_style( 'wp-edit-blocks' );

// Enqueue editor scripts + styles for every registered block type.
// This ensures custom blocks (prc-chart-builder/*, prc-block/*, etc.)
// register themselves in the JS block registry on script load.
$block_registry = WP_Block_Type_Registry::get_instance();
foreach ( $block_registry->get_all_registered() as $block_type ) {
    foreach ( $block_type->editor_script_handles as $handle ) {
        wp_enqueue_script( $handle );
    }
    foreach ( $block_type->style_handles as $handle ) {
        wp_enqueue_style( $handle );  // frontend styles (used inside BlockPreview's iframe)
    }
    foreach ( $block_type->editor_style_handles as $handle ) {
        wp_enqueue_style( $handle );
    }
}
```

Custom block scripts (e.g. `prc-chart-builder-controller-editor-script`) self-register their block type when they execute. Enqueuing them is sufficient — no extra JS call needed for custom blocks.

#### Part B — `src/index.js`: call `registerCoreBlocks()`

```js
import { registerCoreBlocks } from '@wordpress/block-library';

// wp-block-library loads registerCoreBlocks() but doesn't call it outside
// of editor contexts. We call it explicitly before React renders so that
// core blocks (paragraph, table, etc.) are in the JS registry.
registerCoreBlocks();
```

#### Part C — `create-new-chart-modal.jsx`: `BlockEditorProvider` + `BlockPreview`

The modal wraps its content in a single `BlockEditorProvider` (bootstraps the block-editor Redux store) and renders a `BlockPreview` per pattern, matching the architecture of the [Site Editor's Patterns page](https://github.com/WordPress/gutenberg/blob/trunk/packages/edit-site/src/components/page-patterns/index.js):

```jsx
// One provider wraps the entire modal — not one per preview card.
<BlockEditorProvider value={ [] } settings={ {} }>
    <Modal ...>
        ...
        <DataViews fields={ PATTERN_FIELDS } ... />
    </Modal>
</BlockEditorProvider>

// Per-pattern preview field
function PreviewField( { item } ) {
    const blocks = useMemo( () =>
        item.blocks ?? parse( item.content, { __unstableSkipMigrationLogs: true } ),
        [ item.content, item.blocks ]
    );
    if ( ! blocks?.length ) return <FallbackIcon />;
    return <BlockPreview blocks={ blocks } viewportWidth={ 1200 } />;
}
```

`viewportWidth={ 1200 }` matches what core uses. `BlockPreview` renders an iframe and applies `transform: scale()` automatically based on the actual rendered container width — no manual scaling needed. The only CSS required is `overflow: hidden` on the media cell to clip the scaled iframe.

### 3. Pattern data: fetching from REST API

Patterns are not loaded from PHP (timing issues — `wp_localize_script` fires before DB-stored patterns are in the registry). Instead they're fetched at runtime in React using the site-specific REST URL:

```js
const restUrl = window.prcChartBuilderLibrary.restUrl; // subsite-aware

Promise.all([
	fetch(`${restUrl}/wp/v2/blocks?per_page=100&context=edit`, { headers }),
	fetch(`${restUrl}/wp/v2/wp_pattern_category?per_page=100`, { headers }),
]);
```

`/wp/v2/blocks` returns `wp_block` posts (user-created patterns). `/wp/v2/wp_pattern_category` is needed to build a term ID → slug map for filtering — the `wp_block` REST response stores `wp_pattern_category` as an array of integer term IDs, not slugs. Patterns are filtered client-side to those matching `prc-chart-builder-{chartTypeSlug}` categories.

> **Why `context=edit`?** The blocks endpoint always exposes `content.raw` (per `WP_REST_Blocks_Controller`), but some other fields require edit context. Using `context=edit` ensures we always get the raw block markup needed by `parse()`.

### 4. Chart Wizard (AI-assisted creation)

The **Chart Wizard** tab appears in the Add New modal when `window.prcChartBuilderLibrary.aiEnabled` is `true` (set by `Chart_AI_Experiment::localize_experiment_data()`). It is an opt-in experiment — the tab is hidden for all users unless the flag is enabled server-side.

**Inputs (any combination):**

- **Reference image** — PNG/JPG drag-and-drop zone; the file is read as a base64 data-URL and sent to the AI endpoint
- **CSV data** — paste or upload a `.csv` file via `CsvDataInput`; parsed and sent as plain text
- **Text description** — free-text field describing the desired chart

**Flow:**

1. User fills one or more inputs and checks the acknowledgment checkbox ("I understand the risks…")
2. Clicking **Generate Chart** POSTs to `/prc-chart-builder/v1/ai/generate` with `{ chartType, description, csvData, image }`
3. The endpoint returns serialized block markup (`content`)
4. A live `BlockPreview` of the result is shown with **Accept & Continue** and **Regenerate** actions
5. Accepting calls `onAccept({ content })`, which feeds into the same chart creation pipeline as the pattern picker (serialize → POST to `/wp/v2/chart` → redirect to editor)

**Key files:**

- `ai-create-step.jsx` — the full Chart Wizard UI component
- `csv-data-input.jsx` — reusable CSV paste/upload input
- `utils/csv.js` — CSV parsing (used by `CsvDataInput`)
- PHP: `includes/class-chart-ai-experiment.php` — REST endpoint + `aiEnabled` flag

### 5. Chart type taxonomy filter

The `chart_type` taxonomy is registered with `show_in_rest: true`, so `/wp/v2/chart?chart_type=<id>` works natively. The JS always uses integer term IDs from `prcChartBuilderLibrary.chartTypeTerms` — slugs will not work with the REST filter.

---

## Building

From the repo root:

```bash
# One-off build
npm run build -w @prc/chart-builder

# Watch mode during development
npm run start -w @prc/chart-builder
```

The admin build is driven by the parent `@prc/chart-builder` package's scripts:

```json
"build": "... wp-scripts build --source-path=includes/admin/src/ --output-path=includes/admin/build/"
```

The `webpack.config.js` in this directory points to the root platform config, which uses the platform's custom `DependencyExtractionWebpackPlugin`. This ensures `@wordpress/*` imports are extracted as WordPress script handles and reflected correctly in `index.asset.php` — so WordPress enqueues them as dependencies rather than bundling them.

---

## Key dependencies

| Package                    | Why                                                                      |
| -------------------------- | ------------------------------------------------------------------------ |
| `@wordpress/block-editor`  | `BlockPreview`, `BlockEditorProvider` for pattern previews               |
| `@wordpress/block-library` | `registerCoreBlocks()` — must be called explicitly on non-editor pages   |
| `@wordpress/blocks`        | `parse()` — converts raw block markup to block objects for BlockPreview  |
| `@wordpress/dataviews`     | Grid/table UI for both the gallery and the pattern picker                |
| `@wordpress/api-fetch`     | Authenticated REST requests (nonce handled automatically)                |
| `@wordpress/components`    | `Modal`, `Button`, `CheckboxControl`, `Card`, etc.                       |
| Native `fetch`             | Chart Wizard AI endpoint calls (uses REST nonce via `X-WP-Nonce` header) |
