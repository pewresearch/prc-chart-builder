# Feature Specification: Nested Block Attributes Architecture

**Feature Branch**: `issue/1386`
**Created**: 2025-11-06
**Status**: Draft
**Input**: User description: "I want to more intelligently group and nest the block attributes for the chart block.json. Currently all block attributes are stored as an object of flat-ish objects with no real hierarchy. For better maintainability, the attributes should more closely match the structure of baseConfig.ts, which itself is beholden to the type specifications laid out in configTypes.ts and insures type security. Currently we do an extra step to convert these attributes to the base config model in get-config.js, but this does not scale well. Ideally all of the types in our block.json attributes will match the types required by the configTypes file. We will need to update all of the edit controls that currently use the flat architecture to support our new architecture. Additionally, we will need to follow wordpress conventions for deprecating blocks, as there are already hundreds of chart blocks in production that use the existing attribute architecture."

## Clarifications

### Session 2025-11-06

- Q: How should the system handle attributes that existed in the flat structure but have no equivalent in the new nested structure? → A: Preserve old charting-related values in a `_legacy` nested object with console warnings for manual review. WordPress-specific attributes (isFreeformChart, staticImageUrl, etc.) that are not relevant to the charting library should be stored in an 'io' object, not treated as legacy.

- Q: How should the nested attribute migration be rolled out to production? → A: Use WordPress's built-in block deprecation system. Migration happens automatically per-block when loaded in the editor - WordPress tries current save function first, then each deprecation in sequence until one validates, then runs the migrate function. This provides transparent, automatic migration without requiring feature flags or manual intervention. Reference: [Block Deprecation API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/)

- Q: How should testing validate that the migration works correctly for all existing chart variations? → A: Fixture-based regression testing. Create JSON fixtures representing each chart type, attribute combination, and edge case (20-30 representative examples). Automated tests load each fixture through the deprecation system, validate the migrated structure, and verify no data loss. This provides fast feedback, catches regressions, and creates reusable test assets for future migrations.

- Q: Should performance optimization be a consideration for nested attribute access patterns? → A: No optimization needed. Modern JavaScript engines handle nested object access efficiently, and editor operations (reading/writing attributes during user interactions) are infrequent compared to render cycles. The added level of object traversal (e.g., `attributes.independentAxis.active` vs `attributes.xAxisActive`) has negligible performance impact.

- Q: How should complex TypeScript types (unions, enums, nested interfaces) be represented in WordPress block.json? → A: Document mapping conventions that define how TypeScript types map to block.json's limited type system. For example: TypeScript enums map to string type with enum values list, union types map to base type with validation in enum array, nested interfaces map to object type with properties defined. This provides clear guidance without requiring runtime validation or TypeScript type simplification.

## User Scenarios & Testing

### User Story 1 - Existing Charts Continue Working (Priority: P1)

Content creators and site administrators open and edit existing chart blocks that were created with the old flat attribute structure. The charts render correctly, all editor controls work properly, and users experience no disruption or data loss.

**Why this priority**: Critical for production stability. Hundreds of existing chart blocks must continue functioning without manual intervention or migration. Any breaking changes would cause immediate production issues and require emergency fixes.

**Independent Test**: Can be fully tested by opening any existing chart post in the editor, verifying all chart elements render correctly, making edits through inspector controls, and confirming changes persist correctly.

**Acceptance Scenarios**:

1. **Given** an existing post contains a chart block created with flat attributes, **When** user opens the post in the editor, **Then** the chart renders with all visual elements intact (bars, lines, axes, labels, tooltips, legends)
2. **Given** an existing chart block is open, **When** user modifies any chart setting via inspector controls, **Then** the change applies immediately and persists after saving
3. **Given** a chart with custom colors, labels, and annotations, **When** user edits the chart, **Then** all customizations remain intact and functional
4. **Given** a chart block created before the attribute restructure, **When** system loads the block, **Then** attributes are automatically transformed to new structure without user action

---

### User Story 2 - Developers Add New Chart Features (Priority: P2)

Plugin developers add new chart configuration options to the PRC Charting Library. They can quickly integrate these new options into the Chart Builder by adding them to the nested attribute structure without extensive refactoring.

**Why this priority**: Enables faster feature development and reduces maintenance burden. Current flat structure requires manual mapping in get-config.js for every new option, making development slower and error-prone.

