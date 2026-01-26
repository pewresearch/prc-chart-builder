/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { colors as colorPalette } from './colors';
import {
	getDomain,
	getTicks,
	stringToArrayOfNums,
	stringToArray,
	generateDefaultAltText,
} from './helpers';

/**
 * Deep merge viewport-specific overrides into base attributes
 *
 * @param {Object} baseAttributes - The full block attributes object
 * @param {string} deviceType     - Current device type ('mobile', 'tablet', or 'desktop')
 * @return {Object} Merged attributes with viewport overrides applied
 */
export function mergeViewportOverrides(baseAttributes, deviceType) {
	// Desktop uses base attributes only (no override)
	if (!deviceType || deviceType === 'desktop') {
		return baseAttributes;
	}

	// Get viewport-specific overrides
	const viewportOverrides = baseAttributes[deviceType] || {};

	// If no overrides exist, return base attributes
	if (Object.keys(viewportOverrides).length === 0) {
		return baseAttributes;
	}

	// Deep merge: viewport overrides take precedence over base attributes
	// We create a new object to avoid mutating the original
	const merged = { ...baseAttributes };

	// Merge each top-level attribute group that has overrides
	Object.keys(viewportOverrides).forEach((attributeGroup) => {
		if (
			merged[attributeGroup] &&
			typeof merged[attributeGroup] === 'object'
		) {
			// Deep merge the attribute group
			merged[attributeGroup] = {
				...merged[attributeGroup],
				...viewportOverrides[attributeGroup],
			};
		}
	});

	return merged;
}

