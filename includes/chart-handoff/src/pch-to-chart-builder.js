/**
 * PRC Chart Handoff (PCH) -> Chart Builder v2 block attributes converter.
 *
 * Takes a validated PCH handoff object and returns a partial CB block
 * attributes object suitable for merging with block defaults. Only fields
 * expressible in the handoff format are set; all CB-only features (tooltips,
 * animations, responsive overrides, annotations, drawings, etc.) are left
 * absent so the block's own defaults apply.
 *
 * Usage:
 *   import { pchToChartBuilder } from './pch-to-chart-builder.js';
 *   const attributes = pchToChartBuilder(handoffJson);
 */

const SUPPORTED_SCHEMA = 'prc-chart-handoff/v1';

/**
 * Derive CB layout.type from PCH chartType + orientation.
 * pew_bar() is horizontal, pew_column() is vertical — both map to PCH
 * chartType "bar" differentiated by orientation.
 *
 * @param {string} chartType   - PCH chartType value
 * @param {string} orientation - PCH orientation value ('horizontal'|'vertical')
 * @returns {{ type: string, orientation: string }}
 */
function resolveLayoutType(chartType, orientation = 'horizontal') {
	let type = chartType;
	if (chartType === 'bar' && orientation === 'vertical') {
		type = 'column';
	} else if (chartType === 'stacked-bar' && orientation === 'vertical') {
		type = 'stacked-column';
	}
	return { type, orientation };
}

/**
 * Map PCH data section to CB io + dataRender attributes.
 *
 * @param {object} data - PCH data object
 * @returns {{ io: object, dataRender: object }}
 */
function resolveData(data) {
	const { values, xColumn, yColumn, categoryColumn, xType } = data;

	const xScaleMap = {
		categorical: 'linear',
		numeric: 'linear',
		date: 'time',
	};

	const categories = categoryColumn
		? [...new Set(values.map((row) => row[categoryColumn]))]
		: [];

	// The editor's table parser always keys the first column as 'x'
	// (see edit/index.jsx memoizedChartData). chartData and dataRender.x
	// must use 'x'; the original column name is stored in independentVariable.
	let chartData;
	if (categoryColumn && categories.length > 0) {
		const byX = new Map();
		for (const row of values) {
			const xv = row[xColumn];
			if (!byX.has(xv)) {
				byX.set(xv, { x: xv });
			}
			byX.get(xv)[String(row[categoryColumn])] = row[yColumn];
		}
		chartData = [...byX.values()];
	} else {
		chartData = values.map((row) => ({
			x: row[xColumn],
			[yColumn]: row[yColumn],
		}));
	}

	return {
		io: {
			chartData,
			availableCategories: categories,
			independentVariable: 'x',
		},
		dataRender: {
			x: 'x',
			y: yColumn,
			xScale: xScaleMap[xType] ?? 'linear',
			yScale: 'linear',
			categories,
		},
	};
}

/**
 * Map PCH metadata to CB metadata attributes.
 *
 * @param {object} metadata - PCH metadata object
 * @returns {object} CB metadata partial
 */
function resolveMetadata(metadata) {
	return {
		active: true,
		title: metadata.title ?? '',
		subtitle: metadata.subtitle ?? '',
		note: metadata.note ?? '',
		source: metadata.source ?? '',
	};
}

/**
 * Map PCH config.independentAxis to CB independentAxis partial.
 * Only sets fields present in PCH; CB defaults fill the rest.
 *
 * @param {object} axisConfig - PCH config.independentAxis (may be undefined)
 * @returns {object} CB independentAxis partial
 */
function resolveIndependentAxis(axisConfig = {}) {
	const result = {};
	if (axisConfig.label !== undefined) result.label = axisConfig.label;
	if (axisConfig.scale !== undefined) result.scale = axisConfig.scale;
	if (axisConfig.domain != null) result.domain = axisConfig.domain;
	if (axisConfig.tickFormat != null) result.tickFormat = axisConfig.tickFormat;
	if (axisConfig.tickUnit !== undefined) result.tickUnit = axisConfig.tickUnit;
	if (axisConfig.tickUnitPosition !== undefined)
		result.tickUnitPosition = axisConfig.tickUnitPosition;
	if (axisConfig.showZero !== undefined) result.showZero = axisConfig.showZero;
	return result;
}

/**
 * Map PCH config.dependentAxis to CB dependentAxis partial.
 * Also handles the case where yType='percentage' implies tickUnit='%'.
 *
 * @param {object} axisConfig  - PCH config.dependentAxis (may be undefined)
 * @param {string} yType       - PCH data.yType
 * @returns {object} CB dependentAxis partial
 */
function resolveDependentAxis(axisConfig = {}, yType = 'numeric') {
	const result = {};
	if (axisConfig.label !== undefined) result.label = axisConfig.label;
	if (axisConfig.scale !== undefined) result.scale = axisConfig.scale;
	if (axisConfig.domain != null) result.domain = axisConfig.domain;
	if (axisConfig.tickFormat != null) result.tickFormat = axisConfig.tickFormat;
	if (axisConfig.showZero !== undefined) result.showZero = axisConfig.showZero;

	// Explicit tickUnit from axis config takes precedence; fall back to yType
	// inference only when not set.
	if (axisConfig.tickUnit !== undefined) {
		result.tickUnit = axisConfig.tickUnit;
	} else if (yType === 'percentage') {
		result.tickUnit = '%';
		result.tickUnitPosition = 'end';
	}
	if (axisConfig.tickUnitPosition !== undefined)
		result.tickUnitPosition = axisConfig.tickUnitPosition;

	return result;
}

