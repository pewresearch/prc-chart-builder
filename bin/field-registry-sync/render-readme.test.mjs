import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { renderGroupTable, spliceGroupTable } from './render-readme.mjs';

/** @type {Record<string, import('../../src/settings/field-registry/schema.mjs').SchemaField>} */
const schemaGroup = {
	active: { type: 'boolean', themeable: true, description: 'Show/hide.' },
	fontWeight: {
		type: 'enum',
		enum: ['normal', 'bold'],
		themeable: true,
		description: 'CSS font-weight.',
	},
	fill: { type: 'color', themeable: true, description: 'Box fill.' },
	fontFamily: {
		type: 'string',
		themeable: false,
		description: 'Font stack.',
	},
};

const blockDefault = {
	active: false,
	fontWeight: 'normal',
	fill: '',
	fontFamily: 'Verdana',
};

describe('render-readme', () => {
	it('renders enum unions, color, defaults, and read-only notes', () => {
		const table = renderGroupTable('legend', schemaGroup, blockDefault);
		const lines = table.split('\n');

		assert.equal(lines[0], '| Attribute | Type | Default | Notes |');
		assert.ok(
			lines.includes(
				"| `legend.fontWeight` | `'normal' \\| 'bold'` | `\"normal\"` | CSS font-weight. |"
			)
		);
		assert.ok(
			lines.includes('| `legend.fill` | color (hex) | `""` | Box fill. |')
		);
		assert.ok(
			lines.includes(
				'| `legend.fontFamily` | string | `"Verdana"` | Font stack. _(read-only)_ |'
			)
		);
	});

	it('sorts rows by dot-path', () => {
		const table = renderGroupTable('legend', schemaGroup, blockDefault);
		const attrs = table
			.split('\n')
			.slice(2)
			.map((line) =>
				line.split(' | ')[0].replace('| `', '').replace('`', '')
			);
		assert.deepEqual(attrs, [
			'legend.active',
			'legend.fill',
			'legend.fontFamily',
			'legend.fontWeight',
		]);
	});

	it('replaces only the table, preserving surrounding prose', () => {
		const readme = [
			'### `legend` — Chart Legend',
			'',
			'Some prose.',
			'',
			'| Attribute | Type | Default | Notes |',
			'| --- | --- | --- | --- |',
			'| `legend.active` | boolean | `true` | stale |',
			'',
			'---',
			'',
			'### `labels` — Data Labels',
		].join('\n');

		const table = renderGroupTable('legend', schemaGroup, blockDefault);
		const next = spliceGroupTable(readme, 'legend', table);

		assert.ok(next.includes('Some prose.'));
		assert.ok(next.includes('### `labels` — Data Labels'));
		assert.ok(next.includes('---'));
		assert.ok(
			!next.includes('| `legend.active` | boolean | `true` | stale |')
		);
		assert.ok(
			next.includes("| `legend.fontWeight` | `'normal' \\| 'bold'`")
		);
	});

	it('throws when the group section is missing', () => {
		assert.throws(
			() => spliceGroupTable('# Nothing here', 'legend', 'x'),
			/no `legend` section header/
		);
	});
});
