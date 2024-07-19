/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
// eslint-disable-next-line import/no-unresolved
import { baseConfig } from '@prc/chart-builder';
import { colors } from './colors';
import { getDomain, getTicks, stringToArrayOfNums } from './helpers';

const getConfig = (
	attributes,
	clientId,
	parentClass = 'wp-chart-builder-wrapper'
) => {
	// layout attributes
	const {
		chartType,
		chartOrientation,
		paddingTop,
		paddingRight,
		paddingBottom,
		paddingLeft,
		height,
		width,
		horizontalRules,
	} = attributes;
	// metadata attributes
	const {
		metaTextActive,
		metaTitle,
		metaSubtitle,
		metaNote,
		metaSource,
		metaTag,
	} = attributes;
	// independent axis attributes
	const {
		showXMinDomainLabel,
		xAbbreviateTicks,
		xAbbreviateTicksDecimals,
		xTicksToLocaleString,
		xAxisActive,
		xAxisStroke,
		xGridStroke,
		xGridStrokeDasharray,
		xGridOpacity,
		xLabel,
		xLabelFontSize,
		xLabelTextFill,
		xLabelPadding,
		xLabelMaxWidth,
		xMaxDomain,
		xMinDomain,
		xScale,
		xDateFormat,
		xTickExact,
		xTickLabelAngle,
		xTickLabelMaxWidth,
		xTickLabelDX,
		xTickLabelDY,
		xTickLabelTextAnchor,
		xTickLabelVerticalAnchor,
		xTickMarksActive,
		xTickNum,
		xTickUnit,
		xTickUnitPosition,
	} = attributes;
	// dependent axis attributes
	const {
		yAxisStroke,
		yGridStroke,
		yGridStrokeDasharray,
		yGridOpacity,
		yAxisActive,
		yScale,
		yScaleFormat,
		yLabel,
		yLabelFontSize,
		yLabelTextFill,
		yLabelPadding,
		yLabelMaxWidth,
		yMinDomain,
		yMaxDomain,
		showYMinDomainLabel,
		yTickMarksActive,
		yTickNum,
		yTickExact,
		yTickUnit,
		yTickUnitPosition,
		yTickLabelAngle,
		yTickLabelMaxWidth,
		yTickLabelVerticalAnchor,
		yTickLabelTextAnchor,
		yTickLabelDY,
		yTickLabelDX,
		yAbbreviateTicks,
		yAbbreviateTicksDecimals,
		yTicksToLocaleString,
	} = attributes;
	// label attributes
	const {
		labelsActive,
		showFirstLastPointsOnly,
		labelPositionDX,
		labelPositionDY,
		labelAbsoluteValue,
		labelFormatValue,
		labelUnit,
		labelUnitPosition,
		barLabelPosition,
		barLabelCutoff,
		barLabelCutoffMobile,
		labelColor,
		labelFontSize,
		labelFontWeight,
		labelTruncateDecimal,
		labelToFixedDecimal,
	} = attributes;
	// legend attributes
	const {
		legendActive,
		legendOrientation,
		legendCategories,
		legendTitle,
		legendOffsetX,
		legendOffsetY,
		legendAlignment,
		legendMarkerStyle,
		legendBorderStroke,
		legendFill,
	} = attributes;
	// tooltip attributes
	const {
		tooltipActive,
		tooltipHeaderActive,
		tooltipHeaderValue,
		tooltipMaxHeight,
		tooltipMaxWidth,
		tooltipMinWidth,
		tooltipMinHeight,
		tooltipOffsetX,
		tooltipOffsetY,
		tooltipFormat,
		tooltipDateFormat,
		tooltipFormatValue,
		tooltipAbsoluteValue,
		deemphasizeSiblings,
		deemphasizeOpacity,
	} = attributes;
	// pie chart attributes
	const { pieCategoryLabelsActive } = attributes;
	// bar chart attributes
	const { barPadding, barGroupPadding } = attributes;
	// diverging bar attributes
	const {
		positiveCategories,
		negativeCategories,
		neutralCategory,
		divergingBarPercentOfInnerWidth,
		neutralBarSeparator,
		neutralBarActive,
		neutralBarOffsetX,
		neutralBarSeparatorOffsetX,
	} = attributes;
	// dot plot attributes
	const {
		dotPlotConnectPoints,
		dotPlotConnectPointsStroke,
		dotPlotConnectPointsStrokeWidth,
		dotPlotConnectPointsStrokeDasharray,
	} = attributes;
	// line attributes
	const {
		lineStrokeDashArray,
		lineInterpolation,
		lineStrokeWidth,
		lineNodes,
		nodeSize,
		nodeStroke,
		nodeFill,
		areaFillOpacity,
	} = attributes;
	// explded bar attributes
	const { explodedBarColumnGap } = attributes;
	// plot band attributes
	const { plotBandsActive, plotBands } = attributes;
	// diff column attributes
	const {
		diffColumnActive,
		diffColumnCategory,
		diffColumnHeader,
		diffColumnMarginLeft,
		diffColumnBackgroundColor,
		diffColumnHeightOffset,
		diffColumnWidth,
		diffColumnAppearance,
	} = attributes;
	// color attributes
	const { colorValue, customColors, elementHasStroke } = attributes;
	// data render attributes
	const {
		sortOrder,
		categories,
		availableCategories,
		dateInputFormat,
		sortKey,
	} = attributes;
	const xTicks = stringToArrayOfNums(xTickExact);
	const yTicks = stringToArrayOfNums(yTickExact);
	return {
		...baseConfig,
		layout: {
			...baseConfig.layout,
			name: `chart-builder-chart-${clientId}`,
			parentClass,
			type: 'area' === chartType ? 'line' : chartType,
			orientation: chartOrientation,
			width,
			height,
			padding: {
				top: paddingTop,
				bottom: paddingBottom,
				left: paddingLeft,
				right: paddingRight,
			},
			horizontalRules,
		},
		metadata: {
			...baseConfig.metadata,
			active: metaTextActive,
			title: metaTitle,
			subtitle: metaSubtitle,
			note: metaNote,
			source: metaSource,
			tag: metaTag,
		},
		colors: 0 < customColors.length ? customColors : colors[colorValue],
		plotBands: {
			...baseConfig.plotBands,
			active: plotBandsActive,
			bands: plotBands,
		},
		independentAxis: {
			...baseConfig.independentAxis,
			active: xAxisActive,
			label: xLabel,
			scale: xScale,
			dateFormat: xDateFormat,
			domain: getDomain(xMinDomain, xMaxDomain, chartType, xScale, 'x'),
			showZero: showXMinDomainLabel,
			tickCount: xTickNum,
			tickValues: 1 >= xTicks.length ? null : getTicks(xTicks, xScale),
			tickUnit: xTickUnit,
			tickUnitPosition: xTickUnitPosition,
			tickFormat: null,
			abbreviateTicks: xAbbreviateTicks,
			abbreviateTicksDecimals: xAbbreviateTicksDecimals,
			ticksToLocaleString: xTicksToLocaleString,
			tickLabels: {
				...baseConfig.independentAxis.tickLabels,
				angle: xTickLabelAngle,
				verticalAnchor: xTickLabelVerticalAnchor,
				textAnchor: xTickLabelTextAnchor,
				dy: xTickLabelDY,
				dx: xTickLabelDX,
				fontSize: xLabelFontSize,
				padding: 0,
				fill: xLabelTextFill,
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				maxWidth: xTickLabelMaxWidth,
			},
			axisLabel: {
				...baseConfig.independentAxis.axisLabel,
				fontSize: xLabelFontSize,
				fill: xLabelTextFill,
				padding: xLabelPadding,
				angle: 0,
				dx: 0,
				dy: 0,
				textAnchor: 'middle',
				verticalAnchor: 'middle',
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				maxWidth: xLabelMaxWidth,
			},
			axis: {
				...baseConfig.independentAxis.axis,
				stroke: xAxisStroke,
				strokeWidth: 1,
			},
			ticks: {
				...baseConfig.independentAxis.ticks,
				stroke: xAxisStroke,
				size: xTickMarksActive ? 5 : 0,
				strokeWidth: 1,
			},
			grid: {
				...baseConfig.independentAxis.grid,
				stroke: xGridStroke,
				strokeOpacity: xGridOpacity,
				strokeWidth: 1,
				strokeDasharray: xGridStrokeDasharray,
			},
		},
		dependentAxis: {
			...baseConfig.dependentAxis,
			active: yAxisActive,
			label: yLabel,
			scale: yScale,
			domain: getDomain(yMinDomain, yMaxDomain, chartType, yScale, 'y'),
			showZero: showYMinDomainLabel,
			tickCount: yTickNum,
			tickValues: 1 >= yTicks.length ? null : getTicks(yTicks, yScale),
			tickUnit: yTickUnit,
			tickUnitPosition: yTickUnitPosition,
			tickAngle: yTickLabelAngle,
			tickFormat: null,
			abbreviateTicks: yAbbreviateTicks,
			abbreviateTicksDecimals: yAbbreviateTicksDecimals,
			ticksToLocaleString: yTicksToLocaleString,
			customTickFormat: null, // function(d) { return d; },
			tickLabels: {
				...baseConfig.dependentAxis.tickLabels,
				angle: yTickLabelAngle,
				verticalAnchor: yTickLabelVerticalAnchor,
				textAnchor: yTickLabelTextAnchor,
				dy: yTickLabelDY,
				dx: yTickLabelDX,
				fontSize: yLabelFontSize,
				fill: yLabelTextFill,
				padding: 15,
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				maxWidth: yTickLabelMaxWidth,
			},
			axisLabel: {
				...baseConfig.dependentAxis.axisLabel,
				fontSize: yLabelFontSize,
				fill: yLabelTextFill,
				padding: yLabelPadding,
				angle: 270,
				dx: 0,
				dy: 0,
				textAnchor: 'middle',
				verticalAnchor: 'middle',
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				maxWidth: yLabelMaxWidth,
			},
			ticks: {
				...baseConfig.dependentAxis.ticks,
				stroke: yAxisStroke,
				size: yTickMarksActive ? 5 : 0,
				strokeWidth: 1,
			},
			axis: {
				...baseConfig.dependentAxis.axis,
				stroke: yAxisStroke,
				strokeWidth: 1,
			},
			grid: {
				...baseConfig.dependentAxis.grid,
				stroke: yGridStroke,
				strokeOpacity: yGridOpacity,
				strokeWidth: 1,
				strokeDasharray: yGridStrokeDasharray,
			},
		},
		dataRender: {
			...baseConfig.dataRender,
			x: 'x',
			y: 'y',
			x2: null,
			y2: null,
			sortKey,
			sortOrder,
			categories:
				0 < categories.length ? categories : availableCategories,
			xScale,
			yScale,
			xFormat: dateInputFormat,
			yFormat: yScaleFormat,
			numberFormat: 'en-US',
			isHighlightedColor: '#ECDBAC',
		},
		animate: {
			active: false,
			animationWhitelist: [],
			duration: 2000, // time in ms
		},
		tooltip: {
			...baseConfig.tooltip,
			active: tooltipActive,
			deemphasizeSiblings,
			deemphasizeOpacity,
			headerActive: tooltipHeaderActive,
			headerValue: tooltipHeaderValue,
			format: tooltipFormat,
			offsetX: tooltipOffsetX,
			offsetY: tooltipOffsetY,
			abbreviateValue: false,
			absoluteValue: tooltipAbsoluteValue,
			toFixedDecimal: 0,
			toLocaleString: tooltipFormatValue,
			customFormat: null, // function(d) { return d; },
			rlsFormat: false,
			dateFormat: tooltipDateFormat,
			style: {
				...baseConfig.tooltip.style,
				maxWidth: tooltipMaxWidth,
				maxHeight: tooltipMaxHeight,
				minHeight: tooltipMinHeight,
				minWidth: tooltipMinWidth,
				width: 'auto',
				height: 'auto',
				fontSize: '13px',
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				background: 'white',
				border: '1px solid #CBCBCB',
				padding: '10px',
				borderRadius: '0px',
				color: 'black',
			},
		},
		legend: {
			...baseConfig.legend,
			active: legendActive,
			orientation: legendOrientation,
			categories: legendCategories || categories,
			title: legendTitle,
			offsetX: legendOffsetX,
			offsetY: legendOffsetY,
			alignment: legendAlignment,
			markerStyle: legendMarkerStyle,
			borderStroke: legendBorderStroke,
			fill: legendFill,
		},
		bar: {
			...baseConfig.bar,
			hasRectStroke: elementHasStroke,
			barPadding,
			barGroupPadding,
		},
		line: {
			...baseConfig.line,
			interpolation: lineInterpolation,
			strokeDasharray: lineStrokeDashArray,
			strokeWidth: lineStrokeWidth,
			showPoints: lineNodes,
			showArea: 'area' === chartType,
			areaFillOpacity,
		},
		dotPlot: {
			...baseConfig.dotPlot,
			connectPoints: dotPlotConnectPoints,
			connectingLine: {
				...baseConfig.dotPlot.connectingLine,
				stroke: dotPlotConnectPointsStroke,
				strokeWidth: dotPlotConnectPointsStrokeWidth,
				strokeDasharray: dotPlotConnectPointsStrokeDasharray,
				strokeOpacity: 1,
			},
		},
		pie: {
			...baseConfig.pie,
			hasPathStroke: elementHasStroke,
			pathStrokeColor: 'white',
			pathStrokeWidth: 1,
			showCategoryLabels: pieCategoryLabelsActive,
		},
		explodedBar: {
			...baseConfig.explodedBar,
			columnGap: explodedBarColumnGap,
		},
		nodes: {
			...baseConfig.nodes,
			pointSize: nodeSize,
			pointFill: nodeFill,
			pointStrokeWidth: 1,
			pointStroke: nodeStroke,
			pointCustomSize: null, // function(d) { return d; },
		},
		labels: {
			...baseConfig.labels,
			active: labelsActive,
			showFirstLastPointsOnly,
			color: labelColor,
			// altColor: 'white',
			fontWeight: labelFontWeight,
			fontSize: labelFontSize,
			fontFamily: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
			labelPositionBar: barLabelPosition,
			labelCutoff: barLabelCutoff,
			labelCutoffMobile: barLabelCutoffMobile,
			labelPositionDX,
			labelPositionDY,
			pieLabelRadius: 60,
			abbreviateValue: false,
			toLocaleString: labelFormatValue,
			absoluteValue: labelAbsoluteValue,
			truncateDecimal: labelTruncateDecimal,
			toFixedDecimal: labelToFixedDecimal,
			labelUnit, // '%', '$', '€', '£', '¥'
			labelUnitPosition,
			textAnchor: 'middle',
			customLabelFormat: null, // function({datum}) { return datum; },
		},
		voronoi: {
			...baseConfig.voronoi,
			active: false,
			fill: '#756a7e',
			stroke: '#ccc',
			strokeWidth: 1,
			strokeOpacity: 0.5,
		},
		regression: {
			...baseConfig.regression,
			active: false,
			type: 'linear',
			stroke: '#2a2a2a',
			strokeWidth: 2,
			strokeDasharray: '1',
		},
		divergingBar: {
			...baseConfig.divergingBar,
			positiveCategories,
			negativeCategories,
			netPositiveCategory: 'y4',
			netNegativeCategory: 'y5',
			percentOfInnerWidth: divergingBarPercentOfInnerWidth / 100,
			neutralBar: {
				...baseConfig.divergingBar.neutralBar,
				category: neutralCategory,
				offsetX: neutralBarOffsetX,
				active:
					neutralBarActive &&
					!!neutralCategory &&
					0 < neutralCategory.length,
				separator: neutralBarSeparator,
				separatorOffsetX: neutralBarSeparatorOffsetX,
			},
		},
		diffColumn: {
			...baseConfig.diffColumn,
			active: diffColumnActive,
			category: diffColumnCategory,
			columnHeader: diffColumnHeader,
			style: {
				...baseConfig.diffColumn.style,
				rectStrokeWidth: 0,
				rectStrokeColor: 'white',
				rectFill: diffColumnBackgroundColor,
				fontWeight:
					diffColumnAppearance === 'bold' ||
					diffColumnAppearance === 'bold-italic'
						? 'bold'
						: 'normal',
				fontStyle:
					diffColumnAppearance === 'italic' ||
					diffColumnAppearance === 'bold-italic'
						? 'italic'
						: 'normal',
				headerFontSize: '12px',
				marginLeft: diffColumnMarginLeft,
				width: diffColumnWidth,
				heightOffset: diffColumnHeightOffset,
			},
		},
	};
};

export default getConfig;
