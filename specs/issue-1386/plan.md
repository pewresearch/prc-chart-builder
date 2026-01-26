# Implementation Plan: Nested Block Attributes Architecture

**Branch**: `issue/1386` | **Date**: 2025-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/issue-1386/spec.md`

## Summary

Restructure the Chart Block's flat attribute schema to a nested hierarchy that mirrors the PRC Charting Library's baseConfig structure. This eliminates manual transformation logic, improves maintainability, and enables type safety through direct alignment with TypeScript definitions. Migration uses WordPress's block deprecation API to automatically convert legacy flat attributes to the new nested structure when blocks are loaded, ensuring zero disruption for hundreds of existing production charts. Test fixtures provide comprehensive regression validation across all chart types and attribute combinations.

**Primary Requirement**: Transform ~100 flat block attributes into nested objects (layout, metadata, independentAxis, dependentAxis, tooltip, legend, labels, bar, line, map, io, \_legacy) while maintaining 100% backward compatibility.

**Technical Approach**: WordPress block deprecation with migrate functions, fixture-based regression testing, documented TypeScript-to-JSON type mapping conventions, and phased editor control updates.

## Technical Context

**Language/Version**: JavaScript ES2020+ (WordPress/Gutenberg environment), PHP 7.4+ (WordPress 5.8+)
**Primary Dependencies**:

- `@wordpress/blocks` (block registration and deprecation API)
- `@wordpress/scripts` (build tooling)
- `@wordpress/components` (editor UI controls)
- PRC Charting Library (window.prcChartingLibrary) - TypeScript baseConfig source
- Jest (test framework for fixtures)

**Storage**: WordPress post_content (serialized block attributes), WordPress database for chart entities
**Testing**: Jest for fixture-based regression tests, manual WordPress editor testing for UX validation
**Target Platform**: WordPress 5.8+ block editor (Gutenberg), modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: WordPress plugin with three block types (Chart, Controller, Synced Chart) - focus is Chart block refactor
**Performance Goals**: Editor attribute access <1ms per operation, fixture test suite <5 minutes total execution, zero perceivable performance degradation in editor
**Constraints**: Must maintain WordPress block.json schema compatibility, TypeScript types cannot be directly enforced in JSON, deprecation functions must validate against all historical block versions
**Scale/Scope**: ~100 flat attributes → ~12 nested objects, 20-30 test fixtures, ~28 editor control files to update, hundreds of existing production chart blocks

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Block-Based Architecture ✅ PASS

- **Compliance**: Refactors existing Chart block's internal attribute structure; does not create new blocks or features outside WordPress block system
- **Verification**: Changes confined to `src/chart/block.json`, `src/chart/edit/*` controls, and deprecation definitions; maintains `block.json` manifest and WordPress build process

### PRC Charting Library Integration ✅ PASS

- **Compliance**: Nested attributes directly mirror baseConfig structure, eliminating transformation layer; plugin remains integration layer only
- **Verification**: Attribute structure matches `window.prcChartingLibrary.baseConfig`; get-config.js complexity reduced 60%; no chart rendering logic added to plugin

### WordPress Data Patterns ✅ PASS

- **Compliance**: Uses block attributes as primary storage, WordPress deprecation API for migration, no external state libraries
- **Verification**: Migration logic in `deprecated` array per WordPress standards; block attributes remain single source of truth; no Redux/MobX introduced

### Separation of Concerns ✅ PASS

- **Compliance**: Chart block handles configuration and rendering; attribute structure changes don't affect Controller or Synced Chart blocks
- **Verification**: Changes scoped to Chart block only; Controller data transformation remains separate; unidirectional data flow maintained

### Editor-First UX ✅ PASS

- **Compliance**: Migration transparent to users; editor controls updated to use nested paths; no frontend changes required
- **Verification**: Deprecation API provides seamless migration on block load; InspectorControls updated to access nested attributes; WordPress components continue to be used

**Gate Result**: ✅ ALL CHECKS PASS - Proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```text
specs/issue-1386/
├── plan.md              # This file
├── research.md          # Phase 0: Deprecation patterns, type mapping, fixture strategies
├── data-model.md        # Phase 1: Nested attribute schema definition
├── type-mapping.md      # Phase 1: TypeScript-to-JSON type conventions
├── quickstart.md        # Phase 1: Developer guide for adding nested attributes
├── contracts/           # Phase 1: Deprecation function signatures
│   ├── v1-deprecation-schema.json
│   └── fixture-format-schema.json
└── tasks.md             # Phase 2: NOT created by this command
```

### Source Code (repository root)

```text
plugins/prc-chart-builder/
├── src/
│   └── chart/
│       ├── block.json                 # MODIFY: Restructure attributes to nested
│       ├── index.js                   # MODIFY: Add deprecated array
│       ├── deprecations/              # CREATE: Deprecation definitions
│       │   └── v1.js # CREATE: Legacy flat → nested migration
│       ├── edit/                      # MODIFY: Update all ~28 control files
│       │   ├── *-controls.jsx        # UPDATE: Change attribute access paths
│       │   └── ...
│       └── utils/
│           └── get-config.js          # SIMPLIFY: Remove transformation logic
├── tests/
│   └── fixtures/                      # CREATE: Test fixture directory
│       └── chart-block/               # CREATE: Chart block fixtures
│           ├── v1-basic-bar.json     # CREATE: Flat attribute examples
│           ├── v1-line-with-legend.json
│           ├── v1-map-threshold.json
│           └── ...                    # (20-30 total fixtures)
└── tests/
    └── integration/
        └── block-deprecation.test.js  # CREATE: Fixture-based tests
```

**Structure Decision**: Existing WordPress plugin structure maintained. New deprecation definitions added to `src/chart/deprecations/` directory to keep versioning clear. Test fixtures organized by block type under `tests/fixtures/` following WordPress testing conventions. All modifications confined to Chart block scope, preserving Controller and Synced Chart blocks unchanged.

## Complexity Tracking

> No constitution violations - this section intentionally left empty
