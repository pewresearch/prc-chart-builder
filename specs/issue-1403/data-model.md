# Data Model: Viewport-Specific Chart Attributes

**Version**: v2 (with viewport extensions)
**Date**: 2026-01-12

## Entity: Chart Block Attributes with Viewport Overrides

### Current State (v2 with Viewport Support)

```typescript
interface ChartBlockAttributesV2WithViewports {
	_version: 'v2';
	id: string; // At root level (see issue-2013)

	// Default attributes (apply to all viewports unless overridden)
	layout: LayoutObject;
	metadata: MetadataObject;
	independentAxis: AxisObject;
	dependentAxis: AxisObject;
	labels: LabelObject;
	legend: LegendObject;
	tooltip: TooltipObject;
	bar: BarObject;
	line: LineObject;
	map: MapObject;
	pie: PieObject;
	dataRender: DataRenderObject;
	plotBands: PlotBandsObject;
	annotations: AnnotationsObject;
	drawings: DrawingObject[];
	// ... other chart configuration objects

	io: {
		parentClass: string;
		isConvertedChart: boolean;
		isStaticChart: boolean;
		isFreeformChart: boolean;
		chartData: Array<Record<string, any>>;
		availableCategories: string[];
		independentVariable: string;
		customColors?: string[];
		colorValue?: string;
		// ... other io properties
	};

	// NEW: Viewport-specific overrides
	mobile?: ViewportAttributes;
	tablet?: ViewportAttributes;

	_legacy?: Record<string, any>;
	_v1Original?: Record<string, any>;
	_migrationMeta?: {
		migratedAt: string;
		migrationVersion: string;
	};
}

// Viewport attributes can override any chart configuration object
interface ViewportAttributes {
	layout?: Partial<LayoutObject>;
	metadata?: Partial<MetadataObject>;
	independentAxis?: Partial<AxisObject>;
	dependentAxis?: Partial<AxisObject>;
	labels?: Partial<LabelObject>;
	legend?: Partial<LegendObject>;
	tooltip?: Partial<TooltipObject>;
	bar?: Partial<BarObject>;
	line?: Partial<LineObject>;
	map?: Partial<MapObject>;
	pie?: Partial<PieObject>;
	dataRender?: Partial<DataRenderObject>;
	plotBands?: Partial<PlotBandsObject>;
	annotations?: Partial<AnnotationsObject>;
	// Note: drawings are not overridable per viewport
	// Note: io object is not overridable (contains chart data, not display config)
}
```

### Example Configuration Objects

```typescript
interface LayoutObject {
	width: number;
	height: number;
	type: ChartType;
	orientation: 'vertical' | 'horizontal';
	padding: { top: number; right: number; bottom: number; left: number };
	overflowX: 'scroll-fixed-y-axis' | 'responsive' | 'scroll';
	mobileBreakpoint: number;
	horizontalRules: boolean;
}

interface LabelObject {
	active: boolean;
	showFirstLastPointsOnly: boolean;
	color: 'inherit' | 'contrast' | 'black' | 'white';
	fontWeight: number;
	fontSize: number;
	labelPositionBar: 'inside' | 'outside' | 'center';
	labelCutoff: number;
	labelCutoffMobile: number;
	// ... other label properties
}

interface LegendObject {
	active: boolean;
	orientation: 'row' | 'column' | 'row-reverse' | 'column-reverse';
	title: string;
	alignment: 'flex-start' | 'flex-end' | 'center' | 'none';
	offsetX: number;
	offsetY: number;
	categories: string[];
	// ... other legend properties
}
```

## Attribute Access Patterns

### Reading Attributes (with Viewport Awareness)

```javascript
// Editor (JavaScript)
function getCurrentValue(attributes, deviceType, attributeGroup, attributeKey) {
	// Check viewport override first (if not desktop)
	if (deviceType !== 'desktop') {
		const viewportOverride =
			attributes[deviceType]?.[attributeGroup]?.[attributeKey];
		if (viewportOverride !== undefined) {
			return viewportOverride;
		}
	}

	// Fallback to default attribute
	return attributes[attributeGroup]?.[attributeKey];
}

// Example usage:
const labelActive = getCurrentValue(attributes, deviceType, 'labels', 'active');
const chartWidth = getCurrentValue(attributes, deviceType, 'layout', 'width');
```

```php
// Server (PHP)
function get_current_value($attributes, $device_type, $attribute_group, $attribute_key) {
	// Check viewport override first (if not desktop)
	if ($device_type !== 'desktop' && isset($attributes[$device_type][$attribute_group][$attribute_key])) {
		return $attributes[$device_type][$attribute_group][$attribute_key];
	}

	// Fallback to default attribute
	return $attributes[$attribute_group][$attribute_key] ?? null;
}

// Example usage:
$label_active = get_current_value($attributes, $device_type, 'labels', 'active');
$chart_width = get_current_value($attributes, $device_type, 'layout', 'width');
```

### Writing Attributes (Device-Aware)

