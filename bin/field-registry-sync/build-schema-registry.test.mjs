import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	buildGroupFromSchema,
	schemaFieldToDefinition,
	schemaGroupKeys,
} from './build-schema-registry.mjs';

describe('build-schema-registry', () => {
	it('maps an editor enum to a string field with an enum array', () => {
		const def = schemaFieldToDefinition('fontWeight', {
			type: 'enum',
			enum: ['normal', 'bold'],
			themeable: true,
			description: 'CSS font-weight.',
		});
		assert.deepEqual(def, {
			path: ['fontWeight'],
			type: 'string',
			themeable: true,
			description: 'CSS font-weight.',
			enum: ['normal', 'bold'],
		});
	});

	it('splits dotted keys into a path array', () => {
		const def = schemaFieldToDefinition('margin.top', {
			type: 'number',
			themeable: true,
			description: 'Top margin (px).',
		});
		assert.deepEqual(def.path, ['margin', 'top']);
		assert.equal(def.type, 'number');
		assert.equal(def.enum, undefined);
	});

	it('preserves color and non-themeable fields verbatim', () => {
		const color = schemaFieldToDefinition('borderStroke', {
			type: 'color',
			themeable: true,
			description: 'Border color.',
		});
		assert.equal(color.type, 'color');

		const readonly = schemaFieldToDefinition('fontFamily', {
			type: 'string',
			themeable: false,
			description: 'Font stack.',
		});
		assert.equal(readonly.themeable, false);
	});

	it('preserves numberPair fields verbatim', () => {
		const domain = schemaFieldToDefinition('domain', {
			type: 'numberPair',
			themeable: true,
			description: 'Axis extent.',
		});
		assert.equal(domain.type, 'numberPair');
		assert.deepEqual(domain.path, ['domain']);
	});

	it('throws when an enum field omits its values', () => {
		assert.throws(
			() =>
				schemaFieldToDefinition('broken', {
					type: 'enum',
					themeable: true,
					description: 'x',
				}),
			/declares no `enum`/
		);
	});

	it('sorts a group by dot-path for deterministic output', () => {
		const fields = buildGroupFromSchema({
			title: { type: 'string', themeable: true, description: 'b' },
			active: { type: 'boolean', themeable: true, description: 'a' },
			'margin.top': { type: 'number', themeable: true, description: 'c' },
		});
		assert.deepEqual(
			fields.map((field) => field.path.join('.')),
			['active', 'margin.top', 'title']
		);
	});

	it('reports owned group keys', () => {
		const keys = schemaGroupKeys({ legend: {}, tooltip: {} });
		assert.ok(keys.has('legend'));
		assert.ok(keys.has('tooltip'));
		assert.equal(keys.size, 2);
	});
});
