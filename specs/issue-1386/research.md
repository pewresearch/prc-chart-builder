# Research: Nested Block Attributes Architecture

**Feature**: issue/1386 | **Date**: 2025-11-06
**Purpose**: Resolve technical unknowns and establish best practices for WordPress block deprecation, fixture testing, and type mapping

## Research Questions & Resolutions

### 1. WordPress Block Deprecation Best Practices

**Question**: What is the optimal structure and pattern for WordPress block deprecations when migrating complex nested attributes?

**Decision**: Use WordPress's standard deprecation array with separate versioned deprecation files

**Rationale**:

- WordPress docs recommend keeping deprecations in reverse chronological order (most recent first)
- Separate files per version improve maintainability and prevent accidental modification
- Each deprecation is self-contained with its own `attributes`, `supports`, `save`, and `migrate` functions
- Deprecation validation happens automatically; WordPress tries current save first, then each deprecation until one validates

**Implementation Pattern**:

```javascript
// src/chart/deprecations/v1.js
export default {
	attributes: {
		// Full flat attribute schema
		xAxisActive: { type: 'boolean', default: true },
		xLabel: { type: 'string', default: null },
		// ... ~100 flat attributes
	},
	supports: {
		html: false,
		inserter: false,
	},
	save({ attributes }) {
		// Original flat save function
		return (
			<div
				className="wp-block-prc-chart-builder-chart"
				data-attributes={JSON.stringify(attributes)}
			/>
		);
	},
	migrate(oldAttributes) {
		// Transform flat → nested
		return {
			layout: {
				width: oldAttributes.width,
				height: oldAttributes.height,
				// ...
			},
			independentAxis: {
				active: oldAttributes.xAxisActive,
				label: oldAttributes.xLabel,
				// ...
			},
			// ... continue for all nested objects
			io: {
				isFreeformChart: oldAttributes.isFreeformChart,
				staticImageUrl: oldAttributes.staticImageUrl,
				// ... WordPress-specific metadata
			},
			_legacy: {
				// Preserve any attributes that don't map
			},
		};
	},
};
```

**Alternatives Considered**:

- **Inline deprecations in index.js**: Rejected - creates massive file, hard to maintain multiple versions
- **Single migrate function for all versions**: Rejected - WordPress validates save first, then migrates; can't chain migrations
- **Runtime schema validation**: Rejected - WordPress deprecation system handles validation automatically

**References**:

