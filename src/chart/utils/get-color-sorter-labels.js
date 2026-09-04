import { decodeHtmlEntities } from '@prc/charting-utilities';
import {
	effectiveChartTypeForControls,
	VALUE_SCALE_CHART_TYPES,
} from './chart-types';
import {
	getAvailableLegendCategories,
	isBubbleMapLegendMode,
} from './get-available-legend-categories';
import { mergeLegendCategoryOrder } from './merge-legend-category-order';

const DEFAULT_LABEL_LOWER = 'Less than ';
const DEFAULT_LABEL_DELIMITER = 'to';
const DEFAULT_LABEL_UPPER = 'More than ';

/**
 * Build visx LegendThreshold-style labels for a numeric domain.
 * n breaks produce n+1 labels (below, inner ranges, above).
 *
 * @param {Array<number|string>} domain
 * @param {Object}               [legend]
 * @param {string}               [legend.labelLower]
 * @param {string}               [legend.labelDelimiter]
 * @param {string}               [legend.labelUpper]
 * @return {string[]}
 */
export function getThresholdLegendLabels(domain = [], legend = {}) {
	const breaks = (Array.isArray(domain) ? domain : []).filter(
		(value) => value !== '' && value !== null && value !== undefined
	);
	if (breaks.length === 0) {
		return [];
	}

	const labelLower = legend.labelLower ?? DEFAULT_LABEL_LOWER;
	const labelDelimiter = legend.labelDelimiter ?? DEFAULT_LABEL_DELIMITER;
	const labelUpper = legend.labelUpper ?? DEFAULT_LABEL_UPPER;
	const inner = ` ${labelDelimiter} `;

	const labels = [`${labelLower}${breaks[0]}`];
	for (let index = 0; index < breaks.length - 1; index += 1) {
		labels.push(`${breaks[index]}${inner}${breaks[index + 1]}`);
	}
	labels.push(`${labelUpper}${breaks[breaks.length - 1]}`);
	return labels.map((label) => decodeHtmlEntities(label));
}

function getDiscreteLegendLabels(attributes = {}) {
	const io = attributes.io ?? {};
	const available = getAvailableLegendCategories({
		chartType:
			effectiveChartTypeForControls(attributes) ||
			attributes.layout?.type,
		chartFamily: io.chartFamily,
		io,
		dataRender: attributes.dataRender,
		divergingBar: attributes.divergingBar,
		sankey: attributes.sankey,
		smallMultiples: attributes.smallMultiples,
	});
	const persisted = attributes.legend?.categories;
	if (Array.isArray(persisted) && persisted.length > 0) {
		return mergeLegendCategoryOrder(persisted, available);
	}
	return available;
}

/**
 * Labels shown beside rearrangable colors in ColorSorter.
 * Discrete charts use legend category order. Value-binned charts
 * (maps, heat-map-table) follow the active mapScale:
 * ordinal → domain keys, threshold → bin language, linear/bubble → none.
 *
 * @param {Object} attributes Chart block attributes.
 * @return {string[]}
 */
export function getColorSorterLabels(attributes = {}) {
	const chartType =
		effectiveChartTypeForControls(attributes) || attributes.layout?.type;
	const io = attributes.io ?? {};
	const dataRender = attributes.dataRender ?? {};
	const legend = attributes.legend ?? {};

	if (isBubbleMapLegendMode(chartType, dataRender.mapStyle)) {
		return [];
	}

	const usesValueScale =
		io.chartFamily === 'map' || VALUE_SCALE_CHART_TYPES.includes(chartType);

	if (!usesValueScale) {
		return getDiscreteLegendLabels(attributes);
	}

	const scale = dataRender.mapScale || 'threshold';
	const domain = Array.isArray(dataRender.mapScaleDomain)
		? dataRender.mapScaleDomain
		: [];

	if (scale === 'ordinal') {
		const available = domain
			.map((value) => String(value))
			.filter((value) => value !== '');
		if (Array.isArray(legend.categories) && legend.categories.length > 0) {
			return mergeLegendCategoryOrder(legend.categories, available);
		}
		return available;
	}

	if (scale === 'threshold') {
		return getThresholdLegendLabels(domain, legend);
	}

	return [];
}
