/**
 * PRC-528: theme.config base config (per-role fonts, axes, layout, etc.) is
 * "new charts only". An existing chart whose saved attributes lack a given key
 * must render from the shipped default, never the live theme value — otherwise
 * editing the site chart theme retroactively restyles already-published charts.
 *
 * New charts freeze the theme value into their attributes at insert
 * (apply-theme-block-defaults), so they are unaffected by rendering from the
 * static base; only the un-frozen (legacy) population is protected here.
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { formatFontFamilyToken } from '../../src/chart/utils/font-family-tokens';
import baseConfig from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/baseConfig.ts';
import getConfig from '../../src/chart/utils/get-config';

const THEME_SERIF = "'Georgia', Times, serif";
const SERIF_STACK = "'abril-text', Georgia, 'Times New Roman', Times, serif";
const SERIF_TOKEN = formatFontFamilyToken('serif');

/** Minimal v2 chart attributes sufficient for getConfig to build a legend. */
const MINIMAL_ATTRIBUTES = {
	layout: { type: 'bar', width: 640, height: 400 },
	metadata: { active: true, title: 'Test', alt: '' },
	io: {
		colorValue: 'general',
		customColors: [],
		chartData: [{ x: 'A', y: 10 }],
		isFreeformChart: false,
	},
	independentAxis: { scale: 'linear', domain: [0, 100], tickValues: null },
	dependentAxis: { scale: 'linear', domain: [0, 100], tickValues: null },
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

describe('render base config is theme-independent (new charts only)', () => {
	beforeEach(() => {
		window.prcChartingLibrary = { baseConfig };
		window.prcCustomCharts = undefined;
		window.prcChartBuilderTheme = undefined;
	});

	afterEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	test('existing chart missing legend.fontFamily does not inherit the theme.config font at render', () => {
		window.prcChartBuilderTheme = {
			config: { legend: { fontFamily: THEME_SERIF } },
		};

		const config = getConfig(MINIMAL_ATTRIBUTES, 'test-client');

		expect(config.legend.fontFamily).toBe(baseConfig.legend.fontFamily);
		expect(config.legend.fontFamily).not.toBe(THEME_SERIF);
	});

	test('a chart with a saved legend.fontFamily keeps it (new charts freeze the theme value at insert)', () => {
		// A new chart freezes the active theme token into its attributes at
		// insert; get-config resolves the token to a concrete stack at render.
		window.prcChartBuilderTheme = {
			config: { legend: { fontFamily: THEME_SERIF } },
			fontFamilies: [
				{ slug: 'serif', name: 'Serif', value: SERIF_STACK },
			],
		};

		const config = getConfig(
			{
				...MINIMAL_ATTRIBUTES,
				legend: { fontFamily: SERIF_TOKEN },
			},
			'test-client'
		);

		expect(config.legend.fontFamily).toBe(SERIF_STACK);
	});

	test('literal custom fontFamily passes through unchanged at render', () => {
		window.prcChartBuilderTheme = {
			fontFamilies: [
				{ slug: 'serif', name: 'Serif', value: SERIF_STACK },
			],
		};

		const frozenFont = "'Comic Sans MS', cursive";
		const config = getConfig(
			{
				...MINIMAL_ATTRIBUTES,
				legend: { fontFamily: frozenFont },
			},
			'test-client'
		);

		expect(config.legend.fontFamily).toBe(frozenFont);
	});

	test('existing chart missing legend border styling does not inherit baseConfig box defaults', () => {
		const config = getConfig(
			{
				...MINIMAL_ATTRIBUTES,
				legend: { active: true },
			},
			'test-client'
		);

		expect(config.legend.borderStroke).toBe('');
		expect(config.legend.fill).toBe('');
	});

	test('saved empty legend.borderStroke does not render a legend box border', () => {
		const config = getConfig(
			{
				...MINIMAL_ATTRIBUTES,
				legend: { active: true, borderStroke: '', fill: '' },
			},
			'test-client'
		);

		expect(config.legend.borderStroke).toBe('');
		expect(config.legend.fill).toBe('');
	});

	test('getConfig resolves preset font tokens on annotation items', () => {
		window.prcChartBuilderTheme = {
			fontFamilies: [
				{ slug: 'serif', name: 'Serif', value: SERIF_STACK },
			],
		};

		const config = getConfig(
			{
				...MINIMAL_ATTRIBUTES,
				annotations: {
					active: true,
					items: [
						{
							text: 'Label',
							fontFamily: SERIF_TOKEN,
						},
					],
				},
			},
			'test-client'
		);

		expect(config.annotations.items[0].fontFamily).toBe(SERIF_STACK);
	});
});
