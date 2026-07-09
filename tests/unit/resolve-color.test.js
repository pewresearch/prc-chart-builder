import { describe, test, expect } from '@jest/globals';
import {
	resolveColor,
	resolveColorInString,
} from '../../src/chart/utils/resolve-color';

describe('resolveColor', () => {
	test('maps known PRC spectrum hex to light-dark pairs', () => {
		expect(resolveColor('#A2D2C8')).toBe('light-dark(#A2D2C8, #306C60)');
		expect(resolveColor('#456A83')).toBe('light-dark(#456A83, #739EBA)');
	});

	test('wraps unmapped theme.json preset hex in light-dark for format parity', () => {
		expect(resolveColor('#7bdcb5')).toBe('light-dark(#7bdcb5, #7bdcb5)');
		expect(resolveColor('#fcb900')).toBe('light-dark(#fcb900, #fcb900)');
		expect(resolveColor('#f78da7')).toBe('light-dark(#f78da7, #f78da7)');
	});

	test('mixed palette colors resolve to a consistent light-dark format', () => {
		const crazyTheme = ['#A2D2C8', '#7bdcb5', '#fcb900', '#f78da7'];
		expect(crazyTheme.map(resolveColor)).toEqual([
			'light-dark(#A2D2C8, #306C60)',
			'light-dark(#7bdcb5, #7bdcb5)',
			'light-dark(#fcb900, #fcb900)',
			'light-dark(#f78da7, #f78da7)',
		]);
	});

	test('passes through semantic and already-resolved values', () => {
		expect(resolveColor('contrast')).toBe('contrast');
		expect(resolveColor('transparent')).toBe('transparent');
		expect(resolveColor('light-dark(#111, #222)')).toBe(
			'light-dark(#111, #222)'
		);
	});
});

describe('resolveColorInString', () => {
	test('resolves embedded hex using the same fallback rules', () => {
		expect(resolveColorInString('1px solid #7bdcb5')).toBe(
			'1px solid light-dark(#7bdcb5, #7bdcb5)'
		);
	});
});
