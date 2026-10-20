/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { extractHex } from './light-dark';

const UI_SLUG_PREFIX = 'ui-';

/**
 * Theme colors keyed by lowercase light-mode hex. A `ui-*` color wins when two
 * theme colors share a light hex (#FFFFFF is UI White and Grey Spectrum
 * Primary), matching resolveColor().
 *
 * @param {Array} themeColors Theme palette entries `{ name, slug, color }`.
 * @return {Map<string, Object>} Theme color by light hex.
 */
function indexThemeColors(themeColors) {
	const isUi = (entry) => entry.slug?.startsWith(UI_SLUG_PREFIX);
	const index = new Map();
	for (const entry of themeColors) {
		const key = extractHex(entry.color).toLowerCase();
		const current = index.get(key);
		if (!current || (isUi(entry) && !isUi(current))) {
			index.set(key, entry);
		}
	}
	return index;
}

/**
 * ColorPalette swatches for stored palette values. A value whose light hex
 * matches a theme color takes that color's name and slug. Legacy palettes hold
 * plain hex, so a matched hex swatch offers the theme's light-dark() value;
 * light-dark() values keep what the palette holds.
 *
 * @param {string[]} values      Stored palette colors (hex or light-dark()).
 * @param {Array}    themeColors Theme palette entries `{ name, slug, color }`.
 * @return {Array<{ name: string, slug?: string, color: string }>} Swatches.
 */
function toColorOptions(values, themeColors = []) {
	const themeIndex = indexThemeColors(themeColors);
	return values.map((color) => {
		const theme = themeIndex.get(extractHex(color).toLowerCase());
		if (!theme) {
			return { name: color, color };
		}
		return {
			name: theme.name,
			slug: theme.slug,
			color: color.startsWith('#') ? theme.color : color,
		};
	});
}

/**
 * Named chart palettes as ColorPalette groups, so the picker shows one heading
 * per palette instead of one long list.
 *
 * @param {Object} resolvedPalettes            Result of getResolvedPalettes().
 * @param {Object} resolvedPalettes.colors     Palette slug to color array.
 * @param {Array}  resolvedPalettes.colorNames Palette `{ label, value }` in display order.
 * @param {Array}  [themeColors]               Theme palette entries, for swatch names and slugs.
 * @return {Array<{ name: string, slug: string, colors: Array }>} Palette groups.
 */
export function getPaletteGroups(
	{ colors = {}, colorNames = [] },
	themeColors = []
) {
	return colorNames
		.filter(({ value }) => Array.isArray(colors[value]))
		.map(({ label, value }) => ({
			name: label,
			slug: value,
			colors: toColorOptions(colors[value], themeColors),
		}));
}

/**
 * Series color groups: the chart's active palette first, so the colors the
 * chart already paints stay one click away, then the shared groups.
 *
 * @param {string[]} palette       Active palette colors.
 * @param {Array}    groups        Groups that follow, e.g. UI and chart palettes.
 * @param {Array}    [themeColors] Theme palette entries, for swatch names and slugs.
 * @return {Array<{ name: string, slug: string, colors: Array }>} Palette groups.
 */
export function getSeriesColorGroups(
	palette = [],
	groups = [],
	themeColors = []
) {
	if (!palette.length) {
		return groups;
	}

	return [
		{
			name: __('Current palette', 'prc-chart-builder'),
			slug: 'current',
			colors: toColorOptions(palette, themeColors),
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
 * The theme.json palette from the editor's color origins.
 *
 * @param {Array} originGroups Palettes from useMultipleOriginColorsAndGradients().
 * @return {Array<{ name: string, slug: string, color: string }>} Theme colors.
 */
export function getThemeOriginColors(originGroups = []) {
	return originGroups.find((group) => group.slug === 'theme')?.colors ?? [];
}

/**
 * The theme's `ui-*` colors (white, black, grays, link colors) as one group.
 *
 * @param {Array} originGroups Palettes from useMultipleOriginColorsAndGradients().
 * @return {?{ name: string, slug: string, colors: Array }} UI group, or null when the theme has none.
 */
export function getUiColorGroup(originGroups = []) {
	const colors = getThemeOriginColors(originGroups).filter((color) =>
		color.slug?.startsWith(UI_SLUG_PREFIX)
	);

	return colors.length ? { name: 'UI', slug: 'ui', colors } : null;
}
