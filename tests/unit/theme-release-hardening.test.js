/**
 * Slice 16 release hardening smoke tests:
 * - palette-by-name resolves from destination site theme (Distributor cross-site)
 * - preset font tokens resolve at render (export / distributor render paths)
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import baseConfig from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/baseConfig.ts';
import { DEFAULT_FONT_FAMILY } from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/defaultFontFamily.ts';
import getConfig from '../../src/chart/utils/get-config';
import { formatFontFamilyToken } from '../../src/chart/utils/font-family-tokens';
import { resolveColor } from '../../src/chart/utils/resolve-color';

const SOURCE_PALETTE = ['#111111', '#222222', '#333333'];
const DESTINATION_PALETTE = ['#AA0000', '#BB1111', '#CC2222'];
const SERIF_STACK = "'abril-text', Georgia, 'Times New Roman', Times, serif";

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
		colorValue: 'brand-blue',
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

describe('theme release hardening (slice 16)', () => {
	beforeEach(() => {
		window.prcChartingLibrary = { baseConfig };
		window.prcCustomCharts = undefined;
		window.prcChartBuilderTheme = undefined;
	});

	afterEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	test('palette-by-name resolves from destination site theme after Distributor cross-site', () => {
		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					'brand-blue': SOURCE_PALETTE,
				},
			},
		};

		const sourceConfig = getConfig(MINIMAL_ATTRIBUTES, 'source-site');
		expect(sourceConfig.colors).toEqual(SOURCE_PALETTE.map(resolveColor));

		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					'brand-blue': DESTINATION_PALETTE,
				},
			},
		};

		const destinationConfig = getConfig(
			MINIMAL_ATTRIBUTES,
			'destination-site'
		);
		expect(destinationConfig.colors).toEqual(
			DESTINATION_PALETTE.map(resolveColor)
		);
	});

	test('getConfig resolves non-default serif preset token for legend fontFamily', () => {
		window.prcChartBuilderTheme = {
			fontFamilies: [
				{ slug: 'serif', name: 'Serif', value: SERIF_STACK },
			],
		};

		const config = getConfig(
			{
				...MINIMAL_ATTRIBUTES,
				legend: {
					active: true,
					fontFamily: formatFontFamilyToken('serif'),
				},
			},
			'font-smoke'
		);

		expect(config.legend.fontFamily).toBe(SERIF_STACK);
		expect(config.legend.fontFamily).not.toBe(DEFAULT_FONT_FAMILY);
	});
});
