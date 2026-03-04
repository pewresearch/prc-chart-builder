# Implementation Plan: Viewport-Specific Chart Attributes

**Branch**: `issue/1403` | **Date**: 2026-01-12 | **Spec**: [spec.md](./spec.md)

## Summary

Implement viewport-specific attribute overrides for chart blocks, allowing editors to configure different chart settings for desktop, tablet, and mobile viewports. The feature uses WordPress editor device detection and server-side device detection via Jetpack, with automatic fallback to default attributes when viewport-specific overrides are not set.

## Technical Context

**Language/Version**: JavaScript (ES2020+), PHP 8.0+, WordPress Block Editor API v3
**Primary Dependencies**: @wordpress/blocks, @wordpress/components, @wordpress/data, @wordpress/editor, PRC Charting Library, Jetpack Device Detection (optional)
**Storage**: WordPress post_content (block attributes as serialized JSON in HTML comments)
**Testing**: Manual QA in WordPress editor across viewport sizes, browser resize testing, device preview testing
**Target Platform**: WordPress 6.4+ with Gutenberg block editor
**Project Type**: WordPress plugin with block editor extensions
**Performance Goals**: Chart re-render <100ms on viewport change, no degradation in initial load time
**Constraints**: Must use existing block attribute system, must integrate with current PRC Charting Library configuration format, must maintain backward compatibility with charts without viewport overrides
**Scale/Scope**: Affects chart block only (not controller or synced-chart), adds 2 root-level attribute objects (`mobile` and `tablet`)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Block-Based Architecture ✅

- **Compliance**: PASS - Feature is implemented entirely within the existing Chart Block using block attributes
- **Justification**: Viewport-specific attributes are stored as block attributes (`mobile` and `tablet` objects at root level), following WordPress block attribute patterns

### II. PRC Charting Library Integration ✅

- **Compliance**: PASS - No changes to charting library, only configuration object construction
- **Justification**: Feature modifies how we construct the configuration object passed to PRC Charting Library based on viewport. The library itself remains unchanged and continues to handle all rendering.

### III. WordPress Data Patterns ✅

- **Compliance**: PASS - Uses `@wordpress/data` for device type detection, block attributes for persistence
- **Justification**: Leverages `select('core/editor').getDeviceType()` for editor viewport detection. No external state libraries needed.

### IV. Separation of Concerns ✅

- **Compliance**: PASS - Changes isolated to Chart Block; Controller Block unaffected
- **Justification**: Viewport overrides are a rendering concern, properly scoped to the Chart Block. Controller continues to handle data processing without awareness of viewport-specific rendering.

### V. Editor-First UX ✅

- **Compliance**: PASS - Editor controls use WordPress components, visual feedback via device preview
- **Justification**: Uses WordPress's built-in device preview modes (Desktop/Tablet/Mobile) in the editor. Attribute changes are immediately reflected in the chart preview.

**Constitution Verdict**: ✅ **NO VIOLATIONS** - Feature fully compliant with all principles

## Project Structure

### Documentation (this feature)

```text
specs/issue-1403/
├── plan.md              # This file
├── research.md          # Phase 0: Device detection patterns
├── data-model.md        # Phase 1: Viewport attribute structure
├── quickstart.md        # Phase 1: Implementation guide
└── contracts/           # Phase 1: Block attribute schema contracts
    └── viewport-attributes-schema.json
```

### Source Code (repository root)

```text
plugins/prc-chart-builder/
├── src/chart/
│   ├── block.json                      # MODIFY: Add mobile/tablet root attributes
│   ├── edit/
│   │   └── index.jsx                   # MODIFY: Add viewport detection + attribute routing
│   └── utils/
│       └── get-config.js               # MODIFY: Merge viewport overrides into config
├── build/chart/
│   └── class-chart.php                 # MODIFY: Server-side viewport detection + attribute merging
└── includes/
    └── utils.php                       # EXISTING: get_current_device() already available
```

**Structure Decision**: All changes contained within existing Chart Block structure. No new blocks or directories needed. Leverages existing `get-config.js` utility for configuration construction and existing `utils.php` for server-side device detection.

## Complexity Tracking

> No complexity violations - this feature adds no new architectural patterns or dependencies

## Phase 0: Research & Decisions

### Research Tasks

1. **WordPress Editor Device Detection API**

    - Research: How `getDeviceType()` works and when it updates
    - Research: Available device types and their values
    - Research: How to listen for device type changes

2. **Block Attribute Merging Patterns**

    - Research: Best practices for deep merging nested attribute objects
    - Research: How to preserve default values when overrides are undefined
    - Research: Performance implications of deep object merging

