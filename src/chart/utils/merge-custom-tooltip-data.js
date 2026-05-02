/**
 * Merge Custom Tooltip Data
 *
 * Consolidates custom tooltip data from the `customTooltips` block attribute
 * into chartData `__tooltips` entries (as structured objects) so that
 * getCustomTooltip() can consume them when rendering tooltips.
 *
 * Handles:
 * - customTooltips -> __tooltips[category] = { body?, header? }
 *
 * Key Formats:
 * - 2-part (standard): "xValue::category"
 * - 3-part (grouped):  "xValue::category::groupValue"
 *
 * Mirrors the structure of merge-custom-label-data.js. Helpers are duplicated
 * here rather than shared to match the existing per-merger pattern.
 */

/**
 * Normalize a value to a consistent string format for comparison.
 * Handles Date objects and ISO date strings consistently.
 *
 * @param {*} value - The value to normalize
 * @return {string} Normalized string value
 */
function normalizeXValue(value) {
	if (value instanceof Date) {
		return value.toISOString();
	}

	const asString = String(value);

	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(asString)) {
		return asString;
	}

	const asDate = new Date(asString);
	if (!isNaN(asDate.getTime())) {
		return asDate.toISOString();
	}

	return asString;
}

/**
 * Parse customization keys and build a lookup map by normalized x value.
 *
 * @param {Object} customizations - Object with "xValue::category" keys
 * @return {Object} Lookup map: { normalizedX: { entryKey: value } }
 */
function buildLookupMap(customizations) {
	const lookupMap = {};

	if (!customizations || typeof customizations !== 'object') {
		return lookupMap;
	}

	Object.entries(customizations).forEach(([key, value]) => {
		const parts = key.split('::');
		if (parts.length < 2) {
			return;
		}

		const xValue = parts[0];
		const entryKey = parts.slice(1).join('::');
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
 * @param {Object} entries             - The entries from the lookup map for this x value
 * @param {Object} dataPoint           - The data point being processed
 * @param {string} groupBreaksCategory - The column name used for grouping (or null)
 * @return {Object} Resolved entries: { category: value }
 */
function resolveEntries(entries, dataPoint, groupBreaksCategory) {
	const resolved = {};

	const nonGrouped = [];
	const grouped = [];

	Object.entries(entries).forEach(([entryKey, value]) => {
		if (entryKey.includes('::')) {
			grouped.push([entryKey, value]);
		} else {
			nonGrouped.push([entryKey, value]);
		}
	});

	nonGrouped.forEach(([category, value]) => {
		resolved[category] = value;
	});

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
 * Merge custom tooltip customizations from the customTooltips block attribute
 * into chartData as `__tooltips` object entries — a map of category ->
 * { body?, header? } — so getCustomTooltip() can resolve them without
 * a separate key.
 *
 * Existing `data[i].__tooltips[category]` string values (data-model layer) are
 * only present when the editor has not set an override; this merge overwrites
 * those entries with the richer object form when an override exists.
 *
 * @param {Array}  chartData           - The chart data array
 * @param {Object} customTooltipsAttr  - The customTooltips block attribute
 * @param {string} groupBreaksCategory - Column name used for grouping, or null
 * @return {Array} chartData with tooltip overrides merged in
 */
export function mergeCustomTooltipData(
	chartData,
	customTooltipsAttr,
	groupBreaksCategory = null
) {
	if (!chartData || !Array.isArray(chartData)) {
		return chartData;
	}

	if (!customTooltipsAttr || typeof customTooltipsAttr !== 'object') {
		return chartData;
	}

	if (Object.keys(customTooltipsAttr).length === 0) {
		return chartData;
	}

	const lookupMap = buildLookupMap(customTooltipsAttr);

	return chartData.map((d) => {
		const normalizedX = normalizeXValue(d.x);
		const entriesForRow = lookupMap[normalizedX];

		if (!entriesForRow) {
			return d;
		}

		const resolved = resolveEntries(entriesForRow, d, groupBreaksCategory);

		if (Object.keys(resolved).length === 0) {
			return d;
		}

		// Drop entries where both body and header are empty so the
		// fallback cascade (default format) still wins.
		const cleaned = {};
		Object.entries(resolved).forEach(([category, override]) => {
			if (!override || typeof override !== 'object') return;
			const { body, header } = override;
			const hasBody = typeof body === 'string' && body.length > 0;
			const hasHeader = typeof header === 'string' && header.length > 0;
			if (hasBody || hasHeader) {
				cleaned[category] = {
					...(hasBody ? { body } : {}),
					...(hasHeader ? { header } : {}),
				};
			}
		});

		if (Object.keys(cleaned).length === 0) {
			return d;
		}

		return {
			...d,
			__tooltips: {
				...(d.__tooltips || {}),
				...cleaned,
			},
		};
	});
}

export default mergeCustomTooltipData;
