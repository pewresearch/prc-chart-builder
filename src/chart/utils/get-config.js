/* eslint-disable @wordpress/no-unused-vars-before-return */
/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { getAvailableLegendCategories } from './get-available-legend-categories';
import {
	generateDefaultAltText,
	getDomain,
	getDomainBounds,
	getTicks,
	stringToArray,
	stringToArrayOfNums,
} from './helpers';
import { mergeLegendCategoryOrder } from './merge-legend-category-order';
import { migrateLegacyMobileAttributes } from './migrate-legacy-mobile-attributes';
import { resolveColor, resolveColorInString } from './resolve-color';
import { resolveFontFamily } from './resolve-font-family';
import {
	applyGlobalTokens,
	getResolvedPalettes,
	getStaticBaseConfig,
	resolveChartSeriesColors,
} from './resolve-defaults';

/**
 * Resolve fill colors in diff column per-cell customizations.
 *
 * @param {Object} customLabels
 * @return {Object} Custom labels with any per-cell fill colors resolved.
 */
function resolveDiffColumnCustomLabels(customLabels = {}) {
	const resolved = {};
	Object.entries(customLabels).forEach(([key, entry]) => {
		if (!entry || typeof entry !== 'object') {
			resolved[key] = entry;
			return;
		}
		resolved[key] = {
			...entry,
			...(entry.fill !== undefined && entry.fill !== ''
				? { fill: resolveColor(entry.fill) }
				: {}),
		};
	});
	return resolved;
}

/**
 * Resolve a node marker color for chart config.
 * Keep `inherit` as a token for renderers; resolve concrete colors (including
 * `white` / hex) to light-dark() for AnimatedCircle interpolation.
 *
 * @param {string|undefined} color
 * @return {string}
 */
function resolveNodeColor(color) {
	const token = color || 'inherit';
	if (token === 'inherit' || token === 'contrast') {
		return token;
	}
	return resolveColor(token);
}

/**
 * Resolve a preset font token, preserving "unset" as an empty string.
 *
 * `resolveFontFamily` expands empty values to the shipped default stack, which
 * is wrong for fields where empty means "inherit from a broader setting".
 *
 * @param {string|undefined|null} value Stored fontFamily.
 * @return {string} Concrete stack, or '' when unset.
 */
function resolveOptionalFontFamily(value) {
	return value === undefined || value === null || value === ''
		? ''
		: resolveFontFamily(value);
}

/**
 * Resolve preset font tokens on annotation items for SVG render.
 *
 * @param {Array|undefined} items Annotation items from block attrs.
 * @return {Array|undefined} Items with resolved fontFamily tokens.
 */
function resolveAnnotationItems(items) {
	if (!Array.isArray(items) || items.length === 0) {
		return items;
	}

	return items.map((item) => {
		if (!item || typeof item !== 'object') {
			return item;
		}

		if (item.fontFamily === undefined || item.fontFamily === '') {
			return item;
		}

		return {
			...item,
			fontFamily: resolveFontFamily(item.fontFamily),
		};
	});
}

/**
 * Resolve preset font tokens on per-panel title customizations for SVG render.
 *
 * @param {Object|undefined} customTitles customPanelTitles from block attrs.
 * @return {Object} Panel title entries with resolved fontFamily tokens.
 */
function resolvePanelTitleCustomizations(customTitles = {}) {
	const resolved = {};
	Object.entries(customTitles).forEach(([key, entry]) => {
		if (!entry || typeof entry !== 'object') {
			resolved[key] = entry;
			return;
		}
		resolved[key] = {
			...entry,
			...(entry.fontFamily !== undefined && entry.fontFamily !== ''
				? { fontFamily: resolveFontFamily(entry.fontFamily) }
				: {}),
		};
	});
	return resolved;
}

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