3. **Server-Side Device Detection**

    - Research: Jetpack Device_Detection class capabilities and reliability
    - Research: Fallback behavior when Jetpack not available
    - Research: Caching considerations for device detection

4. **Viewport Breakpoint Standards**
    - Research: Industry-standard breakpoints (confirm 768px, 1024px)
    - Research: WordPress core breakpoints for consistency
    - Research: Mobile-first vs desktop-first considerations

### Key Decisions

| Decision                                         | Rationale                                                                             | Alternatives Considered                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------ |
| Root-level `mobile`/`tablet` attributes          | Parallels main attribute structure, easy to merge                                     | Single `viewports` object (more nesting)   |
| Use WordPress `getDeviceType()` in editor ONLY   | Built-in editor function, aligns with preview modes, prevents window resize conflicts | Custom viewport detection via window width |
| Use window.innerWidth in frontend ONLY           | Enables responsive charts on browser resize, device rotation                          | Static rendering (no resize response)      |
| Separate device detection for editor vs frontend | Prevents collision between explicit device selection and window size                  | Single detection method for both contexts  |
| Jetpack Device_Detection for server-side         | Already available in platform, proven device detection                                | User-Agent parsing (less reliable)         |
| Desktop as default fallback                      | Most common editing context, matches current behavior                                 | Mobile-first approach (breaking change)    |
| Deep merge viewport into base config             | Allows partial overrides, flexible granularity                                        | Full config replacement (all-or-nothing)   |
| Update attributes on device type change          | Editor UX: immediate feedback, matches WordPress UX pattern                           | Update only on save (confusing UX)         |

## Phase 1: Design & Contracts

### Data Model Changes

See [data-model.md](./data-model.md) for complete attribute structure.

**Summary**:

- Add `mobile` object at root level (mirrors subset of main attributes)
- Add `tablet` object at root level (mirrors subset of main attributes)
- Viewport objects can contain any override for: `layout`, `metadata`, `independentAxis`, `dependentAxis`, `labels`, `legend`, `tooltip`, etc.
- Missing properties in viewport objects mean "use default"

**Example Structure**:

```json
{
	"_version": "v2",
	"id": "chart-id",
	"layout": { "width": 800, "height": 400 },
	"labels": { "active": true },
	"mobile": {
		"layout": { "width": 400, "height": 300 },
		"labels": { "active": false }
	},
	"tablet": {
		"layout": { "width": 600, "height": 350 }
		// labels.active not specified, falls back to default (true)
	}
}
```

### Files to Modify

1. **src/chart/block.json**

    - Add `mobile` attribute: `{ "type": "object", "default": {} }`
    - Add `tablet` attribute: `{ "type": "object", "default": {} }`

2. **src/chart/edit/use-viewport-attributes.js** (NEW - Custom Hook)

    - Create `useDeviceType()` hook that accesses WordPress Redux store via `select(editorStore).getDeviceType()`
    - Create `useViewportAttributes(attributes, setAttributes)` hook that provides centralized viewport-aware attribute management
    - Export `getCurrentValue(attributeGroup, attributeKey)` helper that checks viewport override first, then falls back to default
    - Export `updateAttributeForDevice(attributeGroup, updates)` helper that routes updates based on device type
    - **BENEFIT**: No prop drilling - any component can import and use the hook directly to access device type and attribute helpers

3. **src/chart/edit/index.jsx**

    - Import and use `useViewportAttributes` hook instead of inline useSelect
    - Get `{ deviceType, getCurrentValue, updateAttributeForDevice }` from hook
    - Pass `deviceType` to `getConfig()` function call
    - **CRITICAL**: Never listen to window resize events in editor - device type comes exclusively from WordPress device selector

4. **src/chart/edit/meta-text-fields.jsx**

    - Import and use `useViewportAttributes` hook to get attribute helpers
    - Update title/subtitle RichText components to use `getCurrentValue()` for values
    - Update onChange handlers to use `updateAttributeForDevice()` for updates
    - **BENEFIT**: Component is self-contained - no props needed beyond attributes and setAttributes

5. **src/chart/utils/get-config.js**

    - Add `deviceType` parameter to `getConfig(attributes, clientId, editorClickEvent, deviceType = 'desktop')`
    - Create `mergeViewportOverrides(baseAttributes, deviceType)` helper
    - Merge viewport-specific attributes before constructing config
    - Return merged configuration to PRC Charting Library

6. **src/chart/view.js** (NEW implementation requirement)

    - Create `detectViewportFromWidth(windowWidth)` function: returns 'mobile' | 'tablet' | 'desktop' based on width thresholds
    - Add debounced window resize listener (~250ms delay) that calls detectViewportFromWidth
    - Implement chart re-render logic when viewport breakpoint is crossed
    - Call `mergeViewportOverrides()` (import from get-config.js) to merge attributes client-side
    - **CRITICAL**: This window resize detection is ONLY for frontend, never runs in editor context