```javascript
// Editor (JavaScript)
function updateAttributeForDevice(
	attributes,
	setAttributes,
	deviceType,
	attributeGroup,
	updates
) {
	if (deviceType === 'desktop') {
		// Update default attribute
		setAttributes({
			[attributeGroup]: {
				...attributes[attributeGroup],
				...updates,
			},
		});
	} else {
		// Update viewport-specific override
		const currentViewport = attributes[deviceType] || {};
		const currentGroup = currentViewport[attributeGroup] || {};

		setAttributes({
			[deviceType]: {
				...currentViewport,
				[attributeGroup]: {
					...currentGroup,
					...updates,
				},
			},
		});
	}
}

// Example usage:
updateAttributeForDevice(attributes, setAttributes, deviceType, 'layout', {
	width: 400,
	height: 300,
});
```

### Merging Viewport Overrides (for Rendering)

```javascript
// JavaScript (in get-config.js)
function mergeViewportOverrides(baseAttributes, deviceType) {
	if (deviceType === 'desktop') {
		return baseAttributes; // No merging needed
	}

	const viewportOverrides = baseAttributes[deviceType];
	if (!viewportOverrides) {
		return baseAttributes; // No overrides defined
	}

	return {
		...baseAttributes,
		layout: { ...baseAttributes.layout, ...viewportOverrides.layout },
		metadata: { ...baseAttributes.metadata, ...viewportOverrides.metadata },
		independentAxis: {
			...baseAttributes.independentAxis,
			...viewportOverrides.independentAxis,
		},
		dependentAxis: {
			...baseAttributes.dependentAxis,
			...viewportOverrides.dependentAxis,
		},
		labels: { ...baseAttributes.labels, ...viewportOverrides.labels },
		legend: { ...baseAttributes.legend, ...viewportOverrides.legend },
		tooltip: { ...baseAttributes.tooltip, ...viewportOverrides.tooltip },
		bar: { ...baseAttributes.bar, ...viewportOverrides.bar },
		line: { ...baseAttributes.line, ...viewportOverrides.line },
		map: { ...baseAttributes.map, ...viewportOverrides.map },
		pie: { ...baseAttributes.pie, ...viewportOverrides.pie },
		dataRender: {
			...baseAttributes.dataRender,
			...viewportOverrides.dataRender,
		},
		plotBands: {
			...baseAttributes.plotBands,
			...viewportOverrides.plotBands,
		},
		annotations: {
			...baseAttributes.annotations,
			...viewportOverrides.annotations,
		},
		// Note: drawings, io, and metadata fields not overridable
	};
}
```

```php
// PHP (in class-chart.php)
function merge_viewport_attributes($attributes, $device_type) {
	if ($device_type === 'desktop' || empty($attributes[$device_type])) {
		return $attributes; // No merging needed
	}

	$viewport_overrides = $attributes[$device_type];
	$merged = $attributes;

	// Merge each attribute group
	$mergeable_groups = ['layout', 'metadata', 'independentAxis', 'dependentAxis',
	                     'labels', 'legend', 'tooltip', 'bar', 'line', 'map',
	                     'pie', 'dataRender', 'plotBands', 'annotations'];

	foreach ($mergeable_groups as $group) {
		if (isset($viewport_overrides[$group])) {
			$merged[$group] = array_merge(
				$attributes[$group] ?? [],
				$viewport_overrides[$group]
			);
		}
	}

	return $merged;
}
```

## Example Configurations

### Example 1: Mobile Label Override

```json
{
	"_version": "v2",
	"id": "abc-123-chart",
	"layout": {
		"width": 800,
		"height": 400,
		"type": "bar"
	},
	"labels": {
		"active": true,
		"fontSize": 14,
		"color": "inherit"
	},
	"mobile": {
		"labels": {
			"active": false
		}
	}
}
```

**Result**:

- Desktop: Shows labels (fontSize 14)
- Tablet: Shows labels (fontSize 14) - no override, uses default
- Mobile: Hides labels - `mobile.labels.active = false` overrides default

### Example 2: Responsive Layout Sizing

```json
{
	"_version": "v2",
	"id": "xyz-789-chart",
	"layout": {
		"width": 800,
		"height": 500,
		"type": "line"
	},
	"mobile": {
		"layout": {
			"width": 400,
			"height": 300
		}
	},
	"tablet": {
		"layout": {
			"width": 600,
			"height": 400
		}
	}
}
```

**Result**:

- Desktop: 800x500
- Tablet: 600x400 - uses `tablet.layout` override
- Mobile: 400x300 - uses `mobile.layout` override

### Example 3: Complex Multi-Attribute Override

```json
{
	"_version": "v2",
	"id": "complex-chart",
	"layout": {
		"width": 800,
		"height": 600
	},
	"labels": {
		"active": true,
		"fontSize": 14
	},
	"legend": {
		"active": true,
		"orientation": "row",
		"alignment": "center"
	},
	"independentAxis": {
		"label": "Full Descriptive Label",
		"tickCount": 10
	},
	"mobile": {
		"layout": {
			"width": 400,
			"height": 400
		},
		"labels": {
			"active": false
		},
		"legend": {
			"orientation": "column",
			"alignment": "flex-start"
		},
		"independentAxis": {
			"label": "Short Label",
			"tickCount": 5
		}
	}
}
```

