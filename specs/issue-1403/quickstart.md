# Quickstart: Viewport-Specific Chart Attributes

**Audience**: Developers implementing viewport-specific attribute overrides
**Time**: ~1-2 days for full implementation and QA

## Prerequisites

- WordPress development environment set up
- PRC Chart Builder plugin installed (v3.2.2+)
- Node.js and npm for building JavaScript
- PHP 8.0+ for server-side development
- Familiarity with WordPress block editor and `@wordpress/data`

## Implementation Steps

### Step 1: Update Block Schema (30 min)

**File**: `src/chart/block.json`

Add viewport attribute definitions:

```json
{
	"attributes": {
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

**Why**: Defines `mobile` and `tablet` as root-level block attributes that can store viewport-specific overrides.

### Step 2: Device Detection in Editor (Already Done!)

**File**: `src/chart/edit/index.jsx` (lines 81-92)

The device detection is already implemented:

```javascript
const { deviceType } = useSelect((select) => {
	const type = select('core/editor').getDeviceType();
	return {
		deviceType: type.toLowerCase(), // 'desktop' | 'tablet' | 'mobile'
	};
}, []);
```

**Why**: WordPress editor provides device preview modes. We use this to determine which viewport is active.

### Step 3: Create Device-Aware Attribute Update Helper (1-2 hours)

**File**: `src/chart/edit/index.jsx`

Add helper functions for device-aware attribute updates:

```javascript
/**
 * Update an attribute, routing to viewport override if not desktop
 */
const updateAttributeForDevice = useCallback(
	(attributeGroup, updates) => {
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
	},
	[deviceType, attributes, setAttributes]
);

/**
 * Get current value for an attribute, checking viewport override first
 */
const getCurrentValue = useCallback(
	(attributeGroup, attributeKey) => {
		// Check viewport override first (if not desktop)
		if (
			deviceType !== 'desktop' &&
			attributes[deviceType]?.[attributeGroup]?.[attributeKey] !==
				undefined
		) {
			return attributes[deviceType][attributeGroup][attributeKey];
		}

		// Fallback to default attribute
		return attributes[attributeGroup]?.[attributeKey];
	},
	[deviceType, attributes]
);
```

**Why**: Centralizes logic for reading/writing viewport-aware attributes. All attribute panel components can use these helpers.

### Step 4: Update Attribute Panel Components (2-3 hours)

**Example**: Layout width control

**Before**:

```javascript
<TextControl
	label="Width"
	value={layout.width}
	onChange={(val) =>
		setAttributes({
			layout: { ...layout, width: parseInt(val) },
		})
	}
/>
```

**After**:

```javascript
<TextControl
	label="Width"
	value={getCurrentValue('layout', 'width')}
	onChange={(val) =>
		updateAttributeForDevice('layout', {
			width: parseInt(val),
		})
	}
/>
```

**Repeat for all attribute controls** in:

- Layout settings
- Label settings
- Legend settings
- Axis settings
- Tooltip settings
- etc.

**Why**: Routes attribute changes to the correct location (default or viewport override) based on active device type.

### Step 5: Update get-config.js for Viewport Merging (2-3 hours)

**File**: `src/chart/utils/get-config.js`

Add device type parameter and merging logic:

```javascript
// Update function signature
const getConfig = (
	attributes,
	clientId,
	editorClickEvent = null,
	deviceType = 'desktop'
) => {
	// Merge viewport overrides before building config
	const mergedAttributes = mergeViewportOverrides(attributes, deviceType);

	// Rest of config construction using mergedAttributes
	const {
		layout,
		metadata,
		independentAxis,
		dependentAxis,
		// ... etc
	} = mergedAttributes;

	// ... build config as before
};

/**
 * Merge viewport-specific overrides into base attributes
 */
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
	};
}

export default getConfig;
```

**Update Chart component to pass deviceType**:

```javascript
// In edit/index.jsx, where chart is rendered
const config = getConfig(attributes, clientId, handleChartClick, deviceType);
```

**Why**: Ensures chart preview in editor reflects viewport-specific configuration based on active device type.

### Step 6: Server-Side Device Detection and Merging (2-3 hours)

**File**: `build/chart/class-chart.php`

Update `render_block_callback` method:

```php
public function render_block_callback( $attributes, $content, $block ) {
	// Detect current device
	$device_type = \PRC\Platform\get_current_device(); // Returns 'desktop' | 'tablet' | 'mobile'

	// Merge viewport-specific attributes
	$merged_attributes = $this->merge_viewport_attributes( $attributes, $device_type );

	// Rest of rendering logic uses $merged_attributes
	// ...
}

