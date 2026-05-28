import { BUBBLE_MAP_CHART_TYPES, POINT_CHART_TYPES } from './chart-types';

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
 * @return {string[]} Available legend category labels.
 */
export function getAvailableLegendCategories({
	chartType,
	chartFamily,
	io = {},
	dataRender = {},
	divergingBar = {},
	sankey = {},
}) {
	const { availableCategories = [], chartData = [] } = io;
	const {
		categories: dataCategories = [],
		mapScale,
		mapScaleDomain = [],
		groupBreaksCategory,
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

	if (chartFamily === 'map' && mapScale === 'ordinal') {
		return mapScaleDomain;
	}

	if (POINT_CHART_TYPES.includes(chartType) && groupBreaksCategory) {
		return [
			...new Set(
				chartData
					.map((d) => d[groupBreaksCategory])
					.filter((v) => v !== null && v !== undefined && v !== '')
			),
		];
	}

	if (chartType === 'treemap') {
		return getTreemapLegendCategories(chartData, dataRender);
	}

	if (chartType === 'sankey') {
		return getSankeyLegendCategories(chartData, sankey);
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
