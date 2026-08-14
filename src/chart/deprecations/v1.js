/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
/**
 * Chart Block v1 Deprecation
 *
 * Handles migration from flat attribute structure (v1) to nested structure (v2).
 * This deprecation definition includes the old flat attributes schema and
 * a migrate function that transforms them to the new nested structure.
 *
 * WordPress checks this deprecation when loading a block. If the save function
 * matches the serialized block content, the migrate function is called to
 * transform the attributes to the current structure.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/
 */

import save from '../save';
import v1Attributes from './v1-attributes';

/**
 * Check if this block should use the v1 deprecation
 *
 * @param {Object} attributes - Block attributes to check
 * @return {boolean} True if block should use v1 deprecation
 */
function isEligible(attributes) {
	if (attributes._version === 'v2') {
		return false;
	}

	// Helper to check if value is a non-empty object
	const isNonEmptyObject = (obj) => {
		return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
	};

	// If attributes have nested structure with actual content, they're already v2
	// Check for non-empty objects to prevent matching on empty placeholders
	if (
		isNonEmptyObject(attributes.layout) ||
		isNonEmptyObject(attributes.metadata) ||
		isNonEmptyObject(attributes.io)
	) {
		return false;
	}

	// Force re-migration if testing flag is set (for testing phase)
	if (attributes._migrationMeta?.forceRemigrate === true) {
		return true;
	}

	// If _version is not set or is explicitly 'v1', use this deprecation
	const shouldMigrate = !attributes._version || attributes._version === 'v1';
	return shouldMigrate;
}

/**
 * Migrate v1 flat attributes to v2 nested structure
 *
 * This function transforms the old flat attribute structure into the new
 * nested structure that mirrors the PRC Charting Library's baseConfig.
 *
 * @param {Object} attributes - v1 flat attributes
 * @return {Object} v2 nested attributes
 */
