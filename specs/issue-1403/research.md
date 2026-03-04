# Research: Viewport-Specific Chart Attributes

**Date**: 2026-01-12
**Status**: Complete

## Overview

Research findings for implementing viewport-specific attribute overrides in chart blocks, allowing different chart configurations for desktop, tablet, and mobile viewports.

## Decision: Attribute Structure Pattern

**Chosen**: Root-level `mobile` and `tablet` objects that mirror main attribute structure

**Rationale**:

- Parallel structure makes merging intuitive and predictable
- Editor can use same attribute paths regardless of device (e.g., `layout.width` works for all)
- Shallow root-level objects easier to serialize/deserialize than deep nesting
- Follows WordPress block attribute conventions (flat-ish structure)
- Easy to detect if override exists: `attributes.mobile?.layout?.width`

**Alternatives Considered**:

1. **Single `viewports` object with nested device keys**: `{ viewports: { mobile: {}, tablet: {} } }`
    - Rejected: Extra nesting layer, harder to work with in editor code
2. **Device-prefixed attributes**: `mobileLayoutWidth`, `tabletLayoutWidth`
    - Rejected: Pollutes attribute namespace, doesn't scale to nested objects
3. **Array of viewport configurations**: `[{ device: 'mobile', overrides: {} }]`
    - Rejected: Awkward to access, harder to serialize, unnecessaryComplexity

## Decision: Device Detection Methods

### Editor (Client-Side)

**Chosen**: WordPress `select('core/editor').getDeviceType()` - **EDITOR CONTEXT ONLY**

**Rationale**:

- Already implemented in codebase (lines 81-92 of `src/chart/edit/index.jsx`)
- Returns: `'Desktop'`, `'Tablet'`, or `'Mobile'` (capitalized)
- Tied to WordPress editor's device preview modes (toolbar buttons)
- Updates automatically when user clicks device preview buttons
- **CRITICAL**: Ignores browser window size - uses explicit user selection only
- No window resize listeners in editor context - prevents conflicts between window size and device selection
- Consistent with WordPress editor UX expectations

**Implementation Details**:

```javascript
const { deviceType } = useSelect((select) => {
	const type = select('core/editor').getDeviceType();
	return {
		deviceType: type.toLowerCase(), // Convert to 'desktop'/'tablet'/'mobile'
	};
}, []);

// NEVER do this in editor:
// window.addEventListener('resize', ...) // ❌ WRONG - causes conflicts
```

**Alternatives Considered**:

1. **Window width detection**: `window.innerWidth` with custom breakpoints

    - Rejected for editor: Doesn't align with WordPress preview modes, would conflict with explicit device selection
    - Accepted for frontend: See "Frontend (Client-Side)" section below

2. **CSS media queries**: Use `matchMedia()` API
    - Rejected: Doesn't integrate with WordPress device preview UI

### Frontend (Client-Side) - NEW

**Chosen**: `window.innerWidth` detection with resize listeners in `view.js`

**Rationale**:

- Enables responsive charts when users resize browser window
- Handles device rotation on mobile/tablet
- Uses same breakpoint thresholds as server-side: < 768px (mobile), 768-1024px (tablet), > 1024px (desktop)
- Debounced resize handler (~250ms) prevents performance issues
- **CRITICAL**: Only runs in frontend context, never in editor

**Implementation Details**:

```javascript
// In view.js (frontend only)
function detectViewportFromWidth(width) {
	if (width < 768) return 'mobile';
	if (width < 1024) return 'tablet';
	return 'desktop';
}

// Debounced resize handler
let resizeTimer;
window.addEventListener('resize', () => {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(() => {
		const newViewport = detectViewportFromWidth(window.innerWidth);
		// Re-render chart if viewport changed
	}, 250);
});
```

**Context Separation Summary**:

