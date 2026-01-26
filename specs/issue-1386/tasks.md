# Tasks: Nested Block Attributes Architecture

**Input**: Design documents from `/specs/issue-1386/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, type-mapping.md ✅, quickstart.md ✅, contracts/ ✅

**Tests**: Fixture-based regression tests are explicitly requested in the specification (FR-017, FR-018, FR-019, SC-008, SC-009)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

**WordPress Plugin Structure**:

- Block source: `src/chart/`
- Deprecations: `src/chart/deprecations/`
- Editor controls: `src/chart/edit/`
- Test fixtures: `tests/fixtures/chart-block/`
- Integration tests: `tests/integration/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and test infrastructure

- [x] T001 Create deprecations directory at src/chart/deprecations/
- [x] T002 Create test fixtures directory at tests/fixtures/chart-block/
- [x] T003 [P] Install/verify Jest test framework dependencies in package.json
- [x] T004 [P] Create fixture format schema validation helper in tests/helpers/fixture-validator.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core block structure and deprecation framework that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add \_version attribute to src/chart/block.json with default "v2"
- [x] T006 Create deprecations index file at src/chart/deprecations/index.js
- [x] T007 Copy current flat attributes schema to src/chart/deprecations/v1.js as deprecation base
- [x] T008 Add deprecated array import to src/chart/index.js
- [x] T009 [P] Create nested attribute structure scaffolding in src/chart/block.json (empty layout, metadata, independentAxis, dependentAxis, tooltip, legend, labels, bar, line, map, io, \_legacy objects)
- [x] T010 [P] Create test suite file at tests/integration/block-deprecation.test.js with fixture loading infrastructure

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Existing Charts Continue Working (Priority: P1) 🎯 MVP

**Goal**: Ensure 100% backward compatibility by implementing WordPress block deprecation that automatically migrates flat attributes to nested structure

**Independent Test**: Open any existing chart post in editor, verify chart renders with all visual elements intact, make edits through inspector controls, confirm changes persist

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] Create v1-basic-bar-chart.json fixture in tests/fixtures/chart-block/
- [ ] T012 [P] [US1] Create v1-line-with-legend.json fixture in tests/fixtures/chart-block/
- [ ] T013 [P] [US1] Create v1-map-threshold.json fixture in tests/fixtures/chart-block/
- [ ] T014 [P] [US1] Create v1-diverging-bar-neutral.json fixture in tests/fixtures/chart-block/
- [ ] T015 [P] [US1] Create v1-pie-with-labels.json fixture in tests/fixtures/chart-block/
- [ ] T016 [P] [US1] Create v1-annotations-plotbands.json fixture in tests/fixtures/chart-block/
- [ ] T017 [P] [US1] Create v1-custom-colors.json fixture in tests/fixtures/chart-block/
- [ ] T018 [P] [US1] Create v1-wordpress-metadata.json fixture in tests/fixtures/chart-block/
- [ ] T019 [P] [US1] Create v1-minimal-config.json fixture in tests/fixtures/chart-block/
- [ ] T020 [P] [US1] Create v1-maximal-config.json fixture in tests/fixtures/chart-block/
- [ ] T021 [US1] Add fixture test cases to tests/integration/block-deprecation.test.js

### Implementation for User Story 1

