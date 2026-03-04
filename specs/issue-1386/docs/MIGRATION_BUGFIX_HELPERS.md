# Migration Bug Fix: Helper Functions Type Error

**Date**: December 4, 2025
**Issue**: `TypeError: A.trim is not a function` in helper functions
**Status**: ✅ **FIXED**

---

## Problem

After fixing the initial `parseTickValues` error, a **second** TypeError appeared when the migrated attributes were being processed by `get-config.js`. The error was:

```
TypeError: A.trim is not a function
    at l (index.js?ver=7747ac0bc353d5074b6b:1:198761)
```

### Root Cause

Two helper functions in `src/chart/utils/helpers.js` assumed their inputs were always **strings**, but WordPress can serialize attributes as either strings or arrays:

1. **`stringToArrayOfNums(str)`** - Used to parse tick values for numeric scales
2. **`stringToArray(str)`** - Used to parse tick values for time scales

Both were calling `.trim()` on the input without checking its type, causing errors when they received arrays from migrated attributes.

### Error Location

```javascript
// In get-config.js
const independentAxisTickValues =
	independentAxis.scale === 'time'
		? stringToArray(independentAxis.tickValues) // ❌ Could be array
		: stringToArrayOfNums(independentAxis.tickValues); // ❌ Could be array
```

When `independentAxis.tickValues` is already an array (from migration), calling `.trim()` fails.

---

## Solution

Updated both helper functions to handle **strings, arrays, null, and undefined**:

### `stringToArrayOfNums` - Fixed

```javascript
export const stringToArrayOfNums = (str) => {
	// Handle null/undefined
	if (!str) {
		return [];
	}

	// If already an array, process it
	if (Array.isArray(str)) {
		return str
			.map((item) => {
				const num =
					typeof item === 'string'
						? Number(item.trim())
						: Number(item);
				return num;
			})
			.filter((num) => !Number.isNaN(num));
	}

	// If it's a string, parse it
	if (typeof str === 'string') {
		const trimmed = str.trim();
		if (trimmed === '') {
			return [];
		}
		return trimmed
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.length > 0)
			.map(Number)
			.filter((num) => !Number.isNaN(num));
	}

	// Unknown type, return empty array
	return [];
};
```

### `stringToArray` - Fixed

```javascript
export const stringToArray = (str) => {
	// Handle null/undefined
	if (!str) {
		return [];
	}

	// If already an array, return it after trimming strings
	if (Array.isArray(str)) {
		return str
			.map((item) =>
				typeof item === 'string' ? item.trim() : String(item)
			)
			.filter((item) => item.length > 0);
	}

	// If it's a string, parse it
	if (typeof str === 'string') {
		const trimmed = str.trim();
		if (trimmed === '') {
			return [];
		}
		return trimmed
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.length > 0);
	}

	// Unknown type, return empty array
	return [];
};
```

---

## Testing

### `stringToArrayOfNums` Tests

| Test Case               | Input                      | Output                     | Status  |
| ----------------------- | -------------------------- | -------------------------- | ------- |
| String with numbers     | `"2000, 2010, 2019, 2023"` | `[2000, 2010, 2019, 2023]` | ✅ PASS |
| Array of numbers        | `[2000, 2010, 2019, 2023]` | `[2000, 2010, 2019, 2023]` | ✅ PASS |
| Array of string numbers | `['2000', '2010', '2019']` | `[2000, 2010, 2019]`       | ✅ PASS |
| Mixed array             | `[2000, '2010', 2019]`     | `[2000, 2010, 2019]`       | ✅ PASS |
| Empty string            | `""`                       | `[]`                       | ✅ PASS |
| Null                    | `null`                     | `[]`                       | ✅ PASS |
| Undefined               | `undefined`                | `[]`                       | ✅ PASS |

### `stringToArray` Tests

