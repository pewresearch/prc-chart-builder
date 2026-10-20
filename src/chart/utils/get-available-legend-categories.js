import { getGroupColorDomain } from '../../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/compute/groupColorDomain.ts';
import { getThresholdLegendLabels } from '../../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/heatMapTable/thresholdLegendLabels.ts';
import {
	BUBBLE_MAP_CHART_TYPES,
	POINT_CHART_TYPES,
	VALUE_SCALE_CHART_TYPES,
} from './chart-types';

function usesValueScaleColorDomain(chartType, chartFamily) {
	return chartFamily === 'map' || VALUE_SCALE_CHART_TYPES.includes(chartType);
}

/**
 * Treemap legend categories mirror Treemap.tsx groupNames: group values when
 * grouped, otherwise leaf labels from the independent variable (x).
 *
 * @param {Object[]} chartData
 * @param {Object}   dataRender
 * @return {string[]} Group or leaf labels used by the treemap color scale.
 */
function getTreemapLegendCategories(chartData = [], dataRender = {}) {
	const {
		groupBreaksActive,
		groupBreaksCategory,
		groupBreaksCategoryValues = [],
	} = dataRender;
	const groupKey = groupBreaksActive ? groupBreaksCategory : null;

	if (!groupKey) {
		return chartData.map((d) => String(d.x));
	}

	const names = new Set();
	chartData.forEach((d) => {
		const value = d[groupKey];
		if (value !== null && value !== undefined && value !== '') {
			names.add(String(value));
		}
	});

	if (groupBreaksCategoryValues.length > 0) {
		return groupBreaksCategoryValues
			.map((value) => String(value))
			.filter((name) => names.has(name));
	}

	return [...names];
}

/**
 * Sankey legend categories mirror Sankey.tsx nodeNames: unique source/target
 * node labels in first-seen order.
 *
 * @param {Object[]} chartData
 * @param {Object}   sankey
 * @return {string[]} Node labels used by the sankey color scale.
 */
function getSankeyLegendCategories(chartData = [], sankey = {}) {
	const {
		sourceKey = 'x',
		targetKey = 'target',
		valueKey = 'value',
	} = sankey;
	const nodeNames = [];
	const seen = new Set();

	const addNode = (name) => {
		if (!name || seen.has(name)) {
			return;
		}
		seen.add(name);
		nodeNames.push(name);
	};

	chartData.forEach((row) => {
		const sourceName = String(row[sourceKey] ?? '');
		const targetName = String(row[targetKey] ?? '');
		const value = Number(row[valueKey]) || 0;

		if (!sourceName || !targetName || value <= 0) {
			return;
		}

		addNode(sourceName);
		addNode(targetName);
	});

	return nodeNames;
}

/**
 * Part-to-whole charts (pie, waffle) color by row label (`x`), like the pie color scale.
 *
 * @param {Object[]} chartData Chart rows. Each row label is `x`.
 * @return {string[]} Row labels in first-seen order.
 */
function getPartToWholeLegendCategories(chartData = []) {
	const seen = new Set();
	const rowLabels = [];
	chartData.forEach((row) => {
		const label = String(row.x ?? '');
		if (!label || seen.has(label)) {
			return;
		}
		seen.add(label);
		rowLabels.push(label);
	});
	return rowLabels;
}

/**
 * Columns whose values make up an ordinal value scale: a map's one data
 * category, or every value column of a heat map.
 *
 * @param {string}   chartType  Block chart type.
 * @param {string[]} categories dataRender.categories.
 * @return {string[]} Column keys.
 */
export function getOrdinalValueColumns(chartType, categories = []) {
	const columns = (categories ?? []).map(String);
	return VALUE_SCALE_CHART_TYPES.includes(chartType)
		? columns
		: columns.slice(0, 1);
}

/**
 * Ordinal color domain from the values in the given columns.
 *
 * Unique values follow first-seen order, row by row. A saved domain keeps
 * that order for values still in the table and drops the rest. New values
 * append. An empty table keeps the saved domain so a chart does not lose
 * its scale before data loads.
 *
 * @param {Array<Object>}        chartData   Table rows.
 * @param {string[]}             columns     Columns that hold the values.
 * @param {Array<string|number>} savedDomain Stored mapScaleDomain.
 * @return {string[]} Domain keys in palette order.
 */
