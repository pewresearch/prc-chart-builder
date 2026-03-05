# Viewport-Specific Chart Settings: Editor Usage Guide

**Audience**: Content creators and editors using the Chart Builder block
**Purpose**: Guide for configuring charts that look great on desktop, tablet, and mobile devices

## Overview

The Chart Builder now supports viewport-specific settings, allowing you to customize how your charts appear on different screen sizes. You can:

- Hide labels on mobile for cleaner presentation
- Adjust font sizes for better readability on smaller screens
- Reposition legends and annotations for optimal layout
- Set different chart dimensions per viewport

## How It Works

### Device Preview Modes

In the WordPress block editor, use the device preview toolbar to switch between:

- **Desktop** (default) - Full-width layout
- **Tablet** - Medium-width layout (641px - 1023px)
- **Mobile** - Narrow layout (≤640px)

When you change a setting while in a specific device preview mode, that setting applies only to that viewport.

### Viewport Breakpoints

- **Mobile**: ≤640px width
- **Tablet**: 641px - 1023px width
- **Desktop**: ≥1024px width

These breakpoints match WordPress's default responsive breakpoints.

## Common Use Cases

### Use Case 1: Hide Labels on Mobile

**Scenario**: Your chart has many data points, and labels become cluttered on mobile devices.

**Steps**:

1. Create your chart with labels enabled (default)
2. Switch to **Mobile** device preview
3. In the **Labels** panel, toggle "Labels Active" to **OFF**
4. Switch back to **Desktop** preview - labels are still visible
5. Switch to **Mobile** preview - labels are hidden

**Result**: Clean, uncluttered mobile view while maintaining detailed labels on desktop.

### Use Case 2: Adjust Font Sizes for Readability

**Scenario**: Text is too small on mobile devices.

**Steps**:

1. Switch to **Mobile** device preview
2. In the **Labels** panel, change "Label Font Size" to **14px** (from default 10px)
3. In the **Legend** panel, change "Font Size" to **14px**
4. Switch to **Tablet** preview, set font sizes to **12px**
5. Desktop remains at default sizes

**Result**: Optimized text sizes for each screen size.

### Use Case 3: Reposition Legend for Mobile

**Scenario**: Legend takes up too much vertical space on mobile.

**Steps**:

1. Switch to **Mobile** device preview
2. In the **Legend** panel:
    - Change "Orientation" to **Row** (if not already)
    - Change "Alignment" to **Left**
    - Adjust "Offset Y" to move legend up/down
3. Desktop legend remains centered

**Result**: Compact legend layout on mobile, centered layout on desktop.

### Use Case 4: Adjust Chart Dimensions

**Scenario**: Chart needs different width/height on mobile.

**Steps**:

1. Switch to **Mobile** device preview
2. In the **Chart Configuration** panel:
    - Adjust "Width" to fit mobile screens (e.g., 400px)
    - Adjust "Height" for better mobile proportions (e.g., 300px)
3. Desktop dimensions remain unchanged

**Result**: Optimized chart size for each viewport.

### Use Case 5: Hide Annotations on Mobile

**Scenario**: Annotations clutter the mobile view.

**Steps**:

1. Switch to **Mobile** device preview
2. In the **Annotations** panel, toggle "Annotations Active" to **OFF**
3. Desktop annotations remain visible

**Result**: Cleaner mobile view with annotations visible on larger screens.

## Understanding Overrides

### How Overrides Work

When you change a setting in a device preview mode:

- **Desktop**: Changes apply to the default settings (used by all viewports unless overridden)
- **Tablet**: Changes create a tablet-specific override
- **Mobile**: Changes create a mobile-specific override

### Override Precedence

1. **Mobile/Tablet Override** (if exists)
2. **Desktop Default** (fallback)

**Example**:

- Desktop: `labels.fontSize = 12`
- Mobile: `mobile.labels.fontSize = 10`
- Tablet: (no override)

**Result**:

- Desktop shows: 12px
- Mobile shows: 10px (uses mobile override)
- Tablet shows: 12px (uses desktop default, no tablet override)

### Clearing Overrides

To remove a viewport override and use the desktop default:

1. Switch to the viewport (mobile/tablet)
2. Change the setting back to match the desktop value
3. The override is automatically removed

**Note**: There's no explicit "clear override" button - simply matching the desktop value removes the override.

## What Can Be Customized Per Viewport?

### ✅ Can Be Customized (Presentation)

- **Layout**: Width, height, padding, orientation
- **Labels**: Font size, color, position, visibility
- **Legend**: Orientation, position, alignment, font size
- **Annotations**: Text, position, styling, visibility
- **Tooltips**: Positioning, sizing, formatting
- **Axes**: Tick counts, label sizes, positioning
- **Metadata**: Title, subtitle (for space constraints)
- **Chart-specific**: Bar padding, line stroke width, map boundaries, etc.

### ❌ Cannot Be Customized (Content)

These settings apply to all viewports for consistency:

- **Data**: Categories, sorting, scales
- **Colors**: Color palette, custom colors
- **Data Rendering**: Which categories to show, data formats

**Why**: The same data should be shown across all devices. Only the presentation adapts.

## Best Practices

### 1. Start with Desktop

Configure your chart for desktop first, then optimize for smaller screens. Desktop is your baseline.

### 2. Test on Actual Devices

While the editor preview is helpful, always test on actual mobile/tablet devices to verify the experience.

### 3. Don't Over-Optimize

Only create overrides when necessary. Too many overrides can make charts harder to maintain.

### 4. Use Consistent Patterns

If you hide labels on mobile for one chart, consider doing the same for similar charts for consistency.

### 5. Consider Performance

Each override adds to the block's attribute size. Keep overrides focused on what matters most.

## Troubleshooting

### Issue: Changes Not Appearing

**Check**:

- Are you in the correct device preview mode?
- Did you save the post after making changes?
- Is the setting you're changing viewport-aware? (See list above)

### Issue: Override Not Clearing

**Solution**: Change the setting to match the desktop value exactly.

### Issue: Chart Looks Different on Frontend

**Check**:

- Is your browser window size matching the expected breakpoint?
- Are you testing on the actual device or using browser dev tools?
- Server-side rendering uses the same breakpoints as the editor

## Technical Details

For developers implementing viewport-aware features, see:

- [VIEWPORT_ATTRIBUTES.md](../docs/VIEWPORT_ATTRIBUTES.md) - Architecture documentation
- [quickstart.md](../specs/issue-1403/quickstart.md) - Implementation guide

---

**Last Updated**: 2026-01-12
**Version**: Chart Builder v3.3.0+
