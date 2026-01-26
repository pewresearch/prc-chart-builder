# Feature Specification: Chart Type Switching in Editor

**Issue**: `issue-2016`
**Created**: 2025-12-11
**Status**: Draft
**Input**: "Currently, when you've selected a chart in chart builder editor, you are locked into that specific chart type for the existence of that chart. Sometimes you may want to see what a chart looks like as a bar chart, but then you realize that it should actually be a column chart or a line chart instead. We currently have the ability to change variations and thus also chart types, but for some reason, in the editor this errors out (most likely due to something regarding the scale). We need to problem solve why this is happening and make sure that these changes can actually be made."

## Scope

### Included Chart Types

This feature applies to **transformable chart types** that share compatible data structures:

- **Ordinal family**: bar, column, stacked-bar, stacked-column, dot-plot, diverging-bar, exploded-bar
- **Time/linear family**: line, area, stacked-area
- **Scatter**: scatter
- **Pie**: pie

### Excluded Chart Types

**Map chart types are explicitly excluded** from the chart type switching feature:

- `us-map` (state FIPS codes)
- `us-map-county` (county FIPS codes)
- `us-map-block` (state FIPS codes, cartogram layout)
- `world-map` (ISO 3166-1 numeric codes)

**Rationale**: Maps require geographic identifier codes (FIPS or ISO) that standard chart types don't have. The code systems are also incompatible with each other — US FIPS codes have no meaning in a world map context, and vice versa. Attempting to transform between these would either silently fail or produce unexpected results.

**Behavior**: When a user has a map chart, the variation picker should either hide non-map options or show them as disabled. Users who need a different map type should create a new chart with the appropriate data structure.

---

## Problem Analysis

### Current Architecture

The Chart Builder uses a two-block structure:

1. **Controller Block** (`prc-chart-builder/controller`): Wraps the chart and holds top-level metadata including `chartType`
2. **Chart Block** (`prc-chart-builder/chart`): Contains all chart rendering configuration in nested attributes

Variations are defined on the controller block in `src/controller/variations.js` with `scope: ['block', 'transform']`, which theoretically allows switching between chart types. However, when a user attempts to change the chart type via the block toolbar or variation picker, errors occur.

### Root Cause Hypothesis

The error likely stems from **incompatible scale configurations** between chart types:

| Chart Family                       | Independent Axis Scale | Data Format           |
| ---------------------------------- | ---------------------- | --------------------- |
| Bar, Column, Stacked Bar, Dot Plot | `ordinal` (implicit)   | Text labels           |
| Line, Area, Stacked Area           | `time`                 | Date/numeric values   |
| Scatter                            | `linear`               | Numeric X and Y       |
| Maps                               | N/A                    | FIPS codes, ISO codes |

When switching from a bar chart (ordinal scale) to a line chart (time scale), the existing data and axis configuration are incompatible. The charting library attempts to parse text labels as dates, causing JavaScript errors.

### Key Code Locations

- **Variations Definition**: `src/controller/variations.js` - defines available chart types
- **Chart Attributes**: `src/chart/block.json` - defines chart block schema with nested attributes
- **Data Formatting**: `src/chart/utils/helpers.js` - `formattedData()`, `formatCellContent()`, `getDomain()`
- **Config Generation**: `src/chart/utils/get-config.js` - builds config passed to charting library
- **Variation Templates**: `.shared/variation-templates/*.js` - default configurations per chart type

## User Scenarios & Testing

### User Story 1 - Switch Between Similar Chart Types (Priority: P1)

Content creators want to switch between visually similar chart types (e.g., bar ↔ stacked bar, line ↔ area) without losing their data or encountering errors. These transitions share compatible scale configurations.

**Why this priority**: Most common use case. Bar/stacked bar and line/area share scales, so this should work with minimal attribute adjustments.

**Acceptance Scenarios**:

1. **Given** a bar chart with categorical data, **When** user changes to stacked bar, **Then** chart re-renders correctly with grouped bars stacked, and all data labels/colors persist
2. **Given** a line chart with time-series data, **When** user changes to area chart, **Then** chart fills area below lines while preserving axis configuration and legends
3. **Given** any chart type, **When** user changes to another chart type within same scale family, **Then** no errors appear in console and chart renders immediately

---

### User Story 2 - Switch Between Different Scale Families (Priority: P2)

Content creators want to switch from a bar chart to a line chart (or vice versa), understanding that some data/configuration adjustments may be needed.

**Why this priority**: Cross-family switching is less common but valuable. Requires intelligent handling of scale differences.

**Acceptance Scenarios**:

