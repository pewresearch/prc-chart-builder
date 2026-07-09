/**
 * @jest-environment jsdom
 */
import {
	getThemeColors,
	extractHex,
	extractDarkHex,
	colorForPreviewMode,
	getColorDisplayValue,
	getThemeColorName,
	inferThemeColorGroup,
	groupThemeColors,
} from '../../src/settings/theme-colors';

describe('getThemeColors', () => {
	afterEach(() => {
		delete window.prcChartBuilderThemeEditor;
	});

	it('returns an empty array when the global is missing', () => {
		expect(getThemeColors()).toEqual([]);
	});

	it('returns the delivered theme colors and drops malformed entries', () => {
		window.prcChartBuilderThemeEditor = {
			themeColors: [
				{ slug: 'ui-white', name: 'UI White', color: '#ffffff' },
				null,
				{ slug: 'broken' },
			],
		};
		expect(getThemeColors()).toEqual([
			{ slug: 'ui-white', name: 'UI White', color: '#ffffff' },
		]);
	});
});

describe('extractHex', () => {
	it('pulls the light component out of light-dark()', () => {
		expect(extractHex('light-dark(#456A83, #739EBA)')).toBe('#456A83');
	});

	it('passes through plain hex and unknown formats', () => {
		expect(extractHex('#BF3B27')).toBe('#BF3B27');
		expect(extractHex('rgba(0,0,0,0.5)')).toBe('rgba(0,0,0,0.5)');
	});
});

describe('extractDarkHex', () => {
	it('pulls the dark component out of light-dark()', () => {
		expect(extractDarkHex('light-dark(#456A83, #739EBA)')).toBe('#739EBA');
	});
});

describe('colorForPreviewMode', () => {
	it('returns light or dark hex from a stored swatch', () => {
		expect(colorForPreviewMode('#456A83', 'light')).toBe('#456A83');
		expect(colorForPreviewMode('#456A83', 'dark')).toBe('#739EBA');
	});
});

describe('getColorDisplayValue', () => {
	afterEach(() => {
		delete window.prcChartBuilderThemeEditor;
	});

	it('prefers the registered theme color over the static resolver', () => {
		window.prcChartBuilderThemeEditor = {
			themeColors: [
				{
					slug: 'gray-blue-primary',
					name: 'Gray Blue Primary',
					color: 'light-dark(#456A83, #739EBA)',
				},
			],
		};
		expect(getColorDisplayValue('#456A83')).toBe(
			'light-dark(#456A83, #739EBA)'
		);
	});
});

describe('getThemeColorName', () => {
	afterEach(() => {
		delete window.prcChartBuilderThemeEditor;
	});

	it('returns the registered theme color name for a stored hex', () => {
		window.prcChartBuilderThemeEditor = {
			themeColors: [
				{
					slug: 'gray-blue-spectrum-primary',
					name: 'Gray Blue Spectrum Primary',
					color: 'light-dark(#456A83, #739EBA)',
				},
			],
		};
		expect(getThemeColorName('#456A83')).toBe('Gray Blue Spectrum Primary');
	});

	it('falls back to the hex when no theme color matches', () => {
		expect(getThemeColorName('#ABCDEF')).toBe('#ABCDEF');
	});
});

describe('inferThemeColorGroup', () => {
	it('detects UI colors from name or slug', () => {
		expect(
			inferThemeColorGroup({
				name: 'UI White',
				slug: 'ui-white',
				color: '#fff',
			})
		).toBe('UI');
		expect(
			inferThemeColorGroup({
				name: 'Link',
				slug: 'ui-link-color',
				color: '#000',
			})
		).toBe('UI');
	});

	it('detects spectrum groups from PRC-style names and slugs', () => {
		expect(
			inferThemeColorGroup({
				name: 'Blue Spectrum Primary',
				slug: 'blue-spectrum-primary',
				color: '#006699',
			})
		).toBe('Blue Spectrum');
		expect(
			inferThemeColorGroup({
				name: 'Primary',
				slug: 'gray-blue-spectrum-primary',
				color: '#456A83',
			})
		).toBe('Gray Blue Spectrum');
	});

	it('falls back to Other for ungrouped palette entries', () => {
		expect(
			inferThemeColorGroup({
				name: 'Primary',
				slug: 'primary',
				color: '#000',
			})
		).toBe('Other');
	});
});

describe('groupThemeColors', () => {
	it('clusters colors by group while preserving palette order', () => {
		const colors = [
			{ name: 'UI White', slug: 'ui-white', color: '#fff' },
			{ name: 'UI Black', slug: 'ui-black', color: '#000' },
			{
				name: 'Blue Spectrum Primary',
				slug: 'blue-spectrum-primary',
				color: '#006699',
			},
		];

		expect(groupThemeColors(colors)).toEqual([
			{ label: 'UI', colors: [colors[0], colors[1]] },
			{ label: 'Blue Spectrum', colors: [colors[2]] },
		]);
	});

	it('returns a single bucket for generic palettes', () => {
		const colors = [
			{ name: 'Primary', slug: 'primary', color: '#000' },
			{ name: 'Secondary', slug: 'secondary', color: '#111' },
		];

		expect(groupThemeColors(colors)).toEqual([{ label: 'Other', colors }]);
	});
});