function migrate(attributes) {
	// Preserve original v1 attributes for testing/comparison
	// Only preserve if not already preserved (to avoid nested copies on re-migration)
	const v1Original = attributes._v1Original || { ...attributes };

	// Remove migration metadata from original snapshot to avoid recursion
	delete v1Original._v1Original;
	delete v1Original._migrationMeta;
	delete v1Original._legacy;

	const migrated = {
		_version: 'v2',

		// Preserve original v1 attributes for testing/comparison
		_v1Original: v1Original,

		// Track migration metadata
		_migrationMeta: {
			migratedAt: new Date().toISOString(),
			migrationVersion: '1.0.0',
			forceRemigrate: false, // Reset flag after migration
		},
		id: attributes.id || '',
		// Layout object
		layout: {
			name: 'wp-block-prc-block-chart-builder-controller',
			parentClass: attributes.parentClass,
			type: attributes.chartType || 'bar',
			orientation: attributes.chartOrientation || 'horizontal', // Match block.json default
			width: attributes.width || 640,
			height: attributes.height || 400,
			padding: {
				top: attributes.paddingTop ?? 0, // Match block.json default
				right: attributes.paddingRight ?? 0,
				bottom: attributes.paddingBottom ?? 0, // Match block.json default
				left: attributes.paddingLeft ?? 0, // Match block.json default
			},
			overflowX: attributes.overflowX || 'responsive',
			horizontalRules: attributes.horizontalRules ?? true,
			mobileBreakpoint: attributes.mobileBreakpoint || 480,
		},

		// Metadata object
		metadata: {
			active: attributes.metaTextActive ?? true, // Match block.json default - use ?? to properly handle false values
			title: attributes.metaTitle ?? 'Title',
			subtitle: attributes.metaSubtitle ?? 'Subtitle',
			note: attributes.metaNote ?? 'Note: This is a note.',
			source: attributes.metaSource ?? 'Source: this is a source.',
			tag: attributes.metaTag ?? 'PEW RESEARCH CENTER',
			alt: attributes.metaAlt ?? '',
		},

		// Colors array
		colors:
			attributes.customColors && attributes.customColors.length > 0
				? attributes.customColors
				: [
						'#436983',
						'#bf3927',
						'#756a7e',
						'#ea9e2c',
						'#bc7b2b',
						'#eeece4',
					],

		// Plot bands object
		plotBands: {
			active: attributes.plotBandsActive || false,
			allowDrag: false,
			allowResize: false,
			dimension: 'x',
			bands: attributes.plotBands || [],
		},

		// Independent axis (X-axis)
		independentAxis: {
			active: attributes.xAxisActive ?? true,
			label: attributes.xLabel || '',
			scale: attributes.xScale || 'linear',
			dateFormat: attributes.xDateFormat || '%-m/%Y',
			domain: [attributes.xMinDomain ?? 0, attributes.xMaxDomain ?? 100],
			domainPadding: 20,
			showZero: attributes.showXMinDomainLabel ?? false,
			padding: attributes.xLabelPadding || 60,
			tickMarksActive: attributes.xTickMarksActive ?? false, // Match block.json default
			tickAngle: attributes.xTickLabelAngle || 0,
			tickCount: attributes.xTickNum || 5,
			tickValues: attributes.xTickExact
				? parseTickValues(attributes.xTickExact)
				: null,
			tickFormat: null,
			ticksToLocaleString: attributes.xTicksToLocaleString || false,
			abbreviateTicks: attributes.xAbbreviateTicks || false,
			abbreviateTicksDecimals: attributes.xAbbreviateTicksDecimals || 0,
			tickUnit: attributes.xTickUnit || '',
			tickUnitPosition: attributes.xTickUnitPosition || 'end',
			tickLabels: {
				fontSize: attributes.xLabelFontSize || 12,
				padding: 0,
				angle: attributes.xTickLabelAngle || 0,
				dx: attributes.xTickLabelDX || 0,
				dy: attributes.xTickLabelDY || 0,
				textAnchor: attributes.xTickLabelTextAnchor || 'middle',
				verticalAnchor: attributes.xTickLabelVerticalAnchor || 'start',
				fill: attributes.xLabelTextFill || 'rgba(35, 31, 32, 0.7)',
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				maxWidth: attributes.xTickLabelMaxWidth || 50,
			},
			axisLabel: {
				fontSize: attributes.xLabelFontSize || 12,
				fill: attributes.xLabelTextFill || 'rgba(35, 31, 32, 0.7)',
				padding: attributes.xLabelPadding || 15,
				angle: 0,
				dx: 0,
				dy: 0,
				textAnchor: 'middle',
				verticalAnchor: 'middle',
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				maxWidth: attributes.xLabelMaxWidth || 200,
			},
			axis: {
				stroke: attributes.xAxisStroke || 'gray',
				strokeWidth: 1,
			},
			ticks: {
				stroke: attributes.xAxisStroke || 'gray',
				size: (attributes.xTickMarksActive ?? true) ? 5 : 0, // Default to true if not set (match block.json default)
				strokeWidth: 0, // Match block.json default
			},
			grid: {
				// Use ?? to preserve empty strings (old default was "")
				stroke: attributes.xGridStroke ?? '',
				strokeOpacity: attributes.xGridOpacity ?? 1,
				strokeWidth: 2, // Match block.json default
				strokeDasharray: attributes.xGridStrokeDasharray ?? '',
			},
		},

		// Dependent axis (Y-axis)
		dependentAxis: {
			active: attributes.yAxisActive ?? true,
			label: attributes.yLabel || '',
			scale: attributes.yScale || 'linear',
			domain: [attributes.yMinDomain ?? 0, attributes.yMaxDomain ?? 100],
			showZero: attributes.showYMinDomainLabel ?? false,
			tickMarksActive: attributes.yTickMarksActive ?? true,
			tickCount: attributes.yTickNum || 5,
			tickValues: attributes.yTickExact
				? parseTickValues(attributes.yTickExact)
				: null,
			tickFormat: null,
			tickAngle: attributes.yTickLabelAngle || 0,
			ticksToLocaleString: attributes.yTicksToLocaleString || false,
			abbreviateTicks: attributes.yAbbreviateTicks ?? true,
			abbreviateTicksDecimals: attributes.yAbbreviateTicksDecimals || 0,
			tickUnit: attributes.yTickUnit || '',
			tickUnitPosition: attributes.yTickUnitPosition || 'end',
			tickLabels: {
				fontSize: attributes.yLabelFontSize || 12,
				padding: 15,
				angle: attributes.yTickLabelAngle || 0,
				dx: attributes.yTickLabelDX || 0,
				dy: attributes.yTickLabelDY || 0,
				textAnchor: attributes.yTickLabelTextAnchor || 'end',
				verticalAnchor: attributes.yTickLabelVerticalAnchor || 'middle',
				fill: attributes.yLabelTextFill || 'rgba(35, 31, 32, 0.7)',
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				maxWidth: attributes.yTickLabelMaxWidth || 50,
			},
			axisLabel: {
				fontSize: attributes.yLabelFontSize || 12,
				fill: attributes.yLabelTextFill || 'rgba(35, 31, 32, 0.7)',
				padding: attributes.yLabelPadding || 30,
				angle: 270,
				dx: 0,
				dy: 0,
				textAnchor: 'middle',
				verticalAnchor: 'middle',
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				maxWidth: attributes.yLabelMaxWidth || 200,
			},
			axis: {
				stroke: attributes.yAxisStroke || 'gray',
				strokeWidth: 1,
			},
			ticks: {
				stroke: attributes.yAxisStroke || 'gray',
				size: (attributes.yTickMarksActive ?? true) ? 5 : 0, // Default to true if not set (match block.json default)
				strokeWidth: 0, // Match block.json default
			},
			grid: {
				// Use ?? to preserve empty strings (old default was "")
				stroke: attributes.yGridStroke ?? '',
				strokeOpacity: attributes.yGridOpacity ?? 1,
				strokeWidth: 1,
				strokeDasharray: attributes.yGridStrokeDasharray ?? '',
			},
		},

		// Tooltip object
		tooltip: {
			active: attributes.tooltipActive ?? true,
			headerActive: attributes.tooltipHeaderActive ?? true,
			headerValue: attributes.tooltipHeaderValue || 'independentValue',
			format: attributes.tooltipFormat || '{{row}}: {{value}}',
			offsetX: attributes.tooltipOffsetX || 10,
			offsetY: attributes.tooltipOffsetY || 10,
			abbreviateValue: false,
			absoluteValue: attributes.tooltipAbsoluteValue || false,
			toFixedDecimal: 0,
			toLocaleString: attributes.tooltipFormatValue ?? true,
			customFormat: null,
			rlsFormat: false,
			dateFormat: attributes.tooltipDateFormat || '%-m/%Y',
			caretPosition: attributes.tooltipCaretPosition, // No default - let charting library decide
			deemphasizeSiblings: attributes.deemphasizeSiblings || false,
			deemphasizeOpacity: attributes.deemphasizeOpacity ?? 0.5,
			emphasizeStrokeActive: attributes.emphasizeStrokeActive || false,
			emphasizeStrokeColor: attributes.emphasizeStrokeColor || 'black',
			emphasizeStrokeWidth: attributes.emphasizeStrokeWidth || 1,
			style: {
				minWidth: attributes.tooltipMinWidth || 50,
				maxWidth: attributes.tooltipMaxWidth || 200,
				maxHeight: attributes.tooltipMaxHeight || 100,
				minHeight: attributes.tooltipMinHeight || 20,
				width: 'auto',
				height: 'auto',
				fontSize: attributes.tooltipFontSize
					? `${attributes.tooltipFontSize}px`
					: '13px',
				fontFamily:
					"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				background: 'white',
				border: '1px solid #CBCBCB',
				padding: '10px',
				borderRadius: '0px',
				color: 'black',
			},
		},

		// Legend object
		legend: {
			active: attributes.legendActive || false,
			orientation: attributes.legendOrientation || 'row',
			title: attributes.legendTitle || '',
			alignment: attributes.legendAlignment || 'center',
			offsetX: attributes.legendOffsetX || 0,
			offsetY: attributes.legendOffsetY || 0,
			markerStyle: attributes.legendMarkerStyle || 'rect',
			borderStroke: attributes.legendBorderStroke, // No default - let charting library decide
			fill: attributes.legendFill, // No default - let charting library decide
			categories: attributes.legendCategories || [],
			labelDelimiter: attributes.legendLabelDelimiter || 'to',
			labelLower: attributes.legendLabelLower || 'Less than ',
			labelUpper: attributes.legendLabelUpper || 'More than ',
			fontSize: attributes.legendFontSize || 12,
			margin: attributes.legendMargin || {
				top: 0,
				right: 5,
				bottom: 0,
				left: 0,
			},
		},

		// Labels object
		labels: {
			active: attributes.labelsActive || false,
			showFirstLastPointsOnly:
				attributes.showFirstLastPointsOnly || false,
			color: attributes.labelColor, // No default - let charting library decide
			fontWeight: attributes.labelFontWeight || 200,
			fontSize: attributes.labelFontSize || 12,
			fontFamily: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
			labelPositionBar: attributes.barLabelPosition || 'inside',
			labelCutoff: attributes.barLabelCutoff ?? 5,
			labelPositionDX: attributes.labelPositionDX ?? -25,
			labelPositionDY: attributes.labelPositionDY || 0,
			pieLabelRadius: 60,
			abbreviateValue: false,
			absoluteValue: attributes.labelAbsoluteValue || false,
			toLocaleString: attributes.labelFormatValue ?? true,
			truncateDecimal: attributes.labelTruncateDecimal ?? true,
			toFixedDecimal: attributes.labelToFixedDecimal || 0,
			labelUnit: attributes.labelUnit || '',
			labelUnitPosition: attributes.labelUnitPosition || 'end',
			textAnchor: 'middle',
			customLabelFormat: null,
		},

		// Bar object
		bar: {
			barPadding: attributes.barPadding ?? 0.2,
			barGroupPadding: attributes.barGroupPadding ?? 0.2,
			hasRectStroke: attributes.elementHasStroke || false,
			stackOffset: 'none',
		},

		// Line object
		line: {
			interpolation: attributes.lineInterpolation || 'curveLinear',
			strokeWidth: attributes.lineStrokeWidth || 3,
			strokeDasharray: attributes.lineStrokeDashArray || '',
			showPoints: attributes.lineNodes ?? true,
			showFirstLastPointsOnly: false,
			showArea: attributes.chartType === 'area',
			areaFillOpacity: attributes.areaFillOpacity ?? 0.4,
		},

		// Dot plot object
		dotPlot: {
			connectPoints: attributes.dotPlotConnectPoints ?? true,
			connectingLine: {
				stroke: attributes.dotPlotConnectPointsStroke || '#E6E7E8',
				strokeWidth: attributes.dotPlotConnectPointsStrokeWidth || 6,
				strokeDasharray:
					attributes.dotPlotConnectPointsStrokeDasharray || '',
				strokeOpacity: 1,
			},
		},

		// Exploded bar object
		explodedBar: {
			columnGap: attributes.explodedBarColumnGap || 16,
		},

		// Pie object
		pie: {
			hasPathStroke: attributes.elementHasStroke || false,
			pathStrokeColor: 'white',
			pathStrokeWidth: 1,
			showCategoryLabels: attributes.pieCategoryLabelsActive ?? true,
			innerRadius: 0,
			padAngle: 0,
			cornerRadius: 0,
			sortByValue: false,
		},

		// Nodes object
		nodes: {
			pointSize: attributes.nodeSize || 3,
			pointFill: attributes.nodeFill || 'inherit',
			pointStrokeWidth: attributes.nodeStrokeWidth || 3,
			pointShape: 'circle',
		},

		// Map object
		map: {
			ignoreSmallStateLabels:
				attributes.mapIgnoreSmallStateLabels ?? true,
			ignoredLabels: attributes.mapIgnoredLabels || [],
			abbreviateLabels: attributes.mapAbbreviateLabels ?? true,
			pathBackgroundFill: attributes.mapPathBackgroundFill || '#f7f7f7',
			pathStroke: attributes.mapPathStroke || '#d3d3d3',
			pathStrokeWidth: 0.5,
			blockRectSize: attributes.mapBlockRectSize || 44,
			showCountyBoundaries: attributes.showCountyBoundaries ?? true,
			showStateBoundaries: attributes.mapShowStateBoundaries ?? true,
			projectionPreset: attributes.mapProjectionPreset || 'default',
			topologyRegion: attributes.mapTopologyRegion || 'default',
			centerLongitude: attributes.mapCenterLongitude || 0,
			centerLatitude: attributes.mapCenterLatitude || 0,
			rotateLambda: attributes.mapRotateLambda || 0,
			rotatePhi: attributes.mapRotatePhi || 0,
			rotateGamma: attributes.mapRotateGamma || 0,
			customScale: attributes.mapCustomScale || 1,
			zoomActive: attributes.mapZoomActive || false,
		},

		// Diverging bar object
		divergingBar: {
			positiveCategories: attributes.positiveCategories || [],
			negativeCategories: attributes.negativeCategories || [],
			percentOfInnerWidth: attributes.divergingBarPercentOfInnerWidth
				? attributes.divergingBarPercentOfInnerWidth / 100
				: 0.7,
			neutralBar: {
				active: attributes.neutralBarActive ?? true,
				category: attributes.neutralCategory || '',
				offsetX: attributes.neutralBarOffsetX || 0,
				separator: attributes.neutralBarSeparator ?? true,
				separatorOffsetX: attributes.neutralBarSeparatorOffsetX ?? -1,
			},
		},

		// Diff column object
		diffColumn: {
			active: attributes.diffColumnActive || false,
			category: attributes.diffColumnCategory || '',
			columnHeader: attributes.diffColumnHeader || '',
			style: {
				marginLeft: attributes.diffColumnMarginLeft || 10,
				width: attributes.diffColumnWidth || 30,
				heightOffset: attributes.diffColumnHeightOffset || 0,
				rectStrokeWidth: 0,
				rectStrokeColor: 'white',
				rectFill: attributes.diffColumnBackgroundColor || '',
				fontWeight:
					attributes.diffColumnAppearance === 'bold' ||
					attributes.diffColumnAppearance === 'bold-italic'
						? 'bold'
						: 'normal',
				fontStyle:
					attributes.diffColumnAppearance === 'italic' ||
					attributes.diffColumnAppearance === 'bold-italic'
						? 'italic'
						: 'normal',
				headerFontSize: '12px',
			},
		},

		// Annotations object
		annotations: {
			active: attributes.annotationsActive || false,
			items: attributes.annotations || [],
		},

		// Data render object
		dataRender: {
			x: attributes.dataRenderX || 'x',
			y: attributes.dataRenderY || 'y',
			sortKey: attributes.sortKey || 'x',
			sortOrder: attributes.sortOrder || 'none',
			categories: attributes.categories || [],
			scales: {
				x: attributes.xScale || 'linear',
				y: attributes.yScale || 'linear',
			},
			xFormat: attributes.dateInputFormat || null,
			yFormat: attributes.yFormat || null,
			numberFormat: attributes.numberFormat || 'en-US',
			isHighlightedColor: attributes.isHighlightedColor || '#ECDBAC',
			mapScale: attributes.mapScale || 'threshold',
			mapScaleDomain: attributes.mapScaleDomain || [10, 20, 30, 40, 50],
			groupBreaksActive: attributes.groupBreaksActive || false,
			groupBreaksCategory: attributes.groupBreaksCategory || '',
			groupBreaksCategoryValues:
				attributes.groupBreaksCategoryValues || [],
			groupBreaks: attributes.groupBreaks || false,
		},

		// Animate object
		animate: {
			active: false,
			animationWhitelist: [],
			duration: 2000,
		},

		// IO object (WordPress-specific)
		io: {
			isConvertedChart: attributes.isConvertedChart || false,
			isStaticChart: attributes.isStaticChart || false,
			isFreeformChart: attributes.isFreeformChart || false,
			staticImageId: attributes.staticImageId || '',
			staticImageUrl: attributes.staticImageUrl || '',
			staticImageInnerHTML: attributes.staticImageInnerHTML || '',
			chartConverted: attributes.chartConverted || {
				converted: false,
				requester: '',
				timestamp: '',
			},
			defaultShouldRender: attributes.defaultShouldRender ?? true,
			lock: attributes.lock || {
				move: true,
				remove: false,
			},
			colorValue: attributes.colorValue || 'general',
			customColors: attributes.customColors || [],
			chartFamily: attributes.chartFamily || 'chart',
			chartData: attributes.chartData || [],
			tableData: attributes.tableData || '',
			hasPreformattedData: attributes.hasPreformattedData || false,
			preformattedData: attributes.preformattedData || [],
			tabsActive: attributes.tabsActive || false,
			allowDataDownload: attributes.allowDataDownload ?? true,
			elementHasStroke: attributes.elementHasStroke || false,
			isCustomChart: attributes.isCustomChart || false,
			customAttributes: attributes.customAttributes || {},
			independentVariable: attributes.independentVariable || '',
			availableCategories: attributes.availableCategories || [],
			questionWordingActive: attributes.questionWordingActive || false,
			questionWording: attributes.questionWording || '',
		},

		// Legacy object for unmapped attributes
		_legacy: {},
	};

	// Check for any unmapped attributes and preserve them in _legacy
	const mappedKeys = new Set([
		'_version',
		'chartType',
		'chartOrientation',
		'width',
		'height',
		'paddingTop',
		'paddingRight',
		'paddingBottom',
		'paddingLeft',
		'overflowX',
		'horizontalRules',
		'mobileBreakpoint',
		'parentClass',
		'metaTextActive',
		'metaTitle',
		'metaSubtitle',
		'metaNote',
		'metaSource',
		'metaTag',
		'metaAlt',
		'customColors',
		'colorValue',
		'plotBandsActive',
		'plotBands',
		'xAxisActive',
		'xLabel',
		'xScale',
		'xDateFormat',
		'xMinDomain',
		'xMaxDomain',
		'showXMinDomainLabel',
		'xLabelPadding',
		'xTickLabelAngle',
		'xTickNum',
		'xTickExact',
		'xTicksToLocaleString',
		'xAbbreviateTicks',
		'xAbbreviateTicksDecimals',
		'xTickUnit',
		'xTickUnitPosition',
		'xLabelFontSize',
		'xLabelTextFill',
		'xTickLabelMaxWidth',
		'xTickLabelDX',
		'xTickLabelDY',
		'xTickLabelTextAnchor',
		'xTickLabelVerticalAnchor',
		'xTickMarksActive',
		'xAxisStroke',
		'xGridStroke',
		'xGridStrokeDasharray',
		'xGridOpacity',
		'xLabelMaxWidth',
		'xMultiLineTickLabels',
		'xMultiLineTickLabelsBreak',
		'yAxisActive',
		'yLabel',
		'yScale',
		'yMinDomain',
		'yMaxDomain',
		'showYMinDomainLabel',
		'yTickNum',
		'yTickExact',
		'yTicksToLocaleString',
		'yAbbreviateTicks',
		'yAbbreviateTicksDecimals',
		'yTickUnit',
		'yTickUnitPosition',
		'yLabelFontSize',
		'yLabelTextFill',
		'yTickLabelMaxWidth',
		'yTickLabelDX',
		'yTickLabelDY',
		'yTickLabelTextAnchor',
		'yTickLabelVerticalAnchor',
		'yTickMarksActive',
		'yAxisStroke',
		'yGridStroke',
		'yGridStrokeDasharray',
		'yGridOpacity',
		'yLabelPadding',
		'yLabelMaxWidth',
		'yTickLabelAngle',
		'yScaleFormat',
		'yMultiLineTickLabels',
		'yMultiLineTickLabelsBreak',
		'tooltipActive',
		'tooltipActiveOnMobile',
		'tooltipHeaderActive',
		'tooltipHeaderValue',
		'tooltipFormat',
		'tooltipOffsetX',
		'tooltipOffsetY',
		'tooltipFormatValue',
		'tooltipAbsoluteValue',
		'tooltipDateFormat',
		'tooltipCaretPosition',
		'deemphasizeSiblings',
		'deemphasizeOpacity',
		'emphasizeStrokeActive',
		'emphasizeStrokeColor',
		'emphasizeStrokeWidth',
		'tooltipMinWidth',
		'tooltipMaxWidth',
		'tooltipMaxHeight',
		'tooltipMinHeight',
		'tooltipFontSize',
		'legendActive',
		'legendOrientation',
		'legendTitle',
		'legendAlignment',
		'legendOffsetX',
		'legendOffsetY',
		'legendMarkerStyle',
		'legendBorderStroke',
		'legendFill',
		'legendCategories',
		'legendLabelDelimiter',
		'legendLabelLower',
		'legendLabelUpper',
		'legendFontSize',
		'legendMargin',
		'labelsActive',
		'showFirstLastPointsOnly',
		'labelColor',
		'labelFontWeight',
		'labelFontSize',
		'barLabelPosition',
		'barLabelCutoff',
		'barLabelCutoffMobile',
		'labelPositionDX',
		'labelPositionDY',
		'labelAbsoluteValue',
		'labelFormatValue',
		'labelTruncateDecimal',
		'labelToFixedDecimal',
		'labelUnit',
		'labelUnitPosition',
		'barPadding',
		'barGroupPadding',
		'elementHasStroke',
		'lineInterpolation',
		'lineStrokeWidth',
		'lineStrokeDashArray',
		'lineNodes',
		'nodeSize',
		'nodeFill',
		'nodeStrokeWidth',
		'areaFillOpacity',
		'dotPlotConnectPoints',
		'dotPlotConnectPointsStroke',
		'dotPlotConnectPointsStrokeWidth',
		'dotPlotConnectPointsStrokeDasharray',
		'explodedBarColumnGap',
		'pieCategoryLabelsActive',
		'mapScale',
		'mapScaleDomain',
		'mapIgnoreSmallStateLabels',
		'mapPathBackgroundFill',
		'mapPathStroke',
		'mapBlockRectSize',
		'showCountyBoundaries',
		'mapShowStateBoundaries',
		'mapProjectionPreset',
		'mapTopologyRegion',
		'mapCenterLongitude',
		'mapCenterLatitude',
		'mapRotateLambda',
		'mapRotatePhi',
		'mapRotateGamma',
		'mapCustomScale',
		'mapZoomActive',
		'mapAbbreviateLabels',
		'mapIgnoredLabels',
		'positiveCategories',
		'negativeCategories',
		'neutralCategory',
		'neutralBarActive',
		'neutralBarOffsetX',
		'neutralBarSeparator',
		'neutralBarSeparatorOffsetX',
		'divergingBarPercentOfInnerWidth',
		'diffColumnActive',
		'diffColumnCategory',
		'diffColumnHeader',
		'diffColumnWidth',
		'diffColumnBackgroundColor',
		'diffColumnMarginLeft',
		'diffColumnHeightOffset',
		'diffColumnAppearance',
		'annotationsActive',
		'annotations',
		'dataRenderX',
		'dataRenderY',
		'sortKey',
		'sortOrder',
		'categories',
		'groupBreaksActive',
		'groupBreaksCategory',
		'groupBreaksCategoryValues',
		'groupBreaksStyleVariation',
		'groupBreaksHeight',
		'groupBreaks',
		'dateInputFormat',
		'availableCategories',
		'independentVariable',
		'id',
		'isConvertedChart',
		'isStaticChart',
		'isFreeformChart',
		'staticImageId',
		'staticImageUrl',
		'staticImageInnerHTML',
		'chartConverted',
		'defaultShouldRender',
		'lock',
		'chartFamily',
		'chartData',
		'tableData',
		'hasPreformattedData',
		'preformattedData',
		'tabsActive',
		'allowDataDownload',
		'isCustomChart',
		'customAttributes',
		'test',
		'svgUrl',
		'svgId',
		'pngUrl',
		'pngId',
		'metaQuestionWordingActive',
		'metaQuestionWording',
		'questionWordingActive',
		'questionWording',
		'labelCutoff',
	]);

	Object.keys(attributes).forEach((key) => {
		if (!mappedKeys.has(key) && attributes[key] !== undefined) {
			migrated._legacy[key] = attributes[key];
		}
	});

	// // Log legacy attributes in development
	// if (
	// 	Object.keys(migrated._legacy).length > 0 &&
	// 	process.env.NODE_ENV === 'development'
	// ) {
	// 	console.warn(
	// 		'[Chart Block Migration] Unmapped v1 attributes preserved in _legacy:',
	// 		Object.keys(migrated._legacy)
	// 	);
	// }

	// console.log('✅ V1 Migration COMPLETE:', {
	// 	_version: migrated._version,
	// 	layoutType: migrated.layout?.type,
	// 	metadataTitle: migrated.metadata?.title,
	// 	ioChartDataLength: migrated.io?.chartData?.length,
	// 	width: migrated.layout?.width,
	// 	hasLegacy: Object.keys(migrated._legacy).length > 0,
	// });

	const mobile = {};

	if (
		attributes.barLabelCutoffMobile != null &&
		(attributes.barLabelCutoff ?? 5) !== attributes.barLabelCutoffMobile
	) {
		mobile.labels = { labelCutoff: attributes.barLabelCutoffMobile };
	}

	if (
		(attributes.tooltipActive ?? true) &&
		(attributes.tooltipActiveOnMobile ?? true) === false
	) {
		mobile.tooltip = { active: false };
	}

	if (Object.keys(mobile).length > 0) {
		migrated.mobile = mobile;
	}

	return migrated;
}

