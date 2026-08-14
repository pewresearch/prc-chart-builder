import { __ } from '@wordpress/i18n';

import {
	formatFontFamilyToken,
	parseFontFamilyToken,
} from '../../chart/utils/font-family-tokens';
import { TEXT_DOMAIN } from '../constants';

/**
 * Accessors for the site's registered theme.json font families (PRC-528 slice 15).
 *
 * The admin page is not the block editor, so families are delivered by PHP as
 * `window.prcChartBuilderThemeEditor.fontFamilies` (see class-theme-admin.php).
 * Each entry is `{ slug, name, value }`, where `value` is a var-free concrete
 * stack used by the render resolver after token expansion.
 *
 * Charts and theme.config store preset tokens (`var:preset|font-family|<slug>`),
 * not concrete stacks — mirroring palette-by-name for colors.
 *
 * @typedef {{ slug: string, name: string, value: string }} ThemeFont
 */

/**
 * Registered theme.json font families (safe accessor).
 *
 * @return {ThemeFont[]}
 */
export function getThemeFonts() {
	const editor =
		typeof window !== 'undefined'
			? window.prcChartBuilderThemeEditor
			: null;
	const fonts = editor?.fontFamilies;
	return Array.isArray(fonts)
		? fonts.filter(
				(entry) =>
					entry &&
					typeof entry === 'object' &&
					typeof entry.slug === 'string' &&
					entry.slug.trim() !== ''
			)
		: [];
}

/**
 * Registered family name for a stored token or legacy stack.
 *
 * @param {string} tokenOrStack Preset token or concrete font stack.
 * @return {string}
 */
export function getThemeFontName(tokenOrStack) {
	const normalized = String(tokenOrStack ?? '').trim();
	if (!normalized) {
		return normalized;
	}

	const slug = parseFontFamilyToken(normalized);
	const match = getThemeFonts().find((entry) =>
		slug ? entry.slug === slug : entry.value === normalized
	);
	if (match?.name) {
		return match.name;
	}
	return normalized;
}

/**
 * SelectControl options for a font field (inherit + theme families).
 *
 * @return {{ label: string, value: string }[]}
 */
export function getFontSelectOptions() {
	return [
		{
			label: __('Inherit default', TEXT_DOMAIN),
			value: '',
		},
		...getThemeFonts().map((font) => ({
			label: font.name || font.slug,
			value: formatFontFamilyToken(font.slug),
		})),
	];
}
