/**
 * Convert the authored editor schema (src/settings/field-registry/schema.mjs)
 * into the `FieldDefinition[]` shape consumed by generated.json and the
 * settings UI.
 *
 * The schema speaks an editor vocabulary (`type: 'enum'`); the registry speaks
 * the control vocabulary the panel already understands (`type: 'string'` with
 * an `enum` array renders a <SelectControl>). This converter is the only place
 * that translation happens.
 */

/**
 * @typedef {import('../../src/settings/field-registry/schema.mjs').SchemaField} SchemaField
 */

/**
 * @typedef {Object} FieldDefinition
 * @property {string[]} path
 * @property {'boolean' | 'number' | 'string' | 'color' | 'numberPair' | 'font'} type
 * @property {boolean} themeable
 * @property {string} description
 * @property {string[]=} enum
 */

/**
 * @param {string} dotPath
 * @param {SchemaField} field
 * @return {FieldDefinition}
 */
export function schemaFieldToDefinition(dotPath, field) {
	const path = dotPath.split('.');

	if (field.type === 'enum') {
		if (!field.enum?.length) {
			throw new Error(
				`Schema field \`${dotPath}\` is type 'enum' but declares no \`enum\` values.`
			);
		}
		return {
			path,
			type: 'string',
			themeable: field.themeable,
			description: field.description,
			enum: [...field.enum],
		};
	}

	return {
		path,
		type: field.type,
		themeable: field.themeable,
		description: field.description,
	};
}

/**
 * @param {Record<string, SchemaField>} schemaGroup
 * @return {FieldDefinition[]} Sorted by dot-path for deterministic output.
 */
export function buildGroupFromSchema(schemaGroup) {
	return Object.entries(schemaGroup)
		.map(([dotPath, field]) => schemaFieldToDefinition(dotPath, field))
		.sort((left, right) =>
			left.path.join('.').localeCompare(right.path.join('.'))
		);
}

/**
 * @param {Record<string, Record<string, SchemaField>>} schema
 * @return {Set<string>} Group keys this schema owns.
 */
export function schemaGroupKeys(schema) {
	return new Set(Object.keys(schema));
}