**Independent Test**: Can be fully tested by adding a new configuration option to the charting library's baseConfig, adding it to the nested block.json structure, and verifying it works in the editor without needing to modify transformation logic.

**Acceptance Scenarios**:

1. **Given** the PRC Charting Library adds a new configuration option, **When** developer adds matching attribute to block.json nested structure, **Then** option is automatically available in charts without additional mapping code
2. **Given** a new chart control is added to the editor, **When** control updates a nested attribute, **Then** the value flows directly to the charting library without intermediate transformation
3. **Given** nested attributes mirror the baseConfig structure, **When** developer references the TypeScript types, **Then** they can determine the exact attribute structure and types needed

---

### User Story 3 - Developers Maintain Editor Controls (Priority: P3)

Plugin developers update or fix editor controls (inspector panels, toolbars, settings). They can easily locate which attributes control which chart features because the nested structure provides clear hierarchical organization.

**Why this priority**: Improves long-term maintainability. Current flat structure makes it difficult to understand relationships between attributes, especially for developers unfamiliar with the codebase.

**Independent Test**: Can be fully tested by having a developer locate and update an attribute for a specific chart feature (e.g., tooltip formatting) and verifying the change is made in the expected nested location with correct typing.

**Acceptance Scenarios**:

1. **Given** a developer needs to modify axis configuration, **When** they open block.json, **Then** all axis-related attributes are grouped under clear nested objects (independentAxis, dependentAxis)
2. **Given** editor controls use nested attribute paths, **When** developer searches for an attribute usage, **Then** the hierarchical path (e.g., `attributes.tooltip.active`) clearly indicates its purpose and context
3. **Given** TypeScript types define the expected structure, **When** developer creates new editor controls, **Then** type checking prevents incorrect attribute structures or types

---

### Edge Cases

- **Removed/renamed charting attributes**: Preserved in `_legacy` object with console warnings for manual review; allows graceful degradation without data loss
- **WordPress-specific attributes**: Non-charting block metadata (isFreeformChart, staticImageUrl, etc.) stored in 'io' object, separate from baseConfig structure
- **Partial migrations**: System handles mixed states where some attributes are nested and others remain flat during migration period
- **Custom/experimental attributes**: Attributes not in standard baseConfig preserved in appropriate location based on type (io vs \_legacy)
- **Attribute conflicts**: When both old flat and new nested attributes exist for same setting, new nested version takes precedence
- **Plugin downgrade**: Charts saved with nested attributes may not fully function if downgraded; version check warnings recommended

## Requirements

### Functional Requirements

- **FR-001**: System MUST preserve all existing chart block data and functionality when transitioning to nested attribute structure
- **FR-002**: System MUST automatically migrate legacy flat attributes to nested structure on block load without user intervention
- **FR-003**: Block attributes MUST be organized in nested objects matching the PRC Charting Library's baseConfig structure (layout, metadata, independentAxis, dependentAxis, tooltip, legend, labels, bar, line, map, etc.)
- **FR-004**: Attribute types in block.json MUST correspond to the charting library's TypeScript definitions following documented type mapping conventions (TypeScript enums → string with enum array, unions → base type with validation, nested interfaces → object with properties)
- **FR-005**: All editor controls (InspectorControls, panels, inputs) MUST be updated to read and write nested attribute paths
- **FR-006**: System MUST implement WordPress block deprecation mechanism using the official deprecation API to support legacy attribute structure alongside new structure
- **FR-007**: Deprecated blocks MUST include transformation functions (migrate) that convert flat attributes to nested structure, following WordPress deprecation patterns where each deprecation defines attributes, supports, save, and migrate functions
- **FR-008**: New chart blocks created after migration MUST use only the nested attribute structure
- **FR-009**: System MUST handle mixed scenarios where some attributes are nested and others remain flat during migration period
- **FR-010**: Configuration transformation logic in get-config.js MUST be significantly simplified by eliminating flat-to-nested mapping, though conditional logic, computed values, and type conversions will remain necessary
- **FR-011**: System MUST maintain backward compatibility with chart blocks saved before the restructure
- **FR-012**: Documentation MUST be updated to reflect new nested attribute structure and provide migration guidance for developers
- **FR-013**: WordPress-specific block attributes (isFreeformChart, staticImageUrl, isStaticChart, etc.) MUST be organized in an 'io' nested object separate from charting configuration
- **FR-014**: Legacy charting attributes with no equivalent in baseConfig MUST be preserved in a '\_legacy' nested object with console warnings emitted for developer review
- **FR-015**: Migration logic MUST distinguish between WordPress block metadata (io) and deprecated charting attributes (\_legacy) to prevent misclassification
- **FR-016**: Deprecations array MUST be ordered in reverse chronological order (most recent first) to allow WordPress to attempt most likely deprecations first, optimizing migration performance
- **FR-017**: System MUST include comprehensive fixture-based regression tests with JSON fixtures for each chart type, attribute combination, and edge case (minimum 20-30 representative examples)
- **FR-018**: Automated tests MUST validate that each fixture successfully migrates through the deprecation system with zero data loss and correct attribute structure
- **FR-019**: Test fixtures MUST be maintained and expanded when new chart features or attribute patterns are added to ensure ongoing migration validation
- **FR-020**: Documentation MUST include type mapping conventions that define how TypeScript configTypes map to WordPress block.json types, providing clear guidance for developers adding new attributes

