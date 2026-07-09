import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateSchemaGroup } from './validate-schema.mjs';

const blockDefault = {
	active: false,
	fontWeight: 'normal',
	fontSize: 12,
	margin: { top: 0, left: 0 },
};

/** @type {Record<string, import('../../src/settings/field-registry/schema.mjs').SchemaField>} */
const schemaGroup = {
	active: { type: 'boolean', themeable: true, description: 'a' },
	fontWeight: {
		type: 'enum',
		enum: ['normal', 'bold'],
		themeable: true,
		description: 'b',
	},
	fontSize: { type: 'number', themeable: true, description: 'c' },
	'margin.top': { type: 'number', themeable: true, description: 'd' },
	'margin.left': { type: 'number', themeable: true, description: 'e' },
};

describe('validate-schema', () => {
	it('passes when schema and block.json defaults agree', () => {
		const { errors } = validateSchemaGroup(
			'legend',
			schemaGroup,
			blockDefault
		);
		assert.deepEqual(errors, []);
	});

	it('flags a schema field with no block.json default path', () => {
		const { errors } = validateSchemaGroup(
			'legend',
			{
				...schemaGroup,
				ghost: { type: 'string', themeable: true, description: 'x' },
			},
			blockDefault
		);
		assert.equal(errors.length, 1);
		assert.match(errors[0], /Schema documents `legend\.ghost`/);
	});

	it('flags a block.json leaf the schema does not describe', () => {
		const { errors } = validateSchemaGroup('legend', schemaGroup, {
			...blockDefault,
			orphan: 'oops',
		});
		assert.equal(errors.length, 1);
		assert.match(errors[0], /block\.json default defines `legend\.orphan`/);
	});

	it('flags an enum default that is not a declared member', () => {
		const { errors } = validateSchemaGroup('legend', schemaGroup, {
			...blockDefault,
			fontWeight: 'lighter',
		});
		assert.equal(errors.length, 1);
		assert.match(errors[0], /not in the schema enum/);
	});

	it('flags a number field whose default is not numeric', () => {
		const { errors } = validateSchemaGroup('legend', schemaGroup, {
			...blockDefault,
			fontSize: '12px',
		});
		assert.equal(errors.length, 1);
		assert.match(errors[0], /declares type 'number'/);
	});

	it('errors when the whole group is missing from block.json', () => {
		const { errors } = validateSchemaGroup(
			'legend',
			schemaGroup,
			undefined
		);
		assert.equal(errors.length, 1);
		assert.match(errors[0], /no `legend` attribute default/);
	});

	it('accepts a two-number array for numberPair fields', () => {
		const { errors } = validateSchemaGroup(
			'independentAxis',
			{
				domain: {
					type: 'numberPair',
					themeable: true,
					description: 'Axis extent.',
				},
			},
			{ domain: [0, 100] }
		);
		assert.deepEqual(errors, []);
	});

	it('flags a numberPair default that is not a two-number array', () => {
		const { errors } = validateSchemaGroup(
			'independentAxis',
			{
				domain: {
					type: 'numberPair',
					themeable: true,
					description: 'Axis extent.',
				},
			},
			{ domain: [0, '100'] }
		);
		assert.equal(errors.length, 1);
		assert.match(errors[0], /numberPair/);
	});
});
