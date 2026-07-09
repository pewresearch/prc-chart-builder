/**
 * WordPress preset font-family token helpers (PRC-528 font tokens).
 *
 * Charts store `var:preset|font-family|<slug>` and resolve to concrete stacks
 * at render, mirroring palette-by-name for colors.
 */

/** @type {string} WordPress block-editor preset token prefix. */
export const FONT_FAMILY_TOKEN_PREFIX = 'var:preset|font-family|';

/**
 * @param {string} slug theme.json fontFamilies slug.
 * @return {string} Preset token for block attribute storage.
 */
export function formatFontFamilyToken(slug) {
	return `${FONT_FAMILY_TOKEN_PREFIX}${String(slug ?? '').trim()}`;
}

/**
 * @param {string} value Stored fontFamily attribute or theme.config value.
 * @return {string|null} Slug when value is a preset token; otherwise null.
 */
export function parseFontFamilyToken(value) {
	const trimmed = String(value ?? '').trim();
	if (!trimmed.startsWith(FONT_FAMILY_TOKEN_PREFIX)) {
		return null;
	}

	const slug = trimmed.slice(FONT_FAMILY_TOKEN_PREFIX.length).trim();
	return slug || null;
}

/**
 * @param {string} value Candidate fontFamily value.
 * @return {boolean} True when value is a preset token.
 */
export function isFontFamilyToken(value) {
	return parseFontFamilyToken(value) !== null;
}
