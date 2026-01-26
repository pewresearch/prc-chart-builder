# Research: Chart Type Switching in Editor

**Issue**: `issue-2016`
**Created**: 2025-12-11

## Technical Investigation

### How WordPress Block Variations Work

**Finding**: WordPress block variations are designed primarily for **initial block insertion**, not for runtime switching of existing blocks.

The `scope: ['block', 'transform']` on variations enables two behaviors:

1. **block scope**: Variation appears in the block inserter
2. **transform scope**: Variation appears in the block toolbar's "Transform to" menu

However, when transforming an **existing block with innerBlocks**, WordPress does NOT automatically replace the inner blocks. It only updates the parent block's attributes.

**Evidence from `src/controller/placeholder.jsx`**:

```javascript
onSelect={(nextVariation = defaultVariation) => {
  if (nextVariation.attributes) {
    setAttributes(nextVariation.attributes);
  }
  if (nextVariation.innerBlocks) {
    replaceInnerBlocks(
      clientId,
      createBlocksFromInnerBlocksTemplate(nextVariation.innerBlocks),
      true
    );
  }
}}
```

This explicit `replaceInnerBlocks` call only happens in the placeholder component during initial selection. Once a chart exists, the block toolbar's variation picker doesn't have this logic.

### Root Cause Confirmed (with evidence)

**Debugged by comparing block markup before/after chart type change:**

When a user attempts to change chart type on an existing chart via the variation picker:

1. **What happens**: Controller's `chartType` attribute is updated (e.g., `"bar"` → `"line"`)
2. **What doesn't happen**: Inner chart block's attributes are **completely unchanged**
3. **Result**: Mismatch between controller's `chartType` and chart block's `layout.type` causes rendering errors

**Actual markup comparison (bar → line):**

| Attribute                     | Before (bar)   | After (line attempt)        |
| ----------------------------- | -------------- | --------------------------- |
| Controller `chartType`        | `"bar"`        | `"line"` ✅                 |
| Chart `layout.type`           | `"bar"`        | `"bar"` ❌ unchanged        |
| Chart `layout.orientation`    | `"horizontal"` | `"horizontal"` ❌ unchanged |
| Chart `independentAxis.scale` | `"linear"`     | `"linear"` ❌ unchanged     |
| All other chart attributes    | ...            | **100% identical**          |

**Key insight**: The data format is **identical** for all chart types. The `io.chartData` array contains `[{x: "Germany", y: "40"}, ...]` regardless of chart type. This is NOT a data compatibility issue.

### What Needs to Change When Switching Chart Types

Since data format is identical, the fix is straightforward - just update rendering configuration:

| Chart Type | `layout.type` | `layout.orientation` | `independentAxis.scale` | `legend.markerStyle` |
| ---------- | ------------- | -------------------- | ----------------------- | -------------------- |
| bar        | `bar`         | `horizontal`         | (ordinal)               | `rect`               |
| column     | `bar`         | `vertical`           | (ordinal)               | `rect`               |
| line       | `line`        | `vertical`           | `time`                  | `line`               |
| area       | `area`        | `vertical`           | `time`                  | `line`               |
| pie        | `pie`         | -                    | -                       | `rect`               |
| dot-plot   | `dot-plot`    | `horizontal`         | (ordinal)               | `circle`             |

### Chart Type Families

Based on variation templates analysis:

**Ordinal Family** (categorical X-axis):

- `bar` - horizontal bars
- `column` - vertical bars (bar with orientation: vertical)
- `stacked-bar` - stacked horizontal
- `stacked-column` - stacked vertical
- `dot-plot` - dots on ordinal axis
- `exploded-bar` - separated bar groups
- `diverging-bar` - positive/negative categories

**Time/Linear Family** (numeric/date X-axis):

- `line` - line chart with `independentAxis.scale: 'time'`
- `area` - filled area
- `stacked-area` - stacked filled areas

**Scatter Family** (numeric both axes):

