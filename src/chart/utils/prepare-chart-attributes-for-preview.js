/**
 * Normalize chart attributes before `getConfig` in lean preview surfaces.
 *
 * Pattern attrs usually include axis objects, but partial seeds may omit them —
 * without defaults `getConfig` throws when destructuring `scale`/`domain`.
 */

const DEFAULT_INDEPENDENT_AXIS = {
	scale: 'linear',
	domain: null,
	tickValues: null,
};

const DEFAULT_DEPENDENT_AXIS = {
	scale: 'linear',
	domain: null,
	tickValues: null,
};

/**
 * @param {Object|null|undefined} chartAttributes Attributes to normalize.
 * @return {Object} Attributes guaranteed to carry independent/dependent axes.
 */
export function prepareChartAttributesForPreview(chartAttributes) {
	if (!chartAttributes || typeof chartAttributes !== 'object') {
		return {
			layout: { type: 'bar', width: 640, height: 400 },
			metadata: { active: true, title: '', alt: '' },
			io: { chartData: [], colorValue: 'general' },
			dataRender: { categories: [] },
			independentAxis: { ...DEFAULT_INDEPENDENT_AXIS },
			dependentAxis: { ...DEFAULT_DEPENDENT_AXIS },
		};
	}

	return {
		...chartAttributes,
		independentAxis: {
			...DEFAULT_INDEPENDENT_AXIS,
			...(chartAttributes.independentAxis ?? {}),
		},
		dependentAxis: {
			...DEFAULT_DEPENDENT_AXIS,
			...(chartAttributes.dependentAxis ?? {}),
		},
	};
}
