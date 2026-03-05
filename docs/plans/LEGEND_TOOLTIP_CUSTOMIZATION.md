---
name: Chart Text Customization
overview: Two-phase plan to add clickable legend item editing (Phase 1) and enriched, per-point tooltip customization (Phase 2), following the established ClickableTicks/popover pattern.
todos:
  - id: legend-clickable-wrapper
    content: Create ClickableLegend wrapper component that uses visx children render prop with onClick handlers and custom label text support
    status: pending
  - id: legend-wp-editor-functions
    content: Add legendItems key to wpEditorFunctions (onClick, updateCustomizations, getCustomizations) and customLegendLabels block attribute
    status: pending
  - id: legend-popover-panel
    content: Create LegendItemPanel popover panel + useLegendItemCustomizations hook, add LEGEND_ITEM to ELEMENT_TYPES
    status: pending
  - id: legend-chart-integration
    content: Replace bare LegendOrdinal usage with ClickableLegend across all chart components (18+ files)
    status: pending
  - id: tooltip-enrich-format
    content: Extend getTooltipFormat to accept full datum object, making all FlatData keys available as {{keyName}} placeholders
    status: pending
  - id: tooltip-update-charts
    content: Update all chart components to pass full data row in showTooltip calls
    status: pending
  - id: tooltip-per-point-editing
    content: Extend ShapePanel with tooltip editing section, add customTooltips block attribute, wire lookup into tooltip rendering
    status: pending
  - id: tooltip-template-builder
    content: (Stretch) Build a tooltip template composer UI that lets users pick from available datum fields
    status: pending
isProject: false
---

# Chart Text Customization: Legends and Tooltips

## Phase 1: Legend Item Text Customization

### Why this is straightforward

visx's `Legend` base component (used by `LegendOrdinal`, `LegendThreshold`, `LegendLinear`) supports a `**children` render prop**:

```60:60:node_modules/@visx/legend/esm/legends/Legend/index.js
  if (children) return /*#__PURE__*/React.createElement(React.Fragment, null, children(labels));
```

When `children` is provided, it receives the `labels` array (`{ datum, text, value, index }[]`) and gives full control over rendering. Both `LegendItem` and `LegendLabel` spread `restProps`, so they natively accept `onClick`.

### Approach

Follow the same pattern as `ClickableTicks` -- but since visx legends are HTML (not SVG), we can attach click handlers directly without needing a custom wrapper component.

### Changes required

**1. `wpEditorFunctions` -- add `legendItems` key** ([wp-editor-functions.js](plugins/prc-chart-builder/src/chart/edit/wp-editor-functions.js))

- Add `legendItems.onClick(categoryValue, defaultLabel, anchorEl)` following the tick labels pattern
- Add `legendItems.updateCustomizations(updates)` / `legendItems.getCustomizations()`
- Store data in a new `customLegendLabels` block attribute: `{ [categoryKey]: { text: string } }`

**2. Popover panel -- add `LegendItemPanel`** (new file in [popover/panels/](plugins/prc-chart-builder/src/chart/edit/popover/panels/))

- Simple panel with `TextControl` for custom label text, mirroring `TickLabelPanel` structure
- Add `LEGEND_ITEM: 'legendItem'` to `ELEMENT_TYPES` in [popover/index.jsx](plugins/prc-chart-builder/src/chart/edit/popover/index.jsx)
- Wire into `renderPanel()` switch and `getPanelTitle()`

**3. Hook -- add `useLegendItemCustomizations`** (new file in [popover/hooks/](plugins/prc-chart-builder/src/chart/edit/popover/hooks/))

- Follows pattern of `useTickLabelCustomizations`

**4. Chart components -- use `children` render prop on `LegendOrdinal`**

Currently every chart renders legends like this:

```861:869:plugins/prc-charting-library/src/lib/Components/BarVertical.tsx
				<LegendOrdinal
					{...legendProps}
					scale={colorScale}
					domain={
						legend.categories.length > 0
							? legend.categories
							: colorScale.domain()
					}
				/>
```

The change: when `wpEditorFunctions?.legendItems?.onClick` is present, use the `children` render prop to render `LegendItem` + `LegendShape` + `LegendLabel` manually with `onClick` on each item. When not in editor, still use `children` to apply custom label text from `customLegendLabels`. This should be extracted into a shared `ClickableLegend` wrapper component (similar to `ClickableTicks`) to avoid duplicating the render prop logic across 18+ chart components.

