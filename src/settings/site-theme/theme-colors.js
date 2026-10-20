import { resolveColor } from '../../chart/utils/resolve-color';
import { extractDarkHex, extractHex } from '../../chart/utils/light-dark';

export { extractDarkHex, extractHex };

/**
 * Accessors for the site's registered theme.json color palette (PRC-528 slice 14).
 *
 * The admin page is not the block editor, so the palette is delivered by PHP as
 * `window.prcChartBuilderThemeEditor.themeColors` (see class-theme-admin.php).
 * Each entry is `{ slug, name, color }`, where `color` may be a `light-dark()`
 * string. Palettes store that full value; older palettes hold plain hex, so
 * lookups match on the light-mode hex from `extractHex`.
 *
 * @typedef {{ slug: string, name: string, color: string }} ThemeColor
 * @typedef {'light' | 'dark'} ColorPreviewMode
 */

/**
 * Registered theme.json colors (safe accessor).
 *
 * @return {ThemeColor[]} Theme colors with a `color` value.
 */
export function getThemeColors() {
	const editor =
		typeof window !== 'undefined'
			? window.prcChartBuilderThemeEditor
			: null;
	const colors = editor?.themeColors;
	return Array.isArray(colors)
		? colors.filter(
				(entry) =>
					entry && typeof entry === 'object' && 'color' in entry
			)
		: [];
}

/**
 * Hex for the active preview mode (light or dark).
 *
 * @param {string}           colorOrHex Stored hex or full CSS color.
 * @param {ColorPreviewMode} mode       Preview mode.
 * @return {string} Hex for that mode.
 */
export function colorForPreviewMode(colorOrHex, mode) {
	const resolved = resolveColor(colorOrHex);
	if (mode === 'dark') {
		return extractDarkHex(resolved);
	}
	return extractHex(resolved);
}

/**
 * Theme color whose light-mode hex matches a stored color.
 *
 * @param {string} hex Stored hex or `light-dark()` value.
 * @return {ThemeColor|undefined} Matching theme color.
 */
function findThemeColorByHex(hex) {
	const normalized = extractHex(hex).toLowerCase();
	return getThemeColors().find(
		(entry) => extractHex(entry.color).toLowerCase() === normalized
	);
}

/**
 * Registered theme color name for a stored hex, or the hex as fallback.
 *
 * @param {string} hex Stored hex or `light-dark()` value.
 * @return {string} Theme color name, or the light hex.
 */
export function getThemeColorName(hex) {
	const themeMatch = findThemeColorByHex(hex);
	if (themeMatch?.name) {
		return themeMatch.name;
	}
	return extractHex(hex);
}

/**
 * Full display value for a stored hex (prefers the registered theme color).
 *
 * @param {string} hex Stored hex or `light-dark()` value.
 * @return {string} CSS color to render.
 */
export function getColorDisplayValue(hex) {
	const themeMatch = findThemeColorByHex(hex);
	if (themeMatch) {
		return themeMatch.color;
	}
	return resolveColor(hex);
}

/**
 * Infer a display group from theme color naming.
 *
 * PRC design-system colors follow `{Group} Spectrum …` or `UI …` conventions.
 * Generic theme.json palettes without grouped names fall back to "Other".
 *
 * @param {ThemeColor} themeColor Theme color.
 * @return {string} Group label.
 */
export function inferThemeColorGroup(themeColor) {
	const name = String(themeColor?.name ?? '').trim();
	const slug = String(themeColor?.slug ?? '').trim();

	if (name.startsWith('UI ') || slug.startsWith('ui-')) {
		return 'UI';
	}

	const fromName = name.match(/^(.+? Spectrum)\b/i);
	if (fromName) {
		return fromName[1];
	}

	const fromSlug = slug.match(/^(.+)-spectrum-/);
	if (fromSlug) {
		return (
			fromSlug[1]
				.split('-')
				.filter(Boolean)
				.map(
					(part) =>
						part.charAt(0).toUpperCase() +
						part.slice(1).toLowerCase()
				)
				.join(' ') + ' Spectrum'
		);
	}

	return 'Other';
}

/**
 * @typedef {{ label: string, colors: ThemeColor[] }} ThemeColorGroup
 */

/**
 * Cluster theme colors into display groups, preserving palette order.
 *
 * @param {ThemeColor[]} colors Theme colors.
 * @return {ThemeColorGroup[]} Groups in palette order.
 */
export function groupThemeColors(colors) {
	/** @type {ThemeColorGroup[]} */
	const groups = [];
	/** @type {Map<string, number>} */
	const indexByLabel = new Map();

	for (const color of colors) {
		const label = inferThemeColorGroup(color);
		if (!indexByLabel.has(label)) {
			indexByLabel.set(label, groups.length);
			groups.push({ label, colors: [] });
		}
		groups[indexByLabel.get(label)].colors.push(color);
	}

	return groups;
}
