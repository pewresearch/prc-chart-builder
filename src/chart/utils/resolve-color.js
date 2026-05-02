/**
 * Color resolver utility for dark mode support.
 *
 * Maps hex color values to their light-dark() CSS equivalents
 * using the theme.json color palette as the source of truth.
 * This ensures charts automatically adapt to the user's
 * color-scheme preference (light or dark mode).
 *
 * @see themes/prc-design-system/theme.json — settings.color.palette.default
 */

/**
 * Static lookup map: normalized hex (lowercase) → full light-dark() string.
 * Generated from theme.json settings.color.palette.default entries.
 */
const HEX_TO_LIGHT_DARK = new Map([
	// UI colors
	['#ffffff', 'light-dark(#ffffff, #1a1a1a)'],
	['#000000', 'light-dark(#000000, #f0f0f0)'],
	['#346ead', 'light-dark(#346EAD, #5B9BD5)'],
	['#5f94cf', 'light-dark(#5F94CF, #7BB3E8)'],
	['#2a2a2a', 'light-dark(#2a2a2a, #d9d9d9)'],
	['#231f20', 'light-dark(#2a2a2a, #d9d9d9)'], // legacy "thunder" text color → ui-gray-very-dark
	['#565656', 'light-dark(#565656, #a0a0a0)'],
	['#818181', 'light-dark(#818181, #9a9a9a)'],
	['#756f6a', 'light-dark(#818181, #9a9a9a)'], // legacy axis stroke → ui-gray-dark
	['#dadbdb', 'light-dark(#dadbdb, #3a3a3a)'],
	['#f7f7f7', 'light-dark(#F7F7F7, #242424)'],
	['#f7f7f1', 'light-dark(#f7f7f1, #26251f)'],
	['#f0f0e6', 'light-dark(#f0f0e6, #333028)'],
	['#d7d8d4', 'light-dark(#d7d8d4, #45433b)'],
	['#adadad', 'light-dark(#adadad, #5a5a5a)'],
	['#d7b236', 'light-dark(#d7b236, #E0BD45)'],
	['#5cb85c', 'light-dark(#5cb85c, #6FCD6F)'],
	['#d9534f', 'light-dark(#d9534f, #E8706C)'],
	['#5a6b51', 'light-dark(#5A6B51, #7E9B6E)'],
	['#8f5949', 'light-dark(#8F5949, #B87A68)'],
	['#1a707e', 'light-dark(#1A707E, #2A9DB0)'],
	['#756a7e', 'light-dark(#756A7E, #9B8FA8)'],

	// Background Spectrum
	['#49432b', 'light-dark(#49432B, #CEC6A6)'],
	['#1d1b12', 'light-dark(#1D1B12, #E1DECD)'],
	['#ddd9c7', 'light-dark(#DDD9C7, #4A442B)'],
	['#938857', 'light-dark(#938857, #AA9E67)'],
	['#c3bb9b', 'light-dark(#C3BB9B, #706640)'],
	['#eeece4', 'light-dark(#EEECE4, #302D1D)'],

	// Blue Spectrum (internet)
	['#004a75', 'light-dark(#004A75, #74CCFF)'],
	['#002748', 'light-dark(#002748, #9AD0FF)'],
	['#c9d1e1', 'light-dark(#C9D1E1, #263249)'],
	['#7591b7', 'light-dark(#7591B7, #476792)'],
	['#9daecb', 'light-dark(#9DAECB, #374C70)'],
	['#006699', 'light-dark(#006699, #56C7FF)'],
	['#1F497D', 'light-dark(#1F497D, #4BC9FF)'],

	// Gray Blue Spectrum (blue)
	['#335062', 'light-dark(#335062, #8FB3C9)'],
	['#213441', 'light-dark(#213441, #ABC6D8)'],
	['#d5e1e9', 'light-dark(#D5E1E9, #1F323F)'],
	['#82a6bf', 'light-dark(#82A6BF, #406A87)'],
	['#acc4d3', 'light-dark(#ACC4D3, #314F63)'],
	['#456a83', 'light-dark(#456A83, #739EBA)'],

	// Green Spectrum (global)
	['#6e7537', 'light-dark(#6E7537, #BFC77E)'],
	['#494e24', 'light-dark(#494E24, #D0D69F)'],
	['#eaecd8', 'light-dark(#EAECD8, #3A3E1C)'],
	['#c2c98b', 'light-dark(#C2C98B, #788137)'],
	['#d6dab3', 'light-dark(#D6DAB3, #585E2A)'],
	['#949d48', 'light-dark(#949D48, #B0BA5B)'],

	// Gray Spectrum
	['#a4a4a4', 'light-dark(#A4A4A4, #616161)'],
	['#7e7e7e', 'light-dark(#7E7E7E, #818181)'],
	['#f1f1f1', 'light-dark(#F1F1F1, #202020)'],
	['#c6c8ca', 'light-dark(#C6C8CA, #404345)'],
	['#d7d7d7', 'light-dark(#D7D7D7, #363636)'],
	// Note: #FFFFFF for gray-spectrum-primary is shared with ui-white above

	// Light Brown Spectrum (politics)
	['#9e7f2d', 'light-dark(#9E7F2D, #D6B355)'],
	['#6a5522', 'light-dark(#6A5522, #DDC283)'],
	['#f6eed6', 'light-dark(#F6EED6, #46380C)'],
	['#e4cb83', 'light-dark(#E4CB83, #8F7119)'],
	['#ecdbac', 'light-dark(#ECDBAC, #6B5414)'],
	['#d1a730', 'light-dark(#D1A730, #D7A926)'],

	// Medium Brown Spectrum (hispanic)
	['#7c441c', 'light-dark(#7C441C, #E5A170)'],
	['#532e16', 'light-dark(#532E16, #E8B695)'],
	['#f2dbcd', 'light-dark(#F2DBCD, #4D2811)'],
	['#de996a', 'light-dark(#DE996A, #A5541D)'],
	['#e7ba9a', 'light-dark(#E7BA9A, #7A4118)'],
	['#a55a26', 'light-dark(#A55A26, #DE884D)'],

	// Orange Spectrum
	['#bb792a', 'light-dark(#BB792A, #DC9239)'],
	['#7c5220', 'light-dark(#7C5220, #E1AE71)'],
	['#f9ead4', 'light-dark(#F9EAD4, #4B3007)'],
	['#f1c37f', 'light-dark(#F1C37F, #975E09)'],
	['#f5d6a9', 'light-dark(#F5D6A9, #724608)'],
	['#ea9e2c', 'light-dark(#EA9E2C, #E08B0C)'],

	// Plum Spectrum (journalism)
	['#552e35', 'light-dark(#552E35, #CC9BA4)'],
	['#391e22', 'light-dark(#391E22, #DAB3B8)'],
	['#e8d3d7', 'light-dark(#E8D3D7, #412026)'],
	['#bc7b86', 'light-dark(#BC7B86, #8D434F)'],
	['#d1a8af', 'light-dark(#D1A8AF, #66323B)'],
	['#733d47', 'light-dark(#733D47, #C0818D)'],

	// Purple Spectrum
	['#584f5e', 'light-dark(#584F5E, #A499AB)'],
	['#3a343f', 'light-dark(#3A343F, #BBB3C2)'],
	['#e3e1e5', 'light-dark(#E3E1E5, #2C282F)'],
	['#aca4b1', 'light-dark(#ACA4B1, #5D5463)'],
	['#c7c1cb', 'light-dark(#C7C1CB, #463E4B)'],
	['#746a7e', 'light-dark(#746A7E, #897E94)'],

	// Red Spectrum
	['#902d1e', 'light-dark(#902D1E, #E5705E)'],
	['#5f1d14', 'light-dark(#5F1D14, #EC9589)'],
	['#f5d4cf', 'light-dark(#F5D4CF, #4D150D)'],
	['#e37f73', 'light-dark(#E37F73, #9E2718)'],
	['#ebaba2', 'light-dark(#EBABA2, #742014)'],
	['#bf3b27', 'light-dark(#BF3B27, #DF4B35)'],

	// Sky Blue Spectrum (religion)
	['#0073a5', 'light-dark(#0073A5, #4BC9FF)'],
	['#00557e', 'light-dark(#00557E, #6CCFFF)'],
	['#c9deee', 'light-dark(#C9DEEE, #15364F)'],
	['#71b2d6', 'light-dark(#71B2D6, #26729C)'],
	['#9dc7e1', 'light-dark(#9DC7E1, #1F5476)'],
	['#0090c0', 'light-dark(#0090C0, #35CDFF)'],

	// Teal Spectrum (social trends)
	['#005645', 'light-dark(#005645, #8EFFE9)'],
	['#003a2c', 'light-dark(#003A2C, #A5FFE9)'],
	['#d1e9e4', 'light-dark(#D1E9E4, #1E443C)'],
	['#64b6aa', 'light-dark(#64B6AA, #46A295)'],
	['#a2d2c8', 'light-dark(#A2D2C8, #306C60)'],
	['#387668', 'light-dark(#387668, #7DC6B6)'],
]);

