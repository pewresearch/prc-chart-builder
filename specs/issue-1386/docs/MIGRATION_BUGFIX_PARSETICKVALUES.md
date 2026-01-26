# Migration Bug Fix: parseTickValues Type Error

**Date**: December 4, 2025
**Issue**: TypeError: A.trim is not a function
**Status**: ✅ **FIXED**

---

## Problem

When opening older v1 chart blocks in the editor, a `TypeError: A.trim is not a function` error was thrown during migration.

### Root Cause

The `parseTickValues` helper function in `src/chart/deprecations/v1.js` assumed the input was always a **string**, but WordPress sometimes saves array attributes in different formats:

- **As string**: `"2000, 2010, 2019, 2023"` (user input)
- **As array**: `[2000, 2010, 2019, 2023]` (after being saved/processed)

When the function received an array and called `.trim()` on it, JavaScript threw the error because arrays don't have a `.trim()` method.

### Error Location

```javascript
function parseTickValues(tickString) {
	if (!tickString || tickString.trim() === '') {
		// ❌ Error here if tickString is array
		return null;
	}
	// ...
}
```

---

## Solution

Updated `parseTickValues` to handle **both strings and arrays**:

```javascript
/**
 * Helper function to parse tick values string or array into array
 *
 * @param {string|Array} tickInput - Comma-separated tick values or array
 * @return {Array|null} Array of tick values or null
 */
function parseTickValues(tickInput) {
	// Handle null/undefined
	if (!tickInput) {
		return null;
	}

	// If already an array, return it (or validate/process it)
	if (Array.isArray(tickInput)) {
		return tickInput.length > 0 ? tickInput : null;
	}

	// If it's a string, parse it
	if (typeof tickInput === 'string') {
		const trimmed = tickInput.trim();
		if (trimmed === '') {
			return null;
		}

		// Try to parse as numbers first
		const values = trimmed.split(',').map((v) => {
			const itemTrimmed = v.trim();
			const num = Number(itemTrimmed);
			return isNaN(num) ? itemTrimmed : num;
		});

		return values.length > 0 ? values : null;
	}

	// Unknown type, return null
	return null;
}
```

---

## Testing

Tested with 9 different input scenarios:

| Test Case              | Input                          | Output                         | Status  |
| ---------------------- | ------------------------------ | ------------------------------ | ------- |
| String with numbers    | `"2000, 2010, 2019, 2023"`     | `[2000, 2010, 2019, 2023]`     | ✅ PASS |
| String with text       | `"Category A, Category B"`     | `["Category A", "Category B"]` | ✅ PASS |
| Array of numbers       | `[2000, 2010, 2019, 2023]`     | `[2000, 2010, 2019, 2023]`     | ✅ PASS |
| Array of strings       | `["Category A", "Category B"]` | `["Category A", "Category B"]` | ✅ PASS |
| Empty string           | `""`                           | `null`                         | ✅ PASS |
| Null                   | `null`                         | `null`                         | ✅ PASS |
| Undefined              | `undefined`                    | `null`                         | ✅ PASS |
| Empty array            | `[]`                           | `null`                         | ✅ PASS |
| String with whitespace | `"  2000  ,  2010  "`          | `[2000, 2010]`                 | ✅ PASS |

**Result**: All 9 tests passed ✅

---

## Impact

This fix resolves migration errors for v1 chart blocks that have tick values saved in either format:

### Affected Attributes

- `xTickExact` → `independentAxis.tickValues`
- `yTickExact` → `dependentAxis.tickValues`

### User's Example Block

The error occurred with this block:

```html
<!-- wp:prc-chart-builder/chart {
  "xTickExact":"2000, 2010, 2019, 2023",
  ...
} /-->
```

After WordPress processes it, `xTickExact` might be:

- ✅ String: `"2000, 2010, 2019, 2023"` - now works
- ✅ Array: `[2000, 2010, 2019, 2023]` - now works (was broken)

---

## Other Array Attributes

Verified that other array attributes in the migration are handled correctly:

| Attribute                   | Migration Handling                             | Status |
| --------------------------- | ---------------------------------------------- | ------ |
| `customColors`              | `attributes.customColors \|\| []`              | ✅ OK  |
| `plotBands`                 | `attributes.plotBands \|\| []`                 | ✅ OK  |
| `legendCategories`          | `attributes.legendCategories \|\| []`          | ✅ OK  |
| `annotations`               | `attributes.annotations \|\| []`               | ✅ OK  |
| `categories`                | `attributes.categories \|\| []`                | ✅ OK  |
| `groupBreaksCategoryValues` | `attributes.groupBreaksCategoryValues \|\| []` | ✅ OK  |

These use the `|| []` fallback pattern which works for both undefined and existing arrays, so no changes needed.

---

## Files Modified

**`src/chart/deprecations/v1.js`** (lines 783-821)

- Updated `parseTickValues` function to handle both string and array inputs
- Added type checking with `Array.isArray()` and `typeof`
- Improved JSDoc to reflect new parameter type: `{string|Array}`

---

## Prevention

To prevent similar issues in the future:

1. **Always check input types** when working with WordPress block attributes
2. **WordPress serialization is unpredictable** - attributes might be strings, arrays, objects, or mixed
3. **Use defensive programming** - check types before calling type-specific methods like `.trim()`, `.split()`, etc.
4. **Test with real saved blocks** - not just fresh blocks created in the editor

---

## Conclusion

✅ **The TypeError is fixed**

Old v1 charts with tick values in either string or array format will now migrate successfully. The migration script is now more robust and handles WordPress's variable attribute serialization.
