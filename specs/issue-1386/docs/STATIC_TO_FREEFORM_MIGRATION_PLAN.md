# Static Chart to Freeform Chart Migration Plan

## Problem Statement

Static charts (`chartType: 'static'`, `isStaticChart: true`) have been replaced with freeform charts (`chartType: 'freeform'`, `isFreeformChart: true`) across the platform. However, the migration system doesn't automatically convert old static charts to freeform charts, causing rendering issues.

## Current State

### Static Chart (Old - Deprecated)

- **Controller attributes**: `chartType: 'static'`, `isStatic: true`
- **Chart attributes**: `isStaticChart: true`, `staticImageId`, `staticImageUrl`, `staticImageInnerHTML`
- **Structure**: Contains a `core/image` block inside the chart block
- **Variation**: Commented out in `src/controller/variations.js` (lines 176-192)

### Freeform Chart (New - Current)

- **Controller attributes**: `chartType: 'freeform'`, `isFreeform: true`
- **Chart attributes**: `isFreeformChart: true`
- **Structure**: Contains a `core/group` block with `className: 'wp-chart-builder-freeform-chart'` inside the chart block
- **Variation**: Active in `src/controller/variations.js` (lines 236-249)

## Migration Strategy

We need to add automatic migration logic that detects old static charts and converts them to freeform charts during the v1→v2 migration process.

### Phase 1: Detection Logic

**Where**: Both JavaScript (`src/chart/deprecations/v1.js`) and PHP (`includes/class-block-migration.php`)

**Detection conditions** (any of these):

1. `attributes.chartType === 'static'` (controller level)
2. `attributes.isStaticChart === true` (chart level)
3. `attributes.staticImageId` is not empty (chart level - has image data)

### Phase 2: Migration Transformation

When a static chart is detected during v1→v2 migration:

#### 2.1 Update Chart Attributes

```javascript
// Instead of:
io: {
  isStaticChart: true,
  isFreeformChart: false,
  staticImageId: '123',
  staticImageUrl: 'https://...',
  staticImageInnerHTML: '<img...>',
}

// Migrate to:
io: {
  isStaticChart: false,        // ✅ Turn off static
  isFreeformChart: true,       // ✅ Turn on freeform
  staticImageId: '123',        // ℹ️ Preserve for reference
  staticImageUrl: 'https://...', // ℹ️ Preserve for reference
  staticImageInnerHTML: '<img...>', // ℹ️ Preserve for reference (used by controller)
}

layout: {
  type: 'freeform',            // ✅ Change chart type
  // ... rest of layout
}

metadata: {
  active: false,               // ✅ Disable metadata (common for freeform)
  // ... rest of metadata
}
```

#### 2.2 Update Controller Attributes

If migration is happening during controller rendering:

```php
// In controller's render_block_callback
$controller_attributes['chartType'] = 'freeform';
$controller_attributes['isFreeform'] = true;
$controller_attributes['isStatic'] = false;
```

#### 2.3 Block Structure Transformation (Optional - Complex)

Ideally, we would also transform the inner block structure from:

```
chart
  └── core/image (static image)
```

To:

```
chart
  └── core/group (className: 'wp-chart-builder-freeform-chart')
      └── core/image (the static image)
```

**Decision**: This is complex because we're only migrating attributes, not block structure. Instead:

- **Keep the image block as-is** at the chart level
- **Let the controller render logic handle it** (lines 128-136 in `class-controller.php`)
- **Use the preserved `staticImageInnerHTML`** to render the image

### Phase 3: Rendering Updates

#### 3.1 Controller Rendering (`src/controller/class-controller.php`)

Current logic (lines 152-165):

```php
// After migration
$chart_is_static = $is_static_chart || ( $chart_attributes['io']['isStaticChart'] ?? false );
$is_static_chart = $chart_is_static;

// Find image block if static
if ( $chart_is_static ) {
    // Search for image block...
}
```

**Update**: After migration, charts will have `isFreeformChart: true` and `isStaticChart: false`, but we still need to find the image block. Change detection to:

```php
// Check if this is a legacy static chart (now migrated to freeform with image data)
$has_static_image = ! empty( $chart_attributes['io']['staticImageId'] )
                    || ! empty( $chart_attributes['io']['staticImageInnerHTML'] );
$is_freeform_with_image = $is_freeform_chart && $has_static_image;

// Find image block for both static and freeform-with-image charts
if ( $chart_is_static || $is_freeform_with_image ) {
    foreach ( $blocks['chart']['innerBlocks'] as $chart_inner_block ) {
        if ( 'core/image' === ( $chart_inner_block['blockName'] ?? '' ) ) {
            $blocks['image'] = $chart_inner_block;
            break;
        }
    }
}

// If no image block found but we have static image data in attributes, use it
if ( $has_static_image && ! $blocks['image'] && ! empty( $chart_attributes['io']['staticImageInnerHTML'] ) ) {
    // Create a pseudo-image block from the preserved HTML
    $blocks['image'] = array(
        'blockName' => 'core/image',
        'attrs' => array(
            'id' => $chart_attributes['io']['staticImageId'],
        ),
        'innerHTML' => $chart_attributes['io']['staticImageInnerHTML'],
    );
}
```

#### 3.2 Freeform Rendering Logic

Update the freeform block detection (lines 117-126) to also find image blocks:

```php
if ( $is_freeform_chart ) {
    // Try to find freeform group first
    $blocks['freeform'] = array_filter(
        $blocks['chart']['innerBlocks'],
        function ( $chart_inner_block ) {
            return 'core/group' === ( $chart_inner_block['blockName'] )
                && 'wp-chart-builder-freeform-chart' === ( $chart_inner_block['attrs']['className'] ?? '' );
        }
    ) ?? null;

    // If no freeform group but has image (legacy static → freeform migration)
    // Use the image as the freeform content
    if ( empty( $blocks['freeform'] ) && $blocks['image'] ) {
        $blocks['freeform'] = $blocks['image'];
    }
}
```