/**
 * Map PCH config.legend to CB legend partial.
 *
 * @param {object} legendConfig - PCH config.legend (may be undefined)
 * @returns {object} CB legend partial
 */
function resolveLegend(legendConfig = {}) {
	const result = {};
	if (legendConfig.active !== undefined) result.active = legendConfig.active;
	if (legendConfig.orientation !== undefined)
		result.orientation = legendConfig.orientation;
	return result;
}

/**
 * Map PCH config.labels to CB labels partial.
 *
 * @param {object} labelsConfig - PCH config.labels (may be undefined)
 * @returns {object} CB labels partial
 */
function resolveLabels(labelsConfig = {}) {
	const result = {};
	if (labelsConfig.active !== undefined) result.active = labelsConfig.active;
	if (labelsConfig.position !== undefined)
		result.labelPositionBar = labelsConfig.position;
	return result;
}

/**
 * Map PCH chart-type-specific config sections to CB type-specific attributes.
 *
 * @param {string} chartType - PCH chartType
 * @param {object} config    - PCH config object (may be undefined)
 * @returns {object} Partial CB attributes for the relevant type-specific group
 */
function resolveTypeSpecificOptions(chartType, config = {}) {
	const result = {};

	if (chartType === 'bar' || chartType === 'stacked-bar') {
		const opts = config.barOptions ?? {};
		const barPartial = {};
		if (opts.barPadding !== undefined) barPartial.barPadding = opts.barPadding;
		if (opts.barGroupPadding !== undefined)
			barPartial.barGroupPadding = opts.barGroupPadding;
		if (opts.stackOffset !== undefined)
			barPartial.stackOffset = opts.stackOffset;
		if (Object.keys(barPartial).length) result.bar = barPartial;
	}

	if (chartType === 'line' || chartType === 'area' || chartType === 'stacked-area') {
		const opts = config.lineOptions ?? {};
		const linePartial = {};
		if (opts.interpolation !== undefined)
			linePartial.interpolation = opts.interpolation;
		if (opts.strokeWidth !== undefined)
			linePartial.strokeWidth = opts.strokeWidth;
		if (opts.showPoints !== undefined)
			linePartial.showPoints = opts.showPoints;
		if (opts.areaFillOpacity !== undefined)
			linePartial.areaFillOpacity = opts.areaFillOpacity;
		if (Object.keys(linePartial).length) result.line = linePartial;
	}

	if (chartType === 'dot-plot') {
		const opts = config.dotPlotOptions ?? {};
		const dotPartial = {};
		if (opts.connectPoints !== undefined)
			dotPartial.connectPoints = opts.connectPoints;
		if (Object.keys(dotPartial).length) result.dotPlot = dotPartial;
	}

	if (chartType === 'scatter') {
		const opts = config.scatterOptions ?? {};
		if (opts.showRegressionLine !== undefined || opts.regressionType !== undefined) {
			result.regression = {
				...(opts.showRegressionLine !== undefined && {
					active: opts.showRegressionLine,
				}),
				...(opts.regressionType !== undefined && {
					type: opts.regressionType,
				}),
			};
		}
	}

	if (chartType === 'diverging-bar') {
		const opts = config.divergingBarOptions ?? {};
		const divPartial = {};
		if (opts.positiveCategories !== undefined)
			divPartial.positiveCategories = opts.positiveCategories;
		if (opts.negativeCategories !== undefined)
			divPartial.negativeCategories = opts.negativeCategories;
		if (Object.keys(divPartial).length) result.divergingBar = divPartial;
	}

	return result;
}

/**
 * Convert a PCH handoff object to CB v2 block attributes.
 *
 * The returned object is a partial — it contains only the attributes that
 * PCH can express. Merge it with the block's default attributes to get a
 * complete, renderable attribute set.
 *
 * @param {object} pch - A parsed, validated PCH JSON object
 * @returns {object} Partial CB v2 block attributes
 * @throws {Error} If the schema version is not supported
 */
export function pchToChartBuilder(pch) {
	if (pch.$schema !== SUPPORTED_SCHEMA) {
		throw new Error(
			`Unsupported PCH schema "${pch.$schema}". Expected "${SUPPORTED_SCHEMA}".`
		);
	}

	const {
		chartType,
		orientation = 'horizontal',
		data,
		metadata,
		config = {},
	} = pch;

	const { type, orientation: resolvedOrientation } = resolveLayoutType(
		chartType,
		orientation
	);
	const { io, dataRender } = resolveData(data);

	const attributes = {
		_version: 'v2',

		layout: {
			type,
			orientation: resolvedOrientation,
			...(config.width !== undefined && { width: config.width }),
			...(config.height !== undefined && { height: config.height }),
		},

		metadata: resolveMetadata(metadata),

		...(config.colors?.length && { colors: config.colors }),

		io,
		dataRender,

		...(Object.keys(resolveIndependentAxis(config.independentAxis)).length && {
			independentAxis: resolveIndependentAxis(config.independentAxis),
		}),
		...(Object.keys(resolveDependentAxis(config.dependentAxis, data.yType)).length && {
			dependentAxis: resolveDependentAxis(config.dependentAxis, data.yType),
		}),
		...(Object.keys(resolveLegend(config.legend)).length && {
			legend: resolveLegend(config.legend),
		}),
		...(Object.keys(resolveLabels(config.labels)).length && {
			labels: resolveLabels(config.labels),
		}),

		...resolveTypeSpecificOptions(chartType, config),
	};

	return attributes;
}

export default pchToChartBuilder;