### Key Entities

- **Block Attributes**: The data structure stored with each chart block instance, currently flat but will become nested to match baseConfig hierarchy. Contains all chart configuration (dimensions, colors, axis settings, labels, tooltips, etc.)

- **Base Configuration (baseConfig)**: The canonical configuration structure defined by the PRC Charting Library with nested objects for different chart aspects (layout, metadata, independentAxis, dependentAxis, tooltip, legend, labels, chart-type-specific settings, etc.)

- **Configuration Types (configTypes)**: TypeScript type definitions that specify the structure and data types for all chart configuration options, ensuring type safety and serving as the source of truth

- **Deprecation Definition**: WordPress block versioning construct that defines how legacy attribute structures should be transformed to current structure, enabling backward compatibility

- **Editor Controls**: UI components (panels, inputs, toggles, selectors) that allow users to modify chart settings, need updating to work with nested attribute paths

- **IO Object**: Nested attribute object containing WordPress-specific block metadata that is not part of the charting library's baseConfig (e.g., isFreeformChart, staticImageUrl, isStaticChart, chartConverted). Separates block management concerns from chart rendering configuration.

- **Legacy Object**: Nested attribute object (\_legacy) that preserves deprecated charting attributes with no equivalent in the new baseConfig structure. Prevents data loss during migration and allows manual review via console warnings.

- **Test Fixtures**: JSON files containing serialized block attributes and HTML markup from various chart configurations at different versions. Used for automated regression testing to validate that deprecation migrations work correctly for all chart types, attribute combinations, and edge cases. Maintained as reusable test assets.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of existing chart blocks (hundreds in production) open and render correctly in the editor without errors or missing elements
- **SC-002**: Developers can add new chart configuration options by only updating block.json and editor controls, without modifying transformation logic
- **SC-003**: Attribute structure in block.json directly mirrors baseConfig structure with less than 5% structural differences (accounting for WordPress-specific needs)
- **SC-004**: Code complexity in get-config.js is reduced by at least 60% as measured by lines of code, primarily by eliminating flat-to-nested attribute mapping while preserving necessary conditional logic, computed values, and type conversions
- **SC-005**: Developer time to add new chart features is reduced by at least 40% compared to current flat structure approach
- **SC-006**: Zero data loss or corruption occurs when opening legacy chart blocks in the new system
- **SC-007**: All editor controls function correctly with nested attributes, with no regression in user experience or functionality
- **SC-008**: Automated fixture-based regression test suite achieves 100% pass rate across all chart type and attribute variation fixtures (minimum 20-30 fixtures)
- **SC-009**: Test execution time for full fixture suite completes in under 5 minutes, enabling rapid iteration during development

### Assumptions

- The PRC Charting Library's baseConfig structure is stable and won't undergo major restructuring during this migration
- TypeScript type definitions in configTypes.ts are complete and accurate for all chart features
- WordPress block deprecation system can handle the complexity of this attribute restructure
- Development team has capacity to update all editor control components to use nested paths
- Testing fixtures can be created representing all critical chart variations and attribute combinations (20-30 representative examples covering all chart types and edge cases)
- WordPress's deprecation system will handle migration automatically per-block when loaded in the editor, providing transparent rollout without requiring feature flags or phased deployment
- Performance impact of nested attribute access is negligible with modern JavaScript engines; no performance optimization strategies needed for attribute reads/writes in editor controls
- Type mapping conventions between TypeScript and WordPress block.json can be clearly documented without requiring runtime validation or modifications to the charting library's type system
