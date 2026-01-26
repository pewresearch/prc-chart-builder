# Feature Specification: Chart Block ID Structure

**Branch**: `issue/2013`
**Date**: 2026-01-12 (Updated)
**Status**: Completed

## Overview

The chart block `id` attribute is located at the root level of the block attributes structure, maintaining consistency with the v1 structure and the controller block pattern.

**Structure**:

- ✅ `attributes.id` - ID is at root level
- ❌ `attributes.io.id` - ID is NOT in io object

This maintains consistency with:

- v1 block structure (which had `id` at root)
- Controller block pattern (which uses root-level `id`)
- General WordPress block conventions

## Key Points

| Aspect              | Implementation                                  |
| ------------------- | ----------------------------------------------- |
| ID Location         | Root level: `attributes.id`                     |
| Schema Version      | v2 (no v3 needed)                               |
| Backward Compatible | Yes - v1→v2 migration preserves root-level `id` |
| Controller Sync     | Chart ID derived as `${controllerId}-chart`     |

## Implementation Details

### Schema (block.json)

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
				// ... io properties, but NO id here
			}
		}
	}
}
```

### JavaScript Usage

```javascript
// Setting the ID (in edit component)
useEffect(() => {
	if (controllerId) {
		const expectedChartId = `${controllerId}-chart`;
		if (attributes.id !== expectedChartId) {
			setAttributes({ id: expectedChartId });
		}
	}
}, [controllerId, attributes.id, setAttributes]);

// Accessing the ID
const chartId = attributes.id; // ✅ Correct
// const chartId = attributes.io.id; // ❌ Wrong - will be undefined
```

### PHP Usage

```php
// Accessing the ID in render callback
$chart_id = $attributes['id']; // ✅ Correct
// $chart_id = $attributes['io']['id']; // ❌ Wrong - will not exist
```

## Testing

### Verification Checklist

- ✅ Existing v2 charts have `id` at root level
- ✅ New charts generate `id` at root level
- ✅ Table data sync works correctly
- ✅ No console errors in editor
- ✅ No PHP errors on frontend
- ✅ Copy/paste generates unique IDs
- ✅ `attributes.io.id` is undefined (not present)

### Test Scenarios

1. **Create New Chart**
    - Insert controller block
    - Add table and chart blocks
    - Verify `attributes.id` is set to `{controllerId}-chart`
    - Verify `attributes.io.id` does not exist

2. **Update Table Data**
    - Modify table cells
    - Verify chart updates with new data
    - Verify no errors in console

3. **Copy/Paste Chart**
    - Copy existing chart block
    - Paste in same or different post
    - Verify new unique ID is generated at root level

4. **Static Chart**
    - Create static chart with image
    - Verify `id` at root level
    - Verify chart renders correctly

5. **Freeform Chart**
    - Create freeform chart
    - Verify `id` at root level
    - Verify chart renders correctly

## Related Documentation

- **Data Model**: See `data-model.md` for detailed attribute structure
- **Architecture**: See `/docs/ARCHITECTURE.md` for system overview
- **Migration History**: See `/specs/issue-1386/` for v1→v2 migration reference

## Summary

The chart block uses a root-level `id` attribute for consistency and simplicity:

```javascript
{
  "_version": "v2",
  "id": "controller-id-chart",  // ✅ ID here
  "io": {
    // ❌ No id property here
    "chartData": [...],
    // ... other io properties
  }
}
```

This structure:

- Matches v1 block pattern
- Aligns with controller block
- Simplifies attribute access
- Maintains backward compatibility

---

**Last Updated**: 2026-01-12
**Status**: Active - Production Implementation
