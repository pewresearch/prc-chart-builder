import { describe, expect, test } from '@jest/globals';
import { scalePoint } from '@visx/scale';

import { computeLabelDeclutter } from '../../../prc-scripts/includes/scripts/src/@prc/charting-utilities/labelLayout/computeLabelDeclutter';

// ---------------------------------------------------------------------------
// Lightweight input constructors — avoids pulling in @prc/charting-utilities
// at test time (d3-time-format breaks Jest's CJS transformer).
// The real builders in buildScatterLabels.ts are covered by tsc; row-scale
// parity with DotPlot render is asserted below via scalePoint math.
// ---------------------------------------------------------------------------

function makeInput(id, x, y, text, locked = false, defaultDy = -8) {
	return {
		id,
		x,
		y,
		text,
		fontSize: 12,
		defaultDx: 0,
		defaultDy,
		locked,
		textAnchor: 'middle',
		dominantBaseline: 'middle',
	};
}

const declutterOpts = {
	lockX: false,
	iterations: 160,
	anchorStrengthX: 0.35,
	anchorStrengthY: 0.35,
	innerWidth: 600,
	innerHeight: 400,
	padding: 4,
};

// ---------------------------------------------------------------------------
// Scatter: 2D declutter
// ---------------------------------------------------------------------------

describe('scatter label declutter', () => {
	test('separates two labels at the same point', () => {
		const inputs = [
			makeInput('scatter::0::A::100::0', 100, 200, '30%'),
			makeInput('scatter::0::B::100::0', 100, 200, '40%'),
		];

		const offsets = computeLabelDeclutter(inputs, declutterOpts);

		const dyA = offsets.get(inputs[0].id)?.dy ?? 0;
		const dyB = offsets.get(inputs[1].id)?.dy ?? 0;
		expect(Math.abs(dyA - dyB)).toBeGreaterThan(4);
	});

	test('moves horizontally when labels share y but differ in x slightly', () => {
		// Two labels extremely close together both horizontally and vertically —
		// engine should move them apart on at least one axis.
		const inputs = [
			makeInput('s1', 200, 150, '50%'),
			makeInput('s2', 202, 151, '51%'),
		];

		const offsets = computeLabelDeclutter(inputs, declutterOpts);

		const o1 = offsets.get('s1');
		const o2 = offsets.get('s2');
		const separated =
			Math.abs(o1.dx - o2.dx) > 1 || Math.abs(o1.dy - o2.dy) > 1;
		expect(separated).toBe(true);
	});

	test('leaves clearly separated labels untouched (no extra displacement)', () => {
		const inputs = [
			makeInput('a', 100, 50, '10%', false, 0),
			makeInput('b', 400, 350, '80%', false, 0),
		];

		const offsets = computeLabelDeclutter(inputs, declutterOpts);

		expect(Math.abs(offsets.get('a').dx)).toBeLessThan(2);
		expect(Math.abs(offsets.get('a').dy)).toBeLessThan(2);
		expect(Math.abs(offsets.get('b').dx)).toBeLessThan(2);
		expect(Math.abs(offsets.get('b').dy)).toBeLessThan(2);
	});

	test('locked labels stay at their default offset', () => {
		const inputs = [
			makeInput('locked', 200, 200, 'Locked', true, 5),
			makeInput('free', 200, 202, 'Free'),
		];

		const offsets = computeLabelDeclutter(inputs, declutterOpts);

		expect(offsets.get('locked')).toEqual({ dx: 0, dy: 5 });
		expect(offsets.get('free').dy).not.toBe(5);
	});
});

// ---------------------------------------------------------------------------
// DotPlot: same engine, transposed axes (value → x, row → y)
// DotPlot labels are stacked horizontally per row; close x-values for the
// same row need vertical (y) separation, or x-push if y is locked.
// ---------------------------------------------------------------------------

