/**
 * Slice 10: shipped palette/branding defaults are neutral; typography stays franklin-gothic.
 */
import { describe, test, expect } from '@jest/globals';
import baseConfig from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/baseConfig.ts';
import { DEFAULT_FONT_FAMILY } from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/defaultFontFamily.ts';
import {
	colors as shippedColors,
	colorNames as shippedColorNames,
} from '../../src/chart/utils/colors';
import { getResolvedPalettes } from '../../src/chart/utils/resolve-defaults';

describe('shipped neutral defaults (slice 10)', () => {
	test('baseConfig metadata tag is empty', () => {
		expect(baseConfig.metadata.tag).toBe('');
	});

	test('DEFAULT_FONT_FAMILY keeps franklin-gothic shipped stack', () => {
		expect(DEFAULT_FONT_FAMILY).toContain('franklin-gothic-urw');
	});

	test('shipped colors.js exposes a single distinct pink-purple general palette', () => {
		expect(Object.keys(shippedColors)).toEqual(['general']);
		expect(shippedColorNames).toEqual([
			{ label: 'General', value: 'general' },
		]);
		expect(shippedColors.general[0]).toBe('#F687B3');
		expect(shippedColors.general.at(-1)).toBe('#805AD5');
	});

	test('legacy theme palette overrides neutral shipped colors at resolve time', () => {
		const legacyGeneral = ['#456A83', '#BF3B27', '#756a7e', '#ea9e2c'];

		window.prcChartBuilderTheme = {
			palettes: {
				colors: {
					general: legacyGeneral,
				},
			},
		};

		expect(getResolvedPalettes().colors.general).toEqual(legacyGeneral);
	});
});
