import { describe, test, expect } from '@jest/globals';
import {
	resolveCategoryColor,
	resolveCategoryOpacity,
	withCategoryOpacity,
	legendCategoryShapeStyle,
} from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/utilities/resolveCategoryColor';

describe('resolveCategoryColor', () => {
	const dataRender = {
		highlightColor: '#ECDBAC',
		deselectedColor: '#EEECE4',
		deselectedOpacity: 0.4,
		highlightedCategories: ['Republican'],
	};

	test('returns fallback when no categories are highlighted', () => {
		expect(
			resolveCategoryColor({
				category: 'Republican',
				fallback: '#456A83',
				dataRender: {
					...dataRender,
					highlightedCategories: [],
				},
			})
		).toBe('#456A83');
	});

	test('returns highlight color for highlighted category', () => {
		expect(
			resolveCategoryColor({
				category: 'Republican',
				fallback: '#456A83',
				dataRender,
			})
		).toBe('#ECDBAC');
	});

	test('returns deselected color for non-highlighted category', () => {
		expect(
			resolveCategoryColor({
				category: 'Democrat',
				fallback: '#BF3B27',
				dataRender,
			})
		).toBe('#EEECE4');
	});

	test('falls back to base color when highlight colors are missing', () => {
		expect(
			resolveCategoryColor({
				category: 'Republican',
				fallback: '#456A83',
				dataRender: {
					highlightedCategories: ['Republican'],
				},
			})
		).toBe('#456A83');

		expect(
			resolveCategoryColor({
				category: 'Democrat',
				fallback: '#BF3B27',
				dataRender: {
					highlightedCategories: ['Republican'],
				},
			})
		).toBe('#BF3B27');
	});
});

describe('resolveCategoryOpacity', () => {
	const dataRender = {
		highlightColor: '#ECDBAC',
		deselectedColor: '#EEECE4',
		deselectedOpacity: 0.4,
		highlightedCategories: ['Republican'],
	};

	test('returns 1 when no categories are highlighted', () => {
		expect(
			resolveCategoryOpacity({
				category: 'Democrat',
				dataRender: {
					...dataRender,
					highlightedCategories: [],
				},
			})
		).toBe(1);
	});

	test('returns 1 for highlighted category', () => {
		expect(
			resolveCategoryOpacity({
				category: 'Republican',
				dataRender,
			})
		).toBe(1);
	});

	test('returns deselected opacity for non-highlighted category', () => {
		expect(
			resolveCategoryOpacity({
				category: 'Democrat',
				dataRender,
			})
		).toBe(0.4);
	});

	test('falls back to 1 when deselected opacity is missing', () => {
		expect(
			resolveCategoryOpacity({
				category: 'Democrat',
				dataRender: {
					highlightedCategories: ['Republican'],
				},
			})
		).toBe(1);
	});
});

describe('withCategoryOpacity', () => {
	const dataRender = {
		highlightColor: '#ECDBAC',
		deselectedColor: '#EEECE4',
		deselectedOpacity: 0.5,
		highlightedCategories: ['Republican'],
	};

	test('multiplies custom opacity by category opacity', () => {
		expect(withCategoryOpacity(0.8, 'Democrat', dataRender)).toBe(0.4);
	});
});

describe('legendCategoryShapeStyle', () => {
	const dataRender = {
		highlightColor: '#ECDBAC',
		deselectedColor: '#EEECE4',
		deselectedOpacity: 0.25,
		highlightedCategories: ['Republican'],
	};

	test('merges base shape opacity with category opacity', () => {
		expect(
			legendCategoryShapeStyle({ datum: 'Democrat' }, dataRender, () => ({
				opacity: 0.8,
			}))
		).toEqual({ opacity: 0.2 });
	});
});