/**
 * Merge viewport-specific attribute overrides into base attributes
 *
 * @param array  $attributes  Block attributes
 * @param string $device_type Current device type ('desktop' | 'tablet' | 'mobile')
 * @return array Merged attributes
 */
private function merge_viewport_attributes( $attributes, $device_type ) {
	// No merging needed for desktop or if no viewport overrides exist
	if ( $device_type === 'desktop' || empty( $attributes[ $device_type ] ) ) {
		return $attributes;
	}

	$viewport_overrides = $attributes[ $device_type ];
	$merged = $attributes;

	// List of attribute groups that can be overridden
	$mergeable_groups = [
		'layout', 'metadata', 'independentAxis', 'dependentAxis',
		'labels', 'legend', 'tooltip', 'bar', 'line', 'map',
		'pie', 'dataRender', 'plotBands', 'annotations'
	];

	foreach ( $mergeable_groups as $group ) {
		if ( isset( $viewport_overrides[ $group ] ) && is_array( $viewport_overrides[ $group ] ) ) {
			$merged[ $group ] = array_merge(
				$attributes[ $group ] ?? [],
				$viewport_overrides[ $group ]
			);
		}
	}

	return $merged;
}
```

**Why**: Ensures server-rendered charts (frontend) use correct configuration for the user's device.

### Step 7: Build and Test (4-6 hours)

```bash
# Build JavaScript
npm run build

# Test scenarios documented below
```

## Testing Checklist

### Desktop Device Type

- [ ] Open chart in editor (desktop device type default)
- [ ] Change `layout.width` to 800
- [ ] Verify: `attributes.layout.width === 800`
- [ ] Verify: `attributes.mobile` and `attributes.tablet` are unchanged
- [ ] Save and reload
- [ ] Verify: Width still 800 on desktop

### Mobile Device Type

- [ ] Switch to mobile device preview in editor toolbar
- [ ] Verify: `deviceType === 'mobile'`
- [ ] Change `labels.active` to `false`
- [ ] Verify: `attributes.mobile.labels.active === false`
- [ ] Verify: `attributes.labels.active` (default) is unchanged
- [ ] Switch back to desktop preview
- [ ] Verify: Labels are still visible (using default `labels.active`)
- [ ] Switch to mobile preview again
- [ ] Verify: Labels are hidden (using `mobile.labels.active`)

### Tablet Device Type

- [ ] Switch to tablet device preview
- [ ] Change `layout.height` to 450
- [ ] Verify: `attributes.tablet.layout.height === 450`
- [ ] Verify: Default `attributes.layout.height` unchanged
- [ ] Switch to desktop/mobile
- [ ] Verify: Each viewport uses correct height

### Fallback Behavior

- [ ] Create chart with mobile overrides only (no tablet)
- [ ] Switch to tablet preview
- [ ] Verify: Tablet uses desktop defaults (not mobile overrides)
- [ ] Clear a mobile override
- [ ] Verify: Mobile viewport reverts to default

### Server Rendering

- [ ] Create chart with mobile `labels.active = false`
- [ ] Save and publish post
- [ ] View on actual mobile device (or use device emulation)
- [ ] Verify: Labels are hidden on mobile
- [ ] View on desktop browser
- [ ] Verify: Labels are shown on desktop

### Copy/Paste

- [ ] Create chart with viewport overrides
- [ ] Copy block
- [ ] Paste in same/different post
- [ ] Verify: Viewport overrides copied with block
- [ ] Modify override in pasted block
- [ ] Verify: Original block unchanged

### Performance

- [ ] Open chart in editor
- [ ] Switch between device types rapidly
- [ ] Verify: Chart updates within 100ms (no lag)
- [ ] Check browser console for errors
- [ ] Verify: No memory leaks on repeated switches

## Common Patterns

### Pattern 1: Simple Toggle Override

```javascript
// Hide labels on mobile, show on desktop
// Desktop (default): labels.active = true
// Mobile override: mobile.labels.active = false

<ToggleControl
	label="Show Labels"
	checked={getCurrentValue('labels', 'active')}
	onChange={(val) => updateAttributeForDevice('labels', { active: val })}
/>
```

### Pattern 2: Numeric Value Override

```javascript
// Different width per viewport
<RangeControl
	label="Chart Width"
	value={getCurrentValue('layout', 'width')}
	min={200}
	max={1200}
	onChange={(val) => updateAttributeForDevice('layout', { width: val })}
