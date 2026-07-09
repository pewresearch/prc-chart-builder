/**
 * Font preset token resolution (PRC-528 font tokens).
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { DEFAULT_FONT_FAMILY } from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/defaultFontFamily.ts';
import { formatFontFamilyToken } from '../../src/chart/utils/font-family-tokens';
import {
	getResolvedFontFamilyMap,
	resolveFontFamily,
} from '../../src/chart/utils/resolve-font-family';

const SERIF_STACK = "'abril-text', Georgia, 'Times New Roman', Times, serif";
const SERIF_TOKEN = formatFontFamilyToken('serif');

describe('resolveFontFamily', () => {
	beforeEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	afterEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	test('empty value resolves to DEFAULT_FONT_FAMILY', () => {
		expect(resolveFontFamily('')).toBe(DEFAULT_FONT_FAMILY);
		expect(resolveFontFamily(undefined)).toBe(DEFAULT_FONT_FAMILY);
	});

	test('preset token resolves to the var-free stack from theme.json delivery', () => {
		window.prcChartBuilderTheme = {
			fontFamilies: [
				{ slug: 'serif', name: 'Serif', value: SERIF_STACK },
			],
		};

		expect(resolveFontFamily(SERIF_TOKEN)).toBe(SERIF_STACK);
	});

	test('unknown preset token falls back to DEFAULT_FONT_FAMILY', () => {
		expect(resolveFontFamily(formatFontFamilyToken('missing-slug'))).toBe(
			DEFAULT_FONT_FAMILY
		);
	});

	test('literal stacks pass through unchanged', () => {
		const custom = 'Comic Sans MS, cursive';
		expect(resolveFontFamily(custom)).toBe(custom);
	});

	test('getResolvedFontFamilyMap builds slug index from fontFamilies delivery', () => {
		window.prcChartBuilderTheme = {
			fontFamilies: [
				{
					slug: 'sans-serif',
					name: 'Sans-Serif',
					value: DEFAULT_FONT_FAMILY,
				},
				{ slug: 'serif', name: 'Serif', value: SERIF_STACK },
			],
		};

		expect(getResolvedFontFamilyMap()).toEqual({
			'sans-serif': DEFAULT_FONT_FAMILY,
			serif: SERIF_STACK,
		});
	});
});
