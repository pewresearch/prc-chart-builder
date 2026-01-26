# Implementation Plan: Chart Type Switching in Editor

**Issue**: `issue-2016`
**Created**: 2025-12-11
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)

## Summary

Enable users to switch between chart types on existing charts without errors, preserving user customizations while correctly applying new chart type configurations.

## Scope Note: Maps Excluded

**Map chart types are explicitly excluded from this feature.** Maps (`us-map`, `us-map-county`, `us-map-block`, `world-map`) require geographic identifier codes (FIPS or ISO) that are incompatible with standard chart data and with each other. Users with map charts will not see transformation options; they should create a new chart if a different type is needed.

## Phases

### Phase 1: Foundation (Estimated: 2-3 hours)

Create the core transformation utility and establish context communication between controller and chart blocks.

### Phase 2: Integration (Estimated: 2-3 hours)

Integrate transformation logic into the editor and handle edge cases.

### Phase 3: Testing & Polish (Estimated: 2-3 hours)

Comprehensive testing and error handling improvements.

---

## Phase 1: Foundation

### Task 1.1: Create Chart Type Transformer Utility

**File**: `src/chart/utils/chart-type-transformer.js` (NEW)

**Description**: Create a utility module that handles attribute transformations when switching chart types.

**Implementation**:

1. Define chart family mappings (ordinal, time, scatter, pie) — maps excluded
2. Create `getTemplateDefaults(chartType)` to extract defaults from variation templates
3. Create `getFamily(chartType)` to determine a chart type's family
4. Create `isTransformable(chartType)` to check if a chart type supports transformations
5. Create `transformChartType(currentAttrs, newChartType)` as the main transformation function
6. Handle same-family transitions (preserve more) vs cross-family (use more defaults)
7. Export utility functions for use in editor

**Acceptance Criteria**:

- [ ] Function correctly identifies chart families
- [ ] Same-family transitions preserve user settings
- [ ] Cross-family transitions apply appropriate defaults
- [ ] Metadata, colors, and io data always preserved
- [ ] Function returns valid attribute objects

---

### Task 1.2: Add Chart Type Context Provider

**File**: `src/controller/block.json`

**Description**: Extend the controller block's `providesContext` to include `chartType`, allowing child blocks to react to type changes.

**Implementation**:

1. Add `"prc-chart-builder/chartType": "chartType"` to `providesContext` object
2. Verify context is properly typed as string

**Acceptance Criteria**:

- [ ] Controller provides `chartType` in context
- [ ] Child blocks can access `chartType` via `usesContext`

---

### Task 1.3: Add Chart Type Context Consumer

**File**: `src/chart/block.json`

**Description**: Enable chart block to consume the `chartType` context from its parent controller.

**Implementation**:

1. Add `"usesContext": ["prc-chart-builder/id", "prc-chart-builder/chartType"]` (or extend existing)
2. Document the expected context shape

**Acceptance Criteria**:

- [ ] Chart block declares `usesContext` for chartType
- [ ] Context is accessible in edit component

---

## Phase 2: Integration

### Task 2.1: Implement Chart Type Synchronization

**File**: `src/chart/edit/index.jsx`

**Description**: Add logic to detect when the parent controller's `chartType` differs from the chart's `layout.type` and trigger appropriate transformations.

**Implementation**:

1. Import `transformChartType` from new utility
2. Extract `chartType` from block context
3. Add `useEffect` hook to watch for chartType changes
4. When mismatch detected, call `transformChartType` and `setAttributes`
5. Add logging for debugging during development

**Code Sketch**:

```javascript
const controllerChartType = context['prc-chart-builder/chartType'];
const currentLayoutType = attrs.layout?.type;

useEffect(() => {
	if (
		controllerChartType &&
		currentLayoutType &&
		getLayoutTypeForChartType(controllerChartType) !== currentLayoutType
	) {
		console.log(
			`Chart type change: ${currentLayoutType} → ${controllerChartType}`
		);
		const newAttrs = transformChartType(attrs, controllerChartType);
		setAttributes(newAttrs);
	}
}, [controllerChartType]);
```

**Acceptance Criteria**:

- [ ] Chart detects type changes from parent context
- [ ] Transformation is applied automatically
- [ ] Chart re-renders with new configuration
- [ ] No infinite loops or unnecessary re-renders

---

### Task 2.2: Map Chart Type to Layout Type

**File**: `src/chart/utils/chart-type-transformer.js`

**Description**: Create mapping between controller's `chartType` values and chart block's `layout.type` values (they differ in some cases).

**Implementation**:

```javascript
const CHART_TYPE_TO_LAYOUT_TYPE = {
	bar: 'bar',
	column: 'bar', // Column is bar with vertical orientation
	'stacked-bar': 'stacked-bar',
	'stacked-column': 'stacked-bar', // Same as stacked-bar with vertical
	line: 'line',
	area: 'area',
	'stacked-area': 'stacked-area',
	'dot-plot': 'dot-plot',
	scatter: 'scatter',
	pie: 'pie',
	'diverging-bar': 'diverging-bar',
	'exploded-bar': 'exploded-bar',
	'us-map': 'map-usa',
	'us-map-county': 'map-usa',
	'us-map-block': 'map-usa-block',
	'world-map': 'map-world',
	freeform: 'freeform',
};
```

