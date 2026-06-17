import { describe, test, expect } from '@jest/globals';
import {
	applyDeepPatch,
	applyChartPatch,
} from '../../src/chart/utils/apply-deep-patch';

/**
 * PRC-17 slice 4 robustness gate (unit level).
 *
 * Covers the store-action merge semantics that are NOT observable from final
 * DOM alone: object-merge vs array-replace, fallback safety, last-write-wins /
 * idempotence, and the data↔config coupling contract. The remaining gate
 * scenarios — single-render atomicity (render-count spy) and the
 * color-fleet-unchanged snapshot — require a rendering context and live in the
 * browser portion of the gate.
 */

describe('applyDeepPatch — merge semantics', () => {
	test('object branches merge per-key (siblings preserved)', () => {
		const target = {
			axis: {
				x: { tickFormat: '%b', nice: true },
				y: { domain: [0, 1] },
			},
		};
		applyDeepPatch(target, { axis: { x: { tickFormat: '%Y' } } });
		expect(target.axis.x.tickFormat).toBe('%Y');
		// Sibling under the same patched branch survives.
		expect(target.axis.x.nice).toBe(true);
		// Untouched sibling branch survives.
		expect(target.axis.y.domain).toEqual([0, 1]);
	});

	test('arrays replace wholesale (no concat / no element merge)', () => {
		const target = { colors: ['#a', '#b', '#c'], categories: ['x', 'y'] };
		applyDeepPatch(target, { colors: ['#z'] });
		expect(target.colors).toEqual(['#z']);
		// Lockstep array left untouched when not in the patch (the sharp edge).
		expect(target.categories).toEqual(['x', 'y']);
	});

	test('primitives replace', () => {
		const target = { enabled: true, duration: 400 };
		applyDeepPatch(target, { duration: 800 });
		expect(target).toEqual({ enabled: true, duration: 800 });
	});

	test('keys absent from target are assigned (never throws on a missing branch)', () => {
		const target = {};
		expect(() =>
			applyDeepPatch(target, { dataRender: { categories: ['a'] } })
		).not.toThrow();
		expect(target.dataRender.categories).toEqual(['a']);
	});

	test('null / array / primitive partial overwrites an object branch', () => {
		const target = { legend: { categories: ['a'] } };
		applyDeepPatch(target, { legend: null });
		expect(target.legend).toBeNull();
	});

	test('non-object inputs are safe no-ops', () => {
		expect(applyDeepPatch(null, { a: 1 })).toBeNull();
		expect(applyDeepPatch({ a: 1 }, null)).toEqual({ a: 1 });
		expect(applyDeepPatch(undefined, undefined)).toBeUndefined();
	});

	test('mutates target in place and returns the same reference', () => {
		const target = { a: 1 };
		const result = applyDeepPatch(target, { b: 2 });
		expect(result).toBe(target);
	});

	test('annotations.items merges per-index (setConfig-shaped partial)', () => {
		const target = {
			annotations: {
				active: true,
				items: [
					{ text: 'Female', x: 496 },
					{ text: 'Male', x: 221 },
					{ text: 'Note', x: 140 },
					{ text: '2020', x: 579, fontSize: 18 },
				],
			},
		};
		applyDeepPatch(target, {
			annotations: {
				items: [undefined, undefined, undefined, { text: '2030' }],
			},
		});
		expect(target.annotations.active).toBe(true);
		expect(target.annotations.items[3].text).toBe('2030');
		expect(target.annotations.items[3].x).toBe(579);
		expect(target.annotations.items[3].fontSize).toBe(18);
		expect(target.annotations.items[0].text).toBe('Female');
	});

	test('colors array still replaces wholesale when not annotations.items', () => {
		const target = {
			colors: ['#a', '#b'],
			annotations: { items: [{ text: 'A' }] },
		};
		applyDeepPatch(target, { colors: ['#z'] });
		expect(target.colors).toEqual(['#z']);
	});
});

