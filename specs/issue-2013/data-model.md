# Data Model: Chart Block ID Structure

**Version**: v2 (Updated)
**Date**: 2026-01-12

## Entity: Chart Block Attributes

### v2 Schema (Current)

```typescript
interface ChartBlockAttributesV2 {
	_version: 'v2';
	id: string; // ← ID IS AT ROOT LEVEL
	layout: LayoutObject;
	metadata: MetadataObject;
	independentAxis: AxisObject;
	dependentAxis: AxisObject;
	// ... other nested objects
	io: {
		// NOTE: id is NOT in io object
		parentClass: string;
		isConvertedChart: boolean;
		isStaticChart: boolean;
		isFreeformChart: boolean;
		chartData: Array<Record<string, any>>;
		availableCategories: string[];
		independentVariable: string;
		// ... other io properties
	};
	_legacy: Record<string, any>;
	_v1Original?: Record<string, any>;
	_migrationMeta?: {
		migratedAt: string;
		migrationVersion: string;
	};
}
```

### Historical Context

Previously, during v1→v2 migration planning, there was a proposal to place `id` within the `io` object as `io.id`. However, this was corrected before production deployment, and the current v2 implementation keeps `id` at the root level, consistent with v1 and the controller block pattern.

## Migration Path

### v1 → v2 Migration

```
┌─────────────┐
│   v1 Block  │
│  root id    │
│ (flat attrs)│
└──────┬──────┘
       │ v1→v2 migration
       │ (preserves id at root)
       ▼
┌─────────────┐
│   v2 Block  │
│  root id    │
│ (nested cfg)│
└─────────────┘
```

### Migration Rules

1. **v1 → v2 Transformation**:

    - `id` stays at root level (not moved to `io.id`)
    - Flat configuration attributes are reorganized into nested objects
    - `_version` is updated from 'v1' to 'v2'

2. **ID Handling**:
    - v1 blocks have `id` at root → preserved at root in v2
    - New v2 blocks generate `id` at root based on controller ID
    - Pattern: `${controllerId}-chart`

## Validation Rules

### v2 Attributes

| Field      | Type   | Required | Validation                                | Default                   |
| ---------- | ------ | -------- | ----------------------------------------- | ------------------------- |
| `_version` | string | Yes      | Must be 'v2'                              | 'v2'                      |
| `id`       | string | Yes      | Non-empty, matches pattern `{uuid}-chart` | Generated from controller |
| `io`       | object | Yes      | Must be object                            | `{}`                      |
| `io.id`    | N/A    | No       | **Must NOT exist** in io object           | -                         |

### Block Validation

```javascript
function validateV2Attributes(attrs) {
	// Version is v2
	assert(attrs._version === 'v2');

	// ID exists at root level
	assert(typeof attrs.id === 'string');
	assert(attrs.id.length > 0);

	// ID matches expected pattern (controller-id + '-chart')
	assert(attrs.id.endsWith('-chart'));

	// io object exists
	assert(typeof attrs.io === 'object');

	// io.id does NOT exist
	assert(!('id' in attrs.io));
}
```

## Relationships

### Controller Block ↔ Chart Block

```
Controller Block
├── attributes.id = "abc-123-def"  (clientId)
└── provides context: { "prc-chart-builder/id": "abc-123-def" }
     ↓
Chart Block (v2)
├── receives context: controllerId = "abc-123-def"
└── attributes.id = "abc-123-def-chart"  (derived from controller)
```

**Relationship Rules**:

- Chart ID is always `${controllerId}-chart`
- Set at root level: `attributes.id`
- Set in `useEffect` early in component lifecycle
- Ensures unique ID per chart
- Maintains relationship for table data sync

### Table Block ↔ Chart Block

```
Controller Block (innerBlocks)
├── Table Block
│   └── attributes.body / attributes.head
│        ↓ (synced via useSelect)
└── Chart Block (v2)
    └── attributes.io.chartData
```

**Data Flow**:

1. Table updated → `useSelect` detects change
2. Chart's `useEffect` triggers
3. Table data transformed to `chartData`
4. Chart re-renders with new data

**Note**: The `id` at `attributes.id` is used to identify the chart, not `io.id`.

## Schema Definitions

### block.json (v2)

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "prc-chart-builder/chart",
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
		"layout": { "type": "object" },
		"metadata": { "type": "object" },
		"io": {
			"type": "object",
			"default": {
				"parentClass": "wp-chart-builder-wrapper",
				"isConvertedChart": false,
				"chartData": []
				// ... other io properties
				// NOTE: No "id" property in io object
			}
		}
	}
}
```

**Important**: The `id` attribute is defined at the root level, **NOT** within the `io` object.

## Examples

### Example 1: Standard Chart

**v2 Structure**:

```json
{
  "_version": "v2",
  "id": "abc-123-def-chart",
  "io": {
    "chartData": [...]
  }
}
```

### Example 2: Static Chart

**v2 Structure**:

```json
{
	"_version": "v2",
	"id": "xyz-789-abc-chart",
	"io": {
		"isStaticChart": true,
		"staticImageId": "123"
	}
}
```

### Example 3: Freeform Chart

**v2 Structure**:

```json
{
	"_version": "v2",
	"id": "free-456-xyz-chart",
	"io": {
		"isFreeformChart": true
	}
}
```

**Note**: In all cases, `id` is at the root level, never in the `io` object.

## Database Storage

### WordPress post_content

Blocks are serialized in post_content as HTML comments:

**v2 Serialization**:

```html
<!-- wp:prc-chart-builder/chart {"_version":"v2","id":"abc-123-chart","io":{...},...} /-->
```

**Key Point**: The `id` appears at the root level in the serialized block attributes, not nested within `io`.

### Storage Location

- **Client-side**: Block attributes stored in editor state
- **Server-side**: Serialized in `post_content` as block comment attributes
- **Persistent**: Saved when post is updated

## Code Usage

### JavaScript

```javascript
// ✅ CORRECT - Access id at root level
const chartId = attributes.id;

// ❌ INCORRECT - Do not access id in io object
const chartId = attributes.io.id; // This will be undefined
```

### PHP

```php
// ✅ CORRECT - Access id at root level
$chart_id = $attributes['id'];

// ❌ INCORRECT - Do not access id in io array
$chart_id = $attributes['io']['id']; // This will not exist
```

## Performance Considerations

### Attribute Access Cost

- **Time Complexity**: O(1) - direct property access
- **Space Complexity**: O(1) - no additional data structures
- **Memory Impact**: Negligible - single string attribute
- **Performance**: No performance difference between root-level and nested access

### Best Practices

- Always access `id` from root level for consistency
- Avoid checking both `attributes.id` and `attributes.io.id`
- Use TypeScript types to enforce correct structure
