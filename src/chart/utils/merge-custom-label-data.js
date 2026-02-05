/**
 * Merge Custom Label Data
 *
 * Consolidates all label customization data from block attributes into chartData
 * as hidden attributes that the charting library can consume.
 *
 * Handles:
 * - customPositions -> __labelPositions (position offsets)
 * - customLabels -> __labelText (custom text overrides)
 * - customVisibility -> __labelVisible (visibility toggles)
 * - customStyles -> __labelStyles (style overrides like color)
 */

/**
 * Normalize a value to a consistent string format for comparison.
 * Handles Date objects and ISO date strings consistently.
 *
 * @param {*} value - The value to normalize
 * @return {string} Normalized string value
 */
function normalizeXValue(value) {
	// If it's a Date object or looks like a date string, convert to ISO
	if (value instanceof Date) {
		return value.toISOString();
	}

	// Try to parse as date if it looks like a date string
	const asString = String(value);

	// If it's already an ISO string, return as-is
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(asString)) {
		return asString;
	}

	// Try to parse as a date and convert to ISO
	const asDate = new Date(asString);
	if (!isNaN(asDate.getTime())) {
		return asDate.toISOString();
	}

	// Not a date, return as string
	return asString;
}

/**
 * Parse customization keys and build a lookup map by normalized x value.
 *
 * @param {Object} customizations - Object with "xValue::category" keys
 * @return {Object} Lookup map: { normalizedX: { category: value } }
 */
function buildLookupMap(customizations) {
	const lookupMap = {};

	if (!customizations || typeof customizations !== 'object') {
		return lookupMap;
	}

	Object.entries(customizations).forEach(([key, value]) => {
		// Key format is "xValue::category"
		const separatorIndex = key.lastIndexOf('::');
		if (separatorIndex === -1) {
			return; // Invalid key format
		}
		const xValue = key.substring(0, separatorIndex);
		const category = key.substring(separatorIndex + 2);

		// Normalize the xValue for consistent comparison
		const normalizedX = normalizeXValue(xValue);

		if (!lookupMap[normalizedX]) {
			lookupMap[normalizedX] = {};
		}
		lookupMap[normalizedX][category] = value;
	});

	return lookupMap;
}

/**
 * Merge all label customization data from labels attribute into chartData.
 *
 * This function takes custom data stored in the viewport-aware labels attribute
 * and merges them into the chartData as hidden attributes (__labelPositions,
 * __labelText, __labelVisible, __labelStyles) which the charting library expects.
 *
 * It also preserves any legacy hidden attributes that may already exist
 * in the chartData (for backwards compatibility).
 *
 * @param {Array}  chartData       - The chart data array
 * @param {Object} labelsAttribute - The labels attribute object containing customizations
 * @return {Array} chartData with all label customizations merged in
 */
export function mergeCustomLabelData(chartData, labelsAttribute) {
	if (!chartData || !Array.isArray(chartData)) {
		return chartData;
	}

	if (!labelsAttribute || typeof labelsAttribute !== 'object') {
		return chartData;
	}

	const {
		customPositions = {},
		customLabels = {},
		customVisibility = {},
		customStyles = {},
	} = labelsAttribute;

	// Check if there's anything to merge
	const hasPositions = Object.keys(customPositions).length > 0;
	const hasLabels = Object.keys(customLabels).length > 0;
	const hasVisibility = Object.keys(customVisibility).length > 0;
	const hasStyles = Object.keys(customStyles).length > 0;

	if (!hasPositions && !hasLabels && !hasVisibility && !hasStyles) {
		return chartData;
	}

	// Build lookup maps for each customization type
	const positionsMap = hasPositions ? buildLookupMap(customPositions) : {};
	const labelsMap = hasLabels ? buildLookupMap(customLabels) : {};
	const visibilityMap = hasVisibility ? buildLookupMap(customVisibility) : {};
	const stylesMap = hasStyles ? buildLookupMap(customStyles) : {};

	// Merge customizations into chartData
	return chartData.map((d) => {
		const normalizedX = normalizeXValue(d.x);
		const result = { ...d };

		// Merge positions
		const positionsForRow = positionsMap[normalizedX];
		if (positionsForRow) {
			result.__labelPositions = {
				...d.__labelPositions, // Preserve legacy
				...positionsForRow,
			};
		}

		// Merge custom label text
		const labelsForRow = labelsMap[normalizedX];
		if (labelsForRow) {
			result.__labelText = {
				...d.__labelText, // Preserve legacy
				...labelsForRow,
			};
		}

		// Merge visibility
		const visibilityForRow = visibilityMap[normalizedX];
		if (visibilityForRow) {
			result.__labelVisible = {
				...d.__labelVisible, // Preserve legacy
				...visibilityForRow,
			};
		}

		// Merge styles
		const stylesForRow = stylesMap[normalizedX];
		if (stylesForRow) {
			result.__labelStyles = {
				...d.__labelStyles, // Preserve legacy
				...stylesForRow,
			};
		}

		return result;
	});
}

/**
 * Generate a label key from x value and category.
 * This is the format used to store customizations in block attributes.
 *
 * @param {string|number|Date} x        - The x value
 * @param {string}             category - The category name
 * @return {string} Key in format "xValue::category"
 */
export function generateLabelKey(x, category) {
	return `${x}::${category}`;
}

export default mergeCustomLabelData;