/**
 * Named CSS colors → their theme.json light-dark() equivalents.
 */
const NAMED_COLOR_MAP = {
	white: 'light-dark(#ffffff, #1a1a1a)',
	black: 'light-dark(#000000, #f0f0f0)',
	gray: 'light-dark(#818181, #9a9a9a)',
	grey: 'light-dark(#818181, #9a9a9a)',
};

/**
 * Known rgba values and their light-dark() equivalents.
 * Normalized by stripping whitespace within the rgba() function.
 */
const RGBA_MAP = {
	'rgba(35,31,32,0.7)':
		'light-dark(rgba(35, 31, 32, 0.7), rgba(217, 217, 217, 0.7))',
	'rgba(35,31,32,1)': 'light-dark(#2a2a2a, #d9d9d9)',
};

/**
 * Normalize an rgba string by stripping internal whitespace for consistent lookup.
 *
 * @param {string} value - An rgba() CSS color value.
 * @return {string} The normalized rgba string.
 */
function normalizeRgba(value) {
	return value.replace(/\s+/g, '');
}

/**
 * Resolve a single color value to its light-dark() equivalent.
 *
 * Priority:
 * 1. Falsy / empty → 'transparent'
 * 2. 'transparent' / 'inherit' / 'contrast' / 'none' → passthrough
 * 3. Already a light-dark() string → passthrough
 * 4. Named color (white, black, gray) → themed equivalent
 * 5. rgba() value → known mapping or passthrough
 * 6. Hex value → palette lookup or passthrough
 *
 * @param {string} color - The color value to resolve.
 * @return {string} The resolved light-dark() string, or the original value if no match.
 */