- `scatter` - requires both X and Y to be numeric

**Pie Family** (no axes):

- `pie` - circular segments

**Map Family** (geographic) — **EXCLUDED FROM TRANSFORMATIONS**:

- `us-map`, `us-map-county`, `us-map-block`, `world-map`
- Uses FIPS codes (US) or ISO 3166-1 codes (world)
- These chart types require geocode columns that standard charts don't have
- The code systems are incompatible with each other (FIPS ≠ ISO)
- Maps cannot be transformed to/from any other chart type, including other maps

## Solution Approaches

### Approach 1: Enhanced Block Transforms (Recommended)

**Decision**: Implement explicit block transforms instead of relying on variation switching.

**Rationale**:

- WordPress's block transform API is designed for this use case
- Provides fine-grained control over attribute mapping
- Can preserve user customizations explicitly
- Already used for table → chart conversion

**Implementation**:

1. Add transforms from controller to controller (same block type, different variation)
2. Each transform function maps old attributes to new chart type requirements
3. Explicitly update inner chart block attributes

**Alternatives Considered**:

- **Variation picker enhancement**: Would require modifying WordPress core or complex workarounds
- **Custom toolbar component**: More work, less standard

### Approach 2: Attribute Synchronization

**Decision**: Add a chart type synchronization hook in the chart block editor.

**Rationale**:

- Chart block can detect when parent's `chartType` differs from its `layout.type`
- Auto-apply required attribute changes for new chart type
- Works with existing variation picker

**Implementation**:

1. Add `useEffect` in chart edit component watching parent context
2. When `chartType` changes, apply attribute transformations
3. Use variation template defaults as baseline

### Approach 3: Hybrid (Selected)

**Decision**: Combine both approaches for robustness.

**Rationale**:

- Transforms provide clean UX with preview
- Synchronization catches edge cases
- Error boundary prevents crashes during transition

## Attribute Transformation Rules

### Preserved Across All Transitions

- `metadata` (title, subtitle, source, note, tag, alt)
- `colors` array (custom color palette)
- `io.availableCategories`
- `io.chartData` (table-derived data)
- `tooltip.format` (if generic, not chart-type-specific)

### Reset to Variation Defaults

- `layout.type` - always matches new chart type
- `layout.orientation` - specific to chart type
- `layout.padding` - differs by chart type
- `independentAxis.scale` - ordinal vs time
- `dependentAxis` configuration
- `legend.markerStyle` - rect for bars, line for lines
- Chart-type-specific: `bar.*`, `line.*`, `nodes.*`, etc.

### Conditional Transformation

- `independentAxis.domain` - keep if scale compatible, reset if not
- `labels.color` - keep 'contrast'/'inherit', reset specific colors
- `dataRender.sortOrder` - keep for ordinal types, reset for time types

## Dependencies

**Existing Code to Leverage**:

- Variation templates in `.shared/variation-templates/*.js` - source of default configs
- `mergeWithDefaults` helper - ensures complete attribute sets
- `createBlocksFromInnerBlocksTemplate` from `@wordpress/blocks`
- `replaceInnerBlocks` from `@wordpress/block-editor`

**No New Dependencies Required** - all functionality achievable with existing WordPress packages.

## Risk Assessment

| Risk                        | Likelihood | Impact | Mitigation                                       |
| --------------------------- | ---------- | ------ | ------------------------------------------------ |
| Data loss during transition | Low        | High   | Preserve all io.chartData, validate before/after |
| Undo not working            | Medium     | Medium | Use WordPress undo history (automatic)           |
| Performance lag             | Low        | Low    | Transformations are synchronous, fast            |
| Edge cases causing errors   | Medium     | High   | Add error boundary, graceful fallbacks           |

## Conclusion

The root cause is confirmed: WordPress variation switching doesn't update inner blocks. The solution is to implement explicit transforms and/or attribute synchronization in the chart block editor. This can be achieved entirely with existing WordPress APIs and the codebase's variation templates.