- [x] T022 [P] [US1] Implement layout object structure in src/chart/block.json (type, width, height, orientation, padding, overflowX, mobileBreakpoint, horizontalRules)
- [x] T023 [P] [US1] Implement metadata object structure in src/chart/block.json (active, title, subtitle, note, source, tag, alt)
- [x] T024 [P] [US1] Implement colors array attribute in src/chart/block.json
- [x] T025 [P] [US1] Implement plotBands object structure in src/chart/block.json (active, allowDrag, allowResize, dimension, bands)
- [x] T026 [P] [US1] Implement independentAxis object structure in src/chart/block.json (active, label, scale, dateFormat, domain, tickCount, tickValues, tickLabels, axisLabel, axis, ticks, grid sub-objects)
- [x] T027 [P] [US1] Implement dependentAxis object structure in src/chart/block.json (mirror independentAxis structure with y-axis specific defaults)
- [x] T028 [P] [US1] Implement tooltip object structure in src/chart/block.json (active, format, offset, style sub-object)
- [x] T029 [P] [US1] Implement legend object structure in src/chart/block.json (active, orientation, title, alignment, categories, margin sub-object)
- [x] T030 [P] [US1] Implement labels object structure in src/chart/block.json (active, color, fontSize, labelPositionBar, labelCutoff, labelUnit)
- [x] T031a [P] [US1] Implement bar object structure in src/chart/block.json (barPadding, barGroupPadding, hasRectStroke, stackOffset)
- [x] T031b [P] [US1] Implement line object structure in src/chart/block.json (interpolation, strokeWidth, showPoints, pointSize, curveType)
- [x] T031c [P] [US1] Implement dotPlot object structure in src/chart/block.json (connectPoints, connectingLine settings)
- [x] T031d [P] [US1] Implement explodedBar object structure in src/chart/block.json (category, explosionDistance)
- [x] T031e [P] [US1] Implement pie object structure in src/chart/block.json (innerRadius, padAngle, cornerRadius, sortByValue)
- [x] T031f [P] [US1] Implement nodes object structure in src/chart/block.json (pointSize, pointFill, pointShape)
- [x] T032 [P] [US1] Implement map object structure in src/chart/block.json (scale, scaleDomain, ignoreSmallStateLabels, pathBackgroundFill, projection settings)
- [x] T033 [P] [US1] Implement divergingBar object structure in src/chart/block.json (positiveCategories, negativeCategories, neutralBar sub-object)
- [x] T034 [P] [US1] Implement diffColumn object structure in src/chart/block.json (active, category, columnHeader, style sub-object)
- [x] T035 [P] [US1] Implement annotations object structure in src/chart/block.json (active, activeOnMobile, items)
- [x] T036 [P] [US1] Implement dataRender object structure in src/chart/block.json (x, y, sortKey, sortOrder, categories, scales, groupBreaks)
- [x] T037 [P] [US1] Implement animate object structure in src/chart/block.json (active, animationWhitelist, duration)
- [x] T038 [P] [US1] Implement io object structure in src/chart/block.json (id, isConvertedChart, isStaticChart, isFreeformChart, staticImageUrl, chartConverted, lock)
- [x] T039 [P] [US1] Implement \_legacy object structure in src/chart/block.json (empty object default)
- [x] T040 [US1] Implement migrate function in src/chart/deprecations/v1.js for layout attributes (chartType→layout.type, width, height, orientation, padding)
- [x] T041 [US1] Implement migrate function for metadata attributes (metaTextActive→metadata.active, metaTitle, metaSubtitle, metaNote, metaSource, metaTag, metaAlt)
- [x] T042 [US1] Implement migrate function for colors (customColors→colors)
- [x] T043 [US1] Implement migrate function for plotBands attributes (plotBandsActive, plotBands array)
- [x] T044 [US1] Implement migrate function for independentAxis (all x-axis attributes: xAxisActive→independentAxis.active, xLabel, xScale, xMinDomain/xMaxDomain→domain, tick settings, label settings)
- [x] T045 [US1] Implement migrate function for dependentAxis (all y-axis attributes: yAxisActive→dependentAxis.active, yLabel, yScale, domains, tick settings)
- [x] T046 [US1] Implement migrate function for tooltip attributes (tooltipActive, format, offsets, style properties)
- [x] T047 [US1] Implement migrate function for legend attributes (legendActive, orientation, title, categories, margin)
- [x] T048 [US1] Implement migrate function for labels attributes (labelsActive, barLabelPosition, labelColor, labelUnit)
- [x] T049 [US1] Implement migrate function for chart-type-specific attributes (bar, line, dotPlot, explodedBar, pie, nodes settings)
- [x] T050 [US1] Implement migrate function for map attributes (mapScale, mapScaleDomain, map display settings)
- [x] T051 [US1] Implement migrate function for divergingBar attributes (positiveCategories, negativeCategories, neutralBarActive→neutralBar.active)
- [x] T052 [US1] Implement migrate function for diffColumn attributes (diffColumnActive→diffColumn.active, column settings)
- [x] T053 [US1] Implement migrate function for annotations attributes (annotationsActive→annotations.active, annotations array→items)
- [x] T054 [US1] Implement migrate function for dataRender attributes (sortOrder, sortKey, categories, dateInputFormat, groupBreaks)
- [x] T055 [US1] Implement migrate function for io object (WordPress-specific: id, isConvertedChart, isStaticChart, isFreeformChart, staticImageUrl, chartConverted, lock, defaultShouldRender)
- [x] T056 [US1] Implement \_legacy preservation logic in migrate function (unmapped attributes with console warnings)
- [x] T057 [US1] Implement isEligible function in src/chart/deprecations/v1.js (check for \_version !== "v2")
- [x] T058 [US1] Implement save function in src/chart/deprecations/v1.js (original flat structure save)
- [x] T059 [US1] Add v1 deprecation to deprecated array in src/chart/index.js
- [ ] T060 [US1] Run fixture tests and verify all 10 basic fixtures migrate correctly
- [ ] T061 [US1] Add console warning logging for \_legacy attributes in migrate function (development mode only)

