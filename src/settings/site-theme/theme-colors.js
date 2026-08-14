import { resolveColor } from '../../chart/utils/resolve-color';

/**
 * Accessors for the site's registered theme.json color palette (PRC-528 slice 14).
 *
 * The admin page is not the block editor, so the palette is delivered by PHP as
 * `window.prcChartBuilderThemeEditor.themeColors` (see class-theme-admin.php).
 * Each entry is `{ slug, name, color }`, where `color` may be a `light-dark()`
 * string. Charts store plain hex, so `extractHex` pulls the light-mode hex out
 * for storage while the swatch UI can still render the full `color` value.
 *
 * @typedef {{ slug: string, name: string, color: string }} ThemeColor
 * @typedef {'light' | 'dark'} ColorPreviewMode
 */

/**
 * Registered theme.json colors (safe accessor).
 *
 * @return {ThemeColor[]}
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
 * Storable hex for a theme color value.
 *
 * - `light-dark(#456A83, #739EBA)` → `#456A83` (light component)
 * - `#456A83` → `#456A83`
 * - anything else → returned unchanged (e.g. rgba / named color)
 *
 * @param {string} color
 * @return {string}
 */
export function extractHex(color) {
	const value = String(color ?? '').trim();

	const lightDark = value.match(/^light-dark\(\s*([^,]+?)\s*,/i);
	if (lightDark) {
		return lightDark[1].trim();
	}

	return value;
}

/**
 * Dark-mode component from a `light-dark()` string, or the value unchanged.
 *
 * @param {string} color
 * @return {string}
 */
export function extractDarkHex(color) {
	const value = String(color ?? '').trim();

	const lightDark = value.match(/^light-dark\(\s*[^,]+?\s*,\s*(.+?)\s*\)$/i);
	if (lightDark) {
		return lightDark[1].trim();
	}

	return value;
}

/**
 * Hex for the active preview mode (light or dark).
 *
 * @param {string}          colorOrHex Stored hex or full CSS color.
 * @param {ColorPreviewMode} mode
 * @return {string}
 */
export function colorForPreviewMode(colorOrHex, mode) {
	const resolved = resolveColor(colorOrHex);
	if (mode === 'dark') {
		return extractDarkHex(resolved);
	}
	return extractHex(resolved);
}

/**
 * @param {string} hex
 * @return {ThemeColor|undefined}
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
 * @param {string} hex
 * @return {string}
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
 * @param {string} hex
 * @return {string}
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
 * @param {ThemeColor} themeColor
 * @return {string}
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
 * @param {ThemeColor[]} colors
 * @return {ThemeColorGroup[]}
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
