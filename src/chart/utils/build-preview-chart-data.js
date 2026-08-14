/**
 * Build chart data for lean previews (Configure / admin wizard) with the same
 * label, error-bar, and tooltip customizations Refine applies in the editor.
 *
 * Pure helper — no Interactivity API / server-state dependency.
 */

import { mergeCustomLabelData } from './merge-custom-label-data';
import { mergeCustomTooltipData } from './merge-custom-tooltip-data';

/**
 * @param {Object}        attributes Chart block attributes.
 * @param {Object}        [options]
 * @param {Array|null}    [options.data]     Override for `attributes.io.chartData`.
 * @param {string}        [options.viewport] `'desktop'` | `'tablet'` | `'mobile'`.
 * @return {Array} Chart data with customizations merged in.
 */
export function buildPreviewChartData(
	attributes,
	{ data = null, viewport = 'desktop' } = {}
) {
	if (!attributes || typeof attributes !== 'object') {
		return [];
	}

	const source = data ?? attributes.io?.chartData ?? [];
	if (!Array.isArray(source) || source.length === 0) {
		return source;
	}

	const labels = attributes.labels || {};
	const viewportLabels =
		viewport !== 'desktop' ? attributes[viewport]?.labels || {} : {};

	const labelCustomizations = {
		customPositions:
			viewportLabels.customPositions || labels.customPositions || {},
		customLabels: viewportLabels.customLabels || labels.customLabels || {},
		customVisibility:
			viewportLabels.customVisibility || labels.customVisibility || {},
		customStyles: viewportLabels.customStyles || labels.customStyles || {},
	};

	const dataRender = attributes.dataRender || {};
	const activeGroupBreaksCategory =
		dataRender.groupBreaksActive && dataRender.groupBreaksCategory
			? dataRender.groupBreaksCategory
			: null;

	const dataWithLabelCustomizations = mergeCustomLabelData(
		source,
		labelCustomizations,
		activeGroupBreaksCategory
	);

	let dataWithCustomizations = dataWithLabelCustomizations;
	const errorBars = attributes.errorBars || {};
	if (
		attributes.layout?.type === 'dot-plot' &&
		errorBars.enabled &&
		errorBars.categories
	) {
		const mappingEntries = Object.entries(errorBars.categories);
		if (mappingEntries.length > 0) {
			const defaultStyles = errorBars.defaultStyles || {};
			dataWithCustomizations = dataWithLabelCustomizations.map((row) => {
				const bars = {};
				for (const [catKey, mapping] of mappingEntries) {
					if (mapping.lowColumn && mapping.highColumn) {
						const low = parseFloat(row[mapping.lowColumn]);
						const high = parseFloat(row[mapping.highColumn]);
						if (!isNaN(low) && !isNaN(high)) {
							bars[catKey] = {
								min: low,
								max: high,
								...defaultStyles,
								...(mapping.styles || {}),
							};
						}
					}
				}
				return Object.keys(bars).length > 0
					? { ...row, __errorBars: bars }
					: row;
			});
		}
	}

	return mergeCustomTooltipData(
		dataWithCustomizations,
		attributes.customTooltips || {},
		activeGroupBreaksCategory
	);
}

export default buildPreviewChartData;
