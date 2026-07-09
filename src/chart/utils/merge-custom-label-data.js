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
 *
 * Key Formats:
 * - 2-part (standard): "xValue::category"
 * - 3-part (grouped):  "xValue::category::groupValue"
 *
 * The 3-part format is used when groupBreaksActive is true, to disambiguate
 * data points that share the same x value and category but belong to different groups.
 * Backward compatible: existing 2-part keys continue to work.
 */

import { resolveColor } from './resolve-color';

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
 * Supports both 2-part keys ("xValue::category") and 3-part keys
 * ("xValue::category::groupValue"). The entry key stored in the map
 * is everything after the first "::" separator — either just "category"
 * or "category::groupValue".
 *
 * @param {Object} customizations - Object with "xValue::category" or "xValue::category::groupValue" keys
 * @return {Object} Lookup map: { normalizedX: { entryKey: value } }
 */
function buildLookupMap(customizations) {
	const lookupMap = {};

	if (!customizations || typeof customizations !== 'object') {
		return lookupMap;
	}

	Object.entries(customizations).forEach(([key, value]) => {
		// Key format: "xValue::category" or "xValue::category::groupValue"
		// Note: x values (country names, years, ISO dates) do not contain "::"
		// so splitting on "::" safely separates the parts.
		const parts = key.split('::');
		if (parts.length < 2) {
			return; // Invalid key format
		}

		const xValue = parts[0];
		// Everything after the first "::" is the entry key
		// For 2-part keys: "category"
		// For 3-part keys: "category::groupValue"
		const entryKey = parts.slice(1).join('::');

		// Normalize the xValue for consistent comparison
		const normalizedX = normalizeXValue(xValue);

		if (!lookupMap[normalizedX]) {
			lookupMap[normalizedX] = {};
		}
		lookupMap[normalizedX][entryKey] = value;
	});

	return lookupMap;
}

/**
 * Resolve lookup map entries for a specific data point, handling group discriminators.
 *
 * Entries without a group discriminator ("category") apply to all data points.
 * Entries with a group discriminator ("category::groupValue") only apply if the
 * data point belongs to that group.
 *
 * Non-grouped entries are applied first, then group-specific entries override them.
 * This ensures backward compatibility: existing 2-part keys apply universally,
 * while new 3-part keys provide group-specific overrides.
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

	// Apply non-grouped entries first (backward compatible, apply to all)
	nonGrouped.forEach(([category, value]) => {
		resolved[category] = value;
	});

	// Apply grouped entries second (override non-grouped if group matches)
	grouped.forEach(([entryKey, value]) => {
		const groupSepIdx = entryKey.indexOf('::');
		const category = entryKey.substring(0, groupSepIdx);
		const discriminator = entryKey.substring(groupSepIdx + 2);

		if (groupBreaksCategory) {
			// Standard group-break path: match on the group column value
			if (String(dataPoint[groupBreaksCategory]) === discriminator) {
				resolved[category] = value;
			}
		} else {
			// Scatter-specific path: when there are no group breaks, a 3-part key
			// was saved with the category's y-value as the discriminator. Match
			// against the data point's actual value for that category so duplicate-x
			// points each resolve their own position independently.
			if (
				dataPoint[category] !== undefined &&
				dataPoint[category] !== null &&
				String(dataPoint[category]) === discriminator
			) {
				resolved[category] = value;
			}
		}
	});

	return resolved;
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
 * @param {Array}  chartData           - The chart data array
 * @param {Object} labelsAttribute     - The labels attribute object containing customizations
 * @param {string} groupBreaksCategory - The column name used for grouping, or null if not grouped
 * @return {Array} chartData with all label customizations merged in
 */
export function mergeCustomLabelData(
	chartData,
	labelsAttribute,
	groupBreaksCategory = null
) {
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
			const resolved = resolveEntries(
				positionsForRow,
				d,
				groupBreaksCategory
			);
			if (Object.keys(resolved).length > 0) {
				result.__labelPositions = {
					...d.__labelPositions, // Preserve legacy
					...resolved,
				};
			}
		}

		// Merge custom label text
		const labelsForRow = labelsMap[normalizedX];
		if (labelsForRow) {
			const resolved = resolveEntries(
				labelsForRow,
				d,
				groupBreaksCategory
			);
			if (Object.keys(resolved).length > 0) {
				result.__labelText = {
					...d.__labelText, // Preserve legacy
					...resolved,
				};
			}
		}

		// Merge visibility
		const visibilityForRow = visibilityMap[normalizedX];
		if (visibilityForRow) {
			const resolved = resolveEntries(
				visibilityForRow,
				d,
				groupBreaksCategory
			);
			if (Object.keys(resolved).length > 0) {
				result.__labelVisible = {
					...d.__labelVisible, // Preserve legacy
					...resolved,
				};
			}
		}

		// Merge styles
		const stylesForRow = stylesMap[normalizedX];
		if (stylesForRow) {
			const resolved = resolveEntries(
				stylesForRow,
				d,
				groupBreaksCategory
			);
			if (Object.keys(resolved).length > 0) {
				const resolvedStyles = {};
				Object.entries(resolved).forEach(([cat, style]) => {
					const s = { ...style };
					if (s.color) {
						s.color = resolveColor(s.color);
					}
					resolvedStyles[cat] = s;
				});

				result.__labelStyles = {
					...d.__labelStyles, // Preserve legacy
					...resolvedStyles,
				};
			}
		}

		return result;
	});
}

/**
 * Generate a label key from x value, category, and optional group value.
 * This is the format used to store customizations in block attributes.
 *
 * @param {string|number|Date} x          - The x value
 * @param {string}             category   - The category name
 * @param {string|null}        groupValue - The group value (when groupBreaksActive), or null
 * @return {string} Key in format "xValue::category" or "xValue::category::groupValue"
 */
export function generateLabelKey(x, category, groupValue = null) {
	if (groupValue) {
		return `${x}::${category}::${groupValue}`;
	}
	return `${x}::${category}`;
}

export default mergeCustomLabelData;