1. **Given** a bar chart with text category labels, **When** user changes to line chart, **Then** system either provides guidance to update X-axis data, or makes a best-effort conversion
2. **Given** a line chart with numeric/date X-axis, **When** user changes to bar chart, **Then** X-axis values become categorical labels and chart renders as bars
3. **Given** incompatible scale configurations, **When** user attempts switch, **Then** system gracefully handles the transition (no crash/white screen), even if chart appears empty or with warning

---

### User Story 3 - Preserve User Customizations (Priority: P2)

When switching chart types, users expect their customizations (colors, labels, tooltips, title/subtitle, source notes) to persist where applicable.

**Acceptance Scenarios**:

1. **Given** a chart with custom color palette, **When** user changes chart type, **Then** color assignments persist for matching categories
2. **Given** a chart with custom tooltip format, **When** user changes to compatible chart type, **Then** tooltip configuration remains intact
3. **Given** a chart with metadata (title, subtitle, source, note), **When** user changes chart type, **Then** all metadata text persists unchanged
4. **Given** chart-type-specific settings (bar width, line stroke), **When** user changes to different chart type, **Then** only non-applicable settings are reset to defaults

---

### Edge Cases

- **Empty table data**: Switching chart type with no data should not error; empty chart should render
- **Single data point**: Line charts with one point should show single node; bar charts show single bar
- **Missing categories**: When chart type expects categories not in data, graceful fallback to available data
- **Map charts**: Maps are excluded from chart type switching entirely (see Scope section above)
- **Freeform charts**: Switching to/from freeform may need special handling as it allows arbitrary inner blocks

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow users to switch between chart type variations via the block toolbar without causing JavaScript errors or editor crashes
- **FR-002**: System MUST update the chart block's inner attributes (especially `layout.type`, `independentAxis.scale`, `dataRender.xScale`) to match the selected variation's requirements
- **FR-003**: System MUST preserve data compatibility where possible when switching between chart types with similar scale families
- **FR-004**: System MUST preserve chart metadata (title, subtitle, source, note, tag, alt text) across all chart type transitions
- **FR-005**: System MUST preserve color assignments when switching chart types, unless the new type requires fewer/different color mappings
- **FR-006**: System SHOULD provide visual feedback or warning when switching between incompatible chart type families
- **FR-007**: System MUST not corrupt or lose underlying table data when switching chart types
- **FR-008**: System MUST update legend marker style appropriately for new chart type (rect for bars, line for line charts)
- **FR-009**: System MUST recalculate chart dimensions and padding when switching to chart types with different layout needs (e.g., bar charts need more left padding for category labels)
- **FR-010**: System SHOULD apply sensible default configurations from variation templates when switching to a new chart type, while preserving user customizations where applicable

### Technical Requirements

- **TR-001**: Variation transforms MUST update the child chart block's attributes, not just the controller's `chartType` attribute
- **TR-002**: Scale type validation MUST occur before rendering to catch incompatibilities before they cause charting library errors
- **TR-003**: Chart type transition logic SHOULD be implemented in a reusable utility function for maintainability
- **TR-004**: Error boundaries SHOULD be added around chart rendering to gracefully handle any remaining edge cases

### Key Entities

- **Controller Block**: Parent wrapper containing `chartType` attribute and providing context to child blocks
- **Chart Block**: Inner block with all rendering configuration in nested attributes (`layout`, `independentAxis`, `dependentAxis`, `dataRender`, etc.)
- **Variation**: WordPress block variation defining a chart type with attributes and innerBlocks template
- **Scale Configuration**: Attribute determining how axis data is interpreted (`ordinal`, `time`, `linear`)
- **Variation Template**: Default attribute configuration for each chart type, defined in `.shared/variation-templates/`

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can switch between any two chart types within the same scale family without errors 100% of the time
- **SC-002**: Users can attempt to switch between any chart types without editor crashes or loss of data
- **SC-003**: Chart metadata (title, subtitle, source, note) is preserved 100% of the time when switching chart types
- **SC-004**: No JavaScript console errors appear when switching between compatible chart types
- **SC-005**: Switching chart types completes within 500ms (no noticeable lag in editor)
- **SC-006**: Users can undo a chart type switch to return to previous state

### Assumptions

- The underlying charting library (`prc-charting-library`) supports all chart types with appropriate configurations
- Variation templates in `.shared/variation-templates/` contain valid, tested configurations for each chart type
- The WordPress block variation API correctly triggers `isActive` callbacks when variations change
- Users have access to the block toolbar where variation picker is available
- The chart's table data is stored separately in a sibling block and is not affected by chart type changes
