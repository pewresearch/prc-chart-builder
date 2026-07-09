/**
 * Validate the editor schema against block.json group defaults.
 *
 * This is the "fail loudly" guard wired into the plugin build: if a schema and
 * its block.json default drift apart, the build aborts instead of shipping a
 * settings panel that edits paths the block never persists (or silently drops
 * attributes the block does persist).
 *
 * Three classes of drift are caught:
 *   1. Path parity — every schema field must map to a block.json leaf, and
 *      every block.json leaf must be described by the schema.
 *   2. Enum defaults — a block.json default for an enum field must be one of
 *      the declared editor values.
 *   3. Scalar kinds — a themeable number/boolean field's block.json default
 *      must actually be a number/boolean.
 */
import { collectBlockJsonPaths } from './walk-block-json.mjs';

/**
 * @param {unknown} root
 * @param {string[]} path
 * @return {unknown}
 */
function valueAtPath(root, path) {
	let current = root;
	for (const segment of path) {
		if (current === null || typeof current !== 'object') {
			return undefined;
		}
		current = /** @type {Record<string, unknown>} */ (current)[segment];
	}
	return current;
}

/**
 * @param {string} groupKey
 * @param {Record<string, import('../../src/settings/field-registry/schema.mjs').SchemaField>} schemaGroup
 * @param {unknown} blockDefault The `block.json` `attributes[group].default` value.
 * @return {{ errors: string[] }}
 */
export function validateSchemaGroup(groupKey, schemaGroup, blockDefault) {
	/** @type {string[]} */
	const errors = [];

	if (blockDefault === undefined) {
		errors.push(
			`Schema documents group \`${groupKey}\` but block.json has no \`${groupKey}\` attribute default.`
		);
		return { errors };
	}

	const blockPaths = collectBlockJsonPaths(blockDefault);
	const schemaPaths = new Set(Object.keys(schemaGroup));

	for (const dotPath of schemaPaths) {
		if (!blockPaths.has(dotPath)) {
			errors.push(
				`Schema documents \`${groupKey}.${dotPath}\` but block.json default has no matching path.`
			);
		}
	}

	for (const dotPath of blockPaths) {
		if (!schemaPaths.has(dotPath)) {
			errors.push(
				`block.json default defines \`${groupKey}.${dotPath}\` but the editor schema has no matching field.`
			);
		}
	}

	for (const [dotPath, field] of Object.entries(schemaGroup)) {
		if (!blockPaths.has(dotPath)) {
			continue;
		}
		const defaultValue = valueAtPath(blockDefault, dotPath.split('.'));

		if (field.type === 'enum') {
			if (!field.enum?.includes(/** @type {string} */ (defaultValue))) {
				errors.push(
					`block.json default for \`${groupKey}.${dotPath}\` is ${JSON.stringify(
						defaultValue
					)}, which is not in the schema enum [${(field.enum ?? [])
						.map((value) => `'${value}'`)
						.join(', ')}].`
				);
			}
			continue;
		}

		if (!field.themeable) {
			continue;
		}

		if (field.type === 'number' && typeof defaultValue !== 'number') {
			errors.push(
				`block.json default for \`${groupKey}.${dotPath}\` is ${JSON.stringify(
					defaultValue
				)}, but the schema declares type 'number'.`
			);
		}
		if (field.type === 'boolean' && typeof defaultValue !== 'boolean') {
			errors.push(
				`block.json default for \`${groupKey}.${dotPath}\` is ${JSON.stringify(
					defaultValue
				)}, but the schema declares type 'boolean'.`
			);
		}
		if (
			field.type === 'numberPair' &&
			(!Array.isArray(defaultValue) ||
				defaultValue.length !== 2 ||
				typeof defaultValue[0] !== 'number' ||
				typeof defaultValue[1] !== 'number')
		) {
			errors.push(
				`block.json default for \`${groupKey}.${dotPath}\` is ${JSON.stringify(
					defaultValue
				)}, but the schema declares type 'numberPair' ([number, number]).`
			);
		}
	}

	return { errors };
}

/**
 * @param {Record<string, Record<string, import('../../src/settings/field-registry/schema.mjs').SchemaField>>} schema
 * @param {Record<string, { default?: unknown }>} blockAttributes
 * @return {{ errors: string[] }}
 */
export function validateSchema(schema, blockAttributes) {
	/** @type {string[]} */
	const errors = [];
	for (const [groupKey, schemaGroup] of Object.entries(schema)) {
		const blockDefault = blockAttributes?.[groupKey]?.default;
		const result = validateSchemaGroup(groupKey, schemaGroup, blockDefault);
		errors.push(...result.errors);
	}
	return { errors };
}
