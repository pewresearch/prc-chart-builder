import {
	buildConfigGridRows,
	compareFieldPaths,
	sortFieldsForDisplay,
} from '../../src/settings/field-grid-layout';

/** @param {string} dotPath @returns {import('../../src/settings/field-registry/types').FieldDefinition} */
function field(dotPath) {
	return {
		path: dotPath.split('.'),
		type: 'number',
		themeable: true,
		description: dotPath,
	};
}

describe('compareFieldPaths', () => {
	it('orders top-level keys before nested keys sharing a prefix', () => {
		expect(compareFieldPaths(['active'], ['axis', 'stroke'])).toBeLessThan(
			0
		);
		expect(
			compareFieldPaths(['axis', 'stroke'], ['axis', 'strokeWidth'])
		).toBeLessThan(0);
		expect(
			compareFieldPaths(['axis', 'strokeWidth'], ['axisLabel', 'angle'])
		).toBeLessThan(0);
	});
});

describe('buildConfigGridRows', () => {
	it('inserts a group header before nested fields', () => {
		const rows = buildConfigGridRows([
			field('active'),
			field('axis.stroke'),
			field('axis.strokeWidth'),
		]);

		expect(rows.map((row) => row.kind)).toEqual([
			'field',
			'group',
			'field',
			'field',
		]);
		expect(rows[1]).toMatchObject({ kind: 'group', label: 'axis' });
		expect(rows[2]).toMatchObject({
			kind: 'field',
			attributeLabel: 'stroke',
			pathLabel: 'axis.stroke',
			depth: 1,
		});
	});

	it('groups padding.* under a padding header', () => {
		const rows = buildConfigGridRows([
			field('height'),
			field('padding.top'),
			field('padding.bottom'),
		]);

		expect(rows.map((row) => row.kind)).toEqual([
			'field',
			'group',
			'field',
			'field',
		]);
		expect(rows[1]).toMatchObject({ label: 'padding' });
		expect(rows[2]).toMatchObject({ attributeLabel: 'bottom' });
		expect(rows[3]).toMatchObject({ attributeLabel: 'top' });
	});

	it('re-opens a group header after intervening top-level fields', () => {
		const rows = buildConfigGridRows([
			field('axis.stroke'),
			field('label'),
			field('axisLabel.angle'),
		]);

		expect(rows.map((row) => row.label ?? row.attributeLabel)).toEqual([
			'axis',
			'stroke',
			'axisLabel',
			'angle',
			'label',
		]);
	});

	it('sorts independentAxis fields so axis.* is not adjacent to active', () => {
		const rows = buildConfigGridRows([
			field('abbreviateTicksDecimals'),
			field('axis.stroke'),
			field('active'),
			field('axisLabel.angle'),
		]);

		const activeIndex = rows.findIndex(
			(row) => row.kind === 'field' && row.pathLabel === 'active'
		);
		const axisGroupIndex = rows.findIndex(
			(row) => row.kind === 'group' && row.label === 'axis'
		);
		const axisStrokeIndex = rows.findIndex(
			(row) => row.kind === 'field' && row.pathLabel === 'axis.stroke'
		);

		expect(activeIndex).toBeLessThan(axisGroupIndex);
		expect(axisGroupIndex).toBe(axisStrokeIndex - 1);
	});

	it('matches sortFieldsForDisplay ordering', () => {
		const fields = [
			field('axis.stroke'),
			field('active'),
			field('abbreviateTicksDecimals'),
		];
		const sorted = sortFieldsForDisplay(fields);
		expect(sorted.map((item) => item.path.join('.'))).toEqual([
			'abbreviateTicksDecimals',
			'active',
			'axis.stroke',
		]);
	});
});