### Phase 4: Testing

#### 4.1 Create Test Fixture

Create `tests/fixtures/chart-block/v1-static-chart.json`:

```json
{
	"name": "v1-static-chart",
	"description": "Legacy static chart with image",
	"blockVersion": "v1",
	"chartType": "static",
	"featureTags": ["static-chart", "image", "legacy-migration"],
	"serializedContent": "<!-- wp:prc-chart-builder/chart {\"chartType\":\"static\",\"isStaticChart\":true,\"staticImageId\":\"456\",\"staticImageUrl\":\"https://example.com/chart.png\",\"width\":640,\"height\":400} -->\n<div class=\"wp-block-prc-chart-builder-chart\"></div>\n<!-- /wp:prc-chart-builder/chart -->",
	"expectedMigratedAttributes": {
		"_version": "v2",
		"layout": {
			"type": "freeform",
			"width": 640,
			"height": 400
		},
		"io": {
			"isStaticChart": false,
			"isFreeformChart": true,
			"staticImageId": "456",
			"staticImageUrl": "https://example.com/chart.png"
		},
		"metadata": {
			"active": false
		}
	}
}
```

#### 4.2 Test Scenarios

1. ✅ v1 static chart migrates to v2 freeform chart
2. ✅ `isStaticChart: false`, `isFreeformChart: true` after migration
3. ✅ `layout.type: 'freeform'` after migration
4. ✅ Static image data preserved in `io` attributes
5. ✅ Image renders correctly on frontend
6. ✅ Controller detects and handles migrated static charts
7. ✅ Metadata is disabled by default (matches freeform behavior)

## Implementation Checklist

### JavaScript Migration (`src/chart/deprecations/v1.js`)

- [ ] Add static chart detection in `migrate()` function
- [ ] Add transformation logic to convert static → freeform
- [ ] Update `io` object with correct flags
- [ ] Update `layout.type` to 'freeform'
- [ ] Set `metadata.active: false` for migrated charts
- [ ] Add migration log/comment for debugging

### PHP Migration (`includes/class-block-migration.php`)

- [ ] Add static chart detection in `migrate_attributes_v1_to_v2()`
- [ ] Add transformation logic (mirror JavaScript)
- [ ] Update `migrate_io()` helper function
- [ ] Update `migrate_layout()` helper function
- [ ] Add QM debug logs for static → freeform migration

### Controller Rendering (`src/controller/class-controller.php`)

- [x] Update static chart detection (completed in initial fix)
- [ ] Add legacy static chart detection (freeform with image data)
- [ ] Update image block search logic
- [ ] Handle missing image block with preserved innerHTML
- [ ] Update freeform block detection to handle legacy static charts

### Chart Rendering (`src/chart/class-chart.php`)

- [ ] Review and test rendering with migrated attributes
- [ ] Ensure `isFreeformChart: true` doesn't break rendering
- [ ] Handle case where static image HTML is in attributes but no image block exists

### Testing

- [ ] Create test fixture for v1 static chart
- [ ] Add unit test for JavaScript migration
- [ ] Add PHP test for server-side migration
- [ ] Manual testing with real static chart from production
- [ ] Verify frontend rendering
- [ ] Verify editor rendering (deprecation should handle it)

### Documentation

- [ ] Update migration documentation
- [ ] Add note about static chart deprecation
- [ ] Document the freeform chart replacement
- [ ] Update MIGRATION.md with this transformation

## Migration Log Format

When a static chart is migrated, log it:

```javascript
console.log('🔄 Static → Freeform migration:', {
	from: { chartType: 'static', isStaticChart: true },
	to: { chartType: 'freeform', isFreeformChart: true },
	preservedImageData: {
		staticImageId: attributes.staticImageId,
		hasStaticImageUrl: !!attributes.staticImageUrl,
		hasStaticImageInnerHTML: !!attributes.staticImageInnerHTML,
	},
});
```

## Backwards Compatibility

- ✅ Original static image data preserved in `io` attributes
- ✅ Controller can still render the image using preserved data
- ✅ No database structure changes required
- ✅ Migration is non-destructive (can be reverted if needed)
- ✅ Editor will save as v2 freeform when block is opened

## Edge Cases

1. **Static chart with no image data**: Migrate to empty freeform (let user add content)
2. **Static chart with corrupted image data**: Preserve data, add error in migration log
3. **Chart is already freeform but has `isStaticChart: true`**: Prioritize freeform, set static to false
4. **Controller has `isStatic: true` but chart has `isFreeformChart: true`**: Prioritize chart attributes

## Success Criteria

1. All old static charts render correctly after migration
2. No console errors or PHP warnings
3. Images display properly on frontend
4. Opening a migrated chart in editor shows freeform variation
5. Saving a migrated chart persists as v2 freeform structure
6. Migration is logged for debugging purposes
7. No regression in existing freeform charts
8. Test fixtures pass validation

## Timeline Estimate

- **JavaScript migration**: 2-3 hours
- **PHP migration**: 2-3 hours
- **Controller/chart rendering updates**: 2-3 hours
- **Testing & debugging**: 3-4 hours
- **Documentation**: 1 hour

**Total**: ~12-16 hours

## Notes

- This migration should be part of the v1→v2 migration system (already in place)
- Static chart variation is already commented out, confirming it's deprecated
- Freeform charts are the official replacement
- This migration makes the deprecation complete and seamless
