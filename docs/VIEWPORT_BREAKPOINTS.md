# Viewport Breakpoints and Fallback Behavior

**Purpose**: Technical documentation of viewport breakpoints, detection logic, and fallback behavior

## Breakpoint Definitions

### Client-Side (Browser)

Breakpoints are determined by `window.innerWidth`:

```javascript
function getViewportFromWidth(width) {
	if (width <= 640) return 'mobile';
	if (width <= 1023) return 'tablet';
	return 'desktop';
}
```

**Breakpoints**:

- **Mobile**: `width ≤ 640px`
- **Tablet**: `641px ≤ width ≤ 1023px`
- **Desktop**: `width ≥ 1024px`

### Server-Side (PHP)

Breakpoints are determined by `PRC\Platform\get_current_device()`:

```php
$device_type = \PRC\Platform\get_current_device();
// Returns: 'desktop' | 'tablet' | 'mobile'
```

The server-side function uses the same breakpoint logic as the client, ensuring consistency.

### Editor Preview

The WordPress block editor provides device preview modes that match these breakpoints:

- **Desktop**: Default view, full editor width
- **Tablet**: Simulated tablet width (~768px)
- **Mobile**: Simulated mobile width (~375px)

## Viewport Detection Flow

### Editor (Client-Side)

1. User selects device preview in editor toolbar
2. WordPress Redux store updates `deviceType`
3. `useDeviceType()` hook reads from store
4. Chart re-renders with viewport-specific attributes

**File**: `src/chart/edit/use-viewport-attributes.js`

### Frontend (Client-Side)

1. Page loads with server-rendered chart
2. `watchForResize` handler monitors `window.innerWidth`
3. When breakpoint changes, navigates to new URL with `cb_viewport` query param
4. Server re-renders chart with correct viewport
5. Client rehydrates with new server state

**File**: `src/chart/view.js`

### Server-Side Rendering

1. Request arrives (with optional `cb_viewport` query param)
2. `get_current_device()` determines device type
3. `merge_viewport_attributes()` merges viewport overrides
4. Chart renders with merged attributes
5. Server state includes `currentViewport` for client hydration

**File**: `src/chart/class-chart.php`

## Fallback Behavior

### Attribute Resolution Order

When reading an attribute value:

1. **Check viewport override** (if not desktop):

    ```javascript
    if (
    	deviceType !== 'desktop' &&
    	attributes[deviceType]?.[group]?.[key] !== undefined
    ) {
    	return attributes[deviceType][group][key];
    }
    ```

2. **Fall back to desktop default**:
    ```javascript
    return attributes[group]?.[key];
    ```

### Examples

#### Example 1: Mobile Override Exists

```json
{
	"labels": { "fontSize": 12 },
	"mobile": { "labels": { "fontSize": 10 } }
}
```

**Result**:

- Desktop: `12px` (from `labels.fontSize`)
- Tablet: `12px` (from `labels.fontSize`, no tablet override)
- Mobile: `10px` (from `mobile.labels.fontSize`)

#### Example 2: Tablet Override Exists

```json
{
	"labels": { "fontSize": 12 },
	"tablet": { "labels": { "fontSize": 11 } }
}
```

**Result**:

- Desktop: `12px` (from `labels.fontSize`)
- Tablet: `11px` (from `tablet.labels.fontSize`)
- Mobile: `12px` (from `labels.fontSize`, no mobile override)

#### Example 3: Both Overrides Exist

```json
{
	"labels": { "fontSize": 12 },
	"tablet": { "labels": { "fontSize": 11 } },
	"mobile": { "labels": { "fontSize": 10 } }
}
```

**Result**:

- Desktop: `12px` (from `labels.fontSize`)
- Tablet: `11px` (from `tablet.labels.fontSize`)
- Mobile: `10px` (from `mobile.labels.fontSize`)

#### Example 4: Partial Override

```json
{
	"labels": { "fontSize": 12, "color": "inherit" },
	"mobile": { "labels": { "fontSize": 10 } }
}
```

**Result** (Mobile):

- `fontSize`: `10px` (from `mobile.labels.fontSize`)
- `color`: `"inherit"` (from `labels.color`, no mobile override)

## Content Attributes (No Fallback)

**Important**: Content attributes (`io`, `dataRender`, `colors`, `divergingBar`) are **NOT** viewport-aware. They always use the base attribute value:

```javascript
// Content attributes - direct access, no viewport override
const io = attributes.io || {};
const dataRender = attributes.dataRender || {};
```

**Why**: These represent WHAT data to show, which should be consistent across all viewports.

## Edge Cases

### Case 1: Rapid Viewport Switching

**Behavior**: Debounced resize handler (250ms) prevents excessive re-renders.

**Implementation**: `src/chart/view.js` - `watchForResize` uses debounce.

### Case 2: Viewport Override Deleted

**Behavior**: Chart reverts to desktop default immediately.

**Implementation**: When override value matches desktop value, override is effectively removed.

### Case 3: Missing Viewport Override

**Behavior**: Falls back to desktop default seamlessly.

**Implementation**: `getCurrentValue()` checks for override existence before using.

### Case 4: Invalid Device Type

**Behavior**: Defaults to 'desktop' and uses base attributes.

**Implementation**:

```javascript
const deviceType = type ? type.toLowerCase() : 'desktop';
```

### Case 5: Server-Side Query Parameter Override

**Behavior**: `cb_viewport` query parameter can force a specific viewport for testing.

**Implementation**: `class-chart.php` checks `$_GET['cb_viewport']` before calling `get_current_device()`.

## Performance Considerations

### Merge Performance

- **Desktop**: No merge needed (returns base attributes directly)
- **Tablet/Mobile**: Shallow merge of attribute groups (~0.01ms overhead)

**Target**: <10% performance degradation with viewport overrides.

### Re-render Performance

- **Device switching**: <100ms target
- **Debounced resize**: 250ms delay prevents excessive renders

## Testing Breakpoints

### Manual Testing

1. **Desktop**: Open browser at ≥1024px width
2. **Tablet**: Resize browser to 641-1023px width
3. **Mobile**: Resize browser to ≤640px width

### Automated Testing

Use browser dev tools or testing frameworks to simulate viewport sizes:

```javascript
// Set viewport width
window.innerWidth = 375; // Mobile
window.innerWidth = 768; // Tablet
window.innerWidth = 1200; // Desktop
```

### Server-Side Testing

Use query parameter to force viewport:

```
https://example.com/chart-page/?cb_viewport=mobile
https://example.com/chart-page/?cb_viewport=tablet
https://example.com/chart-page/?cb_viewport=desktop
```

## Migration Notes

### From v1 Charts

- v1 charts have no viewport overrides
- All viewports use the same (v1) attributes
- Migration to v2 preserves this behavior (no viewport overrides created)

### Adding Viewport Overrides

- Viewport overrides are opt-in
- Charts without overrides work identically to before
- Overrides only created when explicitly set in device preview mode

## Related Documentation

- [VIEWPORT_ATTRIBUTES.md](./VIEWPORT_ATTRIBUTES.md) - Architecture and implementation details
- [VIEWPORT_USAGE_GUIDE.md](./VIEWPORT_USAGE_GUIDE.md) - Editor usage guide
- [quickstart.md](../specs/issue-1403/quickstart.md) - Developer implementation guide

---

**Last Updated**: 2026-01-12
**Version**: Chart Builder v3.3.0+
