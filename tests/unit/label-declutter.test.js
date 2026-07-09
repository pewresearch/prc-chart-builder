import { describe, expect, test } from '@jest/globals';

import { computeLabelDeclutter } from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/labelLayout/computeLabelDeclutter';

function rectsOverlap(a, b, padding = 0) {
	const ax2 = a.x + a.width + padding;
	const ay2 = a.y + a.height + padding;
	const bx2 = b.x + b.width + padding;
	const by2 = b.y + b.height + padding;
	return !(ax2 <= b.x || bx2 <= a.x || ay2 <= b.y || by2 <= a.y);
}

function positionedBoxes(inputs, offsets) {
	return inputs.map((input) => {
		const offset = offsets.get(input.id) ?? { dx: 0, dy: 0 };
		const width = Math.max(
			input.text.length * (input.fontSize ?? 12) * 0.55,
			12
		);
		const height = input.fontSize ?? 12;
		return {
			id: input.id,
			x: input.x + offset.dx - width / 2,
			y: input.y + offset.dy - height / 2,
			width,
			height,
		};
	});
}

describe('computeLabelDeclutter', () => {
	test('separates two overlapping labels on the y axis when x is locked', () => {
		const inputs = [
			{
				id: 'a',
				x: 100,
				y: 100,
				text: 'Series A 50%',
				defaultDx: -25,
				defaultDy: 0,
			},
			{
				id: 'b',
				x: 100,
				y: 102,
				text: 'Series B 48%',
				defaultDx: -25,
				defaultDy: 0,
			},
		];

		const offsets = computeLabelDeclutter(inputs, {
			lockX: true,
			innerWidth: 400,
			innerHeight: 300,
			iterations: 160,
		});

		const boxes = positionedBoxes(inputs, offsets);
		expect(rectsOverlap(boxes[0], boxes[1], 2)).toBe(false);
		expect(offsets.get('a')?.dy).not.toBe(offsets.get('b')?.dy);
	});

	test('leaves well-separated labels untouched (no spurious movement)', () => {
		const inputs = [
			{
				id: 'a',
				x: 100,
				y: 40,
				text: 'Series A 50%',
				defaultDx: 0,
				defaultDy: 0,
			},
			{
				id: 'b',
				x: 100,
				y: 160,
				text: 'Series B 48%',
				defaultDx: 0,
				defaultDy: 0,
			},
		];

		const offsets = computeLabelDeclutter(inputs, {
			padding: 4,
			innerWidth: 400,
			innerHeight: 300,
			iterations: 160,
		});

		expect(offsets.get('a')).toEqual({ dx: 0, dy: 0 });
		expect(offsets.get('b')).toEqual({ dx: 0, dy: 0 });
	});

	test('skips locked author-positioned labels but still declutters unlocked siblings', () => {
		const inputs = [
			{
				id: 'locked',
				x: 100,
				y: 100,
				text: 'Locked',
				defaultDx: 0,
				defaultDy: 0,
				locked: true,
			},
			{
				id: 'free-a',
				x: 100,
				y: 100,
				text: 'Free A',
				defaultDx: 0,
				defaultDy: 0,
			},
			{
				id: 'free-b',
				x: 100,
				y: 101,
				text: 'Free B',
				defaultDx: 0,
				defaultDy: 0,
			},
		];

		const offsets = computeLabelDeclutter(inputs, {
			lockX: true,
			innerWidth: 400,
			innerHeight: 300,
		});

		expect(offsets.get('locked')).toEqual({ dx: 0, dy: 0 });
		expect(offsets.get('free-a')?.dy).not.toBe(offsets.get('free-b')?.dy);
	});

	test('recomputes offsets when the label signature changes (setChart swap)', () => {
		const firstInputs = [
			{ id: 'a', x: 50, y: 50, text: '10%', defaultDx: 0, defaultDy: 0 },
			{ id: 'b', x: 50, y: 52, text: '12%', defaultDx: 0, defaultDy: 0 },
		];
		const secondInputs = [
			{ id: 'a', x: 50, y: 50, text: '99%', defaultDx: 0, defaultDy: 0 },
			{ id: 'b', x: 50, y: 51, text: '98%', defaultDx: 0, defaultDy: 0 },
		];

		const first = computeLabelDeclutter(firstInputs, {
			lockX: true,
			innerWidth: 300,
			innerHeight: 200,
		});
		const second = computeLabelDeclutter(secondInputs, {
			lockX: true,
			innerWidth: 300,
			innerHeight: 200,
		});

		expect(first.get('a')).toBeDefined();
		expect(second.get('a')).toBeDefined();
		expect(first.get('a')).not.toEqual(second.get('a'));
	});

	test('is deterministic for the same inputs', () => {
		const inputs = [
			{
				id: 'a',
				x: 80,
				y: 80,
				text: 'Label A',
				defaultDx: 0,
				defaultDy: 0,
			},
			{
				id: 'b',
				x: 80,
				y: 82,
				text: 'Label B',
				defaultDx: 0,
				defaultDy: 0,
			},
		];

		const first = computeLabelDeclutter(inputs, {
			lockX: true,
			innerWidth: 300,
			innerHeight: 200,
		});
		const second = computeLabelDeclutter(inputs, {
			lockX: true,
			innerWidth: 300,
			innerHeight: 200,
		});

		expect(first.get('a')).toEqual(second.get('a'));
		expect(first.get('b')).toEqual(second.get('b'));
	});
});