**Result on Mobile**:

- Layout: 400x400 (overridden)
- Labels: Hidden (overridden)
- Legend: Column layout, left-aligned (overridden)
- Legend active: true (inherited from default)
- X-axis: "Short Label", 5 ticks (overridden)

## Schema Definitions

### block.json (v2 with Viewports)

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
		"layout": {
			"type": "object",
			"default": {}
		},
		"labels": {
			"type": "object",
			"default": {}
		},
		"legend": {
			"type": "object",
			"default": {}
		},
		"mobile": {
			"type": "object",
			"default": {}
		},
		"tablet": {
			"type": "object",
			"default": {}
		}
	}
}
```

**Important Notes**:

- `mobile` and `tablet` default to empty objects `{}`
- Empty viewport objects mean "no overrides, use defaults"
- Viewport objects can contain any subset of the main attribute groups

## Validation Rules

### Viewport Attribute Validation

```javascript
function validateViewportAttributes(attributes) {
	// Mobile and tablet must be objects (if present)
	if (attributes.mobile && typeof attributes.mobile !== 'object') {
		return 'mobile must be an object';
	}
	if (attributes.tablet && typeof attributes.tablet !== 'object') {
		return 'tablet must be an object';
	}

	// Viewport overrides must only contain valid attribute groups
	const validGroups = [
		'layout',
		'metadata',
		'independentAxis',
		'dependentAxis',
		'labels',
		'legend',
		'tooltip',
		'bar',
		'line',
		'map',
		'pie',
		'dataRender',
		'plotBands',
		'annotations',
	];

	for (const viewport of ['mobile', 'tablet']) {
		if (attributes[viewport]) {
			for (const key of Object.keys(attributes[viewport])) {
				if (!validGroups.includes(key)) {
					return `Invalid attribute group in ${viewport}: ${key}`;
				}
			}
		}
	}

	return null; // Valid
}
```

## Device Type Detection

### Editor (Client-Side)

```javascript
// WordPress editor provides device type
const { deviceType } = useSelect((select) => {
	const type = select('core/editor').getDeviceType();
	return {
		deviceType: type.toLowerCase(), // 'desktop' | 'tablet' | 'mobile'
	};
}, []);
```

**Possible Values**: `'desktop'` | `'tablet'` | `'mobile'` (lowercase)

### Frontend (Server-Side)

```php
// PRC Platform utility
$device_type = \PRC\Platform\get_current_device();
// Returns: 'desktop' | 'tablet' | 'mobile'
```

**Possible Values**: `'desktop'` | `'tablet'` | `'mobile'` (lowercase)

## Data Flow

### Editor to Storage

```
User Action (change width)
  ↓
detect device type via getDeviceType()
  ↓
updateAttributeForDevice(attrs, setAttributes, deviceType, 'layout', { width: 400 })
  ↓
if desktop: setAttributes({ layout: { ...layout, width: 400 } })
if mobile:  setAttributes({ mobile: { ...mobile, layout: { ...mobile.layout, width: 400 } } })
  ↓
Block attributes saved to post_content
```

### Storage to Render

```
Page Load / Editor Render
  ↓
Detect device: get_current_device() (server) or getDeviceType() (editor)
  ↓
Merge viewport overrides: mergeViewportOverrides(attributes, deviceType)
  ↓
getConfig(mergedAttributes, ...)
  ↓
PRC Charting Library renders chart
```

## Performance Considerations

### Memory Impact

- **Base attributes**: ~5-10 KB
- **With mobile overrides**: ~6-12 KB (20-30% increase)
- **With mobile + tablet overrides**: ~7-14 KB (40-50% increase)
- **Typical sparse overrides**: ~5-8 KB (10-20% increase)

### Merge Performance

- **Time Complexity**: O(n) where n = number of attribute groups (~15)
- **Space Complexity**: O(1) - in-place shallow merges
- **Expected Time**: <1ms for typical chart
- **Optimization**: Memoize merged result in editor

### Storage Efficiency

Charts with sparse overrides (most common case):

```json
{
	"mobile": {
		"labels": { "active": false }
	}
}
```

Only ~50 bytes additional storage.

## Migration Considerations

### Backward Compatibility

- **No migration needed**: `mobile` and `tablet` default to `{}`
- **Existing charts work unchanged**: No viewport overrides = use defaults
- **Gradual adoption**: Editors can add overrides as needed
- **No breaking changes**: Schema is additive only

### Future Enhancements

- **Visual indicators**: Show which attributes have viewport overrides in editor UI
- **Copy viewport settings**: "Copy desktop to mobile" button
- **Reset viewport**: "Clear mobile overrides" button
- **Viewport preview**: Live preview in editor (already supported via WordPress device preview)

---

**Last Updated**: 2026-01-12
**Status**: Phase 1 Complete