const getConfig = (
	attributes,
	clientId,
	editorClickEvent = null,
	deviceType = 'desktop'
) => {
	// Render from the shipped static base only. theme.config (Bucket 3: per-role
	// fonts, axes, layout) is a "new charts only" default — it is frozen into a
	// chart's attributes at insert (apply-theme-block-defaults), never merged at
	// render. Merging it here would retroactively restyle already-published
	// charts whose attributes predate a given key. Palette-by-name (Bucket 2)
	// and theme.json webfonts (Bucket 1) stay live via their own paths.
	const baseConfig = getStaticBaseConfig();
	const { colors: resolvedColorPalette } = getResolvedPalettes();

	// Promote legacy *Mobile/*OnMobile keys, then merge viewport overrides.
	const mergedAttributes = mergeViewportOverrides(
		migrateLegacyMobileAttributes(attributes),
		deviceType
	);

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
		customPanelTitles,
		diffColumn,
		netValues,
		dataRender,
		legend,
		nodes,
		tooltip,
		treemap,
		sankey,
		waffle,
		heatMapTable,
		smallMultiples,
		regression,
		errorBars,
		animation,
		beeSwarm,
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
	// dataRender.xScale is what the Data tab writes; keep axis scale in sync so
	// time-series data infer domain from the data extent instead of [0, 100].
	const effectiveIScale = dataRender?.xScale ?? iScale ?? 'linear';
	const effectiveDScale = dataRender?.yScale ?? dScale ?? 'linear';
	const [iDomainMin, iDomainMax] = getDomainBounds(iDomain);
	const [dDomainMin, dDomainMax] = getDomainBounds(dDomain);

	// Use stringToArray for time scales to preserve date strings, stringToArrayOfNums for numeric scales
	const independentAxisTickValues =
		effectiveIScale === 'time'
			? stringToArray(independentAxis.tickValues)
			: stringToArrayOfNums(independentAxis.tickValues);
	const dependentAxisTickValues =
		effectiveDScale === 'time'
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
		colors: resolveChartSeriesColors(
			customColors,
			colorValue,
			resolvedColorPalette
		).map(resolveColor),
		plotBands: {
			...baseConfig.plotBands,
			...plotBands,
		},
		independentAxis: {
			...baseConfig.independentAxis,
			...independentAxis,
			scale: effectiveIScale,
			customTickLabels:
				customTickLabels?.independent ??
				independentAxis.customTickLabels ??
				{},
			domain: getDomain(
				iDomainMin,
				iDomainMax,
				chartType,
				effectiveIScale,
				'x'
			),
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
				fontFamily: resolveFontFamily(
					independentAxis.tickLabels?.fontFamily ??
						baseConfig.independentAxis.tickLabels?.fontFamily
				),
			},
			axisLabel: {
				...baseConfig.independentAxis.axisLabel,
				...independentAxis.axisLabel,
				fill: resolveColor(
					independentAxis.axisLabel?.fill ??
						baseConfig.independentAxis.axisLabel?.fill
				),
				fontFamily: resolveFontFamily(
					independentAxis.axisLabel?.fontFamily ??
						baseConfig.independentAxis.axisLabel?.fontFamily
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
			scale: effectiveDScale,
			customTickLabels:
				customTickLabels?.dependent ??
				dependentAxis.customTickLabels ??
				{},
			domain: getDomain(
				dDomainMin,
				dDomainMax,
				chartType,
				effectiveDScale,
				'y'
			),
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
				fontFamily: resolveFontFamily(
					dependentAxis.tickLabels?.fontFamily ??
						baseConfig.dependentAxis.tickLabels?.fontFamily
				),
			},
			axisLabel: {
				...baseConfig.dependentAxis.axisLabel,
				...dependentAxis.axisLabel,
				fill: resolveColor(
					dependentAxis.axisLabel?.fill ??
						baseConfig.dependentAxis.axisLabel?.fill
				),
				fontFamily: resolveFontFamily(
					dependentAxis.axisLabel?.fontFamily ??
						baseConfig.dependentAxis.axisLabel?.fontFamily
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
			highlightColor: resolveColor(
				dataRender.highlightColor ??
					baseConfig.dataRender?.highlightColor
			),
			deselectedColor: resolveColor(
				dataRender.deselectedColor ??
					baseConfig.dataRender?.deselectedColor
			),
			deselectedOpacity:
				dataRender.deselectedOpacity ??
				baseConfig.dataRender?.deselectedOpacity ??
				1,
			highlightedCategories: dataRender.highlightedCategories ?? [],
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
		// Author-controllable animation config (PRC-17 slice 3c/3d). The
		// block attribute defaults to `{}`, so untouched charts inherit
		// `baseConfig.animation` (disabled by default). The Inspector's
		// AnimationControls panel writes `enabled`/`duration`/`easing` plus
		// the nested `initial`/`update` sections here. Shallow merge is
		// correct: `baseConfig.animation` has no nested sections of its own,
		// so the author's whole `animation` object (including its `initial`/
		// `update`) passes through intact. `setConfig` (slice 4) layers a
		// deep-merge on top of this.
		//
		// `viewportDelay` is a delivery mechanism (when to start), not a
		// style property. Map it to `initial.delay` so the charting library's
		// `useAnimationConfig` applies it as an animation-start offset rather
		// than as a render-blocking pause.
		animation: (() => {
			const anim = { ...baseConfig.animation, ...(animation ?? {}) };
			const delay = animation?.viewportDelay ?? 0;
			if (delay > 0) {
				anim.initial = {
					...(anim.initial ?? {}),
					delay,
				};
			}
			return anim;
		})(),
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
				fontFamily: resolveFontFamily(
					tooltip.style?.fontFamily ??
						baseConfig.tooltip.style?.fontFamily
				),
			},
		},
		legend: {
			...baseConfig.legend,
			...legend,
			// Empty string means "no box border/background" (block.json default).
			// Never pass resolveColor('') — it becomes 'transparent', which is
			// truthy and StyledLegend renders `1px solid transparent`.
			borderStroke: legend.borderStroke
				? resolveColor(legend.borderStroke)
				: '',
			fill: legend.fill ? resolveColor(legend.fill) : '',
			fontFamily: resolveFontFamily(
				legend.fontFamily ?? baseConfig.legend?.fontFamily
			),
			customLabels: customLegendLabels ?? {},
			categories: (() => {
				const availableLegendCategories = getAvailableLegendCategories({
					chartType,
					chartFamily: io.chartFamily,
					io,
					dataRender,
					divergingBar,
					sankey,
					smallMultiples,
				});

				if (legend.categories && legend.categories.length > 0) {
					return mergeLegendCategoryOrder(
						legend.categories,
						availableLegendCategories
					);
				}

				return availableLegendCategories;
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
			pointFill: resolveNodeColor(
				nodes?.pointFill ?? baseConfig.nodes?.pointFill
			),
			// Legacy templates baked pointStroke: 'white' during a nodes rename
			// (#1403); Line ignored it until mid-2026 and always used series
			// color. Treat that dead token as inherit. Literal white = custom hex.
			pointStroke: resolveNodeColor(
				(nodes?.pointStroke === 'white'
					? 'inherit'
					: nodes?.pointStroke) ?? baseConfig.nodes?.pointStroke
			),
			pointCustomSize: null, // function(d) { return d; },
		},
		beeSwarm: {
			...baseConfig.beeSwarm,
			...beeSwarm,
			layoutMode:
				beeSwarm?.layoutMode ??
				baseConfig.beeSwarm?.layoutMode ??
				'dodge',
			swarmSpread:
				beeSwarm?.swarmSpread ?? baseConfig.beeSwarm?.swarmSpread ?? 24,
			groupBy: beeSwarm?.groupBy ?? baseConfig.beeSwarm?.groupBy ?? null,
			forceStrength:
				beeSwarm?.forceStrength ??
				baseConfig.beeSwarm?.forceStrength ??
				0.1,
		},
		labels: {
			...baseConfig.labels,
			...labels,
			// Pass color as-is: getBarLabelFill() in charting-utilities expects the
			// raw semantic token ('contrast' | 'black' | 'white' | 'inherit') to
			// branch its logic. Resolving it here to a light-dark() string breaks
			// the === comparisons inside getBarLabelFill.
			color: labels.color ?? baseConfig.labels?.color ?? 'inherit',
			fontFamily: resolveFontFamily(
				labels.fontFamily ?? baseConfig.labels?.fontFamily
			),
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
			positive: {
				...baseConfig.divergingBar?.positive,
				...divergingBar.positive,
				fontFamily: resolveFontFamily(
					divergingBar.positive?.fontFamily ??
						baseConfig.divergingBar?.positive?.fontFamily
				),
			},
			negative: {
				...baseConfig.divergingBar?.negative,
				...divergingBar.negative,
				fontFamily: resolveFontFamily(
					divergingBar.negative?.fontFamily ??
						baseConfig.divergingBar?.negative?.fontFamily
				),
			},
		},
		diffColumn: {
			...baseConfig.diffColumn,
			...diffColumn,
			customLabels: resolveDiffColumnCustomLabels(
				diffColumn.customLabels ?? baseConfig.diffColumn?.customLabels
			),
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
				fill: resolveColor(
					diffColumn.style?.fill ?? baseConfig.diffColumn?.style?.fill
				),
				headerFill: resolveColor(
					diffColumn.style?.headerFill ??
						baseConfig.diffColumn?.style?.headerFill
				),
				fontFamily: resolveFontFamily(
					diffColumn.style?.fontFamily ??
						baseConfig.diffColumn?.style?.fontFamily
				),
				// Empty means "no header override" — expanding it to a default
				// stack would override the cell font on legacy diff columns.
				headerFontFamily: resolveOptionalFontFamily(
					diffColumn.style?.headerFontFamily ??
						baseConfig.diffColumn?.style?.headerFontFamily
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
				fontFamily: resolveFontFamily(
					netValues?.positive?.fontFamily ??
						baseConfig.netValues?.positive?.fontFamily
				),
			},
			negative: {
				...baseConfig.netValues.negative,
				...netValues?.negative,
				color:
					netValues?.negative?.color ??
					baseConfig.netValues?.negative?.color,
				fontFamily: resolveFontFamily(
					netValues?.negative?.fontFamily ??
						baseConfig.netValues?.negative?.fontFamily
				),
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
		waffle: {
			...baseConfig.waffle,
			...waffle,
		},
		heatMapTable: {
			...baseConfig.heatMapTable,
			...heatMapTable,
		},
		smallMultiples: {
			panelType: 'line',
			columns: 3,
			panelHeight: 184,
			minPanelWidth: 120,
			sharedScale: true,
			axisTreatment: 'minimal',
			emphasisMode: 'own-series',
			...baseConfig.smallMultiples,
			...smallMultiples,
			ghost: {
				stroke: '#E6E7E8',
				strokeWidth: 1.5,
				opacity: 1,
				...baseConfig.smallMultiples?.ghost,
				...smallMultiples?.ghost,
			},
			panelGap: {
				x: 24,
				y: 32,
				...baseConfig.smallMultiples?.panelGap,
				...smallMultiples?.panelGap,
			},
			panelTitle: {
				active: true,
				fontSize: 13,
				fontWeight: 700,
				fill: '#2a2a2a',
				padding: 8,
				...baseConfig.smallMultiples?.panelTitle,
				...smallMultiples?.panelTitle,
				fontFamily: resolveFontFamily(
					smallMultiples?.panelTitle?.fontFamily ??
						baseConfig.smallMultiples?.panelTitle?.fontFamily
				),
			},
			customTitles: resolvePanelTitleCustomizations(customPanelTitles),
		},
		annotations: {
			...baseConfig.annotations,
			...annotations,
			items: resolveAnnotationItems(annotations?.items),
		},
		drawings: {
			active: drawings && drawings.length > 0,
			items: drawings || [],
		},
	};
	return applyGlobalTokens(renderedConfig);
};

export default getConfig;
