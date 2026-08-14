/**
 * Build a JSON Schema for includes/settings/chart-theme.json from the editor
 * field registry (schema.mjs) plus a fixed palettes subtree.
 *
 * The registry is a flat `group → "dot.path" → field` map. This expands dotted
 * keys into nested `properties` trees so VS Code / Cursor can type-check the
 * seed file via a `$schema` URL (see `theme-schema-pointer.json`).
 *
 * Non-themeable `string` slots are intentionally loose: block/theme defaults
 * store null / arrays / objects there for runtime-only values (tickValues,
 * bands, customLabelFormat, …). Themeable leaves stay strict.
 */

/**
 * @typedef {import('../../src/settings/field-registry/schema.mjs').SchemaField} SchemaField
 */

/**
 * @param {SchemaField} field
 * @return {Record<string, unknown>}
 */
export function fieldToJsonSchema(field) {
	const description = field.description;

	switch (field.type) {
		case 'boolean':
			return { type: 'boolean', description };
		case 'number':
			return { type: 'number', description };
		case 'numberPair':
			return {
				description,
				oneOf: [
					{ type: 'null' },
					{
						type: 'array',
						items: { type: 'number' },
						minItems: 2,
						maxItems: 2,
					},
				],
			};
		case 'enum':
			return {
				type: 'string',
				enum: [...(field.enum ?? [])],
				description,
			};
		case 'color':
		case 'font':
			return { type: 'string', description };
		case 'string':
			if (field.themeable) {
				return { type: 'string', description };
			}
			// Reserved / per-chart slots: null, arrays, or opaque objects in the seed.
			return {
				description,
				type: ['string', 'null', 'array', 'object'],
			};
		default: {
			const _exhaustive = /** @type {never} */ (field.type);
			throw new Error(`Unknown schema field type: ${_exhaustive}`);
		}
	}
}

/**
 * Insert a leaf schema at a dotted path under `root.properties`.
 *
 * @param {Record<string, unknown>} root Object node with `properties`.
 * @param {string[]} segments Path segments.
 * @param {Record<string, unknown>} leafSchema
 */
function setNestedProperty(root, segments, leafSchema) {
	let current = root;
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];
		const isLeaf = i === segments.length - 1;
		if (!current.properties) {
			current.properties = {};
		}
		/** @type {Record<string, Record<string, unknown>>} */
		const properties =
			/** @type {Record<string, Record<string, unknown>>} */ (
				current.properties
			);

		if (isLeaf) {
			properties[segment] = leafSchema;
			return;
		}

		if (!properties[segment]) {
			properties[segment] = {
				type: 'object',
				additionalProperties: false,
				properties: {},
			};
		}
		current = properties[segment];
	}
}

/**
 * @param {Record<string, SchemaField>} schemaGroup
 * @return {Record<string, unknown>}
 */
export function buildGroupJsonSchema(schemaGroup) {
	/** @type {Record<string, unknown>} */
	const group = {
		type: 'object',
		additionalProperties: false,
		properties: {},
	};

	const entries = Object.entries(schemaGroup).sort(([a], [b]) =>
		a.localeCompare(b)
	);
	for (const [dotPath, field] of entries) {
		setNestedProperty(group, dotPath.split('.'), fieldToJsonSchema(field));
	}

	return group;
}

/**
 * Fixed palettes subtree (not owned by schema.mjs).
 *
 * @return {Record<string, unknown>}
 */
export function buildPalettesJsonSchema() {
	return {
		type: 'object',
		additionalProperties: false,
		properties: {
			colors: {
				type: 'object',
				description:
					'Slug → hex swatch list. Keys are palette catalog slugs.',
				additionalProperties: {
					type: 'array',
					items: {
						type: 'string',
						pattern: '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$',
					},
				},
			},
			colorNames: {
				type: 'array',
				description: 'Ordered palette catalog labels for the UI.',
				items: {
					type: 'object',
					additionalProperties: false,
					required: ['label', 'value'],
					properties: {
						label: { type: 'string' },
						value: { type: 'string' },
					},
				},
			},
		},
	};
}

/**
 * Full chart-theme.json JSON Schema document.
 *
 * @param {Record<string, Record<string, SchemaField>>} schema EDITOR_SCHEMA
 * @return {Record<string, unknown>}
 */
export function buildChartThemeJsonSchema(schema) {
	/** @type {Record<string, unknown>} */
	const configProperties = {};
	for (const groupKey of Object.keys(schema).sort()) {
		configProperties[groupKey] = buildGroupJsonSchema(schema[groupKey]);
	}

	return {
		$schema: 'http://json-schema.org/draft-07/schema#',
		$id: 'prc-chart-theme/v1',
		title: 'PRC Chart Theme',
		description:
			'Committed fallback seed for Charts → Chart Theme (config + palettes). Generated from src/settings/field-registry/schema.mjs — do not edit by hand.',
		type: 'object',
		additionalProperties: false,
		properties: {
			$schema: {
				type: 'string',
				description:
					'IDE schema pointer; stripped before persistence by Theme_Validator.',
			},
			config: {
				type: 'object',
				additionalProperties: false,
				properties: configProperties,
			},
			palettes: buildPalettesJsonSchema(),
		},
	};
}

/**
 * Pretty-printed schema file contents (trailing newline).
 *
 * @param {Record<string, Record<string, SchemaField>>} schema
 * @return {string}
 */
export function renderChartThemeSchemaFile(schema) {
	return `${JSON.stringify(buildChartThemeJsonSchema(schema), null, '\t')}\n`;
}
