/**
 * Internal dependencies
 */
import { extractHex } from './light-dark';
import { resolveColor } from './resolve-color';

const CHART_BACKGROUND = '#ffffff';

/**
 * WCAG minimum contrast by color role: 4.5:1 for text, 3:1 for graphics.
 */
export const CONTRAST_MINIMUMS = { text: 4.5, graphic: 3 };

/**
 * sRGB channels (0–255) of a `#rgb` or `#rrggbb` color.
 *
 * @param {string} hex Hex color.
 * @return {number[]|null} Red, green, and blue, or null for any other value.
 */
function hexToRgb(hex) {
	const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
	if (!match) {
		return null;
	}
	const digits =
		match[1].length === 3
			? [...match[1]].map((digit) => digit + digit).join('')
			: match[1];
	return [0, 2, 4].map((start) =>
		parseInt(digits.slice(start, start + 2), 16)
	);
}

/**
 * WCAG relative luminance of an sRGB color.
 *
 * @param {number[]} rgb Red, green, and blue (0–255).
 * @return {number} Luminance from 0 (black) to 1 (white).
 */
function relativeLuminance(rgb) {
	const [r, g, b] = rgb.map((channel) => {
		const value = channel / 255;
		return value <= 0.04045
			? value / 12.92
			: ((value + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Low-contrast warning for a picked color against the light chart background.
 * Named colors and `light-dark()` values are checked by their light-mode hex.
 *
 * @param {string}           color Picked color.
 * @param {'text'|'graphic'} role  What the color paints.
 * @return {{ ratio: number, minimum: number }|null} Ratio (one decimal) and
 * the minimum it misses, or null when it passes or cannot be checked.
 */
export function getContrastWarning(color, role) {
	const minimum = CONTRAST_MINIMUMS[role];
	if (!color || !minimum) {
		return null;
	}
	const rgb = hexToRgb(extractHex(resolveColor(color)));
	if (!rgb) {
		return null;
	}
	const luminances = [
		relativeLuminance(rgb),
		relativeLuminance(hexToRgb(CHART_BACKGROUND)),
	].sort((a, b) => b - a);
	const ratio = (luminances[0] + 0.05) / (luminances[1] + 0.05);
	return ratio < minimum
		? { ratio: Math.round(ratio * 10) / 10, minimum }
		: null;
}
