# V1 Attribute Preservation - Usage Guide

## Overview

During the testing phase, we've added functionality to preserve original v1 attributes and allow re-running migrations. This helps you:

1. **Compare v1 vs v2** side-by-side to verify migration correctness
2. **Re-run migration** after fixing issues to test if changes work
3. **Debug migration problems** by examining original v1 data

## How It Works

### Automatic Preservation

When a v1 chart is migrated to v2, the migration automatically:

1. **Preserves original v1 attributes** in `_v1Original`
2. **Tracks migration metadata** in `_migrationMeta`
3. **Stores migration timestamp** and version

### Example Migrated Block

```json
{
	"_version": "v2",
	"_v1Original": {
		"chartType": "bar",
		"paddingTop": 20,
		"paddingLeft": 60,
		"xTickMarksActive": false,
		"metaTitle": "My Chart Title"
		// ... all original v1 attributes
	},
	"_migrationMeta": {
		"migratedAt": "2025-12-05T10:30:00.000Z",
		"migrationVersion": "1.0.0",
		"forceRemigrate": false
	},
	"layout": {
		"padding": {
			"top": 20,
			"left": 60
			// ... migrated values
		}
	},
	"metadata": {
		"title": "My Chart Title"
		// ... migrated values
	}
	// ... rest of v2 nested structure
}
```

## Comparing v1 vs v2

### In Browser Console

```javascript
// After loading a chart block in editor
const block = wp.data.select('core/block-editor').getBlock(clientId);
const attrs = block.attributes;

// Compare padding
console.log('Padding:', {
	v1: {
		top: attrs._v1Original.paddingTop,
		left: attrs._v1Original.paddingLeft,
		bottom: attrs._v1Original.paddingBottom,
	},
	v2: attrs.layout.padding,
});

// Compare metadata
console.log('Metadata:', {
	v1: {
		active: attrs._v1Original.metaTextActive,
		title: attrs._v1Original.metaTitle,
		source: attrs._v1Original.metaSource,
	},
	v2: attrs.metadata,
});

// Compare independent axis
console.log('Independent Axis:', {
	v1: {
		tickMarksActive: attrs._v1Original.xTickMarksActive,
		padding: attrs._v1Original.xLabelPadding,
		dateFormat: attrs._v1Original.xDateFormat,
	},
	v2: {
		tickMarksActive: attrs.independentAxis.tickMarksActive,
		padding: attrs.independentAxis.padding,
		dateFormat: attrs.independentAxis.dateFormat,
	},
});
```

### In PHP (Server-Side)

```php
// In render callback or template
$v1 = $attributes['_v1Original'] ?? [];
$v2 = $attributes;

// Compare specific attributes
error_log('Padding comparison:');
error_log('V1: ' . print_r([
    'top' => $v1['paddingTop'] ?? null,
    'left' => $v1['paddingLeft'] ?? null,
], true));
error_log('V2: ' . print_r($v2['layout']['padding'] ?? [], true));
```

## Re-Running Migration

### Method 1: Set `forceRemigrate` Flag

To force re-migration of an already-migrated chart:

```javascript
// In browser console or editor code
const block = wp.data.select('core/block-editor').getBlock(clientId);
wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, {
	_migrationMeta: {
		...block.attributes._migrationMeta,
		forceRemigrate: true,
	},
});

// Save the post - migration will re-run on next load
```

### Method 2: Temporarily Remove `_version`

```javascript
// Remove version flag to trigger migration
wp.data.dispatch('core/block-editor').updateBlockAttributes(clientId, {
	_version: undefined, // or delete the attribute
});

// Save and reload - migration will run again
```

### Method 3: Direct Migration Call (PHP)

```php
// In PHP, you can call migration directly
$v1_attrs = $attributes['_v1Original'] ?? $attributes;
$remigrated = \PRC\Platform\Chart_Builder\Block_Migration::migrate_attributes_v1_to_v2($v1_attrs);
```

## Testing Workflow

### Step 1: Initial Migration

1. Load a v1 chart in the editor
2. Migration runs automatically
3. Check `_v1Original` to see original values
4. Compare with migrated v2 values

### Step 2: Fix Issues

1. Update migration code or defaults
2. Set `forceRemigrate: true` on the chart
3. Save and reload the post
4. Migration re-runs with new code
5. Compare again to verify fixes

### Step 3: Verify Correctness

```javascript
// Helper function to compare all key attributes
function compareMigration(attrs) {
	const v1 = attrs._v1Original;
	const v2 = attrs;

	const comparisons = {
		padding: {
			v1: {
				top: v1.paddingTop,
				left: v1.paddingLeft,
				bottom: v1.paddingBottom,
			},
			v2: v2.layout.padding,
			match:
				v1.paddingTop === v2.layout.padding.top &&
				v1.paddingLeft === v2.layout.padding.left,
		},
		metadata: {
			v1: { active: v1.metaTextActive, title: v1.metaTitle },
			v2: { active: v2.metadata.active, title: v2.metadata.title },
			match:
				v1.metaTextActive === v2.metadata.active &&
				v1.metaTitle === v2.metadata.title,
		},
		// Add more comparisons...
	};

	console.table(comparisons);
	return comparisons;
}
```

## Cleanup After Testing

Once testing is complete and migration is verified:

1. **Remove `_v1Original` preservation** (optional - can keep for debugging)
2. **Remove `forceRemigrate` support** (or keep for future testing)
3. **Keep `_migrationMeta`** for tracking (optional)

To disable preservation, simply remove the `_v1Original` assignment in migration functions.

## Notes

- `_v1Original` is preserved on first migration only (to avoid nested copies)
- `forceRemigrate` flag is reset to `false` after each migration
- Migration metadata helps track when and how migration happened
- Original attributes are cleaned (removed `_v1Original`, `_migrationMeta`, `_legacy` from snapshot)
