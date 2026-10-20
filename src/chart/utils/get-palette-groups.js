/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

function toColorOptions(hexes) {
	return hexes.map((color) => ({ name: color, color }));
}

/**
 * Named chart palettes as ColorPalette groups, so the picker shows one heading
 * per palette instead of one long list.
 *
 * @param {Object} resolvedPalettes            Result of getResolvedPalettes().
 * @param {Object} resolvedPalettes.colors     Palette slug to hex array.
 * @param {Array}  resolvedPalettes.colorNames Palette `{ label, value }` in display order.
 * @return {Array<{ name: string, slug: string, colors: Array }>} Palette groups.
 */
export function getPaletteGroups({ colors = {}, colorNames = [] }) {
	return colorNames
		.filter(({ value }) => Array.isArray(colors[value]))
		.map(({ label, value }) => ({
			name: label,
			slug: value,
			colors: toColorOptions(colors[value]),
		}));
}

/**
 * Series color groups: the chart's active palette first, so the colors the
 * chart already paints stay one click away, then the shared groups.
 *
 * @param {string[]} palette Active palette hex colors.
 * @param {Array}    groups  Groups that follow, e.g. UI and chart palettes.
 * @return {Array<{ name: string, slug: string, colors: Array }>} Palette groups.
 */
export function getSeriesColorGroups(palette = [], groups = []) {
	if (!palette.length) {
		return groups;
	}

	return [
		{
			name: __('Current palette', 'prc-chart-builder'),
			slug: 'current',
			colors: toColorOptions(palette),
		},
		...groups,
	];
}

/**
 * The chart's selected palettes, in selection order, then the UI group.
 * With no palette selected, every group is offered.
 *
 * @param {Array}    groups  Groups from useChartColorGroups().
 * @param {string[]} sources Selected palette slugs.
 * @return {Array<{ name: string, slug: string, colors: Array }>} Palette groups.
 */
export function getSourceColorGroups(groups = [], sources = []) {
	if (sources.length === 0) {
		return groups;
	}

	return [...sources, 'ui']
		.map((slug) => groups.find((group) => group.slug === slug))
		.filter(Boolean);
}

/**
 * The theme's `ui-*` colors (white, black, grays, link colors) as one group.
 *
 * @param {Array} originGroups Palettes from useMultipleOriginColorsAndGradients().
 * @return {?{ name: string, slug: string, colors: Array }} UI group, or null when the theme has none.
 */
export function getUiColorGroup(originGroups = []) {
	const theme = originGroups.find((group) => group.slug === 'theme');
	const colors = (theme?.colors ?? []).filter((color) =>
		color.slug?.startsWith('ui-')
	);

	return colors.length ? { name: 'UI', slug: 'ui', colors } : null;
}
