/**
 * Chart type groupings for the Chart Builder.
 *
 * Single source of truth for chart type taxonomies used across controls,
 * data processing, and legend logic. A chart type may appear in multiple groups.
 */

/** All known layout types */
export const ALL_CHART_TYPES = [
	'bar',
	'stacked-bar',
	'diverging-bar',
	'exploded-bar',
	'line',
	'area',
	'stacked-area',
	'scatter',
	'bee-swarm',
	'dot-plot',
	'pie',
	'small-multiples',
	'waffle',
	'heat-map-table',
	'treemap',
	'sankey',
	'map-usa',
	'map-usa-counties',
	'map-usa-cbsa',
	'map-usa-block',
	'map-usa-hex',
	'map-world',
	'map-world-orthographic',
];

/** Bar family: bar, stacked-bar, diverging-bar, exploded-bar */
export const BAR_CHART_TYPES = [
	'bar',
	'stacked-bar',
	'diverging-bar',
	'exploded-bar',
];

/** Line family: line, area, stacked-area */
export const LINE_CHART_TYPES = ['line', 'area', 'stacked-area'];

/**
 * Geographic map chart types that support the bubble (proportional symbol)
 * render mode. Excludes block and hex maps — those are abstract grid layouts
 * with no continuous topology to place bubbles on.
 */
export const BUBBLE_MAP_CHART_TYPES = [
	'map-usa',
	'map-usa-counties',
	'map-usa-cbsa',
	'map-world',
];

/**
 * Charts with PRC-17 animation primitives and the Inspector Animation panel.
 * Add a type here when its charting-library component consumes `animated/*`
 * and `config.animation` — keep in sync with `animation-controls.jsx`
 * `resolveFamily()` and the rollout plan (`.cursor/plans/prc-17_animation_rollout.plan.md`).
 */
export const ANIMATED_CHART_TYPES = [
	...BAR_CHART_TYPES,
	...LINE_CHART_TYPES,
	...BUBBLE_MAP_CHART_TYPES,
	'scatter',
	'bee-swarm',
	'dot-plot',
	'pie',
];

/** Charts that get node size/stroke controls */
export const NODE_CHART_TYPES = ['scatter', 'bee-swarm', 'dot-plot'];

/** Point-based charts: color-by-group via groupBreaksCategory (no visual break lines) */
export const POINT_CHART_TYPES = ['scatter', 'bee-swarm', 'bubble'];

/** Charts that support regression line overlay */
export const REGRESSION_CHART_TYPES = ['scatter', 'bubble'];

/** Map chart types */
export const MAP_CHART_TYPES = [
	'map-usa',
	'map-usa-counties',
	'map-usa-cbsa',
	'map-usa-block',
	'map-usa-hex',
	'map-world',
	'map-world-orthographic',
];

/**
 * Chart types that reuse mapScale / mapScaleDomain for value-based color scales
 * without using the map chart family.
 */
export const VALUE_SCALE_CHART_TYPES = ['heat-map-table'];

/** Charts that support visual group break lines between groups */
export const GROUP_BREAKS_CHART_TYPES = [
	...BAR_CHART_TYPES,
	'dot-plot',
	'heat-map-table',
];

/** Charts that can partition data by a category field (groupBreaksCategory).
 *  Superset of GROUP_BREAKS_CHART_TYPES — these charts support the underlying
 *  group-by + group-order controls, but not all draw visual divider lines.
 *  Pie uses angular explode offset (pie-controls.jsx) instead of break lines.
 *  Small multiples facets one panel per group value (multi-series panels). */
export const GROUPABLE_CHART_TYPES = [
	...GROUP_BREAKS_CHART_TYPES,
	'treemap',
	'pie',
	'waffle',
	'heat-map-table',
	'small-multiples',
];

/** Charts that skip numeric coercion in formattedData (preserve raw values) */
export const FORMATTED_DATA_PASSTHROUGH_TYPES = [
	'bar',
	'stacked-bar',
	'pie',
	'dot-plot',
];

/** Charts that support sortable data rendering (sort key + sort order) */
export const SORTABLE_CHART_TYPES = [
	...BAR_CHART_TYPES,
	'dot-plot',
	'pie',
	'treemap',
];

/** Charts that support supplemental column features rendered alongside the chart
 *  (Diff Column, Net Value Labels). Bar and dot-plot layouts only — not pie. */
export const SUPPLEMENTAL_COLUMN_CHART_TYPES = [...BAR_CHART_TYPES, 'dot-plot'];

/**
 * Charts that support highlightedCategories / highlightColor / deselectedColor.
 * Multi-series legend keys only — not per-element emphasis (pie, treemap, maps).
 */
export const HIGHLIGHTABLE_CHART_TYPES = [
	...BAR_CHART_TYPES,
	'dot-plot',
	...LINE_CHART_TYPES,
	'scatter',
	'bee-swarm',
	'sankey',
];

/**
 * Resolve layout.type for inspector control gating.
 * Small multiples maps panelType → the equivalent full chart type
 * (`column` → `bar` so bar-family controls apply).
 *
 * @param {Object} attributes Chart block attributes
 * @return {string|undefined} Effective chart type for control gates
 */
export function effectiveChartTypeForControls(attributes = {}) {
	const type = attributes?.layout?.type;
	if (type !== 'small-multiples') {
		return type;
	}
	const panelType = attributes?.smallMultiples?.panelType || 'line';
	if (panelType === 'column') {
		return 'bar';
	}
	if (panelType === 'waffle') {
		return 'waffle';
	}
	return panelType;
}

/**
 * Whether the effective chart type is in a list (or matches a predicate).
 *
 * @param {Object}                 attributes        Chart block attributes
 * @param {string[]|Function}      typesOrPredicate  Allowed types or predicate(effective)
 * @return {boolean}
 */
export function chartTypeMatches(attributes, typesOrPredicate) {
	const effective = effectiveChartTypeForControls(attributes);
	if (typeof typesOrPredicate === 'function') {
		return !!typesOrPredicate(effective);
	}
	return (
		Array.isArray(typesOrPredicate) && typesOrPredicate.includes(effective)
	);
}