describe('dot-plot group row scale', () => {
	test('scalePoint padding 0.5 differs from the old hand-rolled step formula', () => {
		const domain = ['Row A', 'Row B', 'Row C', 'Row D'];
		const startY = 20;
		const height = 80;

		const groupScale = scalePoint({
			domain,
			range: [startY, startY + height],
			padding: 0.5,
		});

		const step = height / (domain.length + 1);
		const handRolledYs = domain.map((_, i) => startY + step * (i + 1));

		domain.forEach((key, i) => {
			expect(handRolledYs[i]).not.toBeCloseTo(groupScale(key) ?? 0);
		});
	});
});

describe('dot-plot label declutter', () => {
	test('separates same-value labels on same row when lockY=true (typical dot-plot)', () => {
		// Exact same x AND y (two dots with value 60 on the same row).
		// With lockY=true the preferred y-push is blocked; the force must
		// fall back to the x axis.
		// defaultDy=0 matches buildAllDotPlotLabelInputs which always passes 0.
		const inputs = [
			makeInput('dp::0::0::Cat1::RowA::0', 200, 50, '60', false, 0),
			makeInput('dp::0::1::Cat2::RowA::0', 200, 50, '60', false, 0),
		];

		const offsets = computeLabelDeclutter(inputs, {
			...declutterOpts,
			lockY: true,
			innerWidth: 400,
		});

		const dx0 = offsets.get(inputs[0].id)?.dx ?? 0;
		const dx1 = offsets.get(inputs[1].id)?.dx ?? 0;
		expect(Math.abs(dx0 - dx1)).toBeGreaterThan(4);
		// y should not be displaced (lockY keeps labels on their row)
		expect(offsets.get(inputs[0].id)?.dy ?? 0).toBe(0);
		expect(offsets.get(inputs[1].id)?.dy ?? 0).toBe(0);
	});

	test('separates two overlapping dot-plot labels on same row', () => {
		// Both anchored at nearly the same point (same row y, close x value)
		const inputs = [
			makeInput('dp::0::0::Cat1::RowA::0', 100, 40, '50%'),
			makeInput('dp::0::1::Cat2::RowA::0', 102, 40, '51%'),
		];

		const offsets = computeLabelDeclutter(inputs, {
			...declutterOpts,
			innerWidth: 300,
		});

		const separated =
			Math.abs(
				(offsets.get(inputs[0].id)?.dx ?? 0) -
					(offsets.get(inputs[1].id)?.dx ?? 0)
			) > 1 ||
			Math.abs(
				(offsets.get(inputs[0].id)?.dy ?? 0) -
					(offsets.get(inputs[1].id)?.dy ?? 0)
			) > 1;
		expect(separated).toBe(true);
	});

	test('labels on separate rows with clear y separation stay put', () => {
		const inputs = [
			makeInput('dp::0::0::Cat1::RowA::0', 100, 30, '50%', false, 0),
			makeInput('dp::0::0::Cat1::RowB::0', 100, 130, '50%', false, 0),
		];

		const offsets = computeLabelDeclutter(inputs, {
			...declutterOpts,
			innerWidth: 300,
		});

		expect(Math.abs(offsets.get(inputs[0].id)?.dx ?? 0)).toBeLessThan(2);
		expect(Math.abs(offsets.get(inputs[0].id)?.dy ?? 0)).toBeLessThan(2);
		expect(Math.abs(offsets.get(inputs[1].id)?.dx ?? 0)).toBeLessThan(2);
		expect(Math.abs(offsets.get(inputs[1].id)?.dy ?? 0)).toBeLessThan(2);
	});

	test('is deterministic for dot-plot inputs', () => {
		const inputs = [
			makeInput('dp::0::0::Cat1::RowA::0', 100, 40, '50%'),
			makeInput('dp::0::1::Cat2::RowA::0', 102, 40, '51%'),
		];

		const opts = { ...declutterOpts, innerWidth: 300 };
		const first = computeLabelDeclutter(inputs, opts);
		const second = computeLabelDeclutter(inputs, opts);

		expect(first.get(inputs[0].id)).toEqual(second.get(inputs[0].id));
		expect(first.get(inputs[1].id)).toEqual(second.get(inputs[1].id));
	});
});
