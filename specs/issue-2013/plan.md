# Implementation Plan: Chart Block ID at Root Level

**Branch**: `issue/2013` | **Date**: 2026-01-12 (Updated) | **Status**: Completed

## Summary

The chart block `id` attribute is maintained at the root level, consistent with the v1 structure and the controller block pattern. This document reflects the **completed implementation** where:

1. Block schema (block.json) defines `id` at root level
2. JavaScript code accesses `attributes.id` (not `attributes.io.id`)
3. PHP code accesses `$attributes['id']` (not `$attributes['io']['id']`)
4. No v3 migration needed - v2 already uses root-level `id`

## Technical Context

**Language/Version**: JavaScript (ES2020+), PHP 8.0+, WordPress Block Editor API v3
**Primary Dependencies**: WordPress Block Editor (@wordpress/blocks, @wordpress/block-editor), React 18
**Storage**: WordPress post_content (serialized blocks)
**Target Platform**: WordPress 6.4+ with Gutenberg block editor
**Project Type**: WordPress plugin with block editor extensions
**Structure**: ID stored at `attributes.id`, NOT in `attributes.io.id`

## Constitution Check

_This is a simplification, not a complexity addition._

### Complexity Gates

- ✅ **Simplification**: ID at root level is simpler and more consistent
- ✅ **Standard Pattern**: Follows WordPress and v1 block conventions
- ✅ **No New Dependencies**: Uses existing block attribute system

### Quality Gates

- ✅ **Tested**: Verified in editor and frontend
- ✅ **Documented**: Complete documentation in `/specs/issue-2013/`
- ✅ **Consistent**: Aligns with controller block and v1 pattern

## Project Structure

### Documentation (this feature)

```text
specs/issue-2013/
├── plan.md              # This file - implementation overview
├── spec.md              # Feature specification
├── data-model.md        # Attribute structure reference
├── quickstart.md        # Usage guide and examples
└── contracts/           # Block schema contracts
```

### Source Code (repository root)

```text
plugins/prc-chart-builder/
├── src/chart/
│   ├── block.json                      # Defines id at root level
│   ├── deprecations/
│   │   ├── v1.js                       # v1→v2 migration (preserves root id)
│   │   └── index.js                    # Deprecation registry
│   └── edit/
│       └── index.jsx                   # Uses attributes.id
├── includes/
│   └── class-block-migration.php       # Server-side attribute handling
└── build/chart/
    └── class-chart.php                 # Uses $attributes['id']
```

**Key Point**: All code consistently uses root-level `id`, not `io.id`.

## Current Implementation

### Data Model

**v2 Structure (Current)**:

```json
{
  "_version": "v2",
  "id": "controller-id-chart",  // ✅ ID at root level
  "io": {
    // ... io properties
    // Note: NO id property here
  },
  "layout": { ... },
  "metadata": { ... }
}
```

### Block Schema (block.json)

```json
{
	"attributes": {
		"_version": {
			"type": "string",
			"enum": ["v1", "v2"],
			"default": "v2"
		},
		"id": {
			"type": "string",
			"default": ""
		},
		"io": {
			"type": "object",
			"default": {
				"parentClass": "wp-chart-builder-wrapper",
				"isConvertedChart": false,
				"chartData": []
				// No "id" property in defaults
			}
		}
	}
}
```

## Code Usage Examples

### JavaScript (Correct Usage)

```javascript
// src/chart/edit/index.jsx
import { useContext, useEffect } from '@wordpress/element';
import { Context } from '../controller/context';

function ChartEdit({ attributes, setAttributes }) {
	const { controllerId } = useContext(Context);
	const { id } = attributes; // ✅ Access from root

	// Set ID based on controller
	useEffect(() => {
		if (controllerId) {
			const expectedChartId = `${controllerId}-chart`;
			if (id !== expectedChartId) {
				setAttributes({ id: expectedChartId }); // ✅ Set at root
			}
		}
	}, [controllerId, id, setAttributes]);

	return <div>Chart ID: {id}</div>;
}
```

### PHP (Correct Usage)

```php
<?php
// build/chart/class-chart.php
public function render_block_callback( $attributes, $content, $block ) {
	// ✅ Access from root level
	$chart_id = $attributes['id'] ?? '';

	// Use the ID
	$wrapper_attrs = sprintf(
		'id="%s" class="chart-wrapper"',
		esc_attr( $chart_id )
	);

	return sprintf( '<div %s>%s</div>', $wrapper_attrs, $content );
}
```

## Verification Checklist

### Structure Verification

- ✅ `attributes.id` exists and contains chart ID
- ✅ `attributes.io.id` does NOT exist (undefined)
- ✅ `_version` is "v2"
- ✅ ID pattern matches `{controllerId}-chart`

### Functional Verification

- ✅ New charts generate ID at root level
- ✅ Table data sync works correctly
- ✅ Copy/paste generates unique IDs
- ✅ Static charts work correctly
- ✅ Freeform charts work correctly
- ✅ No console errors in editor
- ✅ No PHP errors on frontend

### Code Verification

```javascript
// Quick check in browser console
const block = wp.data.select('core/block-editor').getSelectedBlock();
console.log('ID at root:', block.attributes.id); // Should show ID
console.log('ID in io:', block.attributes.io.id); // Should be undefined
```

## Related Documentation

- **spec.md** - Feature specification and overview
- **data-model.md** - Complete attribute structure reference
- **quickstart.md** - Usage guide with examples
- **research.md** - Research and decision rationale
- **/docs/ARCHITECTURE.md** - System architecture overview
- **/specs/issue-1386/** - v1→v2 migration reference

## Key Takeaways

1. **ID Location**: Always at `attributes.id`, never `attributes.io.id`
2. **Consistency**: Matches v1 structure and controller block pattern
3. **Simplicity**: Reduces nesting for frequently-accessed attribute
4. **Backward Compatible**: v1→v2 migration preserves root-level ID

---

**Last Updated**: 2026-01-12
**Status**: Production Implementation
**Version**: v2 (no v3 needed)
