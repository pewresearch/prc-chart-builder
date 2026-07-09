/**
 * Resolve chart fontFamily preset tokens to concrete stacks (PRC-528).
 *
 * Charts store WordPress preset tokens (`var:preset|font-family|<slug>`).
 * At render, tokens resolve through theme.json families delivered in
 * `window.prcChartBuilderTheme.fontFamilies`. Literal stacks pass through.
 */
import { DEFAULT_FONT_FAMILY } from '../../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/defaultFontFamily.ts';
import { parseFontFamilyToken, isFontFamilyToken } from './font-family-tokens';
import { getRuntimeTheme } from './resolve-defaults';

/**
 * Slug => var-free concrete stack from the active theme.json presets.
 *
 * @return {Record<string, string>}
 */
export function getResolvedFontFamilyMap() {
	const { fontFamilies } = getRuntimeTheme();

	if (!Array.isArray(fontFamilies)) {
		return {};
	}

	/** @type {Record<string, string>} */
	const map = {};

	for (const entry of fontFamilies) {
		if (
			!entry ||
			typeof entry !== 'object' ||
			typeof entry.slug !== 'string' ||
			typeof entry.value !== 'string'
		) {
			continue;
		}

		const stack = entry.value.trim();
		if (stack) {
			map[entry.slug] = stack;
		}
	}

	return map;
}

/**
 * Resolve a stored fontFamily value for canvas measurement and CSS render.
 *
 * Priority:
 * 1. Empty / missing -> DEFAULT_FONT_FAMILY (shipped stack)
 * 2. Preset token -> resolved var-free stack from theme.json
 * 3. Unknown token slug -> DEFAULT_FONT_FAMILY
 * 4. Literal stack -> passthrough unchanged
 *
 * @param {string|undefined|null} value Stored fontFamily.
 * @return {string} Concrete var-free font stack.
 */
export function resolveFontFamily(value) {
	const trimmed = String(value ?? '').trim();

	if (!trimmed) {
		return DEFAULT_FONT_FAMILY;
	}

	const slug = parseFontFamilyToken(trimmed);
	if (slug) {
		const map = getResolvedFontFamilyMap();
		return map[slug] ?? DEFAULT_FONT_FAMILY;
	}

	return trimmed;
}

export { isFontFamilyToken, parseFontFamilyToken };