/**
 * Helper function to parse tick values string or array into array
 *
 * @param {string|Array} tickInput - Comma-separated tick values or array
 * @return {Array|null} Array of tick values or null
 */
function parseTickValues(tickInput) {
	// Handle null/undefined
	if (!tickInput) {
		return null;
	}

	// If already an array, return it (or validate/process it)
	if (Array.isArray(tickInput)) {
		return tickInput.length > 0 ? tickInput : null;
	}

	// If it's a string, parse it
	if (typeof tickInput === 'string') {
		const trimmed = tickInput.trim();
		if (trimmed === '') {
			return null;
		}

		// Try to parse as numbers first
		const values = trimmed.split(',').map((v) => {
			const itemTrimmed = v.trim();
			const num = Number(itemTrimmed);
			return isNaN(num) ? itemTrimmed : num;
		});

		return values.length > 0 ? values : null;
	}

	// Unknown type, return null
	return null;
}

/**
 * v1 Deprecation Export
 *
 * This object defines everything WordPress needs to handle the v1 deprecation:
 * - attributes: The old flat schema (required for WordPress to parse saved content)
 * - supports: Block supports (unchanged from v1)
 * - save: The save function from v1 (same as current)
 * - migrate: Function to transform v1 attributes to v2
 * - isEligible: Function to determine if block should use this deprecation
 */
export default {
	attributes: v1Attributes,
	supports: {
		anchor: true,
		html: false,
	},
	save,
	migrate,
	isEligible,
};
