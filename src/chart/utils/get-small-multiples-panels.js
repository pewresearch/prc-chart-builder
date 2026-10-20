/**
 * Series columns the renderer draws: `dataRender.categories`, or
 * `io.availableCategories` when that is empty, as in `getConfig`.
 *
 * @param {Object} attributes Chart block attributes.
 * @return {string[]} Series column names.
 */
export function getSmallMultiplesCategories(attributes) {
	const categories = attributes.dataRender?.categories?.length
		? attributes.dataRender.categories
		: (attributes.io?.availableCategories ?? []);
	return categories.map(String);
}

/**
 * Panels and the series each one draws, keyed the way the renderer reads
 * `smallMultiples.panelStyles`.
 *
 * @param {Object} attributes Chart block attributes.
 * @return {{ key: string, seriesKeys: string[], sharedKeys: string[] }[]} Panels in render order.
 */
export default function getSmallMultiplesPanels(attributes) {
	const dataRender = attributes.dataRender ?? {};
	const categories = getSmallMultiplesCategories(attributes);
	const groupKey =
		dataRender.groupBreaksActive && dataRender.groupBreaksCategory;

	if (!groupKey) {
		return categories.map((key) => ({
			key,
			seriesKeys: [key],
			sharedKeys: ['All panels'],
		}));
	}

	const seriesKeys = categories.filter((key) => key !== groupKey);
	const groupValues = dataRender.groupBreaksCategoryValues?.length
		? dataRender.groupBreaksCategoryValues
		: [
				...new Set(
					(attributes.io?.chartData ?? [])
						.map((row) => row?.[groupKey])
						.filter(Boolean)
				),
			];
	return groupValues.map((key) => ({
		key: String(key),
		seriesKeys,
		sharedKeys: seriesKeys,
	}));
}
