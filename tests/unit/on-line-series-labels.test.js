import { describe, expect, test } from '@jest/globals';

import { computeLabelDeclutter } from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/labelLayout/computeLabelDeclutter';
import {
	buildOnLineSeriesLabels,
	getDirectLabelOffsetFromCustom,
	getDirectLabelScaleFactors,
	getSeriesYAtPixelX,
	hasAuthorDirectLabelOverride,
} from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/labelLayout/buildOnLineSeriesLabels';
import { getStackedSeriesDependentValue } from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/labelLayout/buildOnLineSeriesLabels';

describe('getSeriesYAtPixelX', () => {
	test('interpolates y between bracketing points', () => {
		const y = getSeriesYAtPixelX(
			[
				{ px: 0, py: 100 },
				{ px: 200, py: 200 },
			],
			100
		);
		expect(y).toBe(150);
	});

	test('clamps to endpoints outside the series span', () => {
		expect(
			getSeriesYAtPixelX(
				[
					{ px: 50, py: 80 },
					{ px: 150, py: 120 },
				],
				10
			)
		).toBe(80);
		expect(
			getSeriesYAtPixelX(
				[
					{ px: 50, py: 80 },
					{ px: 150, py: 120 },
				],
				200
			)
		).toBe(120);
	});
});

describe('buildOnLineSeriesLabels', () => {
	const baseLegend = {
		active: true,
		variation: 'direct',
		fontSize: 12,
		fontWeight: 'bold',
		customLabels: {},
		categories: [],
	};

	test('emits one label per visible category at the chart midpoint', () => {
		const flattenedData = [
			{ x: 2020, Christians: 28.8, Muslims: 24.1 },
			{ x: 2070, Christians: 35.8, Muslims: 29.1 },
		];

		const inputs = buildOnLineSeriesLabels({
			categories: ['Christians', 'Muslims'],
			flattenedData,
			legend: baseLegend,
			innerWidth: 400,
			independentScale: (v) => (Number(v) - 2020) * 8,
			dependentScale: (v) => 300 - Number(v) * 4,
			getIndependentValue: (d) => d.x,
			padding: { left: 20, top: 10 },
		});

		expect(inputs).toHaveLength(2);
		expect(inputs[0].category).toBe('Christians');
		expect(inputs[0].x).toBe(200);
		expect(inputs[0].text).toBe('Christians');
		expect(inputs[1].category).toBe('Muslims');
	});

	test('uses custom label text and locks author-positioned series', () => {
		const inputs = buildOnLineSeriesLabels({
			categories: ['Christians'],
			flattenedData: [{ x: 2020, Christians: 28.8 }],
			legend: {
				...baseLegend,
				customLabels: {
					Christians: {
						text: 'Christians (custom)',
						offsetX: 120,
						offsetY: 88,
					},
				},
			},
			innerWidth: 200,
			independentScale: () => 100,
			dependentScale: (v) => 200 - Number(v),
			getIndependentValue: (d) => d.x,
			padding: { left: 20, top: 10 },
		});

		expect(inputs[0].text).toBe('Christians (custom)');
		expect(inputs[0].locked).toBe(true);
		expect(hasAuthorDirectLabelOverride({ offsetX: 120 })).toBe(true);
	});

	test('scales author drag offsets when rendered inner width differs from layout reference', () => {
		const layout = {
			width: 800,
			height: 400,
			padding: { left: 20, right: 20, top: 10, bottom: 40 },
		};
		const referenceScales = getDirectLabelScaleFactors(760, 350, layout);
		expect(referenceScales).toEqual({ scaleX: 1, scaleY: 1 });

		const mobileScales = getDirectLabelScaleFactors(380, 175, layout);
		expect(mobileScales).toEqual({ scaleX: 0.5, scaleY: 0.5 });

		const customEntry = { offsetX: 220, offsetY: 110 };
		const anchor = { x: 200, y: 175 };
		const padding = { left: 20, top: 10 };

		const atReference = getDirectLabelOffsetFromCustom(
			customEntry,
			anchor.x,
			anchor.y,
			padding,
			referenceScales
		);
		const atMobile = getDirectLabelOffsetFromCustom(
			customEntry,
			anchor.x,
			anchor.y,
			padding,
			mobileScales
		);

		expect(atReference.dx).toBe(0);
		expect(atReference.dy).toBe(-75);
		expect(atMobile.dx).toBe(-100);
		expect(atMobile.dy).toBe(-125);
	});

	test('anchors stacked-area labels on cumulative stack tops', () => {
		const categories = ['A', 'B'];
		const flattenedData = [
			{ x: 0, A: 10, B: 20 },
			{ x: 100, A: 10, B: 20 },
		];

		const inputs = buildOnLineSeriesLabels({
			categories,
			flattenedData,
			legend: baseLegend,
			innerWidth: 200,
			independentScale: (v) => Number(v) * 2,
			dependentScale: (v) => Number(v),
			getIndependentValue: (d) => d.x,
			getSeriesDependentValue: (d, category, categoryIndex) =>
				getStackedSeriesDependentValue(d, categories, categoryIndex),
			padding: { left: 0, top: 0 },
		});

		expect(inputs[0].y).toBe(10);
		expect(inputs[1].y).toBe(30);
	});
});

describe('direct series label declutter', () => {
	test('separates overlapping on-line series labels', () => {
		const inputs = buildOnLineSeriesLabels({
			categories: ['Series A', 'Series B'],
			flattenedData: [
				{ x: 0, 'Series A': 50, 'Series B': 51 },
				{ x: 100, 'Series A': 50, 'Series B': 51 },
			],
			legend: {
				active: true,
				variation: 'direct',
				fontSize: 12,
				fontWeight: 'normal',
				customLabels: {},
				categories: [],
			},
			innerWidth: 200,
			independentScale: (v) => Number(v) * 2,
			dependentScale: (v) => Number(v),
			getIndependentValue: (d) => d.x,
			padding: { left: 0, top: 0 },
		});

		const offsets = computeLabelDeclutter(inputs, {
			lockX: true,
			anchorStrengthY: 0.5,
			innerWidth: 200,
			innerHeight: 200,
			iterations: 160,
		});

		expect(
			Math.abs(
				(offsets.get(inputs[0].id)?.dy ?? 0) -
					(offsets.get(inputs[1].id)?.dy ?? 0)
			)
		).toBeGreaterThan(6);
	});

	test('author-positioned series stays locked while siblings declutter', () => {
		const inputs = [
			{
				id: 'locked',
				category: 'Locked',
				x: 100,
				y: 100,
				text: 'Locked series',
				defaultDx: 5,
				defaultDy: -3,
				locked: true,
			},
			{
				id: 'free-a',
				category: 'A',
				x: 100,
				y: 100,
				text: 'Series A',
				defaultDx: 0,
				defaultDy: 0,
			},
			{
				id: 'free-b',
				category: 'B',
				x: 100,
				y: 101,
				text: 'Series B',
				defaultDx: 0,
				defaultDy: 0,
			},
		];

		const offsets = computeLabelDeclutter(inputs, {
			lockX: true,
			innerWidth: 300,
			innerHeight: 200,
			iterations: 160,
		});

		expect(offsets.get('locked')).toEqual({ dx: 5, dy: -3 });
		expect(offsets.get('free-a')?.dy).not.toBe(offsets.get('free-b')?.dy);
	});
});
