import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
	deepMergeDefaults,
	getResolvedPalettes,
	resolveChartSeriesColors,
	applyGlobalTokens,
	getStaticBaseConfig,
} from '../../src/chart/utils/resolve-defaults';
import {
	colors as staticColors,
	colorNames as staticColorNames,
} from '../../src/chart/utils/colors';

const STATIC_BASE = {
	layout: { padding: { top: 0 }, width: 640 },
	tooltip: { active: false, style: { fontFamily: 'static-font' } },
	labels: { fontFamily: 'static-font' },
};

describe('resolve-defaults — empty theme (Phase 0 no-op)', () => {
	beforeEach(() => {
		window.prcChartBuilderTheme = undefined;
		window.prcChartingLibrary = { baseConfig: STATIC_BASE };
		window.prcCustomCharts = undefined;
	});

	test('getResolvedPalettes returns shipped colors and colorNames when theme is unset', () => {
		expect(getResolvedPalettes()).toEqual({
			colors: staticColors,
			colorNames: staticColorNames,
		});
	});

	test('getResolvedPalettes ignores corrupt list-shaped theme colors', () => {
		window.prcChartBuilderTheme = {
			palettes: {
				colors: [],
				colorNames: [
					{ label: 'Politics Main', value: 'politics-main' },
				],
			},
		};

		expect(getResolvedPalettes().colors).toEqual(staticColors);
	});

	test('applyGlobalTokens is identity when typography token is absent', () => {
		const config = { labels: { fontFamily: 'chart-font' } };
		expect(applyGlobalTokens(config)).toBe(config);
	});
});

describe('resolve-defaults — theme overrides', () => {
	beforeEach(() => {
		window.prcChartingLibrary = { baseConfig: STATIC_BASE };
		window.prcCustomCharts = undefined;
	});

	afterEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	test('getResolvedPalettes merges theme palette color maps', () => {
		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					general: ['#111111', '#222222'],
					'custom-brand': ['#abcdef'],
				},
			},
		};

		const resolved = getResolvedPalettes();
		expect(resolved.colors.general).toEqual(['#111111', '#222222']);
		expect(resolved.colors['custom-brand']).toEqual(['#abcdef']);
		expect(resolved.colors['politics-main']).toBeUndefined();
	});

	test('getResolvedPalettes derives colorNames from theme palette keys when labels are omitted', () => {
		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					general: ['#111111'],
					'politics-main': ['#222222'],
				},
			},
		};

		expect(getResolvedPalettes().colorNames).toEqual([
			{ label: 'General', value: 'general' },
			{ label: 'Politics Main', value: 'politics-main' },
		]);
	});

	test('resolveChartSeriesColors falls back to general for unknown palette names', () => {
		expect(
			resolveChartSeriesColors([], 'politics-main', staticColors)
		).toEqual(staticColors.general);
	});

	test('applyGlobalTokens is a no-op even when typography token is present', () => {
		window.prcChartBuilderTheme = {
			typography: { fontFamily: 'Theme Sans, sans-serif' },
		};

		const config = {
			independentAxis: {
				tickLabels: { fontFamily: 'saved-font' },
			},
			labels: { fontFamily: 'saved-font' },
		};

		expect(applyGlobalTokens(config)).toBe(config);
		expect(applyGlobalTokens(config)).toEqual(config);
	});
});

describe('deepMergeDefaults', () => {
	test('arrays replace wholesale', () => {
		expect(
			deepMergeDefaults({ colors: ['#a', '#b'] }, { colors: ['#z'] })
		).toEqual({ colors: ['#z'] });
	});
});

describe('getStaticBaseConfig', () => {
	test('prefers prcCustomCharts over prcChartingLibrary', () => {
		window.prcCustomCharts = { baseConfig: { layout: { width: 1 } } };
		window.prcChartingLibrary = { baseConfig: { layout: { width: 2 } } };
		expect(getStaticBaseConfig()).toEqual({ layout: { width: 1 } });
	});
});
