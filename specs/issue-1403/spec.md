# Feature Specification: Viewport-Specific Chart Attributes

**Feature Branch**: `issue/1403`
**Created**: 2026-01-12
**Status**: Draft
**Input**: User description: "I would like to be able to create a new set of block attributes that will allow different attributes to be displayed at different viewports within a chart, for instance, if you are on a desktop, maybe we want to show labels but on mobile devices, we want to hide them. We will use the WordPress editor to set these attributes and if no attribute is active on a viewport, then we will just default to the regular attributes that can be found within the block attributes. There will be three different viewport sizes, desktop, tablet and mobile."

## Clarifications

### Session 2026-01-12

- Q: How will editors access and switch between viewport-specific settings in the attribute panel? → A: Use WordPress's existing device preview toolbar buttons (Desktop/Tablet/Mobile). When editors click these buttons, the chart attribute panels automatically show/edit the appropriate viewport settings. The WordPress editor canvas resizes to match the selected device, providing clear visual feedback about which viewport context is being edited.

- Q: What happens when a user resizes their browser window on the frontend (after initial page load with server-rendered chart)? → A: Client-side viewport detection is required in view.js to detect when window width crosses viewport breakpoints (640px, 1023px). When a breakpoint is crossed, the system navigates to trigger server-side re-rendering with the appropriate viewport configuration via the WordPress Interactivity API router. This ensures charts remain responsive to browser resize events and device rotation while leveraging server-side rendering for consistency.

- Q: In the editor, what if a user selects "Mobile" device preview but their editor window is 1280px wide - which device type should be used? → A: In the editor, device type MUST always be determined by WordPress's explicit device preview selector (`select('core/editor').getDeviceType()`), NOT by window.innerWidth. The editor should ignore browser window size and respect the user's explicit device selection. Window resize detection (window.innerWidth) should ONLY be used in frontend view.js, never in the editor.

### Session 2026-01-13

- Q: Should client-side viewport switching use client-side attribute merging or server-side re-rendering? → A: **Server-side navigation approach confirmed**. When viewport changes are detected via window resize on the frontend, the system uses the WordPress Interactivity API router (`router.actions.navigate()`) to navigate with a `cb_viewport` query parameter. This triggers server-side rehydration where PHP merges viewport-specific attributes and re-renders the chart. This approach ensures consistency between initial server render and subsequent viewport changes, avoids duplicating merge logic in JavaScript, and leverages the Interactivity API's built-in state synchronization.

- Q: Is this feature only for chart labels, or should ALL attributes be viewport-adjustable? → A: **ALL chart attributes must be viewport-adjustable**. The user stories (labels, fonts, axes, legend) are priority examples that demonstrate the system with high-value use cases. However, the underlying infrastructure (viewport attribute schema, merge functions, editor hooks) is designed to support viewport overrides for ANY chart attribute across all attribute groups: layout, labels, legend, independentAxis, dependentAxis, tooltip, bar, line, map, pie, dataRender, plotBands, and annotations. Phase 7 in the implementation plan explicitly covers making all remaining attributes viewport-aware after the priority user stories are complete.

## User Scenarios & Testing

### User Story 1 - Mobile-Optimized Chart Labels (Priority: P1)

A content editor creates a bar chart with data labels that are readable on desktop but would clutter the mobile view. They want to show labels on desktop but hide them on mobile devices for a cleaner presentation.

**Why this priority**: This is the most common use case and delivers immediate value by allowing responsive chart configurations. It's the core capability that all other viewport-specific customizations build upon.

**Independent Test**: Can be fully tested by creating a chart with labels enabled, setting the mobile viewport to hide labels, and viewing the chart on different screen sizes. Delivers immediate value by making charts more mobile-friendly.

**Acceptance Scenarios**:

1. **Given** a chart block is open in the editor, **When** the editor configures labels to show on desktop but hide on mobile, **Then** the chart displays labels on desktop viewports and hides them on mobile viewports
2. **Given** a chart has viewport-specific label settings, **When** no mobile-specific setting is configured, **Then** the chart falls back to the default label setting from the main attributes
3. **Given** a chart with mobile label settings, **When** viewed on a tablet, **Then** the chart uses tablet-specific settings if configured, otherwise falls back to desktop settings

---

### User Story 2 - Tablet-Specific Font Sizing (Priority: P2)

A content editor needs to adjust chart text sizes for tablets because the default desktop size is too large for tablet screens but the mobile size is too small. They want independent control over tablet typography.

**Why this priority**: Tablets are a distinct viewport that often needs different treatment than phones or desktops. This ensures charts look optimal across all three major device categories.

