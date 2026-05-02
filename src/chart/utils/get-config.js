/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { colors as colorPalette } from './colors';
import {
	generateDefaultAltText,
	getDomain,
	getTicks,
	stringToArray,
	stringToArrayOfNums,
} from './helpers';
import { resolveColor, resolveColorInString } from './resolve-color';

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
		shapes,
		pie,
		dotPlot,
		independentAxis,
		dependentAxis,
		map,
		divergingBar,
		drawings,
		customTickLabels,
		customLegendLabels,
		diffColumn,
		netValues,
		dataRender,
		legend,
		nodes,
		tooltip,
		treemap,
		sankey,
		regression,
		errorBars,
	} = mergedAttributes;
	const {
		customColors,
		colorValue,
		elementHasStroke,
		isCustomChart,
		isFreeformChart,
		customAttributes,
		availableCategories,
	} = io;
	const { type: chartType } = layout;
	const { alt, title } = metadata;

	// Freeform charts are block containers — they have no chart data, no color palette,
	// and no axis/tooltip/legend config. Return only what the editor wrapper needs.
	if (isFreeformChart) {
		return {
			...baseConfig,
			layout: {
				...baseConfig.layout,
				...layout,
				name: `chart-builder-chart-${clientId}`,
			},
			metadata: {
				...baseConfig.metadata,
				...metadata,
				alt:
					alt && alt.length > 0
						? alt
						: generateDefaultAltText(chartType, title),
			},
		};
	}

	const { scale: iScale, domain: iDomain } = independentAxis;
	const { scale: dScale, domain: dDomain } = dependentAxis;
	const { neutralBar } = divergingBar;

	// Use stringToArray for time scales to preserve date strings, stringToArrayOfNums for numeric scales
	const independentAxisTickValues =
		independentAxis.scale === 'time'
			? stringToArray(independentAxis.tickValues)
			: stringToArrayOfNums(independentAxis.tickValues);
	const dependentAxisTickValues =
		dScale === 'time'
			? stringToArray(dependentAxis.tickValues)
			: stringToArrayOfNums(dependentAxis.tickValues);

	const renderedConfig = {
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
		colors: (customColors && customColors.length > 0
			? customColors
			: colorPalette[colorValue]
		).map(resolveColor),
		plotBands: {
			...baseConfig.plotBands,
			...plotBands,
		},
		independentAxis: {
			...baseConfig.independentAxis,
			...independentAxis,
			customTickLabels: customTickLabels?.independent ?? {},
			domain: getDomain(iDomain[0], iDomain[1], chartType, iScale, 'x'),
			tickValues:
				0 >= independentAxisTickValues.length
					? null
					: getTicks(independentAxisTickValues),
			tickLabels: {
				...baseConfig.independentAxis.tickLabels,
				...independentAxis.tickLabels,
				fill: resolveColor(
					independentAxis.tickLabels?.fill ??
						baseConfig.independentAxis.tickLabels?.fill
				),
			},
			axisLabel: {
				...baseConfig.independentAxis.axisLabel,
				...independentAxis.axisLabel,
				fill: resolveColor(
					independentAxis.axisLabel?.fill ??
						baseConfig.independentAxis.axisLabel?.fill
				),
			},
			axis: {
				...baseConfig.independentAxis.axis,
				...independentAxis.axis,
				stroke: resolveColor(
					independentAxis.axis?.stroke ??
						baseConfig.independentAxis.axis?.stroke
				),
			},
			ticks: {
				...baseConfig.independentAxis.ticks,
				...independentAxis.ticks,
				size: independentAxis.tickMarksActive ? 5 : 0,
				stroke: resolveColor(
					independentAxis.ticks?.stroke ??
						baseConfig.independentAxis.ticks?.stroke
				),
			},
			grid: {
				...baseConfig.independentAxis.grid,
				...independentAxis.grid,
				stroke: resolveColor(
					independentAxis.grid?.stroke ??
						baseConfig.independentAxis.grid?.stroke
				),
			},
		},
		dependentAxis: {
			...baseConfig.dependentAxis,
			...dependentAxis,
			customTickLabels: customTickLabels?.dependent ?? {},
			domain: getDomain(dDomain[0], dDomain[1], chartType, dScale, 'y'),
			tickValues:
				0 >= dependentAxisTickValues.length
					? null
					: getTicks(dependentAxisTickValues),
			tickLabels: {
				...baseConfig.dependentAxis.tickLabels,
				...dependentAxis.tickLabels,
				fill: resolveColor(
					dependentAxis.tickLabels?.fill ??
						baseConfig.dependentAxis.tickLabels?.fill
				),
			},
			axisLabel: {
				...baseConfig.dependentAxis.axisLabel,
				...dependentAxis.axisLabel,
				fill: resolveColor(
					dependentAxis.axisLabel?.fill ??
						baseConfig.dependentAxis.axisLabel?.fill
				),
			},
			axis: {
				...baseConfig.dependentAxis.axis,
				...dependentAxis.axis,
				stroke: resolveColor(
					dependentAxis.axis?.stroke ??
						baseConfig.dependentAxis.axis?.stroke
				),
			},
			ticks: {
				...baseConfig.dependentAxis.ticks,
				...dependentAxis.ticks,
				size: dependentAxis.tickMarksActive ? 5 : 0,
				stroke: resolveColor(
					dependentAxis.ticks?.stroke ??
						baseConfig.dependentAxis.ticks?.stroke
				),
			},
			grid: {
				...baseConfig.dependentAxis.grid,
				...dependentAxis.grid,
				stroke: resolveColor(
					dependentAxis.grid?.stroke ??
						baseConfig.dependentAxis.grid?.stroke
				),
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
			isHighlightedColor: resolveColor(
				dataRender.isHighlightedColor ??
					baseConfig.dataRender?.isHighlightedColor
			),
			groupBreaks: {
				...baseConfig.dataRender?.groupBreaks,
				...dataRender.groupBreaks,
				breakStyles: {
					...baseConfig.dataRender?.groupBreaks?.breakStyles,
					...dataRender.groupBreaks?.breakStyles,
					stroke: resolveColor(
						dataRender.groupBreaks?.breakStyles?.stroke ??
							baseConfig.dataRender?.groupBreaks?.breakStyles
								?.stroke
					),
				},
				labelStyles: {
					...baseConfig.dataRender?.groupBreaks?.labelStyles,
					...dataRender.groupBreaks?.labelStyles,
					fill: resolveColor(
						dataRender.groupBreaks?.labelStyles?.fill ??
							baseConfig.dataRender?.groupBreaks?.labelStyles
								?.fill
					),
				},
			},
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
			emphasizeStrokeColor: resolveColor(
				tooltip.emphasizeStrokeColor ??
					baseConfig.tooltip?.emphasizeStrokeColor
			),
			style: {
				...baseConfig.tooltip.style,
				...tooltip.style,
				background: resolveColor(
					tooltip.style?.background ??
						baseConfig.tooltip.style?.background
				),
				color: resolveColor(
					tooltip.style?.color ?? baseConfig.tooltip.style?.color
				),
				border: resolveColorInString(
					tooltip.style?.border ?? baseConfig.tooltip.style?.border
				),
			},
		},
		legend: {
			...baseConfig.legend,
			...legend,
			borderStroke: resolveColor(
				legend.borderStroke ?? baseConfig.legend?.borderStroke
			),
			fill: resolveColor(legend.fill ?? baseConfig.legend?.fill),
			customLabels: customLegendLabels ?? {},
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
				if (chartType === 'treemap' || chartType === 'sankey') {
					// For treemaps and sankey, legend categories are derived from node/group names
					// in the data by the component itself — return empty so it's not overridden
					return [];
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
			connectingLine: {
				...baseConfig.dotPlot?.connectingLine,
				...dotPlot.connectingLine,
				stroke: resolveColor(
					dotPlot.connectingLine?.stroke ??
						baseConfig.dotPlot?.connectingLine?.stroke
				),
			},
		},
		errorBars: {
			...baseConfig.errorBars,
			...errorBars,
			defaultStyles: {
				...baseConfig.errorBars?.defaultStyles,
				...errorBars?.defaultStyles,
				stroke: resolveColor(
					errorBars?.defaultStyles?.stroke ??
						baseConfig.errorBars?.defaultStyles?.stroke
				),
			},
		},
		pie: {
			...baseConfig.pie,
			...pie,
			// Prefer pie-specific attribute (pie-controls.jsx "Show Slice Stroke"),
			// fall back to legacy io.elementHasStroke toggle from color-controls.jsx
			// for backward compatibility with blocks saved before the pie control existed.
			hasPathStroke: pie?.hasPathStroke ?? elementHasStroke ?? false,
			pathStrokeColor: resolveColor(pie?.pathStrokeColor ?? 'white'),
			pathStrokeWidth:
				pie?.pathStrokeWidth ?? baseConfig.pie?.pathStrokeWidth ?? 1,
			groupArcStyle: {
				...baseConfig.pie.groupArcStyle,
				...pie?.groupArcStyle,
				stroke: resolveColor(
					pie?.groupArcStyle?.stroke ??
						baseConfig.pie?.groupArcStyle?.stroke
				),
			},
		},
		explodedBar: {
			...baseConfig.explodedBar,
			...explodedBar,
		},
		map: {
			...baseConfig.map,
			...map,
			pathBackgroundFill: resolveColor(
				map.pathBackgroundFill ?? baseConfig.map?.pathBackgroundFill
			),
			pathStroke: resolveColor(
				map.pathStroke ?? baseConfig.map?.pathStroke
			),
		},
		nodes: {
			...baseConfig.nodes,
			...nodes,
			pointCustomSize: null, // function(d) { return d; },
		},
		labels: {
			...baseConfig.labels,
			...labels,
			// Pass color as-is: getBarLabelFill() in charting-utilities expects the
			// raw semantic token ('contrast' | 'black' | 'white' | 'inherit') to
			// branch its logic. Resolving it here to a light-dark() string breaks
			// the === comparisons inside getBarLabelFill.
			color: labels.color ?? baseConfig.labels?.color ?? 'inherit',
		},
		shapes: {
			customStyles: shapes?.customStyles || {},
			segmentStyles: shapes?.segmentStyles || {},
			segmentsActive: shapes?.segmentsActive ?? false,
		},
		voronoi: {
			...baseConfig.voronoi,
			fill: resolveColor(baseConfig.voronoi?.fill),
			stroke: resolveColor(baseConfig.voronoi?.stroke),
		},
		regression: {
			...baseConfig.regression,
			...regression,
			stroke: resolveColor(
				regression?.stroke ?? baseConfig.regression?.stroke
			),
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
				rectStrokeColor: resolveColor(
					diffColumn.style?.rectStrokeColor ??
						baseConfig.diffColumn?.style?.rectStrokeColor
				),
				rectFill: resolveColor(
					diffColumn.style?.rectFill ??
						baseConfig.diffColumn?.style?.rectFill
				),
			},
		},
		netValues: {
			...baseConfig.netValues,
			...netValues,
			positive: {
				...baseConfig.netValues.positive,
				...netValues?.positive,
				color:
					netValues?.positive?.color ??
					baseConfig.netValues?.positive?.color,
			},
			negative: {
				...baseConfig.netValues.negative,
				...netValues?.negative,
				color:
					netValues?.negative?.color ??
					baseConfig.netValues?.negative?.color,
			},
		},
		custom: {
			isCustomChart,
			attributes: {
				...customAttributes,
			},
		},
		treemap: {
			...baseConfig.treemap,
			...treemap,
		},
		sankey: {
			...baseConfig.sankey,
			...sankey,
		},
		annotations: {
			...baseConfig.annotations,
			...annotations,
		},
		drawings: {
			active: drawings && drawings.length > 0,
			items: drawings || [],
		},
	};
	return renderedConfig;
};

export default getConfig;
