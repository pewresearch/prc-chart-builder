/**
 * @jest-environment jsdom
 */
import { formatFontFamilyToken } from '../../src/chart/utils/font-family-tokens';
import {
	getThemeFonts,
	getThemeFontName,
	getFontSelectOptions,
} from '../../src/settings/theme-fonts';

describe('getThemeFonts', () => {
	afterEach(() => {
		delete window.prcChartBuilderThemeEditor;
	});

	it('returns an empty array when the global is missing', () => {
		expect(getThemeFonts()).toEqual([]);
	});

	it('returns delivered font families and drops malformed entries', () => {
		window.prcChartBuilderThemeEditor = {
			fontFamilies: [
				{
					slug: 'sans-serif',
					name: 'Sans-Serif',
					value: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				},
				null,
				{ slug: 'broken' },
			],
		};
		expect(getThemeFonts()).toEqual([
			{
				slug: 'sans-serif',
				name: 'Sans-Serif',
				value: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
			},
			{ slug: 'broken' },
		]);
	});
});

describe('getThemeFontName', () => {
	afterEach(() => {
		delete window.prcChartBuilderThemeEditor;
	});

	it('returns the registered family name for a preset token', () => {
		window.prcChartBuilderThemeEditor = {
			fontFamilies: [
				{
					slug: 'serif',
					name: 'Serif',
					value: "'abril-text', Georgia, 'Times New Roman', Times, serif",
				},
			],
		};
		expect(getThemeFontName(formatFontFamilyToken('serif'))).toBe('Serif');
	});

	it('returns the registered family name for a legacy stored stack', () => {
		window.prcChartBuilderThemeEditor = {
			fontFamilies: [
				{
					slug: 'serif',
					name: 'Serif',
					value: "'abril-text', Georgia, 'Times New Roman', Times, serif",
				},
			],
		};
		expect(
			getThemeFontName(
				"'abril-text', Georgia, 'Times New Roman', Times, serif"
			)
		).toBe('Serif');
	});

	it('falls back to the stored value when no family matches', () => {
		expect(getThemeFontName('Comic Sans MS, cursive')).toBe(
			'Comic Sans MS, cursive'
		);
	});
});

describe('getFontSelectOptions', () => {
	afterEach(() => {
		delete window.prcChartBuilderThemeEditor;
	});

	it('builds inherit-default plus preset token options', () => {
		window.prcChartBuilderThemeEditor = {
			fontFamilies: [
				{
					slug: 'sans-serif',
					name: 'Sans-Serif',
					value: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				},
				{
					slug: 'georgia',
					name: 'Georgia',
					value: "Georgia, 'Times New Roman', Times, serif",
				},
			],
		};

		expect(getFontSelectOptions()).toEqual([
			{ label: 'Inherit default', value: '' },
			{
				label: 'Sans-Serif',
				value: 'var:preset|font-family|sans-serif',
			},
			{
				label: 'Georgia',
				value: 'var:preset|font-family|georgia',
			},
		]);
	});
});