export function resolveColor(color) {
	// Empty / falsy → transparent
	if (!color) {
		return 'transparent';
	}

	// Passthrough values that should not be resolved
	if (
		color === 'transparent' ||
		color === 'inherit' ||
		color === 'contrast' ||
		color === 'none' ||
		color === 'currentColor'
	) {
		return color;
	}

	// Already resolved
	if (color.startsWith('light-dark(')) {
		return color;
	}

	const lower = color.toLowerCase().trim();

	// Named color lookup
	if (NAMED_COLOR_MAP[lower]) {
		return NAMED_COLOR_MAP[lower];
	}

	// rgba() lookup
	if (lower.startsWith('rgba(')) {
		const normalized = normalizeRgba(lower);
		return RGBA_MAP[normalized] || color;
	}

	// Hex lookup (normalize to lowercase)
	return HEX_TO_LIGHT_DARK.get(lower) || color;
}

/**
 * Resolve hex color values embedded within a larger CSS string.
 * Useful for compound values like '1px solid #CBCBCB'.
 *
 * Finds all hex color patterns (#RGB, #RRGGBB) and resolves each one.
 *
 * @param {string} cssValue - A CSS value that may contain embedded hex colors.
 * @return {string} The CSS value with hex colors resolved to light-dark().
 */
export function resolveColorInString(cssValue) {
	if (!cssValue || typeof cssValue !== 'string') {
		return cssValue;
	}

	// Already contains light-dark — assume resolved
	if (cssValue.includes('light-dark(')) {
		return cssValue;
	}

	// Match hex colors: #RRGGBB or #RGB (word-bounded to avoid partial matches)
	return cssValue.replace(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (hex) => {
		const resolved = HEX_TO_LIGHT_DARK.get(hex.toLowerCase());
		return resolved || hex;
	});
}
