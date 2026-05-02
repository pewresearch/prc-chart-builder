# PRC Chart Handoff (PCH)

**One-way import pipeline: pewplots (R) → Chart Builder (WordPress)**

Researchers export a chart from pewplots as a `.pch.json` file. A web producer uploads it via the "Import from pewplots" button in the Chart Builder admin. A draft chart post is created instantly, pre-loaded with data, styling, and metadata — no manual recreation needed.

---

## File Locations

```
plugins/prc-chart-builder/
  includes/
    chart-handoff/
      README.md                        ← this file
      class-pch-import-endpoint.php   ← REST endpoint + PHP converter
      src/
        schema.json                    ← authoritative PCH JSON Schema (v1)
        pch-to-chart-builder.js        ← JS converter (used by tests; PHP is the live path)
    trait-chart-block-defaults.php     ← shared 3-layer merge logic (used by PCH + AI endpoints)
  tests/
    integration/chart-handoff/
      pch-to-chart-builder.test.js     ← unit tests for the JS converter
    fixtures/chart-handoff/
      bar-horizontal.pch.json
      bar-vertical.pch.json
      stacked-bar.pch.json
      diverging-bar.pch.json
      line.pch.json
      area.pch.json
      dot-plot.pch.json
      scatter.pch.json
      demo-import.pch.json
```

**pewplots side (R):** see `pewplots/PCH-HANDOFF.md` in the pewplots repo for the complete Data Labs implementation guide (`export_to_pch()`, `pch_metadata()`, per-function additions).

---

## Schema

**Schema ID:** `prc-chart-handoff/v1`
**File:** `src/schema.json`

### Required fields

| Field | Type | Description |
|---|---|---|
| `$schema` | `string` | Must be `"prc-chart-handoff/v1"` |
| `version` | `string` | Semantic version of the handoff document (e.g. `"1.0.0"`) |
| `chartType` | `string` | Chart type — see mapping table below |
| `data` | `object` | The chart data (required sub-fields: `values`, `xColumn`, `yColumn`) |
| `metadata` | `object` | Chart text (title, subtitle, note, source) |

### Optional fields

| Field | Type | Description |
|---|---|---|
| `orientation` | `string` | `"horizontal"` (default) or `"vertical"` |
| `config` | `object` | Colors, dimensions, axis config, legend, labels, type-specific options |
| `source` | `object` | Provenance (tool, toolVersion, exportedAt) |
| `warnings` | `array` | Dropped features (e.g. faceting) |

### `data` sub-fields

| Field | Type | Description |
|---|---|---|
| `values` | `array` | Tidy/long rows. Each row is `{ xColumn: ..., yColumn: ..., [categoryColumn]: ... }` |
| `xColumn` | `string` | Column name for the independent variable (x axis) |
| `yColumn` | `string` | Column name for the dependent variable (y axis) |
| `categoryColumn` | `string\|null` | Column name for series/group (null for single-series charts) |
| `xType` | `string` | `categorical`, `numeric`, or `date` |
| `yType` | `string` | `numeric` or `percentage` |

### `config` sub-fields

| Field | Type | Description |
|---|---|---|
| `colors` | `array` | Hex color palette |
| `width` / `height` | `number` | Chart dimensions in px |
| `independentAxis` | `object` | Axis label, scale, domain, tickFormat, tickUnit, etc. |
| `dependentAxis` | `object` | Same fields as independentAxis + showZero |
| `legend` | `object` | `active`, `orientation` |
| `labels` | `object` | `active`, `position` (`inside`/`outside`) |
| `barOptions` | `object` | `barPadding`, `barGroupPadding`, `stackOffset` |
| `lineOptions` | `object` | `interpolation`, `strokeWidth`, `showPoints`, `areaFillOpacity` |
| `dotPlotOptions` | `object` | `connectPoints` |
| `divergingBarOptions` | `object` | `positiveCategories`, `negativeCategories` |
| `scatterOptions` | `object` | `showRegressionLine`, `regressionType` |

---

## Chart Type Mapping

PCH uses `chartType` + `orientation` to describe a chart. Chart Builder uses separate slugs for horizontal vs vertical. The importer resolves them as follows:

| PCH `chartType` | PCH `orientation` | CB `layout.type` | CB variation template |
|---|---|---|---|
| `bar` | `horizontal` (default) | `bar` | `bar.js` |
| `bar` | `vertical` | `column` | `column.js` |
| `stacked-bar` | `horizontal` | `stacked-bar` | `stacked-bar.js` |
| `stacked-bar` | `vertical` | `stacked-column` | `stacked-column.js` |
| `diverging-bar` | `horizontal` | `diverging-bar` | `diverging-bar.js` |
| `line` | — | `line` | `line.js` |
| `area` | — | `area` | `area.js` |
| `stacked-area` | — | `stacked-area` | `stacked-area.js` |
| `dot-plot` | — | `dot-plot` | `dot-plot.js` |
| `scatter` | — | `scatter` | `scatter.js` |

---

## Data Flow

### 1. Tidy → Wide pivot