**5. `StyledLegend` updates** ([Legend.tsx](plugins/prc-charting-library/src/lib/Components/Legend.tsx))

- May need to pass `customLegendLabels` down or access via `DataContext`

**Affected chart components** (all that use `LegendOrdinal`): BarVertical, BarHorizontal, DivergingBarHorizontal, DivergingBarVertical, Line, Pie, Radar, Scatter, Sankey, DotPlot, Treemap, StackedBarVertical, StackedBarHorizontal, StackedArea, ExplodedBar, plus 5 map components (these also use `LegendThreshold`/`LegendLinear`).

---

## Phase 2: Tooltip Enrichment and Per-Point Customization

### CRITICAL CONSTRAINT: Backward Compatibility

There are hundreds of existing charts using the current tooltip formatting. **Every change in Phase 2 must be purely additive.** Specifically:

- Existing format strings (`{{row}}: {{value}}`, `%1$s`/`%2$s`/`%3$s`) must produce **byte-identical output** after any changes
- The existing `{ x, y, category, color }` signature of `getTooltipFormat` must continue to work unchanged -- the full datum parameter must be **optional** and only consulted when the format string references keys beyond `row`/`value`/`column`
- The existing `__tooltips[category]` data-model override must continue to take precedence exactly as it does today
- No new block attributes should alter rendering for charts that don't explicitly set them (all new attributes must default to `null`/`{}`)
- **Test strategy:** Before touching `getTooltipFormat`, snapshot the output of the existing function for a representative set of inputs (different format strings, date values, ordinal maps, abbreviateValue, toFixedDecimal, etc.) and assert those snapshots are unchanged after the refactor

This phase has three sub-goals, sequenced to minimize risk.

### 2A: Enrich Default Tooltip Formatting (Additive Only)

The existing TODO in the code confirms this is a known gap:

```133:134:plugins/prc-platform-core/includes/scripts/src/@prc/charting-utilities/hooks/tooltips.ts
	// TODO: extend toolitip formatter to support full data object, so that we can return non-numeric values tied to the data point
	// eg. {{data.tooltipValue}} would return the value of data.tooltipValue
```

Currently `getTooltipFormat` only receives `{ x, y, category, color }`. Since `FlatData` supports arbitrary keys (`[propName: string]: any`), there's a lot of data that's invisible to tooltips.

#### `tooltips.ts` function-by-function strategy

The file at [tooltips.ts](plugins/prc-platform-core/includes/scripts/src/@prc/charting-utilities/hooks/tooltips.ts) contains 5 exported functions and 2 internal helpers. Here is exactly what happens to each:

**FROZEN (no changes):**

- `getLocalPoint(svgElement, event)` -- SVG coordinate calculation. No tooltip content logic. Untouched.
- `getTooltipVisible(layout, chartWidth, tooltip)` -- visibility toggle. Untouched.
- `getTooltipMapDeemphasisProps(tooltip, map, id, tooltipData)` -- map hover opacity/stroke. Untouched.
- `getTooltipHeaderFormat(d, config)` -- header formatter. Returns `x` or `category` with date formatting. Untouched.
- `styleTooltipString(formatString, color)` -- internal. Wraps `{{key}}` in styled `<span>` tags for `.isBold()`, `.isColor()`, `.toLowerCase()` modifiers. Untouched.
- `formatTooltipString(formatString)` -- internal. Replaces `{{key}}` placeholders with values from a data object. Untouched.

**ADDITIVE CHANGE (one function):**

- `getTooltipFormat(d, config, dataRender)` -- the main body formatter. Gets an optional 4th parameter:

```typescript
// BEFORE (unchanged, still works):
getTooltipFormat({ x, y, category, color }, config, dataRender)

// AFTER (optional 4th param):
getTooltipFormat({ x, y, category, color }, config, dataRender, datum?: FlatData)
```

The change is at the **end** of the function, after all existing logic has run. The existing pipeline is:

1. Date formatting on `x` and `category` (lines 119-124) -- **unchanged**
2. `customFormat` check (lines 129-131) -- **unchanged**
3. Ordinal map scale branch (lines 136-150) -- **unchanged**
4. Number formatting: `toFixedDecimal`, `abbreviateValue`, `toLocaleString`, `absoluteValue` (lines 152-160) -- **unchanged**, still applies only to `{{value}}`
5. Format string placeholder replacement: `%1$s`->`{{column}}`, etc. (lines 161-169) -- **unchanged**
6. `styleTooltipString` + `formatTooltipString` pipeline (lines 167-169) -- **unchanged**
7. Default fallback `{{row}}: {{value}}` (lines 171-172) -- **unchanged**

