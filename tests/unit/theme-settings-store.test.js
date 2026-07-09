/**
 * @jest-environment jsdom
 */
import {
	applyConfigGroupPartial,
	deepMergePartial,
} from '../../src/settings/utils';
import {
	applyFieldEdit,
	getAtPath,
	isFieldOverridden,
	unsetAtPath,
	valuesEqual,
} from '../../src/settings/path-utils';

describe('applyConfigGroupPartial', () => {
	it('updates a config group partial while preserving palettes', () => {
		const next = applyConfigGroupPartial(
			{
				config: {
					layout: {
						width: 640,
						padding: { top: 20, bottom: 25, left: 60, right: 0 },
					},
				},
				palettes: {
					colorNames: [{ label: 'General', value: 'general' }],
				},
			},
			'layout',
			{
				padding: { top: 48 },
			}
		);

		expect(next.config.layout).toEqual({
			width: 640,
			padding: { top: 48, bottom: 25, left: 60, right: 0 },
		});
		expect(next.palettes.colorNames).toHaveLength(1);
	});
});

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

describe('path-utils', () => {
	it('reads and writes nested paths', () => {
		const group = { padding: { top: 20 } };
		expect(getAtPath(group, ['padding', 'top'])).toBe(20);
		expect(getAtPath(group, ['padding', 'left'])).toBeUndefined();
	});

	it('unsets nested paths and prunes empty parents', () => {
		expect(
			unsetAtPath({ padding: { top: 32 } }, ['padding', 'top'])
		).toEqual({});
	});

	it('omits override when value matches shipped default', () => {
		const next = applyFieldEdit(
			{ config: {} },
			'layout',
			['padding', 'top'],
			20,
			20
		);
		expect(next.config?.layout).toBeUndefined();
	});

	it('keeps explicit enum selection when it matches shipped default', () => {
		const next = applyFieldEdit(
			{ config: {} },
			'layout',
			['type'],
			'bar',
			'bar',
			{ unsetOnShippedMatch: false }
		);
		expect(next.config?.layout).toEqual({ type: 'bar' });
	});

	it('stores override when value differs from shipped default', () => {
		const next = applyFieldEdit(
			{ config: {} },
			'layout',
			['padding', 'top'],
			48,
			20
		);
		expect(next.config?.layout).toEqual({ padding: { top: 48 } });
	});

	it('detects overridden fields', () => {
		expect(
			isFieldOverridden({ padding: { top: 48 } }, ['padding', 'top'], 20)
		).toBe(true);
		expect(
			isFieldOverridden({ padding: { top: 20 } }, ['padding', 'top'], 20)
		).toBe(false);
		expect(isFieldOverridden({}, ['padding', 'top'], 20)).toBe(false);
	});

	it('compares values with JSON semantics', () => {
		expect(valuesEqual(20, 20)).toBe(true);
		expect(valuesEqual('bar', 'bar')).toBe(true);
		expect(valuesEqual(20, 21)).toBe(false);
	});

	it('stores domain pair overrides', () => {
		const next = applyFieldEdit(
			{ config: {} },
			'independentAxis',
			['domain'],
			[0, 200],
			[0, 100]
		);
		expect(next.config?.independentAxis).toEqual({ domain: [0, 200] });
	});
});
