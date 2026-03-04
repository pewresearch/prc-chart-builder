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
 * Resolve lookup map entries for a specific data point, handling group discriminators.
 *
 * Entries without a group discriminator ("category") apply to all data points.
 * Entries with a group discriminator ("category::groupValue") only apply if the
 * data point belongs to that group.
 *
 * @param {Object} entries             - The entries from the lookup map for this x value
 * @param {Object} dataPoint           - The data point being processed
 * @param {string} groupBreaksCategory - The column name used for grouping (or null)
 * @return {Object} Resolved entries: { category: value }
 */
function resolveEntries(entries, dataPoint, groupBreaksCategory) {
	const resolved = {};

	// Separate non-grouped and grouped entries for proper ordering
	const nonGrouped = [];
	const grouped = [];

	Object.entries(entries).forEach(([entryKey, value]) => {
		if (entryKey.includes('::')) {
			grouped.push([entryKey, value]);
		} else {
			nonGrouped.push([entryKey, value]);
		}
	});

	// Apply non-grouped entries first (backward compatible)
	nonGrouped.forEach(([category, value]) => {
		resolved[category] = value;
	});

	// Apply grouped entries second (group-specific overrides)
	grouped.forEach(([entryKey, value]) => {
		const groupSepIdx = entryKey.indexOf('::');
		const category = entryKey.substring(0, groupSepIdx);
		const groupValue = entryKey.substring(groupSepIdx + 2);

		if (
			groupBreaksCategory &&
			String(dataPoint[groupBreaksCategory]) === groupValue
		) {
			resolved[category] = value;
		}
	});

	return resolved;
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
 * Supports both 2-part keys ("xValue::category") and 3-part keys
 * ("xValue::category::groupValue") for group-aware matching.
 *
 * @param {Array}  chartData           - The chart data array
 * @param {Object} customPositions     - Custom positions from labels.customPositions
 * @param {string} groupBreaksCategory - The column name used for grouping, or null
 * @return {Array} chartData with __labelPositions merged in
 */
export function mergeCustomLabelPositions(
	chartData,
	customPositions,
	groupBreaksCategory = null
) {
	if (!chartData || !Array.isArray(chartData)) {
		return chartData;
	}

	// If no custom positions, return data as-is (preserving any legacy __labelPositions)
	if (!customPositions || Object.keys(customPositions).length === 0) {
		return chartData;
	}

	// Build a lookup map: xValue -> { entryKey: position }
	// entryKey is "category" or "category::groupValue"
	const positionsByX = {};
	Object.entries(customPositions).forEach(([key, position]) => {
		// Key format: "xValue::category" or "xValue::category::groupValue"
		const parts = key.split('::');
		if (parts.length < 2) {
			return; // Invalid key format
		}
		const xValue = parts[0];
		const entryKey = parts.slice(1).join('::');

		// Normalize the xValue for consistent comparison
		const normalizedX = normalizeXValue(xValue);

		if (!positionsByX[normalizedX]) {
			positionsByX[normalizedX] = {};
		}
		positionsByX[normalizedX][entryKey] = position;
	});

	// Merge positions into chartData
	return chartData.map((d) => {
		const normalizedX = normalizeXValue(d.x);
		const entriesForRow = positionsByX[normalizedX];

		if (entriesForRow) {
			const resolved = resolveEntries(
				entriesForRow,
				d,
				groupBreaksCategory
			);
			if (Object.keys(resolved).length > 0) {
				return {
					...d,
					__labelPositions: {
						...d.__labelPositions, // Preserve any legacy positions
						...resolved, // Viewport-aware positions override
					},
				};
			}
		}

		return d;
	});
}

export default mergeCustomLabelPositions;