**NEW step 8 (appended after existing return):** If `datum` is provided, do a second pass on the result string replacing any remaining `{{keyName}}` placeholders with values from the datum object. Since existing format strings only use `{{row}}`, `{{value}}`, `{{column}}` -- all of which are resolved in step 6 -- the second pass finds nothing to replace and returns the string untouched. Only format strings that explicitly reference new keys (e.g., `{{population}}`, `{{margin_of_error}}`) trigger the second pass resolution.

**NEW function (separate, does not touch existing code):**

- `renderTooltipFromTemplate(datum, template, config)` -- entirely new function for the template builder (Phase 2C). Lives alongside the existing functions. Used only when a chart has a `tooltipTemplate` attribute set. The existing `getTooltipFormat` path is never called when a template is active.

#### Chart component changes are opt-in and incremental

- Update chart components one at a time to pass the raw data row as the 4th argument to `getTooltipFormat`
- No chart's output changes unless its format string contains new `{{keyName}}` placeholders (which none currently do)
- This can be done gradually -- no need to update all 18+ charts in one pass

### 2B: Per-Point Tooltip Editing

**UX decision needed:** How should users edit per-point tooltips?

Option A: **Extend the Shape popover** -- when you click a bar/dot/slice (already opens `ShapePanel`), add a "Tooltip" section/tab to that panel with a textarea for custom tooltip HTML. This leverages existing click infrastructure.

Option B: **Separate click mode** -- a toolbar toggle between "edit shapes" and "edit tooltips" click modes. More complex but cleaner separation.

**Recommendation:** Option A is simpler and follows the existing pattern. The `ShapePanel` already knows which data point you clicked on. Add a `TextareaControl` for custom tooltip content and store in `customTooltips` block attribute keyed by `xValue::category`.

**Changes:**

- Add `customTooltips` block attribute: `{ [elementKey]: string }` (HTML string per point), **defaults to `{}`** -- no existing chart affected
- Extend `ShapePanel` with a tooltip editing section (or create a tabbed interface)
- In chart components, look up `customTooltips[elementKey]` when rendering tooltip content
- **Priority cascade** (most specific wins): `customTooltips[key]` (block attribute, editor-set) > `__tooltips[category]` (data-model, programmatic) > `getTooltipFormat(...)` (format string, default)
- Existing charts have empty `customTooltips`, so the cascade falls through to existing behavior with zero changes

### 2C: Tooltip Template Builder

This is the big UX vision: replacing the raw format string `TextControl` in [tooltip-controls.jsx](plugins/prc-chart-builder/src/chart/edit/tooltip-controls.jsx) with a structured template composer.

#### Why the current approach is limited

The current [tooltip-controls.jsx](plugins/prc-chart-builder/src/chart/edit/tooltip-controls.jsx) has these limitations:

- **Raw string editing** -- users hand-type `{{row}}: {{value}}` into a `TextControl` (line 270). No autocomplete, no field picker, no preview.
- **Global number formatting** -- `toFixedDecimal`, `abbreviateValue`, `toLocaleString`, `absoluteValue` are single toggles (lines 353-441) that apply uniformly to `{{value}}`. If a tooltip references two numeric fields, they get the same formatting. There's no way to round one to 1 decimal and abbreviate another.
- **Only 3 fields visible** -- `{{row}}`, `{{value}}`, `{{column}}`. Even after 2A adds access to all datum keys, users would need to know the exact key names and type them manually.
- **No visual feedback** -- no preview of what the tooltip will look like.

#### Template data model

A new `tooltipTemplate` block attribute (defaults to `null` -- existing charts unaffected) that replaces the format string approach with a structured definition:

```typescript
type TooltipTemplateRow = {
  field: string;           // datum key: "x", "y", "category", or any custom key
  label?: string;          // display label (defaults to column header if omitted)
  visible: boolean;        // whether this row shows in the tooltip
  // Per-field formatting (overrides the global tooltip config for this field)
  format?: {
    toFixedDecimal?: number;
    abbreviateValue?: boolean;
    toLocaleString?: boolean;
    absoluteValue?: boolean;
    dateFormat?: string;
    prefix?: string;       // e.g., "$"
    suffix?: string;       // e.g., "%", " people"
  };
  // Per-field styling
  style?: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    fontSize?: string;
  };
};

type TooltipTemplate = {
  header?: {
    field: string;         // which field to use as header
    style?: { bold?: boolean; color?: string; };
  };
  rows: TooltipTemplateRow[];
};
```