**Acceptance Criteria**:

- [ ] All chart types have correct layout.type mapping
- [ ] Orientation is set correctly for column/stacked-column

---

### Task 2.3: Handle Variation Template Import

**File**: `src/chart/utils/chart-type-transformer.js`

**Description**: Properly import and extract chart attributes from variation templates.

**Implementation**:

1. Import all templates from `.shared/variation-templates`
2. Create function to extract chart block attributes from template array
3. Handle `mergeWithDefaults` wrapper used in templates

**Acceptance Criteria**:

- [ ] All templates successfully imported
- [ ] Defaults correctly extracted from template structure
- [ ] `mergeWithDefaults` values properly resolved

---

## Phase 3: Testing & Polish

### Task 3.1: Add Error Boundary

**File**: `src/chart/edit/index.jsx`

**Description**: Wrap chart rendering in an error boundary to prevent crashes during type transitions.

**Implementation**:

1. Create or use existing error boundary component
2. Wrap chart visualization in error boundary
3. Display user-friendly error message with recovery option

**Acceptance Criteria**:

- [ ] Errors during render are caught
- [ ] User sees helpful message instead of crash
- [ ] Recovery action available (reset to defaults)

---

### Task 3.2: Block Map Chart Transformations

**File**: `src/chart/utils/chart-type-transformer.js` and `src/controller/edit.jsx`

**Description**: Prevent any transformations to or from map chart types. Maps require incompatible data structures (FIPS/ISO codes) and should not participate in the transformation system.

**Implementation**:

1. Create `NON_TRANSFORMABLE_TYPES` constant for map types
2. Create `isTransformable(chartType)` utility function
3. In controller edit, filter variation picker options based on current chart type
4. If current chart is a map, hide or disable non-map variations
5. If current chart is transformable, hide or disable map variations

```javascript
const NON_TRANSFORMABLE_TYPES = [
	'us-map',
	'us-map-county',
	'us-map-block',
	'world-map',
];

function isTransformable(chartType) {
	return !NON_TRANSFORMABLE_TYPES.includes(chartType);
}
```

**Acceptance Criteria**:

- [ ] Map charts do not show transformation options to non-map types
- [ ] Non-map charts do not show transformation options to map types
- [ ] No console errors when attempting blocked transformations
- [ ] Clear visual indication that transformation is not available (disabled/hidden)

---

### Task 3.3: Manual Testing Matrix

**Description**: Test all chart type transitions systematically.

**Test Cases**:

| #   | From   | To          | Expected Result                   |
| --- | ------ | ----------- | --------------------------------- |
| 1   | bar    | stacked-bar | ✓ Bars stack, data preserved      |
| 2   | bar    | column      | ✓ Orientation changes to vertical |
| 3   | bar    | line        | ✓ Scale changes, line rendered    |
| 4   | line   | area        | ✓ Area fill added                 |
| 5   | line   | bar         | ✓ Scale reverts to ordinal        |
| 6   | bar    | pie         | ✓ Axes hidden, pie rendered       |
| 7   | bar    | dot-plot    | ✓ Dots rendered on ordinal axis   |
| 8   | line   | scatter     | ⚠️ May need data adjustment       |
| 9   | bar    | us-map      | ✗ Blocked — option not available  |
| 10  | us-map | bar         | ✗ Blocked — option not available  |
| 11  | us-map | world-map   | ✗ Blocked — option not available  |

**Acceptance Criteria**:

- [ ] All same-family transitions work without errors
- [ ] All cross-family transitions (within transformable types) complete without crash
- [ ] Map ↔ non-map transitions are blocked in UI
- [ ] Map ↔ map transitions are blocked in UI
- [ ] Metadata preserved in all cases
- [ ] Colors preserved in all cases

---

### Task 3.4: Documentation Update

**File**: `specs/issue-2016/` (this directory)

**Description**: Update documentation with final implementation details.

**Implementation**:

1. Update quickstart.md with any changes from implementation
2. Add troubleshooting section if needed
3. Document any known limitations

**Acceptance Criteria**:

- [ ] Documentation matches implementation
- [ ] Edge cases documented
- [ ] Troubleshooting guidance provided

---

## Dependencies

All implementation uses existing WordPress packages and codebase utilities:

- `@wordpress/block-editor` - `useBlockProps`, `useInnerBlocksProps`
- `@wordpress/blocks` - Block registration
- `@wordpress/data` - `useSelect`, `useDispatch`
- `@wordpress/components` - UI components
- `.shared/variation-templates/*` - Template defaults

**No new dependencies required.**

## Risk Mitigation

| Risk             | Mitigation                                                    |
| ---------------- | ------------------------------------------------------------- |
| Undo not working | WordPress handles this automatically via block editor history |
| Data loss        | Always preserve `io.chartData` and `metadata`                 |
| Rendering crash  | Error boundary catches and displays fallback                  |
| Infinite loop    | Guard useEffect with proper dependency array                  |

## Success Metrics

After implementation:

1. Zero JavaScript errors when switching between same-family chart types
2. Zero editor crashes when switching between any chart types
3. 100% metadata preservation across transitions
4. Under 500ms for chart type switch to complete

## Rollout

1. Implement and test locally
2. Review PR with team
3. Deploy to staging
4. Validate with sample charts
5. Deploy to production
