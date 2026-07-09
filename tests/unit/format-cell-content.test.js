/**
 * @jest-environment jsdom
 */
import { describe, test, expect } from '@jest/globals';
import {
	formatCellContentTyped,
	sanitizeNumericString,
} from '../../src/chart/utils/helpers';

describe('sanitizeNumericString', () => {
	test('preserves trailing zeros in decimal strings', () => {
		expect(sanitizeNumericString('1.50')).toBe('1.50');
		expect(sanitizeNumericString('2.00')).toBe('2.00');
	});

	test('strips currency and percentage symbols without losing precision', () => {
		expect(sanitizeNumericString('$1,234.50')).toBe('1234.50');
		expect(sanitizeNumericString('45.0%')).toBe('45.0');
	});
});

describe('formatCellContentTyped', () => {
	const columnMeta = [
		{ dataType: 'text' },
		{ dataType: 'number' },
		{ dataType: 'percentage' },
	];

	test('keeps typed numeric columns as strings to preserve trailing zeros', () => {
		expect(
			formatCellContentTyped(
				'1.50',
				'Value',
				columnMeta,
				1,
				'linear',
				null,
				'ordinal',
				null
			)
		).toBe('1.50');

		expect(
			formatCellContentTyped(
				'45.0%',
				'Share',
				columnMeta,
				2,
				'linear',
				null,
				'ordinal',
				null
			)
		).toBe('45.0');
	});
});