- [WordPress Block Deprecation API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/)
- [Block Deprecation Tutorial](https://developer.wordpress.org/news/2023/03/block-deprecation-a-tutorial/)

---

### 2. Fixture-Based Testing Strategy

**Question**: What format and structure should test fixtures use to validate WordPress block deprecation migrations?

**Decision**: Use JSON fixtures containing serialized block content with both attributes and HTML markup, organized by chart type and complexity

**Rationale**:

- WordPress blocks serialize as HTML comments with JSON attributes: `<!-- wp:prc-chart-builder/chart {...} -->`
- Fixtures should capture this exact format to test the full WordPress parsing → deprecation → migration flow
- Organizing by chart type (bar, line, map, etc.) and complexity (basic, with-legend, with-annotations) ensures comprehensive coverage
- JSON format allows easy versioning and comparison

**Fixture Format**:

```json
{
	"name": "v1-basic-bar-chart",
	"description": "Simple vertical bar chart with flat attributes",
	"blockVersion": "v1",
	"serializedContent": "<!-- wp:prc-chart-builder/chart {\"chartType\":\"bar\",\"width\":640,\"height\":400,\"xAxisActive\":true,\"xLabel\":\"Years\",\"yAxisActive\":true,\"yLabel\":\"Values\"} -->\\n<div class=\"wp-block-prc-chart-builder-chart\"></div>\\n<!-- /wp:prc-chart-builder/chart -->",
	"expectedMigratedAttributes": {
		"layout": {
			"type": "bar",
			"width": 640,
			"height": 400
		},
		"independentAxis": {
			"active": true,
			"label": "Years"
		},
		"dependentAxis": {
			"active": true,
			"label": "Values"
		}
	}
}
```

**Test Coverage Strategy** (minimum 20-30 fixtures):

- **Chart Types** (8 fixtures): bar, line, area, pie, map-usa, map-world, stacked-bar, grouped-bar
- **Feature Combinations** (12 fixtures): with-legend, with-tooltips, with-annotations, with-plot-bands, custom-colors, multiple-axes
- **Edge Cases** (8 fixtures): empty-attributes, missing-required, wordpress-metadata-only, legacy-removed-attributes
- **Complexity Variations** (2-4 fixtures): minimal-config, maximal-config

**Test Implementation**:

```javascript
// tests/integration/block-deprecation.test.js
import { parse } from '@wordpress/blocks';
import fixtures from '../fixtures/chart-block/*.json';

describe('Chart Block Deprecation', () => {
	fixtures.forEach((fixture) => {
		test(`migrates ${fixture.name} correctly`, () => {
			// Parse serialized block content
			const blocks = parse(fixture.serializedContent);
			const migratedBlock = blocks[0];

			// Validate migration
			expect(migratedBlock.attributes).toMatchObject(
				fixture.expectedMigratedAttributes
			);
			expect(migratedBlock.isValid).toBe(true);

			// Verify no data loss
			const oldKeys = Object.keys(fixture.originalAttributes || {});
			const newKeys = getAllNestedKeys(migratedBlock.attributes);
			expect(newKeys.length).toBeGreaterThanOrEqual(oldKeys.length);
		});
	});
});
```

**Alternatives Considered**:

- **Programmatic fixture generation**: Rejected - manual curation ensures edge cases are captured
- **Full database export**: Rejected - too heavy, contains sensitive data, hard to version control
- **Snapshot testing only**: Rejected - snapshots don't explain intent or validate specific transformations

---

### 3. TypeScript-to-JSON Type Mapping Conventions

**Question**: How should complex TypeScript types from configTypes.ts be represented in WordPress block.json's limited type system?

**Decision**: Document explicit mapping conventions with examples; use enum arrays for validation where possible

**Mapping Conventions**:

| TypeScript Type        | WordPress block.json                        | Example                                                                           | Notes                             |
| ---------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| `string`               | `{ "type": "string" }`                      | `label: string` → `"label": { "type": "string" }`                                 | Direct mapping                    |
| `number`               | `{ "type": "number" }`                      | `width: number` → `"width": { "type": "number" }`                                 | Direct mapping                    |
| `integer`              | `{ "type": "integer" }`                     | `tickCount: integer` → `"tickCount": { "type": "integer" }`                       | WordPress-specific integer type   |
| `boolean`              | `{ "type": "boolean" }`                     | `active: boolean` → `"active": { "type": "boolean" }`                             | Direct mapping                    |
| `string literal union` | `{ "type": "string", "enum": [...] }`       | `type: 'bar' \| 'line'` → `"type": { "type": "string", "enum": ["bar", "line"] }` | Enum provides validation          |
| `number union`         | `{ "type": "number", "enum": [...] }`       | `size: 1 \| 2 \| 3` → `"size": { "type": "number", "enum": [1, 2, 3] }`           | Limited validation                |
| `interface` / `object` | `{ "type": "object", "properties": {...} }` | `axis: { label: string }` → `"axis": { "type": "object" }`                        | Can't enforce shape in block.json |
| `array`                | `{ "type": "array", "items": {...} }`       | `colors: string[]` → `"colors": { "type": "array" }`                              | Can't enforce item type strongly  |
| Optional (`?`)         | `{ ..., "default": undefined }`             | `label?: string` → `"label": { "type": "string", "default": null }`               | Default indicates optional        |

**Nested Object Example**:

```typescript
// TypeScript (configTypes.ts)
interface IndependentAxis {
	active: boolean;
	label: string;
	scale: 'linear' | 'time' | 'log' | 'sqrt';
	domain: [number, number];
	tickCount: number;
}
```

```json
// block.json
{
	"independentAxis": {
		"type": "object",
		"default": {
			"active": true,
			"label": "",
			"scale": "linear",
			"domain": [0, 100],
			"tickCount": 5
		}
	}
}
```

**Note**: block.json doesn't support nested property schemas like JSON Schema, so object types are opaque. TypeScript provides type safety in editor code; block.json provides serialization structure.

**Rationale**:

- WordPress block.json limited to basic types; can't enforce complex shapes
- Enum arrays provide validation for string/number unions when possible
- Default values serve as documentation of expected structure
- TypeScript in editor code provides runtime type safety
- Trade-off: Accept looser validation in block.json for pragmatic WordPress compatibility

**Alternatives Considered**:

- **JSON Schema in block.json**: Rejected - WordPress doesn't support extended JSON Schema features
- **Runtime validation functions**: Rejected - adds complexity; WordPress attr system already validates types
- **Simplify TypeScript types**: Rejected - would weaken charting library's type safety

---

### 4. Migration Complexity Estimation

**Question**: How many editor control files need updating and what is the refactoring scope?

**Research Findings**:

**Editor Control Files** (28 files in `src/chart/edit/`):

- annotation-controls.jsx (5 attributes)
- bar-controls.jsx (3 attributes)
- chart-controls.jsx (6 attributes)
- color-controls.jsx (2 attributes)
- data-controls.jsx (8 attributes)
- diff-column-controls.jsx (7 attributes)
- diverging-bar-control.jsx (6 attributes)
- dot-plot-controls.jsx (4 attributes)
- label-controls.jsx (12 attributes)
- legend-controls.jsx (13 attributes)
- line-controls.jsx (6 attributes)
- map-controls.jsx (11 attributes)
- meta-text-fields.jsx (6 attributes)
- node-controls.jsx (3 attributes)
- plot-band-controls.jsx (2 attributes)
- popover-label-controls.jsx (1 attribute)
- text-field-controls.jsx (4 attributes)
- tooltip-controls.jsx (15 attributes)
- x-axis-controls.jsx (23 attributes)
- y-axis-controls.jsx (20 attributes)
- alignment-overlay.jsx (indirect access)
- copy-paste-styles-handler.jsx (indirect access)
- Image.jsx (indirect access)
- index.jsx (main editor, orchestrates all controls)
- store.js (editor state management)
- wp-editor-functions.js (editor utilities)

**Refactoring Pattern** (per control file):

```javascript
// BEFORE (flat):
const { xAxisActive, xLabel } = attributes;
setAttributes({ xAxisActive: true });

// AFTER (nested):
const { independentAxis } = attributes;
const { active, label } = independentAxis;
setAttributes({
	independentAxis: {
		...independentAxis,
		active: true,
	},
});
```

**Estimated Effort**:

- Simple controls (1-5 attributes): 15 minutes each × 12 files = 3 hours
- Medium controls (6-12 attributes): 30 minutes each × 10 files = 5 hours
- Complex controls (13+ attributes): 1 hour each × 6 files = 6 hours
- **Total**: ~14 hours for editor control updates

**get-config.js Refactoring**:

- Current: ~718 lines with manual flat→baseConfig transformation
- Target: ~300 lines (60% reduction) - mostly direct passthrough + io/\_legacy handling
- Estimated effort: 4 hours

**Decision**: Refactor incrementally by nested object group (layout, then axes, then tooltip, etc.) to enable testing between each group

---

### 5. Rollback and Safety Strategy

**Question**: What safeguards should be in place if the migration causes issues in production?

**Decision**: Multi-layered safety approach with version detection, console warnings, and manual override capability

**Safety Mechanisms**:

1. **Version Detection**:

```javascript
// Block includes version marker
attributes: {
  _version: {
    type: 'string',
    default: 'v2'
  }
}

// Deprecation detects v1
isEligible(attributes) {
  return !attributes._version || attributes._version === 'v1';
}
```

2. **Console Warnings**:

```javascript
if (process.env.NODE_ENV === 'development') {
	console.group('Chart Block Migration');
	console.log('Migrated from v1 (flat) to v2 (nested)');
	console.log('Original attributes:', oldAttributes);
	console.log('New attributes:', newAttributes);
	if (legacyAttributes) {
		console.warn('Legacy attributes preserved:', legacyAttributes);
	}
	console.groupEnd();
}
```

3. **Emergency Rollback Path**:

```javascript
// Add temporary admin setting to force v1 behavior
if (window.prcChartBuilder?.forceV1Attributes) {
	// Skip nested attributes, use deprecated version
	return v1Deprecation.save({ attributes: oldAttributes });
}
```

4. **Fixture-Based Pre-Release Validation**:

- Run full fixture suite on staging environment
- Manually test 10-15 actual production charts on staging
- Monitor WordPress debug log for validation errors
- Require 100% fixture pass rate before production deployment

**Rationale**:

- WordPress deprecation system is battle-tested but migrations can have edge cases
- Console warnings help developers debug issues without impacting end users
- Version detection prevents re-migration of already-migrated blocks
- Emergency rollback provides escape hatch if critical issues found post-deployment

---

## Summary of Decisions

| Area                  | Decision                                                | Key Takeaway                                                           |
| --------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Deprecation Structure | Separate versioned files in `src/chart/deprecations/`   | Maintainable, self-contained deprecations per WordPress best practices |
| Fixture Format        | JSON with serialized content + expected output          | Enables full WordPress parse → migrate → validate testing              |
| Type Mapping          | Document conventions; use enums where possible          | Pragmatic balance between TypeScript safety and WordPress constraints  |
| Refactoring Scope     | 28 control files, incremental by nested group           | ~14 hours for controls, 4 hours for get-config.js                      |
| Safety Strategy       | Version detection, console warnings, fixture validation | Multi-layered approach minimizes production risk                       |

**Ready for Phase 1**: All technical unknowns resolved. Proceed to data model design and contract definition.