export function getOrdinalValueDomain(chartData, columns, savedDomain = []) {
	const saved = (Array.isArray(savedDomain) ? savedDomain : [])
		.map((value) => String(value))
		.filter((value) => value.trim() !== '');
	const cells = (Array.isArray(chartData) ? chartData : []).flatMap((row) =>
		columns.map((column) => ({ value: row?.[column] }))
	);
	const inferred = getGroupColorDomain(cells, 'value', {
		groupOrder: saved,
	});

	return inferred.length > 0 ? inferred : saved;
}

/**
 * Derive the set of legend categories for the current chart configuration.
 * Shared by legend-controls.jsx (editor sorter) and get-config.js (render).
 *
 * @param {Object} params
 * @param {string} params.chartType
 * @param {string} [params.chartFamily]
 * @param {Object} [params.io]
 * @param {Object} [params.dataRender]
 * @param {Object} [params.divergingBar]
 * @param {Object} [params.sankey]
 * @param {Object} [params.smallMultiples]
 * @param {Object} [params.legend]
 * @return {string[]} Available legend category labels.
 */
export function getAvailableLegendCategories({
	chartType,
	chartFamily,
	io = {},
	dataRender = {},
	divergingBar = {},
	sankey = {},
	smallMultiples = {},
	legend = {},
}) {
	const { availableCategories = [], chartData = [] } = io;
	const {
		categories: dataCategories = [],
		mapScale,
		mapScaleDomain = [],
		groupBreaksCategory,
		groupBreaksCategoryValues = [],
	} = dataRender;
	const { neutralBar = {} } = divergingBar;

	const defaultCategories =
		dataCategories?.length > 0 ? dataCategories : availableCategories;

	if (chartType === 'diverging-bar') {
		const divergingCategories = neutralBar.active
			? [
					...divergingBar.negativeCategories,
					...divergingBar.positiveCategories,
					neutralBar.category,
				]
			: [
					...divergingBar.negativeCategories,
					...divergingBar.positiveCategories,
				];

		if (
			divergingBar.secondary?.active &&
			divergingBar.secondary?.showInLegend
		) {
			return [
				...divergingCategories,
				...divergingBar.secondary.negativeCategories,
				...divergingBar.secondary.positiveCategories,
			];
		}

		return divergingCategories;
	}

	if (isBubbleMapLegendMode(chartType, dataRender.mapStyle)) {
		if (groupBreaksCategory) {
			return getGroupColorDomain(chartData, groupBreaksCategory, {
				groupOrder: groupBreaksCategoryValues,
			});
		}
		return dataCategories?.[0] ? [String(dataCategories[0])] : [];
	}

	if (usesValueScaleColorDomain(chartType, chartFamily)) {
		if (mapScale === 'threshold') {
			return getThresholdLegendLabels(mapScaleDomain, legend);
		}
		if (mapScale === 'ordinal') {
			return getOrdinalValueDomain(
				chartData,
				getOrdinalValueColumns(chartType, dataCategories),
				mapScaleDomain
			);
		}
		if (mapScale === 'linear') {
			return [];
		}
	}

	if (POINT_CHART_TYPES.includes(chartType) && groupBreaksCategory) {
		return getGroupColorDomain(chartData, groupBreaksCategory, {
			groupOrder: groupBreaksCategoryValues,
		});
	}

	if (chartType === 'treemap') {
		return getTreemapLegendCategories(chartData, dataRender);
	}

	if (chartType === 'sankey') {
		return getSankeyLegendCategories(chartData, sankey);
	}

	// Pie slices and standalone waffle cells key by row label.
	if (chartType === 'pie' || chartType === 'waffle') {
		return getPartToWholeLegendCategories(chartData);
	}

	if (chartType === 'small-multiples') {
		if (smallMultiples.panelType === 'pie') {
			return getPartToWholeLegendCategories(chartData);
		}
		// Each waffle panel is one series keyed by panel name.
		if (
			smallMultiples.panelType === 'waffle' &&
			dataRender.groupBreaksActive &&
			groupBreaksCategory
		) {
			return getGroupColorDomain(chartData, groupBreaksCategory, {
				groupOrder: groupBreaksCategoryValues,
			});
		}
		// The grouping column names the panels; it is not a series.
		if (dataRender.groupBreaksActive && groupBreaksCategory) {
			return defaultCategories.filter(
				(category) => category !== groupBreaksCategory
			);
		}
	}

	return defaultCategories;
}

/**
 * Returns true when bubble map legend order controls should be hidden.
 *
 * @param {string} chartType
 * @param {string} mapStyle
 * @return {boolean} Whether bubble map mode is active.
 */
export function isBubbleMapLegendMode(chartType, mapStyle) {
	return BUBBLE_MAP_CHART_TYPES.includes(chartType) && mapStyle === 'bubble';
}
