# Chart AI Experiment

An opt-in AI experiment for PRC Chart Builder that uses Claude to generate fully
configured WordPress block markup from a text description, CSV data, and/or a
reference image. When enabled, a **"Chart Wizard (Experimental)"** tab appears
inside the _Add New Chart_ modal in the Chart Library admin.

---

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
- [Architecture](#architecture)
- [Data Flow](#data-flow)
- [PHP API](#php-api)
    - [ChartAIExperiment](#chart_ai_experiment)
    - [ChartAIAbility](#chart_ai_ability)
- [REST Endpoint](#rest-endpoint)
- [Abilities API Registration](#abilities-api-registration)
- [AI Prompt Design](#ai-prompt-design)
- [Block Serialization](#block-serialization)
- [React UI (AICreateStep)](#react-ui-aicreate-step)
- [Enabling the Experiment](#enabling-the-experiment)
- [Supported Chart Types](#supported-chart-types)
- [Common Use Cases & Examples](#common-use-cases--examples)
- [Design Decisions](#design-decisions)
- [Common Pitfalls](#common-pitfalls)

---

## Overview

The AI experiment wires together three layers:

1. **WordPress AI Experiments plugin** — gates the feature behind a toggleable
   experiment flag so it can be enabled/disabled site-wide without a code deploy.
2. **PHP backend** — receives user inputs, calls the Claude API via `AiClient`,
   parses the JSON response, and serializes ready-to-insert WordPress block markup.
3. **React frontend** — an `AICreateStep` component embedded in the Chart Library
   admin modal that collects inputs, calls the REST endpoint, previews the result
   with `BlockPreview`, and forwards accepted markup to the chart creation workflow.

---

## Key Concepts

| Term                   | Meaning                                                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Experiment**         | A feature flag managed by the WordPress AI Experiments plugin. Code runs only when the experiment is enabled by a site admin.                                                                 |
| **Ability**            | A named, schema-validated capability registered with the WordPress Abilities API (`wp_register_ability`). Abilities can be consumed by blocks in the editor via the Abilities API JS client.  |
| **AiClient**           | The platform's AI client abstraction (`WordPress\AiClient\AiClient`) — wraps Claude API calls and handles model selection, JSON mode, and file attachments.                                   |
| **Block markup**       | Serialized WordPress block comment syntax (`<!-- wp:block-name {...} /-->`) that is stored directly in `post_content`.                                                                        |
| **Three-layer merge**  | The attribute merging strategy: `block.json defaults → variation template → AI overrides`. Ensures every generated chart is properly configured for its type even when the AI omits settings. |
| **Variation template** | A PHP array (mirroring the JS `variation-templates/*.js` files) of opinionated defaults for each chart type — widths, orientations, axis config, sort orders, etc.                            |

---

## Architecture

```
includes/ai-experiment/
├── class-chart-ai-experiment.php   # Extends Abstract_Experiment; registers hooks
└── class-chart-ai-ability.php      # REST endpoint + Abilities API + generation logic
```

The experiment integrates with two adjacent areas:

```
plugins/prc-chart-builder/
├── includes/
│   ├── ai-experiment/          ← this directory
│   └── admin/src/components/
│       └── ai-create-step.jsx  ← React UI (Step 2b of the Add New Chart modal)
```

---

## Data Flow

```
User (modal)
  │  description + CSV text + reference image (PNG/JPG) + model choice
  ▼
AICreateStep (React)
  │  POST /prc-chart-builder/v1/ai/generate
  ▼
Chart_AI_Ability::handle_rest_request()
  │  validates & extracts params
  ▼
Chart_AI_Ability::generate_chart()
  │  builds system instructions (get_system_instructions)
  │  builds user prompt        (build_user_prompt)
  │  optionally attaches image (withFile)
  ▼
AiClient → Claude (claude-sonnet-4-5 default)
  │  returns raw JSON string
  ▼
  JSON parse → { tableData, chartAttributes }
  ▼
Chart_AI_Ability::serialize_chart_blocks()
  │  three-layer attribute merge
  │  derives io.chartData / io.availableCategories from table rows
  │  sanitizes annotations (strips runtime-only callback keys, clamps x/y)
  │  maps AI colors → io.customColors
  │  serializes prc-block/table, prc-chart-builder/chart, prc-chart-builder/controller
  ▼
{ content: "<block markup string>", error: "" }
  ▼
AICreateStep — BlockPreview
  │  user clicks "Accept & Continue"
  ▼
create-new-chart-modal.jsx — chart creation workflow (POST /wp/v2/chart)
```

---

## PHP API

### `Chart_AI_Experiment`

**File:** `class-chart-ai-experiment.php`
**Extends:** `WordPress\AI\Abstracts\Abstract_Experiment`

Registers the `chart-ai-create` experiment. All hooks inside `register()` run
only when the experiment is enabled.

#### `load_experiment_metadata(): array`

Returns the experiment's metadata for the Experiments admin UI.

```php
[
    'id'          => 'chart-ai-create',
    'label'       => 'Chart AI Create',
    'description' => 'Uses Claude to generate chart block markup ...',
]
```

#### `register(): void`

Called automatically by `Abstract_Experiment` when the experiment is enabled.
Wires up three hooks:

| Hook                    | Priority | What it does                                             |
| ----------------------- | -------- | -------------------------------------------------------- |
| `wp_abilities_api_init` | default  | Registers the `prc-chart-builder/generate` ability       |
| `rest_api_init`         | default  | Registers `POST /prc-chart-builder/v1/ai/generate`       |
| `admin_enqueue_scripts` | 20       | Appends `aiEnabled = true` to the gallery script globals |

#### `localize_experiment_data(): void`

Injects a small inline script **before** the `prc-chart-builder-library` handle
so that the React modal can branch on `window.prcChartBuilderLibrary.aiEnabled`.
Runs only on the `prc-chart-builder-library` admin page.

```js
// Injected script:
window.prcChartBuilderLibrary = window.prcChartBuilderLibrary || {};
window.prcChartBuilderLibrary.aiEnabled = true;
```

> **Why `wp_add_inline_script` instead of a second `wp_localize_script` call?** > `wp_localize_script` with the same object name overwrites the previous
> localization in some WP versions. `wp_add_inline_script(..., 'before')` safely
> appends to whatever the main admin enqueue set up.

---

### `Chart_AI_Ability`

**File:** `class-chart-ai-ability.php`

Handles ability registration, REST routing, AI orchestration, and block
serialization.

#### Constants

| Constant           | Value                          | Purpose                             |
| ------------------ | ------------------------------ | ----------------------------------- |
| `$ability_name`    | `prc-chart-builder/generate`   | Ability identifier (static, public) |
| `REST_NAMESPACE`   | `prc-chart-builder/v1`         | REST API namespace                  |
| `REST_ROUTE`       | `/ai/generate`                 | REST route path                     |
| `CONTROLLER_BLOCK` | `prc-chart-builder/controller` | Outer container block name          |
| `CHART_BLOCK`      | `prc-chart-builder/chart`      | Chart configuration block name      |
| `TABLE_BLOCK`      | `prc-block/table`              | Data table block name               |
| `PRC_COLORS`       | `['#456A83', ...]`             | Default PRC brand palette           |
| `ALLOWED_MODELS`   | `['claude-haiku-4-5', ...]`    | Allowlist for model selection       |

#### `register_ability(): void`

Registers the ability with the WordPress Abilities API. The ability exposes its
`execute_callback` so it can also be called from within the block editor by
future block integrations.

**Input schema** (`input_schema`):

| Field         | Type            | Required | Description                                      |
| ------------- | --------------- | -------- | ------------------------------------------------ |
| `chartType`   | `string`        | Yes      | Chart type slug (e.g. `bar`, `line`, `pie`)      |
| `description` | `string`        | No       | Free-text description of the chart               |
| `image`       | `string`        | No       | Base64-encoded PNG or JPEG                       |
| `csvData`     | `string`        | No       | Raw CSV text                                     |
| `model`       | `string` (enum) | No       | Claude model ID; defaults to `claude-sonnet-4-5` |

**Output schema** (`output_schema`):

| Field     | Type     | Description                       |
| --------- | -------- | --------------------------------- |
| `content` | `string` | Serialized WordPress block markup |
| `error`   | `string` | Error message (empty on success)  |

**Permission:** `current_user_can('edit_posts')`

#### `register_rest_route(): void`

Registers `POST /wp-json/prc-chart-builder/v1/ai/generate`. Accepts the same
parameters as the ability input schema. Uses the same `edit_posts` capability
gate.

A dedicated REST endpoint is used (rather than calling the Abilities API from
JS) because the chart gallery admin is not inside the block editor context and
does not have access to the `@wordpress/abilities` JS client.

#### `handle_rest_request(WP_REST_Request $request): WP_REST_Response`

Extracts validated/sanitized params from the request, delegates to
`generate_chart()`, and wraps the result in a `WP_REST_Response`. Always returns
HTTP 200; errors are surfaced in the `error` key of the response body.

#### `generate_chart(array $input): array`

The central orchestration method. Called by both the REST handler and directly
as the Abilities API `execute_callback`.

**Parameters:**

| Key           | Type     | Description                                    |
| ------------- | -------- | ---------------------------------------------- |
| `chartType`   | `string` | Chart type slug                                |
| `description` | `string` | User description                               |
| `image`       | `string` | Base64 image (with or without data-URL prefix) |
| `csvData`     | `string` | Raw CSV                                        |
| `model`       | `string` | Claude model ID                                |

**Returns:** `array{ content: string, error: string }`

**Validation guards:**

- `chartType` must be non-empty.
- At least one of `description`, `image`, or `csvData` must be provided.
- `model` is validated against `ALLOWED_MODELS`; falls back to `claude-sonnet-4-5`.

**Image handling:** The data-URL prefix (`data:image/png;base64,`) is stripped
before passing the raw base64 payload to `AiClient::withFile()`. The MIME type
is parsed from the prefix (defaults to `image/png` if absent).

---

## REST Endpoint

```
POST /wp-json/prc-chart-builder/v1/ai/generate
```

**Request headers:**

```
Content-Type: application/json
X-WP-Nonce: <wp_rest nonce>
```

**Request body:**

```json
{
	"chartType": "bar",
	"description": "Monthly active users by region, Q1–Q4 2024",
	"csvData": "region,Q1,Q2,Q3,Q4\nNorth,120,145,160,175\nSouth,90,95,110,130",
	"image": "",
	"model": "claude-sonnet-4-5"
}
```

**Success response (200):**

```json
{
	"content": "<!-- wp:prc-chart-builder/controller {\"chartType\":\"bar\"} -->\n<!-- wp:prc-block/table {...} -->\n<figure>...</figure>\n<!-- /wp:prc-block/table -->\n\n<!-- wp:prc-chart-builder/chart {...} /-->\n<!-- /wp:prc-chart-builder/controller -->",
	"error": ""
}
```

**Error response (200 with error key):**

```json
{
	"content": "",
	"error": "AI generation failed: ..."
}
```

> **Note:** The endpoint always returns HTTP 200. Callers must check for a
> non-empty `error` key to detect failures.

---

## Abilities API Registration

The ability `prc-chart-builder/generate` is registered with `wp_register_ability()`
and is available for inspection at:

```
GET /wp-json/wp-abilities/v1/abilities/prc-chart-builder/generate
```

Relevant metadata:

```json
{
	"annotations": {
		"instructions": "Generates WordPress block markup for PRC Chart Builder blocks from a description, CSV data, and/or a chart image.",
		"readonly": false,
		"destructive": false,
		"idempotent": false
	},
	"show_in_rest": true
}
```

---

## AI Prompt Design

### System instructions (`get_system_instructions`)

The system prompt is dynamically constructed per request with the selected
`$chart_type` interpolated at two points:

1. **Chart Type section** — tells the model which chart type it is producing.
2. **Type-Specific Guidance section** — injects the output of
   `get_type_specific_guidance()` (a per-type one-liner covering orientation,
   axis config, and data shape requirements).

The system prompt enforces:

- **Output format:** Raw JSON only — no markdown, no code fences.
- **Schema:** Exactly two top-level keys: `tableData` and `chartAttributes`.
- **Column naming:** Keep original CSV header names; do not rename to `x`/`y`.
- **Colors:** Return a full palette of 4–6 hex colors when a scheme is requested;
  omit the `colors` key entirely when no scheme is asked for.
- **Annotations:** Only include when non-data text is present (callouts, trend
  markers, etc.). Coordinates are 0.0–1.0 fractions of the chart bounding box.
- **PRC design conventions:** Font family, standard widths, brand palette.

### User prompt (`build_user_prompt`)

Assembled from the user's inputs:

````
Generate a Bar chart (bar) configuration.

User description: Monthly active users by region

CSV data:
```csv
region,Q1,Q2,Q3,Q4
...
````

Parse this CSV into the tableData format. The first row is the header.

Return ONLY the JSON object as specified in your system instructions.

```

If no CSV is provided, the model is instructed to generate 5–8 realistic sample
data points. The CSV is capped at 101 lines before being sent to avoid token
waste on very large datasets.

---

## Block Serialization

`serialize_chart_blocks()` converts the AI's JSON response into WordPress block
markup. It runs in nine logical steps:

| Step | What happens |
|---|---|
| 1 | Build the `<figure><table>...</table></figure>` inner HTML for `prc-block/table` |
| 2 | Set static table block attributes (`isScrollOnPc`, `sticky`, `className`, etc.) |
| 3 | Derive `io.chartData` (array of `{x, col1, col2, ...}` objects) and `io.availableCategories` from the table rows |
| 4 | Three-layer merge: `block.json defaults → variation template → AI overrides` |
| 5 | Force-set required runtime fields: `_version`, `layout.type`, `metadata.title`, `io.chartData`, `io.availableCategories`, `io.independentVariable`, `dataRender.categories` |
| 6 | Sanitize annotations: strip `onDrag*` callbacks, assign stable IDs, clamp `x`/`y` to 0–1, set `active: true` |
| 7 | *(reserved)* |
| 8 | Map AI `colors` array → `io.customColors`; remove top-level `colors` key |
| 9 | Lock the chart block (`lock.move = true`, `lock.remove = true`); serialize all three blocks |

### Attribute merge strategy

```

block.json defaults
↓ deep_merge
variation template (get_variation_template_defaults)
↓ deep_merge
AI-provided chartAttributes
↓ force-override
runtime-derived fields (chartData, categories, independentVariable)

````

`deep_merge()` merges associative arrays recursively. Lists and scalars in the
source **replace** (not extend) their counterparts in the target. This matches
the behavior of the JavaScript `mergeWithDefaults()` helper used in the block
editor variation templates.

### `serialize_block`

```php
private function serialize_block(
    string $block_name,
    array  $attributes,
    string $inner_html = ''
): string
````

Produces standard WordPress block comment markup:

```
<!-- wp:block-name {"attr":"value"} /-->
```

or, for blocks with inner content:

```
<!-- wp:block-name {"attr":"value"} -->
<inner content>
<!-- /wp:block-name -->
```

### `get_chart_block_defaults`

Reads `block.json` from `build/chart/` (falls back to `src/chart/` for local
development) and extracts all attribute `default` values. This is the PHP
equivalent of the JS `mergeWithDefaults()` helper and ensures the serialized
attributes are always complete.

---

## React UI (AICreateStep)

**File:** `includes/admin/src/components/ai-create-step.jsx`

Step 2b of the _Add New Chart_ modal. Mounted only when
`window.prcChartBuilderLibrary.aiEnabled === true`.

### Props

| Prop        | Type                                             | Description                                        |
| ----------- | ------------------------------------------------ | -------------------------------------------------- |
| `chartType` | `{ slug: string, label: string }`                | The chart type selected in step 1                  |
| `onBack`    | `() => void`                                     | Navigates back to the tab bar                      |
| `onAccept`  | `({ content: string, csvText: string }) => void` | Called when the user accepts the generated preview |

### State

| State               | Initial               | Description                                                       |
| ------------------- | --------------------- | ----------------------------------------------------------------- |
| `description`       | `''`                  | User's text description                                           |
| `imageFile`         | `null`                | Uploaded `File` object                                            |
| `csvText`           | `''`                  | Pasted or uploaded CSV text                                       |
| `model`             | `'claude-sonnet-4-5'` | Selected Claude model                                             |
| `acknowledgedRisks` | `false`               | Risk acknowledgment gate (must be checked to enable Generate)     |
| `isGenerating`      | `false`               | Loading state during API call                                     |
| `error`             | `null`                | Error message to display                                          |
| `generatedContent`  | `null`                | `{ content, csvText }` on success; switches view to preview state |

### Key behaviors

- `**canGenerate`\*\* — the Generate button is disabled unless at least one of
  `description`, `imageFile`, or `csvText` is non-empty AND `acknowledgedRisks`
  is `true`.
- **Image upload** — `ImageDropZone` supports drag-and-drop and click-to-browse.
  The `File` object is converted to a base64 data-URL via `readFileAsBase64()`
  immediately before the fetch, not in state.
- **Preview state** — after a successful generation, `AIPreview` renders a
  `BlockPreview` of the parsed block markup. The user can Accept, Regenerate
  (re-uses the same inputs), or go back to edit inputs.
- **Error recovery** — errors are displayed as dismissible `Notice` components.
  On Regenerate after a failure, the error is cleared before the next attempt.

### Sub-components

`**ImageDropZone`\*\* — drag-and-drop image upload with ARIA roles and keyboard
support (`Enter`/`Space` to open the file picker).

`**AIPreview**` — shows the `BlockPreview` in a frame, Accept & Continue, and
Regenerate actions. During regeneration, a `Spinner` replaces the rotate icon
and the button is disabled.

---

## Enabling the Experiment

1. Go to **Dashboard → AI Experiments** (requires the WordPress AI Experiments
   plugin to be active and configured).
2. Find **Chart AI Create** and toggle it on.
3. Navigate to **Charts → Library** — the _Add New Chart_ modal will now show a
   **Chart Wizard (Experimental)** tab.

To disable, toggle the experiment off. No database cleanup is required.

---

## Supported Chart Types

The experiment supports all chart types known to the Chart Builder. Each has a
dedicated variation template and type-specific prompt guidance:

| Slug             | Label          | Notes                                                      |
| ---------------- | -------------- | ---------------------------------------------------------- |
| `bar`            | Bar            | Horizontal, descending sort, height = 40 × row count       |
| `column`         | Column         | Vertical, tick abbreviation on Y-axis                      |
| `line`           | Line           | Time scale on X; multiple series get a legend              |
| `area`           | Area           | Like line with `showArea: true`                            |
| `stacked-bar`    | Stacked Bar    | Horizontal stacking                                        |
| `stacked-column` | Stacked Column | Vertical stacking                                          |
| `stacked-area`   | Stacked Area   | Ascending sort                                             |
| `pie`            | Pie            | Two columns: label and value; `innerRadius` controls donut |
| `scatter`        | Scatter        | Numeric X and Y columns                                    |
| `dot-plot`       | Dot Plot       | Comparison of two value columns                            |
| `diverging-bar`  | Diverging Bar  | Positive and negative value columns required               |
| `exploded-bar`   | Exploded Bar   | 100% comparison                                            |
| `treemap`        | Treemap        | Label and value columns                                    |
| `sankey`         | Sankey         | Columns **must** be `source`, `target`, `value`            |
| `freeform`       | Freeform       | Falls back to bar layout defaults                          |
| map types        | Map            | Generic fallback template (640×400)                        |

---

## Common Use Cases & Examples

### Generate from CSV only

```json
{
	"chartType": "line",
	"csvData": "year,approval\n2020,52\n2021,49\n2022,45\n2023,51\n2024,48",
	"model": "claude-haiku-4-5"
}
```

The model parses the CSV, generates realistic metadata, and returns a fully
configured line chart with a time-scale X-axis.

### Recreate a chart from an image

```json
{
	"chartType": "bar",
	"image": "data:image/png;base64,iVBOR...",
	"description": "Match the color scheme from the image"
}
```

The model uses vision to extract data values, labels, and layout details from
the image, then recreates the chart as editable block markup.

### Generate sample data for a new chart type

```json
{
	"chartType": "sankey",
	"description": "Energy flow from sources to end users"
}
```

Because no CSV is provided, the model generates 5–8 realistic data points with
`source`, `target`, and `value` columns appropriate for a Sankey diagram.

### Custom color scheme

```json
{
	"chartType": "pie",
	"csvData": "category,value\nPolicy,35\nEconomy,28\nHealth,22\nClimate,15",
	"description": "Use a warm color scheme"
}
```

The model returns a full 4–6 color warm palette in `chartAttributes.colors`,
which is mapped to `io.customColors` during serialization.

---

## Design Decisions

### Why a separate REST endpoint instead of the Abilities API JS client?

The Chart Library admin page (`/wp-admin/admin.php?page=prc-chart-builder-library`)
is a custom React app that is not rendered inside the block editor. The
`@wordpress/abilities` JS client is designed for use within the editor context.
A direct REST endpoint avoids this dependency while reusing the same PHP
`generate_chart()` logic, which is also registered as the ability's
`execute_callback` for future block-editor integrations.

### Why three-layer attribute merging?

The AI is good at high-level decisions (chart type, title, data, color scheme)
but unreliable at knowing every required low-level attribute. The three-layer
merge ensures:

1. **block.json defaults** provide a complete, valid attribute set.
2. **Variation templates** apply chart-type-specific opinionated settings
   (axis visibility, sort order, bar dimensions) without requiring the AI to
   know them.
3. **AI overrides** are applied on top, so the AI can still customise anything
   it has an opinion about.

Runtime data fields (`chartData`, `categories`, `independentVariable`) are
always derived from the actual table rows and force-set last — they are never
trusted from the AI response.

### Why lock the generated chart block?

The generated `prc-chart-builder/chart` block is locked (`move: true`,
`remove: true`) by default. This prevents editors from accidentally breaking the
controller/table/chart structure that the AI-generated markup relies on. Editors
can still modify chart attributes via the block inspector. Additionally, locking
the block in the editor allows users to drag chart components (labels,
annotations, etc) in WYSIWYG style without moving the entire chart block.

### Why cap CSV at 101 lines?

The AI context window is not unlimited, and very large datasets provide
diminishing returns for chart generation. 101 lines (1 header + 100 rows) covers
virtually all real-world chart datasets. Rows beyond this limit are silently
dropped before the prompt is built.

---

## Common Pitfalls

### The "Chart Wizard" tab does not appear

- Confirm the AI Experiments plugin is active.
- Confirm the `chart-ai-create` experiment is toggled on in the AI Experiments
  admin panel.
- Confirm `wp_script_is('prc-chart-builder-library', 'enqueued')` returns true
  on the library page (the experiment hook fires at priority 20 — after the main
  admin enqueue).

### The AI returns invalid JSON

The model is instructed to return raw JSON only. If markdown or prose bleeds
through (especially with Haiku), the PHP `json_decode` will fail and the
endpoint returns `error: "Failed to parse AI response as JSON."`. Switching to
Sonnet or Opus generally resolves this.

### Sankey charts fail to render

Sankey diagrams require columns named exactly `source`, `target`, and `value`.
If the AI uses different column names, the chart will be empty. Include an
explicit instruction in the description: _"Use source, target, value columns"_.

### Annotations appear at wrong positions

Annotation coordinates are fractions of the **full chart bounding box** (origin
at top-left). When recreating from an image, the model visually estimates
positions, which can be imprecise. Editors can drag annotations to correct
positions after the chart is created.

### Generated colors are not applied

Colors from the AI go into `io.customColors`. If the chart is configured to use
a named palette (`io.colorValue`), `customColors` takes precedence. If colors
still do not appear, check that the `colors` top-level key is absent from the
serialized attributes (it is stripped during serialization) and that
`io.customColors` is present.