**Independent Test**: Can be tested by setting different font sizes for desktop/tablet/mobile and viewing on each device type. Validates the three-tier viewport system works correctly.

**Acceptance Scenarios**:

1. **Given** a chart block in the editor, **When** the editor sets font sizes for desktop (14px), tablet (12px), and mobile (10px), **Then** each viewport displays the appropriate font size
2. **Given** tablet-specific settings are not configured, **When** viewing on a tablet, **Then** the chart falls back to desktop settings
3. **Given** a chart with viewport overrides, **When** the editor clears a tablet-specific setting, **Then** the tablet viewport reverts to using the desktop default

---

### User Story 3 - Responsive Axis Configuration (Priority: P2)

A content editor has a line chart with detailed axis labels that are perfect for desktop but too verbose for mobile. They want to show abbreviated axis labels on mobile while keeping the full labels on desktop.

**Why this priority**: Axis configuration is crucial for chart readability, and mobile screens often require simplified or abbreviated labels to prevent overlap and crowding.

**Independent Test**: Can be tested independently by configuring different axis settings per viewport and validating each viewport shows its configured values.

**Acceptance Scenarios**:

1. **Given** a chart with detailed X-axis labels, **When** the editor configures abbreviated labels for mobile, **Then** mobile viewports show abbreviated labels while desktop shows full labels
2. **Given** axis tick counts differ by viewport, **When** switching between viewports, **Then** each viewport displays the appropriate number of ticks
3. **Given** axis visibility is toggled per viewport, **When** mobile hides Y-axis, **Then** the Y-axis is hidden on mobile but visible on other viewports

---

### User Story 4 - Legend Position by Viewport (Priority: P3)

A content editor wants the legend positioned below the chart on desktop where there's horizontal space, but above the chart on mobile to prevent excessive scrolling.

**Why this priority**: Legend positioning affects chart layout and user experience but is less critical than core display elements like labels and axes.

**Independent Test**: Can be tested by setting different legend positions per viewport and validating layout changes accordingly on each device type.

**Acceptance Scenarios**:

1. **Given** a chart with a legend, **When** the editor sets legend position to bottom for desktop and top for mobile, **Then** the legend appears in the configured position for each viewport
2. **Given** legend visibility differs by viewport, **When** mobile disables the legend, **Then** the legend is hidden on mobile but visible on desktop
3. **Given** viewport-specific legend settings, **When** tablet settings are not configured, **Then** the tablet uses desktop legend settings

---

### Edge Cases

- What happens when a viewport-specific setting is configured but then the default setting is changed? (Viewport override should still take precedence)
- How does the system handle viewport detection when window is resized on frontend? (Client-side JavaScript in view.js detects window resize, determines new viewport from window.innerWidth, re-renders chart if viewport breakpoint crossed)
- In the editor, what if the editor window is 1280px wide but the user selects "Mobile" preview? (Editor always uses WordPress device selector, ignores window size - user sees mobile configuration)
- In the editor, does resizing the editor window change the active viewport configuration? (No - only the explicit device preview selector changes viewport, window resize is ignored)
- What happens if user rapidly resizes window back and forth across breakpoints on frontend? (Debounce resize handler to prevent excessive re-renders, ~250ms delay)
- What happens if all three viewport configurations are set to different values and then deleted? (Should revert to default attributes)
- How are viewport settings preserved when copying/pasting a chart block? (Viewport overrides should be copied with the block)
- What happens when a new attribute is added to the chart schema but viewport overrides don't include it yet? (Should fall back to default gracefully)

## Requirements

### Functional Requirements