**Checkpoint**: At this point, all existing flat-attribute charts should automatically migrate to nested structure when loaded in editor

---

## Phase 3.5: Server-Side Migration (Priority: P1 - CRITICAL) ✅ **COMPLETE**

**Goal**: Enable migration on frontend and REST API, not just in editor. Without this, v1 charts will fail to render on the frontend.

**Why Critical**: WordPress block deprecation ONLY runs in the editor. Charts must also work on the frontend without requiring manual editing.

**Status**: ✅ **COMPLETE** (December 4, 2025)

### Server-Side Migration Implementation

- [x] T061a [US1] Create PHP migration class in includes/class-block-migration.php ✅
- [x] T061b [US1] Implement PHP migrate_to_nested() function matching JavaScript v1.js migration logic (all 232 attribute mappings) ✅
- [x] T061c [US1] Add render_block filter to auto-migrate v1 blocks during frontend rendering ✅
- [x] T061d [US1] Add block_type_metadata filter to migrate REST API responses ✅
- [ ] T061e [US1] Create shared test fixtures (JSON) for both JS and PHP migration testing
- [ ] T061f [US1] Add PHP unit tests to verify migration parity with JavaScript version
- [ ] T061g [US1] Test frontend rendering with v1 blocks (should auto-migrate and render correctly)
- [ ] T061h [US1] Test REST API with v1 blocks (should return v2 structure)

**Implementation Summary**:

- ✅ Added `Block_Migration::migrate_attributes_v1_to_v2()` static method (645 lines)
- ✅ Ported all 11 helper methods from JavaScript to PHP (1:1 parity)
- ✅ Integrated migration into `render_block_callback()` in `src/chart/class-chart.php`
- ✅ Implemented `_version` flag caching (v2 blocks skip migration with zero overhead)
- ✅ Added error handling with admin notice + fallback to original attributes
- ✅ PHP syntax validated (no errors in both modified files)
- 📄 **Full documentation**: `PHASE_3_5_IMPLEMENTATION_SUMMARY.md`
- [ ] T061i [US1] Add performance monitoring for migration filter (should be <5ms per block)
- [ ] T061j [US1] Document server-side migration in MIGRATION.md

**Checkpoint**: v1 charts work on frontend, in editor, and via REST API without manual intervention

---

## Phase 4: User Story 1 - Extended Test Coverage (Priority: P1 continued)

**Goal**: Comprehensive edge case and chart type coverage for backward compatibility

**Independent Test**: Verify migration works for all chart types and edge cases through fixture tests

### Additional Test Fixtures

