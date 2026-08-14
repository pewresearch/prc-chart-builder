/**
 * Curated chart block attribute groups theme.config may override (PRC-528).
 *
 * Presentation/style object groups from block.json. Excludes identifiers,
 * viewport override shells, data/runtime (io, dataRender), user-content maps
 * (customTickLabels, customLegendLabels, customTooltips), arrays (colors,
 * drawings), and migration metadata.
 *
 * @type {readonly string[]}
 */
export const CURATED_THEME_CONFIG_GROUPS = [
	'layout',
	'metadata',
	'plotBands',
	'independentAxis',
	'dependentAxis',
	'tooltip',
	'legend',
	'labels',
	'shapes',
	'bar',
	'line',
	'dotPlot',
	'errorBars',
	'explodedBar',
	'pie',
	'nodes',
	'beeSwarm',
	'regression',
	'map',
	'divergingBar',
	'diffColumn',
	'netValues',
	'treemap',
	'sankey',
	'heatMapTable',
	'smallMultiples',
	'annotations',
];

/**
 * @param {unknown} themePartial Candidate theme.config value for a group.
 * @return {boolean} True when the partial should merge into block defaults.
 */
export function isThemeableConfigPartial(themePartial) {
	return (
		themePartial &&
		typeof themePartial === 'object' &&
		!Array.isArray(themePartial) &&
		Object.keys(themePartial).length > 0
	);
}
