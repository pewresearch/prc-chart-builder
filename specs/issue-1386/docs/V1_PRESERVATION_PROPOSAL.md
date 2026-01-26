# V1 Attribute Preservation for Testing

## Problem

During testing phase, we need to:

1. **Preserve original v1 attributes** so we can compare v1 vs v2 side-by-side
2. **Allow re-running migration** to test if fixes actually work
3. **See differences** between what was migrated and what should have been migrated

## Proposed Solution

### 1. Add `_v1Original` Attribute

Store a complete snapshot of the original v1 attributes when migrating:

```javascript
// In migration function
const migrated = {
	_version: 'v2',
	_v1Original: { ...attributes }, // Complete snapshot of v1 attributes
	// ... rest of migrated attributes
};
```

**Benefits**:

- Always have access to original v1 data
- Can compare v1 vs v2 programmatically
- Can re-run migration from original source
- Useful for debugging migration issues

### 2. Add `_migrationMeta` Attribute

Track migration metadata:

```javascript
_migrationMeta: {
  migratedAt: new Date().toISOString(),
  migrationVersion: '1.0.0', // Version of migration logic used
  forceRemigrate: false // Testing flag
}
```

**Benefits**:

- Know when migration happened
- Track which migration version was used
- Allow forcing re-migration for testing

### 3. Add Testing Flag Support

Allow forcing re-migration even if already v2:

```javascript
function isEligible(attributes) {
	// Force re-migration if testing flag is set
	if (attributes._migrationMeta?.forceRemigrate === true) {
		return true;
	}

	// Normal check
	return !attributes._version || attributes._version === 'v1';
}
```

### 4. Add Comparison Utility (Optional)

Create a utility to compare v1 vs v2:

```javascript
// utils/compare-migration.js
export function compareV1ToV2(v1Original, v2Migrated) {
	// Compare and return differences
	// Useful for debugging
}
```

## Implementation Plan

1. ✅ Update `block.json` to include `_v1Original` and `_migrationMeta` attributes
2. ✅ Modify JavaScript migration (`v1.js`) to preserve original attributes
3. ✅ Modify PHP migration (`class-block-migration.php`) to preserve original attributes
4. ✅ Update `isEligible` to support `forceRemigrate` flag
5. ⚠️ Optional: Add comparison utility for debugging

## Usage During Testing

### Preserve v1 Attributes

```javascript
// Migration automatically preserves original
const migrated = migrate(v1Attributes);
console.log(migrated._v1Original); // Original v1 attributes
```

### Force Re-migration

```javascript
// Set flag to force re-migration
attributes._migrationMeta = {
	...attributes._migrationMeta,
	forceRemigrate: true,
};
// Next time block loads, migration will re-run
```

### Compare v1 vs v2

```javascript
const v1 = migrated._v1Original;
const v2 = migrated;

// Compare specific attributes
console.log('Padding:', {
	v1: { top: v1.paddingTop, left: v1.paddingLeft },
	v2: v2.layout.padding,
});
```

## Cleanup After Testing

Once testing is complete:

- Remove `_v1Original` preservation (or make it optional)
- Remove `forceRemigrate` flag support
- Keep `_migrationMeta` for tracking (optional)