7. **build/chart/class-chart.php**
    - Import `PRC\Platform\get_current_device()` (already available)
    - Call `get_current_device()` in `render_block_callback()`
    - Create `merge_viewport_attributes($attributes, $device_type)` method
    - Pass merged attributes to chart rendering

### Implementation Contracts

See [contracts/viewport-attributes-schema.json](./contracts/viewport-attributes-schema.json) for complete JSON schema.

**Key Contracts**:

```typescript
// Editor device type
type DeviceType = 'Desktop' | 'Tablet' | 'Mobile';

// Server device type
type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Viewport attribute structure
interface ViewportAttributes {
	layout?: Partial<LayoutAttributes>;
	metadata?: Partial<MetadataAttributes>;
	independentAxis?: Partial<AxisAttributes>;
	dependentAxis?: Partial<AxisAttributes>;
	labels?: Partial<LabelAttributes>;
	legend?: Partial<LegendAttributes>;
	tooltip?: Partial<TooltipAttributes>;
	// ... any other chartattribute object
}

// Updated block attributes
interface ChartBlockAttributes {
	// ... existing attributes
	mobile?: ViewportAttributes;
	tablet?: ViewportAttributes;
}

// Merge function signature
function mergeViewportOverrides(
	baseAttributes: ChartBlockAttributes,
	deviceType: 'desktop' | 'tablet' | 'mobile'
): ChartBlockAttributes;
```

### Integration Points

1. **Editor Integration**

    - WordPress device preview (Desktop/Tablet/Mobile buttons in toolbar)
    - Attribute panel: Visual indicator when editing viewport-specific override
    - Chart preview: Real-time update when switching devices

2. **Rendering Integration**

    - `get-config.js`: Constructs merged config for PRC Charting Library
    - `class-chart.php`: Server-side rendering with device-specific attributes
    - Frontend: Uses server-rendered attributes (no client-side JS needed for device detection)

3. **Data Flow**

    ```
    EDITOR:
    User changes device → getDeviceType() → updateAttributeForDevice()
    → setAttributes({ [device]: { ...override } }) → block saved
    → Chart preview updates via get-config(attrs, id, event, deviceType)

    FRONTEND:
    Page load → get_current_device() → merge_viewport_attributes()
    → render with merged config → PRC Charting Library renders
    ```

## Phase 2: Implementation Tasks

_NOT created by `/speckit.plan` - use `/speckit.tasks` command_

## Testing Strategy

## Testing Strategy

### Key Testing Focus: metadata.title (Proof of Concept)

We're implementing metadata.title FIRST as a proof of concept. Once this works correctly, we'll extend the pattern to all other attributes.

### Unit Testing (Manual)

**Hook Testing** (`use-viewport-attributes.js`):

1. Create test chart block in editor
2. Open browser console and import the hook
3. Verify `useDeviceType()` returns correct value when switching device preview modes
4. Verify `getCurrentValue()` returns desktop value when in desktop mode
5. Verify `getCurrentValue()` returns viewport override when set and not in desktop mode
6. Verify `updateAttributeForDevice()` updates correct attribute location based on device type

**Merge Function Testing** (`get-config.js`):

1. Create test attributes object with viewport overrides
2. Call `mergeViewportOverrides(attrs, 'mobile')` in console
3. Verify returned object has mobile overrides merged into base attributes
4. Verify desktop attributes unchanged when deviceType='desktop'
5. Verify deep merge works (nested object properties merge correctly)

### Integration Testing (Manual) - metadata.title Focus

**Editor Flow Testing**:

1. Create new chart in editor (desktop mode by default)
2. Set title to "Desktop Title"
3. Switch to Mobile device preview (toolbar button)
4. Verify title still shows "Desktop Title" (no override yet)
5. Change title to "Mobile Title"
6. Verify title updates to "Mobile Title"
7. Switch back to Desktop preview
8. Verify title shows "Desktop Title" (desktop default preserved)
9. Switch to Tablet preview
10. Verify title shows "Desktop Title" (no tablet override, falls back to desktop)
11. Change title to "Tablet Title"
12. Switch between all three device previews
13. Verify each preview shows its respective title (Desktop/Mobile/Tablet)
14. Save post and verify block attributes stored correctly in database

**Server-Side Rendering Testing**:

1. With chart from above (has different titles per device), save and publish
2. View post on desktop browser (width > 1024px)
3. Verify "Desktop Title" is rendered
4. Resize browser to tablet width (768-1024px) or use responsive design mode
5. Verify chart title doesn't change yet (server rendered with desktop on page load)
6. View post on actual mobile device or mobile emulator
7. Verify "Mobile Title" is server-rendered on initial load
8. View post on tablet device
9. Verify "Tablet Title" is rendered (or "Desktop Title" if no tablet override was set)

**Editor Window Resize Testing** (critical - should NOT trigger viewport changes):

1. Open chart in editor with Mobile device preview selected
2. Set title to "Mobile Title"
3. Resize editor browser window to be very wide (> 1024px)
4. Verify title still shows "Mobile Title" (window size ignored in editor)
5. Verify chart preview still shows mobile configuration
6. Click Desktop device preview button
7. Verify NOW title changes to desktop value
8. Confirm window resize events are not affecting editor device type

### Edge Case Testing

**No Override Scenario**:

1. Create chart, set title on desktop
2. Switch to mobile, don't change title
3. Verify mobile shows desktop title (fallback works)
4. Save and view on mobile device
5. Verify desktop title is rendered (no mobile override stored)

**Partial Override Scenario**:

1. Create chart with multiple metadata fields (title, subtitle, note)
2. On mobile, only override title (leave subtitle/note unchanged)
3. Verify mobile shows custom title but desktop subtitle/note
4. Verify attributes stored correctly (only title in mobile override object)

**Clear Override Scenario**:

1. Create chart with mobile title override
2. Switch to mobile, delete custom title completely
3. Verify falls back to showing desktop title
4. Save and verify mobile override removed from attributes

**Copy/Paste Chart Scenario**:

1. Create chart with viewport overrides
2. Copy the chart block
3. Paste in same post
4. Verify viewport overrides copied correctly
5. Verify both charts function independently

### Success Criteria Validation (for metadata.title)

After metadata.title testing, verify against spec.md success criteria:

- [ ] **SC-001**: Configuring viewport title takes < 2 minutes ✓
- [ ] **SC-002**: Charts adapt to viewport changes within 100ms ✓ (use browser perf tools)
- [ ] **SC-003**: Title displays correctly across all three viewports ✓ (test across devices)
- [ ] **SC-004**: Performance degradation < 10% ✓ (measure render time with/without overrides)

**Once metadata.title passes all tests above, we can confidently extend to other attributes using the same pattern.**

### Manual Test Scenarios (Original - For Full Implementation)

1. **Desktop Editing**

    - Open chart in editor (desktop device type)
    - Change layout.width
    - Verify: Default `layout.width` updated, mobile/tablet unchanged

2. **Mobile Device Type**

    - Switch to mobile device preview in editor
    - Change labels.active to false
    - Verify: `mobile.labels.active = false`, default `labels.active` unchanged
    - Switch back to desktop
    - Verify: Labels still visible (default active = true)

3. **Tablet Fallback**

    - Switch to tablet device preview
    - Verify: Chart uses tablet overrides if set
    - If no tablet override, verify: Chart uses desktop defaults
    - Set tablet-specific legend position
    - Verify: Only affects tablet view

4. **Server Render**

    - Create chart with mobile overrides (labels off)
    - View on actual mobile device
    - Verify: Labels are hidden
    - View on desktop browser
    - Verify: Labels are shown

5. **Copy/Paste**
    - Create chart with viewport overrides
    - Copy/paste block
    - Verify: Viewport overrides copied with block
    - Modify override in copied block
    - Verify: Original block unchanged

### Rollback Plan

If issues arise:

1. Viewport attributes are optional - charts without them continue working
2. Can disable feature by not routing through device-aware helper in edit.jsx
3. Can revert by removing `mobile`/`tablet` from block.json (backwards compatible)

## Success Criteria

From [spec.md](./spec.md):

- **SC-001**: Editors can configure viewport-specific attributes in <2 minutes ✓
- **SC-002**: Charts adapt to viewport changes within 100ms ✓
- **SC-003**: 95% accuracy across viewport sizes ✓
- **SC-004**: <10% performance degradation ✓
- **SC-005**: Editors identify overrides within 5 seconds ✓
- **SC-006**: 90% correct fallback behavior ✓
- **SC-007**: 80% reduction in mobile label overlap ✓

## Notes

- This feature builds on the existing v2 block attribute structure (issue-2013)
- No migration needed - new attributes are optional and default to `{}`
- Existing charts continue to work without changes
- Feature can be rolled out gradually - editors can adopt viewport overrides as needed
- Future enhancement: Visual indicators in editor UI to show which attributes have overrides

---

**Last Updated**: 2026-01-12
**Ready for**: Phase 0 Research (`research.md` creation)
