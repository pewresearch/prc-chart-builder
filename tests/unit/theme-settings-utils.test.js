/**
 * @jest-environment jsdom
 */
import { CURATED_CONFIG_GROUPS } from '../../src/settings/constants';
import {
	deepMergePartial,
	formatGroupLabel,
	isThemeEmpty,
} from '../../src/settings/utils';

describe('deepMergePartial', () => {
	it('merges nested objects without clobbering sibling keys', () => {
		expect(
			deepMergePartial(
				{
					width: 640,
					padding: { top: 20, bottom: 25 },
				},
				{
					padding: { top: 40 },
				}
			)
		).toEqual({
			width: 640,
			padding: { top: 40, bottom: 25 },
		});
	});
});

describe('formatGroupLabel', () => {
	it('converts camelCase keys to title labels', () => {
		expect(formatGroupLabel('independentAxis')).toBe('Independent Axis');
		expect(formatGroupLabel('dotPlot')).toBe('Dot Plot');
		expect(formatGroupLabel('layout')).toBe('Layout');
	});
});

describe('isThemeEmpty', () => {
	it('returns true for empty or missing theme payloads', () => {
		expect(isThemeEmpty({})).toBe(true);
		expect(isThemeEmpty({ config: {}, palettes: {} })).toBe(true);
	});

	it('returns false when config or palettes are present', () => {
		expect(
			isThemeEmpty({
				config: { layout: { width: 640 } },
			})
		).toBe(false);

		expect(
			isThemeEmpty({
				palettes: {
					colorNames: [{ label: 'General', value: 'general' }],
				},
			})
		).toBe(false);
	});
});

describe('CURATED_CONFIG_GROUPS', () => {
	it('matches the PHP curated group count', () => {
		expect(CURATED_CONFIG_GROUPS).toHaveLength(24);
		expect(CURATED_CONFIG_GROUPS[0]).toBe('layout');
		expect(CURATED_CONFIG_GROUPS).toContain('annotations');
	});
});