const { baseConfig } = window.prcCustomCharts || window.prcChartingLibrary;
const getConfig = (
	attributes,
	clientId,
	editorClickEvent = null,
	deviceType = 'desktop'
) => {
	// Merge viewport-specific overrides before extracting attributes
	const mergedAttributes = mergeViewportOverrides(attributes, deviceType);

	// layout attributes
	const {
		layout,
		metadata,
		io,
		plotBands,
		annotations,
		bar,
		line,
		explodedBar,
		labels,
		pie,
		dotPlot,
		independentAxis,
		dependentAxis,
		map,
		divergingBar,
		drawings,
		diffColumn,
		dataRender,
		legend,
		nodes,
		tooltip,
	} = mergedAttributes;
	const {
		customColors,
		colorValue,
		elementHasStroke,
		isCustomChart,
		customAttributes,
		availableCategories,
	} = io;
	const { type: chartType } = layout;
	const { alt, title } = metadata;
	const { scale: iScale, domain: iDomain } = independentAxis;
	const { scale: dScale, domain: dDomain } = dependentAxis;
	const { neutralBar } = divergingBar;
	// independent axis attributes
	// const {
	// 	showXMinDomainLabel,
	// 	xAbbreviateTicks,
	// 	xAbbreviateTicksDecimals,
	// 	xTicksToLocaleString,
	// 	xAxisActive,
	// 	xAxisStroke,
	// 	xGridStroke,
	// 	xGridStrokeDasharray,
	// 	xGridOpacity,
	// 	xLabel,
	// 	xLabelFontSize,
	// 	xLabelTextFill,
	// 	xLabelPadding,
	// 	xLabelMaxWidth,
	// 	xMaxDomain,
	// 	xMinDomain,
	// 	xScale,
	// 	xDateFormat,
	// 	xTickExact,
	// 	xTickLabelAngle,
	// 	xTickLabelMaxWidth,
	// 	xTickLabelDX,
	// 	xTickLabelDY,
	// 	xTickLabelTextAnchor,
	// 	xTickLabelVerticalAnchor,
	// 	xTickMarksActive,
	// 	xTickNum,
	// 	xTickUnit,
	// 	xTickUnitPosition,
	// } = attributes;
	// dependent axis attributes
	// const {
	// 	yAxisStroke,
	// 	yGridStroke,
	// 	yGridStrokeDasharray,
	// 	yGridOpacity,
	// 	yAxisActive,
	// 	yScale,
	// 	yScaleFormat,
	// 	yLabel,
	// 	yLabelFontSize,
	// 	yLabelTextFill,
	// 	yLabelPadding,
	// 	yLabelMaxWidth,
	// 	yMinDomain,
	// 	yMaxDomain,
	// 	showYMinDomainLabel,
	// 	yTickMarksActive,
	// 	yTickNum,
	// 	yTickExact,
	// 	yTickUnit,
	// 	yTickUnitPosition,
	// 	yTickLabelAngle,
	// 	yTickLabelMaxWidth,
	// 	yTickLabelVerticalAnchor,
	// 	yTickLabelTextAnchor,
	// 	yTickLabelDY,
	// 	yTickLabelDX,
	// 	yAbbreviateTicks,
	// 	yAbbreviateTicksDecimals,
	// 	yTicksToLocaleString,
	// } = attributes;
	// label attributes
	// const {
	// 	labelsActive,
	// 	showFirstLastPointsOnly,
	// 	labelPositionDX,
	// 	labelPositionDY,
	// 	labelAbsoluteValue,
	// 	labelFormatValue,
	// 	labelUnit,
	// 	labelUnitPosition,
	// 	barLabelPosition,
	// 	barLabelCutoff,
	// 	barLabelCutoffMobile,
	// 	labelColor,
	// 	labelFontSize,
	// 	labelFontWeight,
	// 	labelTruncateDecimal,
	// 	labelToFixedDecimal,
	// } = attributes;
	// legend attributes
	// const {
	// 	legendActive,
	// 	legendOrientation,
	// 	legendCategories,
	// 	legendTitle,
	// 	legendOffsetX,
	// 	legendOffsetY,
	// 	legendAlignment,
	// 	legendMarkerStyle,
	// 	legendBorderStroke,
	// 	legendFill,
	// 	legendFontSize,
	// 	legendMargin,
	// 	legendLabelDelimiter,
	// 	legendLabelLower,
	// 	legendLabelUpper,
	// } = attributes;
	// tooltip attributes
	// const {
	// 	tooltipActive,
	// 	tooltipActiveOnMobile,
	// 	tooltipHeaderActive,
	// 	tooltipHeaderValue,
	// 	tooltipMaxHeight,
	// 	tooltipMaxWidth,
	// 	tooltipMinWidth,
	// 	tooltipMinHeight,
	// 	tooltipOffsetX,
	// 	tooltipOffsetY,
	// 	tooltipFormat,
	// 	tooltipDateFormat,
	// 	tooltipFormatValue,
	// 	tooltipAbsoluteValue,
	// 	deemphasizeSiblings,
	// 	deemphasizeOpacity,
	// } = attributes;
	// pie chart attributes
	// const { pieCategoryLabelsActive } = attributes;
	// bar chart attributes
	// const { barPadding, barGroupPadding } = attributes;
	// diverging bar attributes
	// const {
	// 	positiveCategories,
	// 	negativeCategories,
	// 	neutralCategory,
	// 	divergingBarPercentOfInnerWidth,
	// 	neutralBarSeparator,
	// 	neutralBarActive,
	// 	neutralBarOffsetX,
	// 	neutralBarSeparatorOffsetX,
	// } = attributes;
	// dot plot attributes
	// const {
	// 	dotPlotConnectPoints,
	// 	dotPlotConnectPointsStroke,
	// 	dotPlotConnectPointsStrokeWidth,
	// 	dotPlotConnectPointsStrokeDasharray,
	// } = attributes;
	// line attributes
	// const {
	// 	lineStrokeDashArray,
	// 	lineInterpolation,
	// 	lineStrokeWidth,
	// 	lineNodes,
	// 	nodeSize,
	// 	nodeStrokeWidth,
	// 	nodeFill,
	// 	areaFillOpacity,
	// } = attributes;
	// explded bar attributes
	// const { explodedBarColumnGap } = attributes;
	// // plot band attributes
	// const { plotBandsActive } = attributes;
	// diff column attributes
	// const {
	// 	diffColumnActive,
	// 	diffColumnCategory,
	// 	diffColumnHeader,
	// 	diffColumnMarginLeft,
	// 	diffColumnBackgroundColor,
	// 	diffColumnHeightOffset,
	// 	diffColumnWidth,
	// 	diffColumnAppearance,
	// } = attributes;
	// data render attributes
	// const {
	// 	sortOrder,
	// 	// categories,
	// 	// availableCategories,
	// 	dateInputFormat,
	// 	sortKey,
	// 	dataRenderX,
	// 	dataRenderY,
	// 	groupBreaksActive,
	// 	groupBreaksCategory,
	// 	groupBreaksCategoryValues,
	// 	groupBreaksStyleVariation,
	// 	groupBreaksHeight,
	// 	mapScale,
	// 	mapScaleDomain,
	// } = attributes;
	// annotations
	// const { annotationsActive, annotations } = attributes;
	// map attributes
	// const {
	// 	mapShowCountyBoundaries,
	// 	mapShowStateBoundaries,
	// 	mapPathBackgroundFill,
	// 	mapPathStroke,
	// 	mapBlockRectSize,
	// 	// mapAbbreviateLabels,
	// 	mapIgnoreSmallStateLabels,
	// 	// mapIgnoredLabels,
	// 	mapProjectionPreset,
	// 	mapTopologyRegion,
	// 	mapCenterLongitude,
	// 	mapCenterLatitude,
	// 	mapRotateLambda,
	// 	mapRotatePhi,
	// 	mapRotateGamma,
	// 	mapCustomScale,
	// 	mapZoomActive,
	// } = attributes;

	// const { isCustomChart, customAttributes } = attributes;
	// Use stringToArray for time scales to preserve date strings, stringToArrayOfNums for numeric scales
	const independentAxisTickValues =
		independentAxis.scale === 'time'
			? stringToArray(independentAxis.tickValues)
			: stringToArrayOfNums(independentAxis.tickValues);
	const dependentAxisTickValues =
		dScale === 'time'
			? stringToArray(dependentAxis.tickValues)
			: stringToArrayOfNums(dependentAxis.tickValues);

	return {
		...baseConfig,
		layout: {
			...baseConfig.layout,
			...layout,
			name: `chart-builder-chart-${clientId}`,
			type: 'area' === chartType ? 'line' : chartType,
		},
		metadata: {
			...baseConfig.metadata,
			...metadata,
			alt:
				alt && alt.length > 0
					? alt
					: generateDefaultAltText(chartType, title),
		},
		colors:
			customColors && customColors.length > 0
				? customColors
				: colorPalette[colorValue],
		plotBands: {
			...baseConfig.plotBands,
			...plotBands,
		},
		independentAxis: {
			...baseConfig.independentAxis,
			...independentAxis,
			domain: getDomain(iDomain[0], iDomain[1], chartType, iScale, 'x'),
			tickValues:
				0 >= independentAxisTickValues.length
					? null
					: getTicks(independentAxisTickValues),
			tickLabels: {
				...baseConfig.independentAxis.tickLabels,
				...independentAxis.tickLabels,
			},
			axisLabel: {
				...baseConfig.independentAxis.axisLabel,
				...independentAxis.axisLabel,
			},
			axis: {
				...baseConfig.independentAxis.axis,
				...independentAxis.axis,
			},
			ticks: {
				...baseConfig.independentAxis.ticks,
				...independentAxis.ticks,
				size: independentAxis.tickMarksActive ? 5 : 0,
			},
			grid: {
				...baseConfig.independentAxis.grid,
				...independentAxis.grid,
			},
		},
		dependentAxis: {
			...baseConfig.dependentAxis,
			...dependentAxis,
			domain: getDomain(dDomain[0], dDomain[1], chartType, dScale, 'y'),
			tickValues:
				0 >= dependentAxisTickValues.length
					? null
					: getTicks(dependentAxisTickValues),
			tickLabels: {
				...baseConfig.dependentAxis.tickLabels,
				...dependentAxis.tickLabels,
			},
			axisLabel: {
				...baseConfig.dependentAxis.axisLabel,
				...dependentAxis.axisLabel,
			},
			axis: {
				...baseConfig.dependentAxis.axis,
				...dependentAxis.axis,
			},
			ticks: {
				...baseConfig.dependentAxis.ticks,
				...dependentAxis.ticks,
				size: dependentAxis.tickMarksActive ? 5 : 0,
			},
			grid: {
				...baseConfig.dependentAxis.grid,
				...dependentAxis.grid,
			},
		},
		dataRender: {
			...baseConfig.dataRender,
			...dataRender,
			categories:
				0 < dataRender?.categories?.length
					? dataRender.categories
					: availableCategories,
			xScale: iScale,
			yScale: dScale,
		},
		animate: {
			...baseConfig.animate,
		},
		events: {
			...baseConfig.events,
			click: editorClickEvent,
		},
		tooltip: {
			...baseConfig.tooltip,
			...tooltip,
			customFormat: null, // function(d) { return d; },
			rlsFormat: false,
			style: {
				...baseConfig.tooltip.style,
				...tooltip.style,
			},
		},
		legend: {
			...baseConfig.legend,
			...legend,
			categories: (() => {
				// If legendCategories is set, use it (custom user-defined order)
				if (legend.categories && legend.categories.length > 0) {
					return legend.categories;
				}
				// Otherwise determine categories based on chart type and data source
				if (chartType === 'diverging-bar') {
					// For diverging bar charts, combine negative, positive, and neutral categories
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
					return divergingCategories;
				}
				if (dataRender.mapScale === 'ordinal') {
					// For maps with ordinal scale, use the mapScaleDomain
					return dataRender.mapScaleDomain;
				}
				// For all other charts, use the categories array from dataRender
				return dataRender.categories || [];
			})(),
		},
		bar: {
			...baseConfig.bar,
			...bar,
			hasRectStroke: elementHasStroke,
		},
		line: {
			...baseConfig.line,
			...line,
			showArea: 'area' === chartType || line.showArea,
		},
		dotPlot: {
			...baseConfig.dotPlot,
			...dotPlot,
		},
		pie: {
			...baseConfig.pie,
			...pie,
			hasPathStroke: elementHasStroke,
			pathStrokeColor: 'white',
			pathStrokeWidth: 1,
		},
		explodedBar: {
			...baseConfig.explodedBar,
			...explodedBar,
		},
		map: {
			...baseConfig.map,
			...map,
		},
		nodes: {
			...baseConfig.nodes,
			...nodes,
			pointCustomSize: null, // function(d) { return d; },
		},
		labels: {
			...baseConfig.labels,
			...labels,
		},
		voronoi: {
			...baseConfig.voronoi,
		},
		regression: {
			...baseConfig.regression,
		},
		divergingBar: {
			...baseConfig.divergingBar,
			...divergingBar,
			neutralBar: {
				...baseConfig.divergingBar.neutralBar,
				...divergingBar.neutralBar,
			},
		},
		diffColumn: {
			...baseConfig.diffColumn,
			...diffColumn,
			style: {
				...baseConfig.diffColumn.style,
				...diffColumn.style,
			},
		},
		custom: {
			isCustomChart,
			attributes: {
				...customAttributes,
			},
		},
		annotations: {
			...baseConfig.annotations,
			...annotations,
		},
		drawings: drawings || [],
	};
};

export default getConfig;
