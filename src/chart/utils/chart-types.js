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
	'dot-plot',
	'pie',
	'treemap',
	'sankey',
	'map-usa',
	'map-usa-counties',
	'map-usa-block',
	'map-usa-hex',
	'map-world',
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

/** Charts that get node size/stroke controls */
export const NODE_CHART_TYPES = ['scatter', 'dot-plot'];

/** Point-based charts: color-by-group via groupBreaksCategory (no visual break lines) */
export const POINT_CHART_TYPES = ['scatter', 'bee-swarm', 'bubble'];

/** Charts that support regression line overlay */
export const REGRESSION_CHART_TYPES = ['scatter', 'bee-swarm', 'bubble'];

/** Map chart types */
export const MAP_CHART_TYPES = [
	'map-usa',
	'map-usa-counties',
	'map-usa-block',
	'map-usa-hex',
	'map-world',
];

/** Charts that support visual group break lines between groups */
export const GROUP_BREAKS_CHART_TYPES = [...BAR_CHART_TYPES, 'dot-plot'];

/** Charts that can partition data by a category field (groupBreaksCategory).
 *  Superset of GROUP_BREAKS_CHART_TYPES — these charts support the underlying
 *  group-by + group-order controls, but not all draw visual divider lines.
 *  Pie uses angular explode offset (pie-controls.jsx) instead of break lines. */
export const GROUPABLE_CHART_TYPES = [
	...GROUP_BREAKS_CHART_TYPES,
	'treemap',
	'pie',
];

/** Charts where legend ordering / ordinal scale does not apply */
export const NO_ORDINAL_LEGEND_TYPES = ['treemap', 'sankey'];

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
 *  (Diff Column, Net Value Labels). These are bar/dot-plot/pie concepts and do
 *  not apply to layout types like treemap. */
export const SUPPLEMENTAL_COLUMN_CHART_TYPES = [
	...BAR_CHART_TYPES,
	'dot-plot',
	'pie',
];
