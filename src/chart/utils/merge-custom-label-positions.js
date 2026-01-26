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
 * Merge custom label positions from labels.customPositions into chartData
 *
 * This function takes custom positions stored in the viewport-aware
 * labels.customPositions attribute and merges them into the chartData
 * as __labelPositions, which is the format the charting library expects.
 *
 * It also preserves any legacy __labelPositions that may already exist
 * in the chartData (for backwards compatibility).
 *
 * @param {Array}  chartData       - The chart data array
 * @param {Object} customPositions - Custom positions from labels.customPositions
 * @return {Array} chartData with __labelPositions merged in
 */
export function mergeCustomLabelPositions(chartData, customPositions) {
	if (!chartData || !Array.isArray(chartData)) {
		return chartData;
	}

	// If no custom positions, return data as-is (preserving any legacy __labelPositions)
	if (!customPositions || Object.keys(customPositions).length === 0) {
		return chartData;
	}

	// Build a lookup map: xValue -> { category: { dx, dy } }
	const positionsByX = {};
	Object.entries(customPositions).forEach(([key, position]) => {
		// Key format is "xValue::category"
		const separatorIndex = key.lastIndexOf('::');
		if (separatorIndex === -1) {
			return; // Invalid key format
		}
		const xValue = key.substring(0, separatorIndex);
		const category = key.substring(separatorIndex + 2);

		// Normalize the xValue for consistent comparison
		const normalizedX = normalizeXValue(xValue);

		if (!positionsByX[normalizedX]) {
			positionsByX[normalizedX] = {};
		}
		positionsByX[normalizedX][category] = position;
	});

	// Merge positions into chartData
	return chartData.map((d) => {
		const normalizedX = normalizeXValue(d.x);
		const customPositionsForRow = positionsByX[normalizedX];

		if (customPositionsForRow) {
			// Merge with any existing __labelPositions (legacy data takes precedence)
			// Custom positions from labels.customPositions override legacy
			return {
				...d,
				__labelPositions: {
					...d.__labelPositions, // Preserve any legacy positions
					...customPositionsForRow, // Viewport-aware positions override
				},
			};
		}

		return d;
	});
}

export default mergeCustomLabelPositions;
