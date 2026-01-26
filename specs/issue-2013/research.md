# Research: Chart Block ID Structure

**Date**: 2026-01-12 (Updated)
**Status**: Documentation of Current Implementation

## Overview

This document explains the research and decisions behind the chart block's ID structure, where the `id` attribute is stored at the root level rather than nested in the `io` object.

## Decision: Root-Level ID

**Chosen**: Store `id` at root level of block attributes

**Rationale**:

- Consistency with v1 block structure
- Consistency with controller block pattern
- Simpler attribute access (less nesting)
- Standard WordPress block convention
- Easier to understand and maintain

**Why Not Nested in `io`**:

1. **Semantic clarity**: ID is a fundamental identifier, not an "input/output" property
2. **Access frequency**: ID is accessed frequently, root-level is more convenient
3. **Controller alignment**: Controller block uses root-level `id`, chart should match
4. **WordPress patterns**: Most block IDs are at root level

## Current Implementation Audit

### JavaScript Files Using Root-Level `id`

```
src/chart/edit/index.jsx - Uses attributes.id to set and access chart ID
```

**Usage Pattern**: Setting ID early in component lifecycle based on controller ID

### PHP Files Using Root-Level `id`

```
build/chart/class-chart.php - Uses $attributes['id'] for rendering
includes/class-block-migration.php - Handles attribute structure
```

**Usage Pattern**: Server-side rendering and block processing

## WordPress Block Deprecation API

## WordPress Block Deprecation API (Reference)

### Key Concepts

1. **Deprecation Object**:

```javascript
{
  attributes: { /* old schema */ },
  supports: { /* old supports */ },
  save: ({ attributes }) => { /* old save */ },
  migrate: (attributes) => { /* transform to new */ },
  isEligible: (attributes) => { /* check if needs migration */ }
}
```

2. **Migration Execution**:
    - Runs when block is parsed
    - Checks `isEligible` first
    - If eligible, calls `migrate`
    - Updates block with new attributes

**Note**: The current v2 implementation uses root-level `id`, so no v2→v3 migration is needed. The v1→v2 deprecation already handles moving from flat attributes to nested config while preserving root-level `id`.

## Implementation Details

### v1 → v2 Migration (Existing)

The existing v1→v2 migration correctly preserves the `id` at root level:

```javascript
// v1 (flat attributes)
{
  id: "chart-id",
  chartType: "bar",
  width: 640,
  // ... other flat attributes
}

// v2 (nested config, root-level id)
{
  _version: "v2",
  id: "chart-id", // ✅ Preserved at root
  layout: {
    type: "bar",
    width: 640
  },
  io: {
    // ❌ No id here
    chartData: []
  }
}
```

### Why No v3 Migration Needed

The v2 schema already has `id` at the root level, consistent with v1. There was never a production deployment where `id` was incorrectly placed in `io.id`, so no migration to correct this is needed.

## Testing & Verification

### Verification Checklist

- ✅ New charts have `id` at root level
- ✅ `attributes.io.id` is undefined (does not exist)
- ✅ ID pattern matches `{controllerId}-chart`
- ✅ Table data sync works correctly
- ✅ Copy/paste generates unique IDs
- ✅ Static and freeform charts work correctly

### Testing in Browser Console

```javascript
// Select a chart block in the editor
const block = wp.data.select('core/block-editor').getSelectedBlock();

// Verify structure
console.assert(block.attributes.id, 'ID should exist at root');
console.assert(block.attributes.io.id === undefined, 'io.id should not exist');
console.assert(block.attributes._version === 'v2', 'Version should be v2');
```

## Best Practices

### Attribute Access

1. **Always access from root**: Use `attributes.id`, never `attributes.io.id`
2. **Use destructuring**: `const { id, io } = attributes;` for clarity
3. **Defensive coding**: Use fallbacks: `attributes.id ?? ''`
4. **Type safety**: Define TypeScript interfaces to enforce structure

### Code Consistency

1. **JavaScript**: Always use `attributes.id`
2. **PHP**: Always use `$attributes['id']`
3. **Documentation**: Reference root-level ID in comments
4. **Examples**: Show correct usage in code examples

### From v1→v2 Migration Experience

1. **Preserve ID location**: Keep `id` at root during migrations
2. **Test thoroughly**: Verify with various chart types
3. **Document structure**: Clear docs prevent confusion
4. **Gradual rollout**: Test on staging before production

## Related Documentation

- **spec.md** - Feature specification
- **data-model.md** - Complete attribute structure
- **quickstart.md** - Usage guide and examples
- **plan.md** - Implementation overview
- **/specs/issue-1386/** - v1→v2 migration reference

## Key Takeaways

1. **ID Location**: Root level (`attributes.id`) for consistency
2. **No Migration Needed**: v2 already has correct structure
3. **Consistency**: Matches v1 and controller block patterns
4. **Simplicity**: Direct access without nesting

---

**Last Updated**: 2026-01-12
**Status**: Current Implementation Documentation