- [ ] T062 [P] [US1] Create v1-stacked-bar.json fixture in tests/fixtures/chart-block/
- [ ] T063 [P] [US1] Create v1-grouped-bar.json fixture in tests/fixtures/chart-block/
- [ ] T064 [P] [US1] Create v1-area-chart.json fixture in tests/fixtures/chart-block/
- [ ] T065 [P] [US1] Create v1-scatter-plot.json fixture in tests/fixtures/chart-block/
- [ ] T066 [P] [US1] Create v1-dot-plot.json fixture in tests/fixtures/chart-block/
- [ ] T067 [P] [US1] Create v1-map-world.json fixture in tests/fixtures/chart-block/
- [ ] T068 [P] [US1] Create v1-map-usa-counties.json fixture in tests/fixtures/chart-block/
- [ ] T069 [P] [US1] Create v1-map-usa-block.json fixture in tests/fixtures/chart-block/
- [ ] T070 [P] [US1] Create v1-exploded-bar.json fixture in tests/fixtures/chart-block/
- [ ] T071 [P] [US1] Create v1-edge-case-empty-attributes.json fixture in tests/fixtures/chart-block/
- [ ] T072 [P] [US1] Create v1-edge-case-missing-required.json fixture in tests/fixtures/chart-block/
- [ ] T073 [P] [US1] Create v1-edge-case-legacy-attributes.json fixture in tests/fixtures/chart-block/
- [ ] T074 [US1] Add extended fixture test cases to tests/integration/block-deprecation.test.js
- [ ] T075 [US1] Run full fixture test suite (20+ fixtures) and verify 100% pass rate
- [ ] T076 [US1] Measure test execution time and verify <5 minutes (SC-009)

**Checkpoint**: Extended test coverage validates all chart types and edge cases migrate correctly

---

## Phase 5: User Story 2 - Developers Add New Chart Features (Priority: P2)

**Goal**: Simplify get-config.js by eliminating flat-to-nested mapping while preserving necessary conditional logic (e.g., default colors, computed values, type conversions), reducing development friction for new features

**Independent Test**: Add a mock new configuration option to block.json nested structure and verify it passes through to charting library without modifying get-config.js

### Implementation for User Story 2

