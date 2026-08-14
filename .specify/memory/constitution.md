<!--
════════════════════════════════════════════════════════════════════════════════
SYNC IMPACT REPORT
════════════════════════════════════════════════════════════════════════════════
Version Change: Initial Creation → 1.0.0
Date: 2025-11-06

CREATED SECTIONS:
  + Core Principles (5 principles defined)
  + WordPress Integration Requirements
  + Development Standards
  + Governance

PRINCIPLES DEFINED:
  1. Block-Based Architecture (NON-NEGOTIABLE)
  2. PRC Charting Library Integration
  3. WordPress Data Patterns
  4. Separation of Concerns
  5. Editor-First UX

TEMPLATES STATUS:
  ✅ plan-template.md - Constitution Check section can reference these principles
  ✅ spec-template.md - Requirements align with WordPress block development
  ✅ tasks-template.md - Task organization supports block-based development
  ⚠️  No commands directory found - skipping command file validation

FOLLOW-UP ITEMS:
  - None (all placeholders filled)

NOTES:
  - Ratification date set to today (first constitution)
  - Last amended date same as ratification (initial version)
  - Constitution reflects current v3.2.2 plugin architecture
  - Principles derived from docs/plugins/prc-chart-builder/architecture.md and actual implementation patterns
════════════════════════════════════════════════════════════════════════════════
-->

# PRC Chart Builder Constitution

## Core Principles

### I. Block-Based Architecture (NON-NEGOTIABLE)

All features MUST be implemented as WordPress blocks following the block editor paradigm. The plugin provides exactly three block types:

1. **Chart Block** - Renders visualizations using PRC Charting Library
2. **Controller Block** - Handles data processing, transformations, and peripheral UI (share/data tabs)
3. **Synced Chart Block** - Enables chart reuse across posts via WordPress entities

**Rationale:** WordPress block architecture ensures first-class editor integration, real-time collaboration support, and consistent user experience. Deviating from block patterns breaks WordPress conventions and editor functionality.

**Requirements:**

- MUST register all blocks via `block.json` with proper metadata
- MUST use `@wordpress/scripts` build tooling for consistency
- MUST NOT create features outside the block system (e.g., separate React apps)
- Block attributes MUST be the single source of truth for persistence

### II. PRC Charting Library Integration

All chart rendering MUST use the PRC Charting Library (located at `../prc-charting-library`, accessed by window.prcChartingLibrary or window.prcCustomCharts if flagged as custom). The chart builder is a WordPress integration layer, NOT an independent charting library.

**Rationale:** The PRC Charting Library handles chart rendering and layout styling. This separation allows the charting library to evolve independently while the plugin focuses on WordPress integration, data processing, and editor UX.

**Requirements:**

- MUST NOT implement chart rendering logic within the plugin
- MUST pass configuration objects conforming to PRC Charting Library's API
- Layout styling MUST be handled by the charting library
- Plugin responsibility limited to: data transformation, WordPress integration, editor controls

### III. WordPress Data Patterns

State management and data persistence MUST follow WordPress-native patterns. External state libraries (Redux, MobX, etc.) are NOT permitted without explicit architectural justification.

**Rationale:** WordPress provides robust data management through `@wordpress/data` stores, block attributes, and the Interactivity API. These patterns provide real-time collaboration, undo/redo, and persistence automatically. External state libraries create complexity without providing benefits in the WordPress context.

**Requirements:**

- MUST use block attributes as primary persistence mechanism
- MUST use `@wordpress/data` for editor state management
- MUST use WordPress Interactivity API for frontend interactivity
- MUST use Block Context for parent-child communication
- External state libraries require documentation of why WordPress patterns are insufficient

**Acceptable patterns:**

- Block attributes for persisted data
- `@wordpress/data` stores for editor-only state
- WordPress Interactivity API for frontend user interactions
- Block Context for passing data to InnerBlocks

### IV. Separation of Concerns

Clear separation MUST be maintained between data processing (Controller), rendering (Chart), and reuse (Synced Chart).

