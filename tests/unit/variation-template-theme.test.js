/**
 * Variation template theme layer (slice 3).
 *
 * Merge order: block.json defaults → theme.config → variation overrides.
 * Variations intentionally win on chart-type-specific fields (width, padding, etc.).
 * Tests use layout fields variations leave alone (e.g. mobileBreakpoint).
 */
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
	mergeWithDefaults,
	applyThemeToInnerBlocksTemplate,
} from '../../src/controller/variation-templates/helpers';

const BAR_OVERRIDES = {
	layout: {
		type: 'bar',
		orientation: 'horizontal',
		width: 420,
		padding: { left: 100 },
	},
};

describe('mergeWithDefaults — theme layer', () => {
	beforeEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	afterEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	test('applies theme layout on fields variations do not override', () => {
		window.prcChartBuilderTheme = {
			config: {
				layout: {
					mobileBreakpoint: 600,
					width: 800,
				},
			},
		};

		const merged = mergeWithDefaults(BAR_OVERRIDES);

		// Variation-specific dimensions win over theme.
		expect(merged.layout.width).toBe(420);
		expect(merged.layout.padding.left).toBe(100);
		// Theme applies where the variation is silent (bar.js does not set mobileBreakpoint).
		expect(merged.layout.mobileBreakpoint).toBe(600);
	});
});

describe('applyThemeToInnerBlocksTemplate', () => {
	beforeEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	afterEach(() => {
		window.prcChartBuilderTheme = undefined;
	});

	test('re-applies theme layout on chart inner blocks at insert time', () => {
		window.prcChartBuilderTheme = undefined;
		const chartAttrs = mergeWithDefaults(BAR_OVERRIDES);

		window.prcChartBuilderTheme = {
			config: { layout: { mobileBreakpoint: 720 } },
		};

		const template = [
			['prc-block/table', {}],
			['prc-chart-builder/chart', chartAttrs],
		];

		const [chartEntry] = applyThemeToInnerBlocksTemplate(template).filter(
			(block) =>
				Array.isArray(block) && block[0] === 'prc-chart-builder/chart'
		);

		expect(chartEntry[1].layout.mobileBreakpoint).toBe(720);
		expect(chartEntry[1].layout.width).toBe(420);
	});
});