PCH stores data in **tidy/long format** — one observation per row, natural for R:

```json
"values": [
  { "country": "Germany", "share": 40, "opinion": "Favorable" },
  { "country": "Spain",   "share": 50, "opinion": "Favorable" },
  { "country": "Germany", "share": 20, "opinion": "Unfavorable" },
  { "country": "Spain",   "share": 30, "opinion": "Unfavorable" }
]
```

Chart Builder expects **wide format** — one row per x-value, category values as columns (matching the table block's column structure):

```json
[
  { "x": "Germany", "Favorable": 40, "Unfavorable": 20 },
  { "x": "Spain",   "Favorable": 50, "Unfavorable": 30 }
]
```

The pivot is performed by `pivot_pch_data_to_wide()` in the PHP endpoint and `resolveData()` in the JS converter.

### 2. Key conventions after pivot

The Chart Builder editor's table parser (in `edit/index.jsx`) always keys the **first column as `'x'`** regardless of the original column name. The importer matches this convention:

| CB attribute | Value | Notes |
|---|---|---|
| `io.chartData[n].x` | The independent variable value | First column always keyed `'x'` |
| `dataRender.x` | `'x'` | Fixed; matches editor table parser |
| `io.independentVariable` | `'x'` | Display label in the editor UI |
| `dataRender.y` | Original `yColumn` (e.g. `'share'`) | Non-first columns keep their original names |
| `dataRender.categories` | Category values (e.g. `['Favorable', 'Unfavorable']`) | Derived from unique `categoryColumn` values |
| `io.availableCategories` | Same as `dataRender.categories` | |

### 3. 3-layer attribute merge

The PHP endpoint builds a complete CB block attribute set using the same 3-layer merge as the AI generation endpoint:

```
Layer 1: block.json defaults          (all attributes at registered defaults)
    ↓  deep_merge
Layer 2: variation template defaults  (chart-type-specific opinionated settings)
    ↓  deep_merge
Layer 3: PCH overrides                (only what PCH actually specifies)
```

**Critical rule:** PCH overrides only include attributes that PCH explicitly provides. Empty arrays are not written to the override — they would clobber variation template values (e.g. `sortOrder: 'descending'` for bar charts, `tickLabels` styles for axes). If PCH has no `independentAxis` config, the variation template's axis settings survive untouched.

---

## REST Endpoint

**Route:** `POST /prc-chart-builder/v1/import-pch`

**Authentication:** `edit_posts` capability required.

**Request:** JSON body — a complete `.pch.json` object.

**Response (201):**
```json
{
  "post_id": 12345,
  "edit_url": "https://example.com/wp-admin/post.php?post=12345&action=edit",
  "warnings": []
}
```

**Error responses:**
- `400 pch_empty` — no JSON body
- `400 pch_unsupported_schema` — `$schema` is not `prc-chart-handoff/v1`
- `400 pch_missing_chart_type` — `chartType` field absent
- `400 pch_missing_data` — `data.values` absent or empty

---

## Test Fixtures

| File | Chart type | Multi-series | Notes |
|---|---|---|---|
| `bar-horizontal.pch.json` | bar (horizontal) | Yes | Favorable/Unfavorable, Germany/Spain |
| `bar-vertical.pch.json` | bar (vertical → column) | No | Single series, numeric x |
| `stacked-bar.pch.json` | stacked-bar | Yes | |
| `diverging-bar.pch.json` | diverging-bar | Yes | positiveCategories / negativeCategories |
| `line.pch.json` | line | Yes | Multi-series over time |
| `area.pch.json` | area | Yes | |
| `dot-plot.pch.json` | dot-plot | Yes | connectPoints |
| `scatter.pch.json` | scatter | No | showRegressionLine |
| `demo-import.pch.json` | bar (horizontal) | Yes | General-purpose demo |

---

## Lossy Conversion Notes

| pewplots feature | PCH behavior |
|---|---|
| `facet_by` | Dropped; `FACET_DROPPED` warning added to `warnings[]` |
| `diff_bar` in `pew_dotplot()` | Maps to `config.dotPlotOptions.connectPoints` |
| `highlight` in `pew_dotplot()` | Dropped (no CB equivalent) |
| `group_labels` in `pew_area()` | Dropped (CB uses legend) |
| `fit_line` in `pew_scatter()` | Maps to `config.scatterOptions.showRegressionLine` |
| Font stack / theme details | Dropped (CB uses its own Pew theme) |

---

## Adding a New Chart Type

1. Add the type to `schema.json` under `chartType.enum`
2. Add a type-specific options section to `schema.json` under `config.properties` if needed
3. Add a mapping entry to `resolveLayoutType()` in `pch-to-chart-builder.js`
4. Add the same mapping to `resolve_cb_chart_type()` in `class-pch-import-endpoint.php`
5. Add type-specific option handling to `resolveTypeSpecificOptions()` (JS) and `resolve_type_specific_options()` (PHP)
6. Add a fixture file to `tests/fixtures/chart-handoff/`
7. Add test cases to `pch-to-chart-builder.test.js`
8. Update this README's chart type mapping table