**Rationale:** This separation enables independent testing, clear responsibilities, and maintainable code. The Controller handles WordPress editor concerns; the Chart handles rendering; Synced Charts handle entity relationships.

**Requirements:**

- Controller Block MUST handle: table data input, data transformations, tab UI, share functionality
- Chart Block MUST handle: PRC Charting Library integration, chart configuration, rendering
- Synced Chart Block MUST handle: entity relationships, chart search, sync management
- Blocks MUST NOT duplicate responsibilities
- Data flow MUST be unidirectional: Controller → Chart (via attributes or context)

### V. Editor-First UX

All features MUST be designed for the WordPress block editor first. Frontend rendering is a separate concern using the Interactivity API.

**Rationale:** The primary user is a content creator in the WordPress editor. Editor UX must be intuitive, use native WordPress controls, and provide immediate visual feedback. Frontend interactivity is a secondary concern handled via WordPress's Interactivity API.

**Requirements:**

- MUST use WordPress components (`@wordpress/components`) for editor UI
- MUST provide real-time visual feedback in the editor
- MUST follow WordPress editor patterns (InspectorControls, BlockControls, etc.)
- Frontend interactivity MUST use WordPress Interactivity API
- MUST NOT compromise editor UX for frontend concerns

## WordPress Integration Requirements

### Block Registration

- All blocks MUST have a `block.json` manifest
- Block metadata MUST include: name, title, category, icon, supports
- Server-side rendering MUST use PHP render callbacks in class files (`class-*.php`)
- Build output MUST match WordPress conventions (`index.js`, `view.js`, `*.asset.php`)

### Data Persistence

- Block attributes are the canonical storage location
- Attributes MUST be serializable (JSON-compatible types only)
- Complex data structures MUST be stored as objects/arrays in attributes
- Database queries for chart entities MUST use WordPress WP_Query patterns

### Testing

- Unit tests for utility functions
- Integration tests for WordPress block registration
- Manual testing in WordPress editor required before release
- Test with WordPress core updates

## Development Standards

### Code Organization

- Source files in `src/[block-name]/`
- Build output in `build/[block-name]/`
- Shared utilities in `includes/`
- PHP classes use WordPress naming conventions (`class-*.php`)
- JavaScript follows WordPress coding standards

### Build Process

- MUST use `@wordpress/scripts` for building
- Build commands defined in `package.json`
- Webpack configuration in `webpack.config.js` when customization needed
- Asset files auto-generated by WordPress dependency extraction

### Documentation

- Architecture decisions documented in `docs/plugins/prc-chart-builder/architecture.md`
- Block configuration documented in `README.md`
- Migration guides in `MIGRATION.md` when making breaking changes
- Inline code comments for complex logic

### Versioning

- Follow semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes to block attributes or PHP APIs
- MINOR: New features, new blocks, backward-compatible changes
- PATCH: Bug fixes, minor improvements
- Update version in `package.json` and plugin header

## Governance

### Amendment Process

1. Proposed changes MUST be documented with rationale
2. Impact analysis required for principle changes
3. Team review and approval required
4. Update `LAST_AMENDED_DATE` when making changes
5. Increment `CONSTITUTION_VERSION` according to semantic versioning

### Constitution Versioning

- **MAJOR bump**: Backward incompatible governance changes, principle removal/redefinition
- **MINOR bump**: New principles added, materially expanded guidance
- **PATCH bump**: Clarifications, wording improvements, non-semantic refinements

### Compliance Review

- All PRs MUST verify compliance with constitution principles
- Architecture decisions that deviate from principles MUST be justified in `docs/plugins/prc-chart-builder/architecture.md`
- Complexity must be justified in implementation plans
- Use `.specify/templates/plan-template.md` for structured planning

### Living Document

- This constitution evolves with the project
- Principles should reflect actual practice, not aspirational goals
- Regular review recommended when architecture patterns change
- Questions about application should be discussed and documented

**Version**: 1.0.0 | **Ratified**: 2025-11-06 | **Last Amended**: 2025-11-06