| Context  | Detection Method                    | Responds to Window Resize? | Purpose                            |
| -------- | ----------------------------------- | -------------------------- | ---------------------------------- |
| Editor   | `getDeviceType()` (explicit)        | ❌ NO (intentionally)      | Editing viewport-specific settings |
| Frontend | `window.innerWidth` (automatic)     | ✅ YES                     | Responsive rendering on resize     |
| Server   | Jetpack Device_Detection (UA-based) | N/A                        | Initial page load device detection |

### Server-Side (Frontend Rendering)

**Chosen**: `PRC\Platform\get_current_device()` using Jetpack Device_Detection

**Rationale**:

- Already available in PRC Platform utilities
- Uses Jetpack's proven device detection library
- Returns: `'mobile'`, `'tablet'`, or `'desktop'` (lowercase)
- Graceful fallback to desktop when Jetpack not available
- Server-side detection means no client-side JS overhead
- Reliable user-agent parsing

**Implementation from provided code**:

```php
function get_current_device() {
  $devices = get_devices(); // Uses Jetpack\Device_Detection
  return $devices['is_phone'] ? 'mobile' :
         ($devices['is_tablet'] ? 'tablet' : 'desktop');
}
```

**Alternatives Considered**:

1. **Custom User-Agent parsing**: Roll our own device detection
    - Rejected: Jetpack library is battle-tested, maintained, handles edge cases
2. **Client-side JS detection**: Pass device info via data attributes
    - Rejected: Adds page weight, flash of unstyled content, unnecessary complexity

## Decision: Viewport Breakpoints

**Chosen**: Industry-standard breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

**Rationale**:

- Aligns with CSS framework conventions (Bootstrap, Tailwind)
- Matches common device widths (phones ~360-414px, tablets ~768-1024px)
- WordPress core uses similar breakpoints for responsive admin
- Jetpack Device_Detection makes these decisions automatically

**Alternatives Considered**:

1. **WordPress core breakpoints**: Varies by context (admin uses different than frontend)
    - Rejected: Not consistent across WordPress
2. **Custom configurable breakpoints**: Allow users to set their own
    - Rejected: Out of scope, adds complexity, 99% of users want standards

## Decision: Attribute Merging Strategy

**Chosen**: Deep merge with viewport overrides taking precedence

**Rationale**:

- Allows partial overrides (e.g., override just `layout.width`, keep other layout props)
- Intuitive behavior: specific beats general
- Performance acceptable: merge happens once per render
- Maintains type safety: merged result has same shape as base attributes

**Merge Logic**:

```javascript
function mergeViewportOverrides(baseAttributes, deviceType) {
	if (deviceType === 'desktop') {
		return baseAttributes; // No merging needed
	}

	const viewportOverrides = baseAttributes[deviceType] || {};

	return {
		...baseAttributes,
		// Deep merge each top-level object
		layout: { ...baseAttributes.layout, ...viewportOverrides.layout },
		labels: { ...baseAttributes.labels, ...viewportOverrides.labels },
		legend: { ...baseAttributes.legend, ...viewportOverrides.legend },
		// ... repeat for all attribute objects
	};
}
```

**Alternatives Considered**:

1. **Shallow merge**: Only override top-level properties
    - Rejected: Too coarse-grained, can't override single nested property
2. **Complete replacement**: If viewport override exists, use it entirely
    - Rejected: Forces editors to duplicate all config, error-prone
3. **Lodash \_.merge()**: Use library for deep merge
    - Rejected: Adds dependency, our structure is simple enough

## Decision: Editor UX Pattern

**Chosen**: Device-aware attribute updates via wrapper function

**Rationale**:

- Minimal code changes: wrap existing `setAttributes()` calls
- Transparent to attribute panel components (they don't need to know about devices)
- Centralized logic for routing updates to correct attribute path
- Easy to add visual indicators later (show which attrs have overrides)

**Implementation Pattern**:

```javascript
function updateAttributeForDevice(path, value, deviceType) {
	if (deviceType === 'desktop') {
		// Update default attribute
		setAttributes({ [path]: value });
	} else {
		// Update viewport-specific override
		const currentViewport = attributes[deviceType] || {};
		setAttributes({
			[deviceType]: {
				...currentViewport,
				[path]: value,
			},
		});
	}
}

// Usage in attribute panels remains simple:
<TextControl
	value={getCurrentValue('layout.width', deviceType)}
	onChange={(val) =>
		updateAttributeForDevice('layout', { width: val }, deviceType)
	}
/>;
```

**Alternatives Considered**:

1. **Modify all attribute panels**: Add device detection to each control
    - Rejected: Lots of code duplication, error-prone
2. **Custom hook**: `useDeviceAttribute(path, deviceType)`
    - Considered: Could be future enhancement for reading values
3. **Context provider**: Wrap all controls in device-aware context
    - Rejected: Over-engineering for this use case

## Block Attribute Deep Merge Implementation

### Challenge: WordPress Block Attributes and Nested Objects

WordPress block attributes don't support automatic deep merging. When you call:

```javascript
setAttributes({ mobile: { layout: { width: 400 } } });
```

It **replaces** the entire `mobile` object, not merges into it.

### Solution: Manual Deep Merge in setAttributes Calls

```javascript
function updateViewportAttribute(deviceType, attributeGroup, updates) {
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

// Example: Update mobile layout width
updateViewportAttribute('mobile', 'layout', { width: 400 });
```

### Helper Function for Reading Merged Values

```javascript
function getCurrentValue(attributeGroup, attributeKey, deviceType) {
	// Check viewport override first
	if (
		deviceType !== 'desktop' &&
		attributes[deviceType]?.[attributeGroup]?.[attributeKey] !== undefined
	) {
		return attributes[deviceType][attributeGroup][attributeKey];
	}
	// Fall back to default
	return attributes[attributeGroup]?.[attributeKey];
}

// Example: Get current width for active device
const width = getCurrentValue('layout', 'width', deviceType);
```

## Viewport Attribute Configuration Precedence

### Precedence Rules

1. **Desktop device type (or undefined)**: Use default attributes only

    - `attributes.layout.width` → chart width
    - Viewport overrides ignored

2. **Mobile device type**: Check mobile override first, fallback to default

    - `attributes.mobile?.layout?.width` (if exists) → chart width
    - Otherwise: `attributes.layout.width` → chart width

3. **Tablet device type**: Check tablet override first, fallback to default
    - `attributes.tablet?.layout?.width` (if exists) → chart width
    - Otherwise: `attributes.layout.width` → chart width
    - Note: Does NOT fallback to desktop-specific attributes (desktop is the default)

### Merge Order (In getConfig)

```javascript
export default function getConfig(
	attributes,
	clientId,
	editorClickEvent,
	deviceType = 'desktop'
) {
	// Step 1: Start with base attributes
	let workingAttributes = attributes;

	// Step 2: Merge viewport overrides if not desktop
	if (deviceType === 'mobile' && attributes.mobile) {
		workingAttributes = mergeViewportOverrides(
			attributes,
			attributes.mobile
		);
	} else if (deviceType === 'tablet' && attributes.tablet) {
		workingAttributes = mergeViewportOverrides(
			attributes,
			attributes.tablet
		);
	}

	// Step 3: Build config from merged attributes
	return {
		layout: workingAttributes.layout,
		labels: workingAttributes.labels,
		// ... rest of config construction
	};
}

function mergeViewportOverrides(baseAttributes, viewportOverrides) {
	return {
		...baseAttributes,
		layout: { ...baseAttributes.layout, ...viewportOverrides.layout },
		labels: { ...baseAttributes.labels, ...viewportOverrides.labels },
		// Deep merge all top-level attribute groups
	};
}
```

## Performance Considerations

### Editor Performance

- **Device Type Detection**: Uses `useSelect` hook, automatically optimized by `@wordpress/data`
- **Attribute Merging**: Happens in `getConfig()`, only when chart re-renders
- **Chart Re-render**: PRC Charting Library handles updates, <100ms target

**Optimization**: Memoize merged attributes

```javascript
const mergedAttributes = useMemo(() => {
	return mergeViewportOverrides(attributes, deviceType);
}, [attributes, deviceType]);
```

### Frontend Performance

- **No Client-Side JS**: Device detection happens server-side
- **Single Render**: Chart renders once with correct config for device
- **No Flash**: No layout shift from detecting device client-side

### Storage Impact

- **Size Increase**: ~10-50% attribute payload increase with full viewport overrides
- **Mitigation**: Most charts will have sparse overrides (only a few properties per viewport)
- **Example**: Base attributes ~5KB, with mobile overrides ~6KB (acceptable)

## Testing Approach

### Test Matrix

| Scenario                       | Device  | Expected Behavior                      | Verification                        |
| ------------------------------ | ------- | -------------------------------------- | ----------------------------------- |
| No viewport overrides          | Any     | Use default attributes                 | Chart identical across all devices  |
| Mobile override set            | Mobile  | Use mobile.\* values                   | Check merged config in getConfig()  |
| Mobile override set            | Desktop | Ignore mobile.\*, use defaults         | Chart shows desktop config          |
| Tablet override missing        | Tablet  | Fallback to desktop defaults           | No tablet-specific attributes       |
| Partial override (layout only) | Mobile  | Override layout, inherit other configs | Labels, legend from defaults        |
| Device switch in editor        | Switch  | Chart updates within 100ms             | Visual inspection + performance.now |
| Server render                  | Mobile  | PHP merges correctly                   | View on actual device               |

### Edge Cases to Test

1. **Override is `null` vs missing**: Both should fallback
2. **Override is `{}` (empty object)**: Should fallback (no properties)
3. **Deep nesting**: Override `independentAxis.tickLabels.fontSize`
4. **Boolean values**: `labels.active = false` vs missing (should be different)
5. **Zero values**: `layout.padding = 0` is valid, different from undefined

## Implementation Risks & Mitigations

| Risk                               | Impact | Likelihood | Mitigation                                 |
| ---------------------------------- | ------ | ---------- | ------------------------------------------ |
| Merge logic bugs                   | High   | Medium     | Unit tests for merge function, QA          |
| Editor performance degradation     | Medium | Low        | Memoization, performance profiling         |
| Confusing UX (which attrs active?) | Medium | Medium     | Future: visual indicators in editor panels |
| Server-client mismatch             | High   | Low        | Use same merge logic PHP and JS            |
| Jetpack not available              | Low    | Low        | Graceful fallback to desktop               |

## Technical Dependencies

- WordPress `@wordpress/editor` store (getDeviceType selector)
- WordPress `@wordpress/data` (useSelect hook)
- PRC Platform utils (get_current_device function)
- Jetpack Device_Detection class (optional, for server-side)
- PRC Charting Library (accepts configuration objects)

## Best Practices from Research

1. **Keep viewport objects shallow**: Only override what's necessary
2. **Document default behavior**: Make it clear desktop is the default
3. **Provide clear feedback**: Editor should show which device is active
4. **Test on real devices**: Emulators/preview modes don't catch everything
5. **Monitor attribute payload size**: Alert if overrides getting too large

## Open Questions Resolved

✅ **Q**: Should tablet fallback to desktop or mobile if no tablet override?
**A**: Fallback to desktop (default attributes), not mobile. More predictable.

✅ **Q**: Should we support custom breakpoints?
**A**: No, use standard 768px/1024px. Keeps it simple.

✅ **Q**: Can any attribute be overridden?
**A**: Yes, any top-level attribute group (layout, labels, legend, etc.)

✅ **Q**: Do we need client-side device detection on frontend?
**A**: No, server-side detection is sufficient. Avoids JS overhead.

✅ **Q**: Should we validate viewport overrides?
**A**: No special validation needed. Invalid values handled by existing chart validation.

---

**Last Updated**: 2026-01-12
**Ready for**: Phase 1 Design (`data-model.md`, `contracts/`, `quickstart.md`)