/>
```

### Pattern 3: Multi-Property Update

```javascript
// Update multiple layout properties at once
updateAttributeForDevice('layout', {
	width: 400,
	height: 300,
	overflowX: 'scroll',
});
```

### Pattern 4: Clearing Override

```javascript
// Reset mobile override to use default
const clearMobileOverride = (attributeGroup) => {
	const currentMobile = attributes.mobile || {};
	const { [attributeGroup]: _, ...restMobile } = currentMobile;

	setAttributes({ mobile: restMobile });
};

// Usage:
clearMobileOverride('labels'); // Remove mobile.labels override
```

## Debugging Tips

### Check Current Device Type

```javascript
// In editor, add temporary logging
useEffect(() => {
	console.log('Current device type:', deviceType);
}, [deviceType]);
```

### Inspect Merged Attributes

```javascript
// In get-config.js, log merged result
const mergedAttributes = mergeViewportOverrides(attributes, deviceType);
console.log('Merged attributes for', deviceType, mergedAttributes);
```

### Verify Viewport Overrides Exist

```javascript
// Check if mobile override is set
if (attributes.mobile?.labels?.active !== undefined) {
	console.log(
		'Mobile has labels.active override:',
		attributes.mobile.labels.active
	);
} else {
	console.log(
		'Mobile using default labels.active:',
		attributes.labels.active
	);
}
```

### Server-Side Debugging

```php
// In class-chart.php render callback
error_log('Device type: ' . $device_type);
error_log('Merged attributes: ' . print_r($merged_attributes, true));
```

## Common Issues and Solutions

### Issue 1: Viewport Override Not Applying

**Symptom**: Changed attribute on mobile but chart still shows desktop value

**Solution**:

- Verify `deviceType` is correctly detected (check console.log)
- Verify `updateAttributeForDevice` is being called (add logging)
- Verify `getConfig` is receiving correct `deviceType` parameter
- Check that merge logic includes the attribute group you're testing

### Issue 2: Attribute Update Overwrites Entire Viewport Object

**Symptom**: Setting one mobile attribute clears other mobile attributes

**Solution**:

- Ensure you're spreading existing viewport object: `{ ...currentViewport, [group]: {...} }`
- Check that you're not replacing entire viewport: DON'T do `{ mobile: { labels: {} } }`

### Issue 3: Server-Rendered Chart Doesn't Match Editor Preview

**Symptom**: Chart looks different on frontend than in editor preview

**Solution**:

- Verify `get_current_device()` is returning expected value
- Check that PHP `merge_viewport_attributes` logic matches JS `mergeViewportOverrides`
- Ensure both are merging the same attribute groups
- Test with WP_DEBUG enabled to catch PHP errors

### Issue 4: Performance Degradation

**Symptom**: Editor feels sluggish when switching devices

**Solution**:

- Add memoization to `mergeViewportOverrides`:
    ```javascript
    const mergedAttrs = useMemo(
    	() => mergeViewportOverrides(attributes, deviceType),
    	[attributes, deviceType]
    );
    ```
- Verify you're not triggering unnecessary re-renders
- Check that `getConfig` isn't being called excessively

## Next Steps

After successful implementation:

1. **Add Visual Indicators** (Future Enhancement):
    - Show badge/icon next to controls that have viewport overrides
    - "This setting is overridden for Mobile" message

2. **Add Reset Functions** (Future Enhancement):
    - "Clear Mobile Overrides" button
    - "Copy Desktop to Mobile" button
    - "Copy Mobile to Tablet" button

3. **Add Viewport Preview** (Already Supported):
    - WordPress editor already provides device preview modes
    - Ensure chart updates immediately when switching

4. **Monitor Performance**:
    - Track attribute payload sizes
    - Alert if overrides getting too large (>20KB)
    - Optimize merge logic if needed

5. **User Documentation**:
    - Create editor guide for content creators
    - Document best practices for viewport optimization
    - Show examples of common responsive patterns

## Reference

- **Spec**: [spec.md](./spec.md) - Feature specification
- **Data Model**: [data-model.md](./data-model.md) - Attribute structure
- **Research**: [research.md](./research.md) - Decision rationale
- **Plan**: [plan.md](./plan.md) - Implementation plan
- **Contract**: [contracts/viewport-attributes-schema.json](./contracts/viewport-attributes-schema.json) - JSON schema

---

## Implementation Learnings

### Content vs. Presentation Attributes

**Critical Decision**: Not all attributes should be viewport-aware. We separated attributes into two categories:

**Content Attributes (NOT viewport-aware)**:

- `io` - Data source, color palette, chart family
- `dataRender` - Categories to render, sorting, scales
- `divergingBar` - Positive/negative category assignments
- `colors` - Color palette (via `io.colorValue`, `io.customColors`)

**Why**: These represent WHAT data to show. The same data should be shown across all viewports for editorial consistency and user trust.

**Presentation Attributes (viewport-aware)**:

- `layout` - Width, height, padding, orientation
- `labels` - Font size, positioning, visibility
- `legend` - Orientation, position, alignment
- `annotations` - Text, positioning, styling
- `tooltip` - Positioning, sizing, formatting
- `independentAxis` / `dependentAxis` - Tick counts, label sizes
- `metadata` - Title, subtitle (for space constraints)
- Chart-type specific: `bar`, `line`, `map`, `dotPlot`, etc.

**Why**: These represent HOW to show the data. Presentation can adapt to different screen sizes.

**Implementation Pattern**:

```javascript
// Content attributes - direct access
const io = attributes.io || {};
const dataRender = attributes.dataRender || {};