describe('edge-label x-drift regression (clampPosition edge-awareness fix)', () => {
	// Labels at the leftmost data point (x≈0) were drifting rightward when
	// autoDeclutter was enabled, even with plenty of vertical clearance.
	//
	// Root cause: clampPosition computed
	//   minX = padding - bboxOffsetX = padding + width/2  (for textAnchor:'middle')
	// then clamped node.x to >= minX on every one of 160 iterations.
	// A label whose natural anchor is at x=0 (< minX ≈ 26) was hard-pushed
	// rightward each tick; forceX pull at strength 0.35 couldn't overcome it.
	//
	// Fix: only apply the x-clamp when the natural anchor (node.x0) was already
	// inside the boundary — labels naturally at the edge are left alone.

	const firstPointLabels = [
		{
			id: 'a',
			x: 0,
			y: 80,
			text: '69.8%',
			defaultDx: 0,
			defaultDy: 0,
			textAnchor: 'middle',
			dominantBaseline: 'middle',
			fontSize: 12,
		},
		{
			id: 'b',
			x: 0,
			y: 108,
			text: '54.7%',
			defaultDx: 0,
			defaultDy: 0,
			textAnchor: 'middle',
			dominantBaseline: 'middle',
			fontSize: 12,
		},
		{
			id: 'c',
			x: 0,
			y: 140,
			text: '43.1%',
			defaultDx: 0,
			defaultDy: 0,
			textAnchor: 'middle',
			dominantBaseline: 'middle',
			fontSize: 12,
		},
		{
			id: 'd',
			x: 0,
			y: 185,
			text: '19.2%',
			defaultDx: 0,
			defaultDy: 0,
			textAnchor: 'middle',
			dominantBaseline: 'middle',
			fontSize: 12,
		},
	];

	const opts = {
		lockX: false,
		iterations: 160,
		anchorStrengthX: 0.35,
		anchorStrengthY: 0.35,
		innerWidth: 600,
		innerHeight: 300,
		padding: 4,
	};

	test('edge labels with clear vertical separation stay at x=0 (no drift)', () => {
		const offsets = computeLabelDeclutter(firstPointLabels, opts);
		const dxValues = firstPointLabels.map(
			(l) => offsets.get(l.id)?.dx ?? 0
		);

		// All four labels are separated by ~28px vertically; label height ~12px.
		// No collision, no reason to move horizontally — drift should be ~zero.
		expect(dxValues.every((dx) => Math.abs(dx) < 1)).toBe(true);
	});

	test('edge labels with clear vertical separation also produce zero dy', () => {
		const offsets = computeLabelDeclutter(firstPointLabels, opts);
		offsets.forEach((offset) => {
			expect(Math.abs(offset.dx)).toBeLessThan(1);
			expect(Math.abs(offset.dy)).toBeLessThan(2);
		});
	});

	test('interior labels are still clamped when simulation pushes them off-screen', () => {
		// An interior label (x=580 on a 600px chart) pushed further right by a
		// collision should be clamped back within bounds.
		const interiorLabels = [
			{
				id: 'left',
				x: 560,
				y: 100,
				text: '69.8%',
				defaultDx: 0,
				defaultDy: 0,
				textAnchor: 'middle',
				dominantBaseline: 'middle',
				fontSize: 12,
			},
			{
				id: 'right',
				x: 570,
				y: 100,
				text: '54.7%',
				defaultDx: 0,
				defaultDy: 0,
				textAnchor: 'middle',
				dominantBaseline: 'middle',
				fontSize: 12,
			},
		];

		const offsets = computeLabelDeclutter(interiorLabels, opts);

		// The right label should not be pushed beyond the chart right edge.
		const rightOffset = offsets.get('right') ?? { dx: 0, dy: 0 };
		const finalX = 570 + rightOffset.dx;
		expect(finalX).toBeLessThanOrEqual(600);
	});
});
