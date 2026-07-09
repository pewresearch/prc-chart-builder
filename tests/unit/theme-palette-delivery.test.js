/**
 * Slice 2: palette token end-to-end — theme palettes flow through the resolve
 * layer into getConfig (render) and opt out when io.customColors is set.
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import baseConfig from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/baseConfig.ts';
import getConfig from '../../src/chart/utils/get-config';
import { getResolvedPalettes } from '../../src/chart/utils/resolve-defaults';
import { resolveColor } from '../../src/chart/utils/resolve-color';
import { colors as staticColors } from '../../src/chart/utils/colors';

const THEME_GENERAL = ['#111111', '#222222', '#333333'];

/** Minimal v2 chart attributes sufficient for getConfig color resolution. */
const MINIMAL_ATTRIBUTES = {
	layout: {
		type: 'bar',
		width: 640,
		height: 400,
	},
	metadata: {
		active: true,
		title: 'Test',
		alt: '',
	},
	io: {
		colorValue: 'general',
		customColors: [],
		chartData: [{ x: 'A', y: 10 }],
		isFreeformChart: false,
	},
	independentAxis: {
		scale: 'linear',
		domain: [0, 100],
		tickValues: null,
	},
	dependentAxis: {
		scale: 'linear',
		domain: [0, 100],
		tickValues: null,
	},
	plotBands: {},
	annotations: {},
	bar: {},
	line: {},
	explodedBar: {},
	labels: {},
	shapes: {},
	pie: {},
	dotPlot: { connectingLine: {} },
	map: {},
	divergingBar: {},
	drawings: [],
	customTickLabels: {},
	customLegendLabels: {},
	diffColumn: {},
	netValues: {},
	dataRender: {},
	legend: {},
	nodes: {},
	tooltip: {},
	treemap: {},
	sankey: {},
	regression: {},
	errorBars: { defaultStyles: {} },
	animation: {},
};

describe('theme palette delivery (slice 2)', () => {
	beforeEach(() => {
		window.prcChartingLibrary = { baseConfig };
		window.prcCustomCharts = undefined;
		window.prcChartBuilderTheme = undefined;
	});

	afterEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	test('getResolvedPalettes reads palette overrides from window.prcChartBuilderTheme', () => {
		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					general: THEME_GENERAL,
				},
			},
		};

		const { colors } = getResolvedPalettes();
		expect(colors.general).toEqual(THEME_GENERAL);
	});

	test('seeded legacy theme general palette overrides neutral shipped default', () => {
		const legacyGeneral = ['#456A83', '#BF3B27', '#756a7e', '#ea9e2c'];

		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					general: legacyGeneral,
				},
			},
		};

		const config = getConfig(MINIMAL_ATTRIBUTES, 'test-client');
		expect(config.colors).toEqual(legacyGeneral.map(resolveColor));
	});

	test('getConfig resolves colors from the themed palette when referenced by name', () => {
		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					general: THEME_GENERAL,
				},
			},
		};

		const config = getConfig(MINIMAL_ATTRIBUTES, 'test-client');
		expect(config.colors).toEqual(THEME_GENERAL.map(resolveColor));
	});

	test('getConfig keeps io.customColors when set (palette-by-name opt-out)', () => {
		const custom = ['#FF0000', '#00FF00'];

		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					general: THEME_GENERAL,
				},
			},
		};

		const config = getConfig(
			{
				...MINIMAL_ATTRIBUTES,
				io: {
					...MINIMAL_ATTRIBUTES.io,
					customColors: custom,
				},
			},
			'test-client'
		);

		expect(config.colors).toEqual(custom.map(resolveColor));
	});

	test('empty theme uses shipped palette in getConfig (no-op == trunk)', () => {
		window.prcChartBuilderTheme = {};

		const config = getConfig(MINIMAL_ATTRIBUTES, 'test-client');
		expect(config.colors).toEqual(staticColors.general.map(resolveColor));
	});

	test('getConfig falls back to general when a named palette is missing from theme', () => {
		window.prcChartBuilderTheme = {
			config: { layout: { padding: { top: 40 }, width: 800 } },
		};

		const config = getConfig(
			{
				...MINIMAL_ATTRIBUTES,
				io: {
					...MINIMAL_ATTRIBUTES.io,
					colorValue: 'politics-main',
				},
			},
			'test-client'
		);

		expect(config.colors).toEqual(staticColors.general.map(resolveColor));
	});
});