// Presentation attributes - use hook
const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
	attributes,
	setAttributes
);
const fontSize = getCurrentValue('labels', 'fontSize');
```

### Custom Hook Pattern

We created `useViewportAttributes` hook to centralize viewport-aware logic:

```javascript
// File: src/chart/edit/use-viewport-attributes.js
export function useViewportAttributes(attributes, setAttributes) {
	const deviceType = useDeviceType();

	const getCurrentValue = (attributeGroup, attributeKey) => {
		// Check viewport override first, then fall back to default
		if (
			deviceType !== 'desktop' &&
			attributes[deviceType]?.[attributeGroup]?.[attributeKey] !==
				undefined
		) {
			return attributes[deviceType][attributeGroup][attributeKey];
		}
		return attributes[attributeGroup]?.[attributeKey];
	};

	const updateAttributeForDevice = (attributeGroup, updates) => {
		// Route to viewport override or default based on deviceType
		// ...
	};

	return { deviceType, getCurrentValue, updateAttributeForDevice };
}
```

**Benefits**:

- No prop drilling
- Consistent pattern across all controls
- Easy to test and maintain

### Server-Side Rendering

We use WordPress Interactivity API for client-side viewport detection and server-side rehydration:

```javascript
// Client-side: src/chart/view.js
// Detects viewport changes and navigates with cb_viewport query param
// Server-side: src/chart/class-chart.php
// Reads cb_viewport param and merges attributes accordingly
```

**Why**: Ensures server-rendered charts match editor preview, and provides SEO benefits.

### Custom Label Positions

Custom label positions were migrated from `io.chartData.__labelPositions` (data) to `labels.customPositions` (viewport-aware attribute):

```javascript
// Merge utility: src/chart/utils/merge-custom-label-positions.js
// Merges viewport-aware customPositions into chartData at render time
```

**Why**: Makes custom positions viewport-aware while maintaining compatibility with charting library.

### Controls Intentionally Not Updated

The following controls were **intentionally NOT made viewport-aware** because they represent content (what data to show) rather than presentation (how to show it):

**Content Attributes (NOT viewport-aware)**:

- **`io`** - Data source, color palette, chart family, available categories
- **`dataRender`** - Categories to render, sorting order, scales, date formats
- **`divergingBar`** - Positive/negative category assignments, neutral bar configuration
- **`colors`** - Color palette (accessed via `io.colorValue`, `io.customColors`)

**Rationale**:

- Data integrity: Charts should show the same data across all devices
- Editorial consistency: One set of findings, not three different datasets
- User trust: Shared links show the same data regardless of device
- Simpler mental model: "The data is constant; the presentation adapts"

**Implementation**: These attributes use direct `attributes` access instead of `getCurrentValue()`:

```javascript
// Content attributes - direct access
const io = attributes.io || {};
const dataRender = attributes.dataRender || {};

// Updates use setAttributes directly
setAttributes({
	dataRender: {
		...dataRender,
		categories: newCategories,
	},
});
```

See [VIEWPORT_ATTRIBUTES.md](../../docs/VIEWPORT_ATTRIBUTES.md) for complete architecture documentation.

---

**Last Updated**: 2026-01-12
**Status**: ✅ Implementation Complete
