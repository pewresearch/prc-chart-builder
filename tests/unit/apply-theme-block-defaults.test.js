/**
 * Slice 3: merge active theme config into chart block attribute defaults (editor).
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
	applyThemeBlockDefaults,
	applyThemeLayoutDefault,
	CHART_BLOCK_NAME,
} from '../../src/chart/utils/apply-theme-block-defaults';

const BLOCK_LAYOUT_DEFAULT = {
	type: 'bar',
	width: 640,
	height: 400,
	padding: {
		top: 20,
		bottom: 25,
		left: 60,
		right: 0,
	},
};

const CHART_BLOCK_SETTINGS = {
	attributes: {
		layout: {
			type: 'object',
			default: BLOCK_LAYOUT_DEFAULT,
		},
	},
};

describe('applyThemeLayoutDefault', () => {
	test('deep-merges theme layout over the block.json default', () => {
		expect(
			applyThemeLayoutDefault(BLOCK_LAYOUT_DEFAULT, {
				padding: { top: 40 },
				width: 720,
			})
		).toEqual({
			type: 'bar',
			width: 720,
			height: 400,
			padding: {
				top: 40,
				bottom: 25,
				left: 60,
				right: 0,
			},
		});
	});

	test('returns block default when theme layout is absent', () => {
		expect(applyThemeLayoutDefault(BLOCK_LAYOUT_DEFAULT, undefined)).toBe(
			BLOCK_LAYOUT_DEFAULT
		);
	});
});

describe('applyThemeBlockDefaults — curated groups (slice 5)', () => {
	beforeEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	afterEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	test('leaves settings unchanged for other blocks', () => {
		const settings = { attributes: {} };
		expect(applyThemeBlockDefaults(settings, 'core/paragraph')).toBe(
			settings
		);
	});

	test('leaves layout default unchanged when theme is empty', () => {
		window.prcChartBuilderTheme = {};

		const result = applyThemeBlockDefaults(
			CHART_BLOCK_SETTINGS,
			CHART_BLOCK_NAME
		);

		expect(result.attributes.layout.default).toEqual(BLOCK_LAYOUT_DEFAULT);
	});

	test('overrides layout default from theme.config.layout', () => {
		window.prcChartBuilderTheme = {
			config: {
				layout: {
					padding: { top: 40 },
					width: 800,
				},
			},
		};

		const result = applyThemeBlockDefaults(
			CHART_BLOCK_SETTINGS,
			CHART_BLOCK_NAME
		);

		expect(result.attributes.layout.default).toEqual({
			type: 'bar',
			width: 800,
			height: 400,
			padding: {
				top: 40,
				bottom: 25,
				left: 60,
				right: 0,
			},
		});
	});

	test('does not mutate the incoming settings object', () => {
		window.prcChartBuilderTheme = {
			config: { layout: { width: 800 } },
		};

		const settings = CHART_BLOCK_SETTINGS;
		applyThemeBlockDefaults(settings, CHART_BLOCK_NAME);

		expect(settings.attributes.layout.default.width).toBe(640);
	});

	test('overrides legend default from theme.config.legend', () => {
		const legendDefault = {
			active: false,
			fontSize: 12,
			fontFamily: "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
		};

		const settings = {
			attributes: {
				layout: CHART_BLOCK_SETTINGS.attributes.layout,
				legend: {
					type: 'object',
					default: legendDefault,
				},
			},
		};

		window.prcChartBuilderTheme = {
			config: {
				legend: {
					fontFamily: 'Georgia, serif',
					fontSize: 14,
				},
			},
		};

		const result = applyThemeBlockDefaults(settings, CHART_BLOCK_NAME);

		expect(result.attributes.legend.default).toEqual({
			active: false,
			fontSize: 14,
			fontFamily: 'Georgia, serif',
		});
	});
});