| Test Case          | Input                      | Output                             | Status  |
| ------------------ | -------------------------- | ---------------------------------- | ------- |
| String with dates  | `"2000, 2010, 2019, 2023"` | `['2000', '2010', '2019', '2023']` | ✅ PASS |
| Array of dates     | `['2000', '2010', '2019']` | `['2000', '2010', '2019']`         | ✅ PASS |
| Array with numbers | `[2000, 2010, 2019]`       | `['2000', '2010', '2019']`         | ✅ PASS |

**Result**: All 10 tests passed ✅

---

## Impact

### Where These Functions Are Used

**`get-config.js`** (lines 262-269):

```javascript
// Use stringToArray for time scales to preserve date strings
// Use stringToArrayOfNums for numeric scales
const independentAxisTickValues =
	independentAxis.scale === 'time'
		? stringToArray(independentAxis.tickValues)
		: stringToArrayOfNums(independentAxis.tickValues);

const dependentAxisTickValues =
	dScale === 'time'
		? stringToArray(dependentAxis.tickValues)
		: stringToArrayOfNums(dependentAxis.tickValues);
```

### Migration Flow

After migration, tick values flow through this process:

```
v1 Attributes (flat)
  xTickExact: "2000, 2010, 2019, 2023"
         ↓
   parseTickValues() in v1.js
         ↓
v2 Attributes (nested)
  independentAxis.tickValues: [2000, 2010, 2019, 2023]  ← Now an array!
         ↓
   get-config.js processes attributes
         ↓
   stringToArrayOfNums() or stringToArray()
         ↓
   ✅ Both now handle arrays correctly
```

---

## Files Modified

1. **`src/chart/utils/helpers.js`** (lines 38-96)

    - Updated `stringToArrayOfNums` to handle arrays
    - Updated `stringToArray` to handle arrays
    - Added type checking for both functions

2. **`src/chart/deprecations/v1.js`** (line 780)
    - Removed debug console.log statement

---

## Related Fixes

This is the **second** of two related fixes for WordPress's variable attribute serialization:

| Fix # | File         | Function                               | Issue                                   |
| ----- | ------------ | -------------------------------------- | --------------------------------------- |
| 1     | `v1.js`      | `parseTickValues`                      | Migration converts string → array       |
| 2     | `helpers.js` | `stringToArrayOfNums`, `stringToArray` | get-config.js processes migrated arrays |

Both fixes address the same root cause: **WordPress can serialize the same attribute as either a string or an array**, and our code must handle both formats.

---

## Prevention

### Best Practices for WordPress Attribute Handling

1. **Never assume attribute types** - WordPress serialization is unpredictable
2. **Always check types first** - Use `typeof`, `Array.isArray()`, etc.
3. **Handle multiple formats** - String, array, null, undefined
4. **Use defensive programming** - Provide sensible fallbacks
5. **Test with real saved blocks** - Not just new blocks created in the editor

### Type-Safe Pattern

```javascript
export const processAttribute = (input) => {
	// 1. Handle null/undefined
	if (!input) {
		return defaultValue;
	}

	// 2. Check if already correct type
	if (Array.isArray(input)) {
		return processArray(input);
	}

	// 3. Check if needs conversion
	if (typeof input === 'string') {
		return convertString(input);
	}

	// 4. Unknown type, return safe default
	return defaultValue;
};
```

---

## Conclusion

✅ **The TypeError is fixed**

Both `parseTickValues` and the helper functions now handle WordPress's variable attribute serialization correctly. The migration will work smoothly regardless of whether WordPress has saved attributes as strings or arrays.

### What Works Now

- ✅ v1 blocks with string tick values: `"2000, 2010, 2019, 2023"`
- ✅ v1 blocks with array tick values: `[2000, 2010, 2019, 2023]`
- ✅ Migrated blocks with nested arrays: `independentAxis.tickValues: [...]`
- ✅ Mixed formats across different attributes
- ✅ Edge cases: null, undefined, empty strings, empty arrays

The migration is now **robust against WordPress's unpredictable attribute serialization**! 🎉
