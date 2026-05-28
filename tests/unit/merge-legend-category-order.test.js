import { describe, test, expect } from '@jest/globals';
import { getAvailableLegendCategories } from '../../src/chart/utils/get-available-legend-categories';
import {
	isLegendCategoryOrderStale,
	mergeLegendCategoryOrder,
} from '../../src/chart/utils/merge-legend-category-order';

describe('mergeLegendCategoryOrder', () => {
	test('preserves custom relative order when sets match', () => {
		expect(
			mergeLegendCategoryOrder(['C', 'A', 'B'], ['A', 'B', 'C'])
		).toEqual(['C', 'A', 'B']);
	});

	test('appends newly available categories at the end', () => {
		expect(
			mergeLegendCategoryOrder(
				['C', 'A', 'B'],
				['A', 'B', 'C', 'Neutral']
			)
		).toEqual(['C', 'A', 'B', 'Neutral']);
	});

	test('drops categories no longer available', () => {
		expect(
			mergeLegendCategoryOrder(
				['C', 'A', 'B', 'Neutral'],
				['A', 'B', 'C']
			)
		).toEqual(['C', 'A', 'B']);
	});

	test('returns available order when persisted order is empty', () => {
		expect(mergeLegendCategoryOrder([], ['A', 'B', 'C'])).toEqual([
			'A',
			'B',
			'C',
		]);
	});

	test('preserves persisted order when no categories are available', () => {
		expect(mergeLegendCategoryOrder(['A', 'B'], [])).toEqual(['A', 'B']);
	});

	test('returns empty array when both persisted and available are empty', () => {
		expect(mergeLegendCategoryOrder([], [])).toEqual([]);
	});
});

describe('isLegendCategoryOrderStale', () => {
	test('returns false when persisted order is empty', () => {
		expect(isLegendCategoryOrderStale([], ['A', 'B'])).toBe(false);
	});

	test('returns true when available categories were added', () => {
		expect(
			isLegendCategoryOrderStale(['A', 'B'], ['A', 'B', 'Neutral'])
		).toBe(true);
	});

	test('returns false when persisted order matches merged result', () => {
		expect(
			isLegendCategoryOrderStale(['C', 'A', 'B'], ['A', 'B', 'C'])
		).toBe(false);
	});
});

describe('getAvailableLegendCategories', () => {
	const baseDivergingBar = {
		negativeCategories: ['Neg A', 'Neg B'],
		positiveCategories: ['Pos A', 'Pos B'],
		neutralBar: {
			active: false,
			category: 'Neutral',
		},
		secondary: {
			active: false,
			showInLegend: false,
			negativeCategories: ['Sec Neg'],
			positiveCategories: ['Sec Pos'],
		},
	};

	test('returns negative and positive categories for diverging bar', () => {
		expect(
			getAvailableLegendCategories({
				chartType: 'diverging-bar',
				divergingBar: baseDivergingBar,
			})
		).toEqual(['Neg A', 'Neg B', 'Pos A', 'Pos B']);
	});

	test('includes neutral category when neutral bar is active', () => {
		expect(
			getAvailableLegendCategories({
				chartType: 'diverging-bar',
				divergingBar: {
					...baseDivergingBar,
					neutralBar: {
						active: true,
						category: 'Neutral',
					},
				},
			})
		).toEqual(['Neg A', 'Neg B', 'Pos A', 'Pos B', 'Neutral']);
	});

	test('includes secondary categories when overlay is shown in legend', () => {
		expect(
			getAvailableLegendCategories({
				chartType: 'diverging-bar',
				divergingBar: {
					...baseDivergingBar,
					secondary: {
						...baseDivergingBar.secondary,
						active: true,
						showInLegend: true,
					},
				},
			})
		).toEqual(['Neg A', 'Neg B', 'Pos A', 'Pos B', 'Sec Neg', 'Sec Pos']);
	});

	test('returns group names for grouped treemap charts, not column keys', () => {
		expect(
			getAvailableLegendCategories({
				chartType: 'treemap',
				io: {
					availableCategories: ['y', 'category'],
					chartData: [
						{ x: 'Waffles', y: '40', category: 'Breakfast' },
						{ x: 'Salad', y: '30', category: 'Lunch' },
						{ x: 'Pasta', y: '50', category: 'Dinner' },
					],
				},
				dataRender: {
					categories: ['y'],
					groupBreaksActive: true,
					groupBreaksCategory: 'category',
				},
			})
		).toEqual(['Breakfast', 'Lunch', 'Dinner']);
	});

	test('omits blank group values from grouped treemap legend categories', () => {
		expect(
			getAvailableLegendCategories({
				chartType: 'treemap',
				io: {
					chartData: [
						{ x: 'Waffles', y: '40', category: 'Breakfast' },
						{ x: 'Mystery', y: '10', category: null },
						{ x: 'Unknown', y: '5', category: '' },
					],
				},
				dataRender: {
					categories: ['y'],
					groupBreaksActive: true,
					groupBreaksCategory: 'category',
				},
			})
		).toEqual(['Breakfast']);
	});

	test('honors group order for treemap charts', () => {
		expect(
			getAvailableLegendCategories({
				chartType: 'treemap',
				io: {
					chartData: [
						{ x: 'Waffles', y: '40', category: 'Breakfast' },
						{ x: 'Salad', y: '30', category: 'Lunch' },
					],
				},
				dataRender: {
					categories: ['y'],
					groupBreaksActive: true,
					groupBreaksCategory: 'category',
					groupBreaksCategoryValues: ['Lunch', 'Breakfast'],
				},
			})
		).toEqual(['Lunch', 'Breakfast']);
	});

	test('returns leaf labels for ungrouped treemap charts', () => {
		expect(
			getAvailableLegendCategories({
				chartType: 'treemap',
				io: {
					availableCategories: ['y'],
					chartData: [
						{ x: 'Waffles', y: '40' },
						{ x: 'Salad', y: '30' },
					],
				},
				dataRender: { categories: ['y'] },
			})
		).toEqual(['Waffles', 'Salad']);
	});

	test('returns node names for sankey charts, not column keys', () => {
		expect(
			getAvailableLegendCategories({
				chartType: 'sankey',
				io: {
					availableCategories: ['x', 'target', 'value'],
					chartData: [
						{ x: 'Coal', target: 'Electricity', value: '25' },
						{
							x: 'Electricity',
							target: 'Residential',
							value: '35',
						},
					],
				},
				dataRender: { categories: ['value'] },
				sankey: {
					sourceKey: 'x',
					targetKey: 'target',
					valueKey: 'value',
				},
			})
		).toEqual(['Coal', 'Electricity', 'Residential']);
	});

	test('merges custom treemap group order with newly available groups', () => {
		const available = getAvailableLegendCategories({
			chartType: 'treemap',
			io: {
				chartData: [
					{ x: 'Waffles', y: '40', category: 'Breakfast' },
					{ x: 'Salad', y: '30', category: 'Lunch' },
					{ x: 'Pasta', y: '50', category: 'Dinner' },
				],
			},
			dataRender: {
				categories: ['y'],
				groupBreaksActive: true,
				groupBreaksCategory: 'category',
			},
		});

		expect(
			mergeLegendCategoryOrder(['Dinner', 'Breakfast'], available)
		).toEqual(['Dinner', 'Breakfast', 'Lunch']);
	});
});