- **FR-001**: System MUST support three distinct viewport configurations: desktop, tablet, and mobile
- **FR-002**: System MUST allow editors to configure viewport-specific overrides for any chart attribute in the WordPress block editor
- **FR-003**: System MUST fall back to default block attributes when no viewport-specific override is configured
- **FR-004**: System MUST apply viewport-specific attributes based on screen width thresholds: mobile (< 768px), tablet (768px - 1024px), desktop (> 1024px)
- **FR-005**: System MUST preserve viewport-specific settings when charts are saved, copied, or duplicated
- **FR-006**: System MUST update chart rendering reactively when viewport changes (e.g., browser resize, device rotation) on both editor and frontend. Frontend requires client-side JavaScript in view.js to detect window resize events and re-render charts when viewport breakpoints are crossed.
- **FR-007**: System MUST leverage WordPress's existing device preview toolbar buttons (Desktop/Tablet/Mobile) for toggling between viewport configurations. When editors switch preview modes, attribute panels automatically show/edit settings for the active viewport.
- **FR-008**: System MUST indicate which attributes have viewport-specific overrides through WordPress's visual device preview feedback (editor canvas resizes to match selected device)
- **FR-009**: System MUST allow clearing/resetting viewport-specific overrides to restore default behavior
- **FR-010**: System MUST support viewport overrides for all existing chart attributes (labels, axes, legend, colors, sizing, etc.)
- **FR-011**: System MUST implement client-side viewport detection in view.js that listens for window resize events and determines current viewport based on window.innerWidth against breakpoints (< 768px = mobile, 768-1024px = tablet, > 1024px = desktop). This viewport detection is ONLY for frontend rendering, NOT for the editor.
- **FR-012**: System MUST re-render charts with appropriate viewport configuration when client-side viewport detection detects a viewport change (crossing breakpoint thresholds during browser resize) on the frontend only.
- **FR-013**: System MUST use WordPress device preview selector (`select('core/editor').getDeviceType()`) as the ONLY source of device type in the editor, completely ignoring browser window.innerWidth. Editor device type must never be influenced by window resize events.

### Key Entities

- **Viewport Configuration**: Represents a set of attribute overrides for a specific viewport (desktop, tablet, or mobile). Contains attribute values that override the default block attributes when the viewport is active.
- **Viewport Threshold**: Defines the screen width ranges that determine which viewport configuration is active. Typically: mobile (< 768px), tablet (768-1024px), desktop (> 1024px).
- **Attribute Override**: A specific attribute value (e.g., `labelsActive: false`) that applies only to a particular viewport, overriding the default attribute value.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Editors can configure viewport-specific attributes for a chart in under 2 minutes
- **SC-002**: Charts automatically adapt to viewport changes within 100ms of resize/rotation
- **SC-003**: 95% of viewport-specific configurations display correctly across all three viewport sizes without visual glitches
- **SC-004**: Chart performance (render time) does not degrade by more than 10% when viewport-specific overrides are enabled
- **SC-005**: Editors can successfully identify which attributes have viewport overrides within 5 seconds (through visual indicators)
- **SC-006**: 90% of charts with viewport overrides maintain correct fallback behavior when overrides are not set
- **SC-007**: Mobile chart readability improves by measurable reduction in label overlap and crowding (target: 80% reduction in overlapping elements)

## Assumptions

- Screen width thresholds follow industry-standard breakpoints (mobile < 768px, tablet 768-1024px, desktop > 1024px)
- Viewport detection uses browser window width (not device type detection)
- Server-side detection happens once at initial page load via Jetpack Device_Detection
- Client-side detection happens on window resize via window.innerWidth measurement (FRONTEND ONLY)
- Editor device detection uses WordPress's explicit device preview selector ONLY - window resize events are completely ignored in the editor context
- Editor and frontend use different device detection strategies: editor = explicit selector, frontend = window.innerWidth
- Viewport-specific overrides are stored as nested attributes within the chart block
- The existing WordPress block editor infrastructure supports conditional/tabbed attribute panels
- Chart re-rendering on viewport change is acceptable from a performance perspective (target: <100ms)
- Resize event handlers should be debounced (~250ms) to prevent excessive re-renders during window dragging (frontend only)
- Editors are familiar with responsive design concepts and understand viewport terminology
- The chart library (PRC Charting Library) supports dynamic attribute updates without full re-initialization
- Charts rendered via Interactivity API have access to block attributes for client-side viewport merging

## Out of Scope

- Custom viewport breakpoints (using fixed three-tier system)
- Per-user viewport preferences (viewport detection is automatic)
- Animation or transitions when viewport changes
- Print-specific styling or viewport
- Viewport preview mode in the editor (editors must use browser resize or device preview)
- Automatic optimization suggestions for mobile (manual configuration only)
- Pure server-side rendering without client-side responsiveness (charts must respond to browser resize)
- Client-side rendering only without server-side initial render (initial page load must use server-detected device)

## Dependencies

- Requires existing PRC Chart Builder block architecture (issue-2013)
- Requires WordPress block editor attribute system
- Requires PRC Charting Library's ability to accept dynamic configuration updates
- Requires WordPress Interactivity API for frontend interactivity (view.js)
- Requires block attributes to be accessible to view.js for client-side viewport merging

## Open Questions

None - all critical decisions have reasonable defaults based on industry standards and existing chart builder patterns.

---

**Last Updated**: 2026-01-12
**Ready for**: Clarification and Planning (`/speckit.clarify` or `/speckit.plan`)