describe('applyChartPatch — atomic field semantics', () => {
	const baseSlice = () => ({
		data: [{ name: '2010', democrat: 1 }],
		tableData: { rows: [['2010', '1']] },
		config: {
			colors: ['#a', '#b'],
			dataRender: { categories: ['democrat', 'republican'] },
			axis: { x: { tickFormat: '%b' } },
		},
	});

	test('data replaces wholesale', () => {
		const slice = baseSlice();
		const next = [{ name: '2020', democrat: 9 }];
		applyChartPatch(slice, { data: next });
		expect(slice.data).toBe(next);
	});

	test('tableData replaces wholesale', () => {
		const slice = baseSlice();
		applyChartPatch(slice, { tableData: { rows: [] } });
		expect(slice.tableData).toEqual({ rows: [] });
	});

	test('config deep-merges (object-merge, array-replace) preserving siblings', () => {
		const slice = baseSlice();
		applyChartPatch(slice, {
			config: { axis: { x: { tickFormat: '%Y' } } },
		});
		expect(slice.config.axis.x.tickFormat).toBe('%Y');
		// Unrelated config branches survive a partial config patch.
		expect(slice.config.colors).toEqual(['#a', '#b']);
		expect(slice.config.dataRender.categories).toEqual([
			'democrat',
			'republican',
		]);
	});

	test('config is assigned wholesale when the slice has no config yet', () => {
		const slice = { data: [], tableData: null };
		applyChartPatch(slice, { config: { colors: ['#x'] } });
		expect(slice.config).toEqual({ colors: ['#x'] });
	});

	test('only provided fields are touched (partial patch)', () => {
		const slice = baseSlice();
		const originalData = slice.data;
		const originalTable = slice.tableData;
		applyChartPatch(slice, { config: { colors: ['#new'] } });
		expect(slice.data).toBe(originalData);
		expect(slice.tableData).toBe(originalTable);
		expect(slice.config.colors).toEqual(['#new']);
	});

	test('coupling contract: a category swap must resend its lockstep colors in the SAME patch', () => {
		const slice = baseSlice();
		// Atomic, consistent swap — categories AND colors together.
		applyChartPatch(slice, {
			config: {
				dataRender: { categories: ['a', 'b', 'c'] },
				colors: ['#1', '#2', '#3'],
			},
		});
		expect(slice.config.dataRender.categories).toEqual(['a', 'b', 'c']);
		expect(slice.config.colors).toEqual(['#1', '#2', '#3']);
		// The arrays stay the same length — the positional zip is consistent.
		expect(slice.config.colors).toHaveLength(
			slice.config.dataRender.categories.length
		);
	});

	test('coupling contract: patching categories alone leaves colors stale (documents the sharp edge)', () => {
		const slice = baseSlice();
		applyChartPatch(slice, {
			config: { dataRender: { categories: ['a', 'b', 'c'] } },
		});
		// colors was NOT resent, so it is now mismatched in length — exactly the
		// torn-zip hazard the contract warns about. setChart cannot save a
		// caller who under-specifies the patch; it only guarantees that what IS
		// provided lands atomically.
		expect(slice.config.colors).toEqual(['#a', '#b']);
		expect(slice.config.dataRender.categories).toHaveLength(3);
	});

	test('atomicity: a single setChart applies data + config in one pass with a consistent triple', () => {
		const slice = baseSlice();
		// Swap to a dataset with a different category universe.
		applyChartPatch(slice, {
			data: [{ name: '2020', a: 1, b: 2, c: 3 }],
			config: {
				dataRender: { categories: ['a', 'b', 'c'] },
				colors: ['#1', '#2', '#3'],
			},
		});
		// After the single synchronous pass, data/categories/colors are all
		// consistent — never an intermediate state with new data + old config.
		expect(Object.keys(slice.data[0])).toEqual(
			expect.arrayContaining(['a', 'b', 'c'])
		);
		expect(slice.config.dataRender.categories).toEqual(['a', 'b', 'c']);
		expect(slice.config.colors).toHaveLength(3);
	});

	test('last-write-wins: sequential patches resolve to the final values', () => {
		const slice = baseSlice();
		applyChartPatch(slice, { data: [{ name: 'first' }] });
		applyChartPatch(slice, { data: [{ name: 'second' }] });
		expect(slice.data).toEqual([{ name: 'second' }]);
	});

	test('idempotence: re-applying the same config patch is a no-op on state', () => {
		const slice = baseSlice();
		const patch = { config: { axis: { x: { tickFormat: '%Y' } } } };
		applyChartPatch(slice, patch);
		const snapshot = JSON.stringify(slice);
		applyChartPatch(slice, patch);
		expect(JSON.stringify(slice)).toBe(snapshot);
	});

	test('missing / malformed inputs are safe no-ops', () => {
		expect(() => applyChartPatch(null, { data: [] })).not.toThrow();
		const slice = baseSlice();
		const snapshot = JSON.stringify(slice);
		applyChartPatch(slice); // no patch
		applyChartPatch(slice, {}); // empty patch
		expect(JSON.stringify(slice)).toBe(snapshot);
	});
});
