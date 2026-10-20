/**
 * Deep-import decodeHtmlEntities. This file is on the view.js script-module
 * graph via get-config.js. The @prc/charting-utilities barrel re-exports
 * useSize, and webpack then rejects `react` in a module build.
 */
import {
	getLinearRampStops,
	getThresholdLegendLabels,
} from '../../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/heatMapTable/thresholdLegendLabels.ts';
import {
	effectiveChartTypeForControls,
	VALUE_SCALE_CHART_TYPES,
} from './chart-types';
import {
	getAvailableLegendCategories,
	getOrdinalValueColumns,
	getOrdinalValueDomain,
	isBubbleMapLegendMode,
} from './get-available-legend-categories';
import { mergeLegendCategoryOrder } from './merge-legend-category-order';

export { getThresholdLegendLabels };

/**
 * Column-facet line, column, and bar panels share one series row.
 *
 * @param {Object} attributes Chart block attributes.
 * @return {boolean} Whether the chart lists the shared "All panels" row.
 */
function usesSharedPanelRow(attributes) {
	const dataRender = attributes.dataRender ?? {};
	const panelType = attributes.smallMultiples?.panelType || 'line';
	return (
		attributes.layout?.type === 'small-multiples' &&
		!(dataRender.groupBreaksActive && dataRender.groupBreaksCategory) &&
		['line', 'column', 'bar'].includes(panelType)
	);
}

function getDiscreteLegendLabels(attributes = {}, followLegendOrder = true) {
	const io = attributes.io ?? {};
	const available = getAvailableLegendCategories({
		chartType: attributes.layout?.type,
		chartFamily: io.chartFamily,
		io,
		dataRender: attributes.dataRender,
		divergingBar: attributes.divergingBar,
		sankey: attributes.sankey,
		smallMultiples: attributes.smallMultiples,
		legend: attributes.legend,
	});
	const persisted = attributes.legend?.categories;
	if (followLegendOrder && Array.isArray(persisted) && persisted.length > 0) {
		return mergeLegendCategoryOrder(persisted, available);
	}
	return available;
}

/**
 * Series color keys: one `seriesStyles` row per key, in legend order.
 * Discrete charts use legend category order. Value-binned charts
 * (maps, heat-map-table) follow the active mapScale:
 * ordinal → domain keys, threshold → bin language, linear → ramp stops,
 * bubble → group values, or the mapped category without a group column.
 * Use `getSeriesColorSlotKeys` to index into the palette.
 *
 * @param {Object} attributes Chart block attributes.
 * @return {string[]} Color domain keys in legend order.
 */
export function getSeriesColorKeys(attributes = {}) {
	return collectSeriesColorKeys(attributes, true);
}

/**
 * Waffle cells and small-multiples pie slices take their color domain in
 * legend order. Every other discrete chart reads `config.colors` by data
 * column, so there the legend order only orders the legend.
 *
 * @param {Object} attributes Chart block attributes.
 * @return {boolean} Whether palette slots follow the saved legend order.
 */
function paintsInLegendOrder(attributes) {
	const chartType = effectiveChartTypeForControls(attributes);
	return (
		chartType === 'waffle' ||
		(attributes.layout?.type === 'small-multiples' && chartType === 'pie')
	);
}

/**
 * Series color keys in the order renderers read `config.colors`. Matches
 * `getSeriesColorKeys` except where the legend order differs from the
 * order a renderer paints in.
 *
 * @param {Object} attributes Chart block attributes.
 * @return {string[]} Color domain keys in palette slot order.
 */
export function getSeriesColorSlotKeys(attributes = {}) {
	return collectSeriesColorKeys(attributes, paintsInLegendOrder(attributes));
}

function collectSeriesColorKeys(attributes, followLegendOrder) {
	const chartType =
		effectiveChartTypeForControls(attributes) || attributes.layout?.type;
	const io = attributes.io ?? {};
	const dataRender = attributes.dataRender ?? {};
	const legend = attributes.legend ?? {};

	if (usesSharedPanelRow(attributes)) {
		return ['All panels'];
	}

	if (isBubbleMapLegendMode(chartType, dataRender.mapStyle)) {
		return getAvailableLegendCategories({
			chartType,
			chartFamily: io.chartFamily,
			io,
			dataRender,
		});
	}

	const usesValueScale =
		io.chartFamily === 'map' || VALUE_SCALE_CHART_TYPES.includes(chartType);

	if (!usesValueScale) {
		return getDiscreteLegendLabels(attributes, followLegendOrder);
	}

	const scale = dataRender.mapScale || 'threshold';
	const domain = Array.isArray(dataRender.mapScaleDomain)
		? dataRender.mapScaleDomain
		: [];

	if (scale === 'ordinal') {
		const stored = domain
			.map((value) => String(value))
			.filter((value) => value !== '');
		const available = getOrdinalValueDomain(
			io.chartData,
			getOrdinalValueColumns(chartType, dataRender.categories),
			stored
		);
		if (Array.isArray(legend.categories) && legend.categories.length > 0) {
			return mergeLegendCategoryOrder(legend.categories, available);
		}
		return available;
	}

	if (scale === 'threshold') {
		const available = getThresholdLegendLabels(domain, legend);
		if (Array.isArray(legend.categories) && legend.categories.length > 0) {
			return mergeLegendCategoryOrder(legend.categories, available);
		}
		return available;
	}

	return getLinearRampStops(domain).map(String);
}