When `tooltipTemplate` is set, tooltip rendering uses the new `renderTooltipFromTemplate(datum, template, config)` function instead of `getTooltipFormat`. When it's `null` (all existing charts), the existing pipeline is used unchanged.

#### Template builder UI

Located in [tooltip-controls.jsx](plugins/prc-chart-builder/src/chart/edit/tooltip-controls.jsx), this would be a new section (or replacement for the format string `TextControl`) that provides:

- **Field picker** -- dropdown or list of all available datum keys (derived from the data's column headers / `FlatData` keys). Users pick fields to include in the tooltip rather than typing key names.
- **Per-field formatting** -- each added field gets its own formatting controls (decimals, abbreviation, locale, prefix/suffix). This replaces the global toggles which have the single-value limitation.
- **Per-field styling** -- bold, italic, color per field (replaces the `.isBold()`, `.isColor()` string modifiers).
- **Drag-to-reorder** -- rows can be reordered.
- **Live preview** -- renders a sample tooltip using actual data from the chart, updating as the user changes the template.
- **Migration path** -- a "Convert to template" action that reads the existing format string + global formatting toggles and generates an equivalent `TooltipTemplate`, so users can upgrade without losing their existing configuration.

#### Relationship to existing tooltip controls

The existing global controls in `tooltip-controls.jsx` (show/hide, positioning, size, font size, deemphasis, stroke emphasis) remain untouched -- they control the tooltip *container*, not its *content*. The template builder replaces only the *content* controls:

- `format` TextControl (line 270) -- replaced by the template builder's field list
- `absoluteValue` toggle (line 358) -- moves to per-field formatting in the template
- `abbreviateValue` toggle (line 381) -- moves to per-field formatting in the template
- `toFixedDecimal` control (line 405) -- moves to per-field formatting in the template
- `toLocaleString` toggle (line 424) -- moves to per-field formatting in the template
- `dateFormat` select (line 294) -- moves to per-field formatting in the template

These controls still exist for charts using the legacy format string approach (i.e., `tooltipTemplate` is `null`). A toggle or progressive disclosure pattern lets users switch between "Simple format" (existing string) and "Template builder" (new structured approach).

#### New rendering function in `tooltips.ts`

```typescript
// NEW -- lives alongside existing functions, never replaces them
renderTooltipFromTemplate(
  datum: FlatData,
  template: TooltipTemplate,
  config: Tooltip  // for container-level settings like dateFormat fallback
): string
```

This function:

- Iterates `template.rows`, skipping rows where `visible === false`
- For each row, looks up `datum[row.field]` to get the raw value
- Applies `row.format` (per-field decimals, abbreviation, locale, prefix/suffix)
- Applies `row.style` (bold, italic, color wrapping)
- Assembles the final HTML string
- Returns it for `dangerouslySetInnerHTML` (same output contract as `getTooltipFormat`)

#### `tooltips.ts` final state after all phases

```
tooltips.ts exports (after Phase 2 complete):
-----------------------------------------------
getLocalPoint()                    -- UNCHANGED
getTooltipHeaderFormat()           -- UNCHANGED
getTooltipFormat()                 -- ADDITIVE (optional 4th datum param)
getTooltipVisible()                -- UNCHANGED
getTooltipMapDeemphasisProps()     -- UNCHANGED
renderTooltipFromTemplate()        -- NEW (only called when tooltipTemplate is set)

Internal helpers:
-----------------
styleTooltipString()               -- UNCHANGED
formatTooltipString()              -- UNCHANGED
```

---

## Sequencing Summary

- **Phase 1** (Legend): Well-bounded, ~6-8 files changed. The `ClickableLegend` wrapper + popover panel + wpEditorFunctions addition follows established patterns exactly. **Safe to execute.**
- **Phase 2A** (Tooltip enrichment): Low risk when done as additive optional parameter. Write snapshot tests first. Update charts incrementally. **No existing chart output changes.**
- **Phase 2B** (Per-point tooltip editing): Low risk -- new attribute defaults to empty, existing cascade is preserved. Depends on shape click infrastructure (already exists).
- **Phase 2C** (Template builder): Full-featured tooltip template composer with per-field formatting, field picker, and live preview. New `renderTooltipFromTemplate` function in `tooltips.ts`. Existing charts use `tooltipTemplate: null` and are completely unaffected.
