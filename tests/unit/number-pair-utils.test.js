import {
	defaultNumberPair,
	formatNumberPairValue,
	parseNumberPairInput,
} from '../../src/settings/number-pair-utils';

describe('number-pair-utils', () => {
	it('falls back to [0, 100] when shipped default is missing', () => {
		expect(defaultNumberPair(undefined)).toEqual([0, 100]);
	});

	it('parses a complete pair override', () => {
		expect(parseNumberPairInput('10', '90', [0, 100])).toEqual([10, 90]);
	});

	it('fills missing side from shipped defaults', () => {
		expect(parseNumberPairInput('10', '', [0, 100])).toEqual([10, 100]);
		expect(parseNumberPairInput('', '90', [0, 100])).toEqual([0, 90]);
	});

	it('returns undefined when both sides are empty', () => {
		expect(parseNumberPairInput('', '', [0, 100])).toBeUndefined();
	});

	it('formats stored pairs for read-only display', () => {
		expect(formatNumberPairValue([0, 100])).toBe('[0, 100]');
	});
});