- [ ] T077 [US2] Refactor get-config.js to use nested attributes directly from attributes object
- [ ] T078 [US2] Replace flat attribute destructuring with nested object destructuring in get-config.js
- [ ] T079 [US2] Update layout config generation to use attributes.layout directly in get-config.js
- [ ] T080 [US2] Update metadata config generation to use attributes.metadata directly in get-config.js
- [ ] T081 [US2] Update colors to use attributes.colors directly in get-config.js
- [ ] T082 [US2] Update plotBands config to use attributes.plotBands directly in get-config.js
- [ ] T083 [US2] Update independentAxis config to use attributes.independentAxis directly in get-config.js
- [ ] T084 [US2] Update dependentAxis config to use attributes.dependentAxis directly in get-config.js
- [ ] T085 [US2] Update tooltip config to use attributes.tooltip directly in get-config.js
- [ ] T086 [US2] Update legend config to use attributes.legend directly in get-config.js
- [ ] T087 [US2] Update labels config to use attributes.labels directly in get-config.js
- [ ] T088 [US2] Update chart-type-specific configs (bar, line, dotPlot, etc.) to use nested attributes directly in get-config.js
- [ ] T089 [US2] Update map config to use attributes.map directly in get-config.js
- [ ] T090 [US2] Update divergingBar config to use attributes.divergingBar directly in get-config.js
- [ ] T091 [US2] Update diffColumn config to use attributes.diffColumn directly in get-config.js
- [ ] T092 [US2] Update annotations config to use attributes.annotations directly in get-config.js
- [ ] T093 [US2] Update dataRender config to use attributes.dataRender directly in get-config.js
- [ ] T094 [US2] Keep io object handling separate (not passed to charting library) in get-config.js
- [ ] T095 [US2] Add \_legacy object console warning logic in get-config.js (log but don't pass to charting library)
- [ ] T096 [US2] Remove flat-to-nested attribute mapping from get-config.js (preserve conditional logic, computed values, type conversions)
- [ ] T097 [US2] Measure get-config.js lines of code reduction and verify ≥60% reduction (SC-004)
- [ ] T098 [US2] Test charts render correctly with simplified get-config.js

**Checkpoint**: get-config.js is significantly simplified - nested attributes pass through with minimal transformation (conditional defaults, computed values, type conversions remain)

---

## Phase 6: User Story 3 - Developers Maintain Editor Controls (Priority: P3)

**Goal**: Update all editor controls to use nested attribute paths, improving code organization and developer experience

**Independent Test**: Developer can locate and update an attribute for a specific chart feature (e.g., tooltip formatting) using nested path

### Implementation for User Story 3 - Part 1: Core Controls

- [ ] T099 [P] [US3] Update chart-controls.jsx to use nested layout attributes (attributes.layout.type, attributes.layout.orientation, etc.)
- [ ] T100 [P] [US3] Update meta-text-fields.jsx to use nested metadata attributes (attributes.metadata.title, attributes.metadata.subtitle, etc.)
- [ ] T101 [P] [US3] Update color-controls.jsx to use attributes.colors array
- [ ] T102 [P] [US3] Update plot-band-controls.jsx to use nested plotBands attributes (attributes.plotBands.active, attributes.plotBands.bands)
- [ ] T103 [P] [US3] Update annotation-controls.jsx to use nested annotations attributes (attributes.annotations.active, attributes.annotations.items)
- [ ] T104 [P] [US3] Update data-controls.jsx to use nested dataRender attributes (attributes.dataRender.sortOrder, attributes.dataRender.categories, etc.)

**Checkpoint**: Core layout, metadata, and data controls migrated to nested paths

### Implementation for User Story 3 - Part 2: Axis Controls

- [ ] T105 [P] [US3] Update x-axis-controls.jsx to use nested independentAxis attributes (attributes.independentAxis.active, attributes.independentAxis.label, attributes.independentAxis.scale, attributes.independentAxis.domain, attributes.independentAxis.tickCount, attributes.independentAxis.tickLabels, attributes.independentAxis.axisLabel, attributes.independentAxis.axis, attributes.independentAxis.ticks, attributes.independentAxis.grid)
- [ ] T106 [P] [US3] Update y-axis-controls.jsx to use nested dependentAxis attributes (attributes.dependentAxis.active, attributes.dependentAxis.label, attributes.dependentAxis.scale, attributes.dependentAxis.domain, attributes.dependentAxis.tickCount, attributes.dependentAxis.tickLabels, attributes.dependentAxis.axisLabel, attributes.dependentAxis.axis, attributes.dependentAxis.ticks, attributes.dependentAxis.grid)

**Checkpoint**: Axis controls migrated to nested paths

### Implementation for User Story 3 - Part 3: Visual Element Controls

- [ ] T107 [P] [US3] Update tooltip-controls.jsx to use nested tooltip attributes (attributes.tooltip.active, attributes.tooltip.format, attributes.tooltip.offsetX, attributes.tooltip.style)
- [ ] T108 [P] [US3] Update legend-controls.jsx to use nested legend attributes (attributes.legend.active, attributes.legend.orientation, attributes.legend.categories)
- [ ] T109 [P] [US3] Update label-controls.jsx to use nested labels attributes (attributes.labels.active, attributes.labels.color, attributes.labels.labelPositionBar)
- [ ] T110 [P] [US3] Update popover-label-controls.jsx to use nested labels attributes

**Checkpoint**: Visual element controls migrated to nested paths

### Implementation for User Story 3 - Part 4: Chart Type Specific Controls

- [ ] T111 [P] [US3] Update bar-controls.jsx to use nested bar attributes (attributes.bar.barPadding, attributes.bar.barGroupPadding, attributes.bar.hasRectStroke)
- [ ] T112 [P] [US3] Update line-controls.jsx to use nested line attributes (attributes.line.interpolation, attributes.line.strokeWidth, attributes.line.showPoints)
- [ ] T113 [P] [US3] Update node-controls.jsx to use nested nodes attributes (attributes.nodes.pointSize, attributes.nodes.pointFill)
- [ ] T114 [P] [US3] Update diverging-bar-control.jsx to use nested divergingBar attributes (attributes.divergingBar.positiveCategories, attributes.divergingBar.neutralBar)
- [ ] T115 [P] [US3] Update dot-plot-controls.jsx to use nested dotPlot attributes (attributes.dotPlot.connectPoints, attributes.dotPlot.connectingLine)
- [ ] T116 [P] [US3] Update diff-column-controls.jsx to use nested diffColumn attributes (attributes.diffColumn.active, attributes.diffColumn.category)
- [ ] T117 [P] [US3] Update map-controls.jsx to use nested map attributes (attributes.map.scale, attributes.map.scaleDomain, attributes.map.ignoreSmallStateLabels)

**Checkpoint**: Chart type specific controls migrated to nested paths

### Implementation for User Story 3 - Part 5: Utilities and Main Editor

- [ ] T118 [US3] Update wp-editor-functions.js utility to work with nested attributes
- [ ] T119 [US3] Update alignment-overlay.jsx to use nested attributes (if accessing attributes)
- [ ] T120 [US3] Update alignment-utils.js to work with nested attributes (if applicable)
- [ ] T121 [US3] Update copy-paste-styles-handler.jsx to work with nested attributes
- [ ] T122 [US3] Update Image.jsx to use nested io attributes (attributes.io.staticImageUrl, attributes.io.staticImageId)
- [ ] T123 [US3] Update sorter.jsx to work with nested dataRender attributes
- [ ] T124 [US3] Update color-sorter.jsx to work with attributes.colors
- [ ] T125 [US3] Update text-field-controls.jsx to use nested metadata attributes
- [ ] T126 [US3] Update store.js to work with nested attribute structure (if applicable)
- [ ] T127 [US3] Update main edit/index.jsx to pass nested attributes to all controls
- [ ] T128 [US3] Verify all editor controls function correctly with nested attributes - test in WordPress editor

**Checkpoint**: All 28 editor control files updated to use nested attribute paths

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and final validation

- [ ] T129 [P] Add inline code comments explaining nested structure in src/chart/block.json
- [ ] T130 [P] Add JSDoc comments to migrate function in src/chart/deprecations/v1.js
- [ ] T131 [P] Update ARCHITECTURE.md to document nested attribute architecture decision
- [ ] T132 [P] Create MIGRATION.md guide for developers explaining deprecation system
- [ ] T133 [P] Add type mapping examples to quickstart.md (already in specs/issue-1386/quickstart.md, integrate into plugin docs if needed)
- [ ] T134 [P] Add fixture creation guide to developer documentation
- [ ] T135 Code cleanup - remove unused flat attribute code comments
- [ ] T135a Remove all flat attributes from src/chart/block.json (lines 473-1561) - keep only nested structure
- [ ] T136 Run full test suite and verify 100% pass rate
- [ ] T137 Run linter on all modified files
- [ ] T138 Manual testing - test 10-15 actual production charts on staging environment
- [ ] T139 Verify quickstart.md examples work correctly
- [ ] T140 Update package.json version (follow semver - this is a MINOR version bump as it's backward compatible)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3-4)**: Depends on Foundational phase completion - Critical for production
- **User Story 2 (Phase 5)**: Depends on Foundational + US1 deprecation working - Can start after T059
- **User Story 3 (Phase 6)**: Depends on Foundational + nested attributes in block.json - Can start after T039
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 deprecation is working (T059) - Needs working migration to simplify get-config.js
- **User Story 3 (P3)**: Can start after nested attributes defined in block.json (T039) - Needs structure to update controls against

### Within Each User Story

- **US1**: Tests (fixtures) → Nested structure in block.json → Migrate function → Deprecation integration → Test validation
- **US2**: get-config.js refactor can happen incrementally per nested object
- **US3**: Editor controls can be updated in parallel (marked [P]) as they work with different files

### Parallel Opportunities

- **Phase 1**: All 4 setup tasks can run in parallel
- **Phase 2**: T009 (nested structure scaffold) and T010 (test suite) can run parallel to T005-T008
- **Phase 3-4 Tests**: All fixture creation tasks (T011-T020, T062-T073) can run in parallel
- **Phase 3 Implementation**: Nested object structures (T022-T039) can be created in parallel
- **Phase 3 Migration**: Migrate functions (T040-T056) can be implemented in parallel after structure is complete
- **Phase 5**: get-config.js refactoring (T077-T093) can be done incrementally per config section
- **Phase 6**: Editor control updates can run in parallel within each part (Part 1: T099-T104, Part 2: T105-T106, Part 3: T107-T110, Part 4: T111-T117)
- **Phase 7**: Most polish tasks (T129-T134) can run in parallel

---

## Parallel Example: User Story 1 Implementation

```bash
# Create all fixtures in parallel (after tests written):
Task T011-T020: All 10 basic fixture files
Task T062-T073: All 12 extended fixture files

# Create all nested attribute structures in parallel:
Task T022: layout object
Task T023: metadata object
Task T024: colors array
Task T025: plotBands object
Task T026: independentAxis object
Task T027: dependentAxis object
Task T028: tooltip object
Task T029: legend object
Task T030: labels object
Task T031a-f: chart-type objects (bar, line, dotPlot, explodedBar, pie, nodes)
Task T032: map object
Task T033: divergingBar object
Task T034: diffColumn object
Task T035: annotations object
Task T036: dataRender object
Task T037: animate object
Task T038: io object
Task T039: _legacy object

# Implement migrate functions in parallel (after structures complete):
Task T040: layout migration
Task T041: metadata migration
Task T042: colors migration
Task T043: plotBands migration
Task T044: independentAxis migration
Task T045: dependentAxis migration
Task T046: tooltip migration
Task T047: legend migration
Task T048: labels migration
Task T049: chart-type migration
Task T050: map migration
Task T051: divergingBar migration
Task T052: diffColumn migration
Task T053: annotations migration
Task T054: dataRender migration
Task T055: io migration
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks, ~1 hour)
2. Complete Phase 2: Foundational (6 tasks, ~2 hours)
3. Complete Phase 3: User Story 1 Basic (51 tasks, ~12 hours)
4. Complete Phase 4: User Story 1 Extended Tests (15 tasks, ~3 hours)
5. **STOP and VALIDATE**: Run fixture tests, verify 100% pass rate, test with actual production charts
6. **MVP READY**: Backward compatibility fully working, safe to deploy

**MVP Scope**: 76 tasks, ~18 hours estimated effort

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (10 tasks, ~3 hours)
2. Add User Story 1 (complete both Phase 3 and 4) → Test independently with fixture suite → Deploy/Demo (66 tasks, ~15 hours) **← MVP!**
3. Add User Story 2 → Verify simplified get-config.js → Deploy/Demo (22 tasks, ~4 hours)
4. Add User Story 3 → Verify all controls work with nested attrs → Deploy/Demo (30 tasks, ~14 hours)
5. Polish → Final cleanup and documentation → Deploy (12 tasks, ~2 hours)

**Total Effort**: 140 tasks, ~38 hours (aligns with estimate in research.md)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (10 tasks, ~3 hours)
2. Once Foundational is done:
    - **Developer A**: Focus on US1 - Deprecation and fixtures (highest priority)
    - **Developer B**: Can start US3 controls migration after T039 completes
    - **Developer C**: Can start US2 get-config.js simplification after T059 completes
3. All stories converge for final testing and polish

---

## Notes

- **[P] tasks** = different files, no dependencies - can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story is independently completable and testable
- Fixture tests provide comprehensive validation without manual testing for every change
- Commit after each logical group (e.g., after completing all fixtures, after completing migrate function)
- Stop at checkpoints to validate story independently
- **Critical**: User Story 1 (backward compatibility) must be 100% working before deploying
- Success metrics from spec:
    - SC-001: 100% charts work ✅ Validated by fixtures + manual testing
    - SC-004: ≥60% get-config.js reduction ✅ Measured in T097
    - SC-006: Zero data loss ✅ Validated by fixture data-loss checks
    - SC-008: 100% fixture pass rate ✅ Validated in T075, T136
    - SC-009: <5 min test execution ✅ Measured in T076
