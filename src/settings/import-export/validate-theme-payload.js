/**
 * Validate a chart theme payload against the editor field registry.
 *
 * Used by Upload JSON so broken themes never enter the draft. Omitting
 * `config` or `palettes` is allowed (replace merges those from the current
 * draft). Present groups/leaves must match registry types/enums; unknown
 * keys fail. Full path parity is only enforced for the committed seed via
 * `bin/sync-field-registry.mjs`.
 */
import { FIELD_REGISTRY } from '../field-registry';

/** @typedef {import('./field-registry/types').FieldDefinition} FieldDefinition */

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * @param {unknown} value
 * @return {value is Record<string, unknown>}
 */
function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

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
 * Collect leaf dot-paths (arrays / null / scalars / empty objects are leaves).
 *
 * @param {unknown} value
 * @param {string[]} [prefix]
 * @return {Set<string>}
 */
export function collectThemePaths(value, prefix = []) {
	/** @type {Set<string>} */
	const paths = new Set();

	if (value === null || value === undefined) {
		if (prefix.length > 0) {
			paths.add(prefix.join('.'));
		}
		return paths;
	}

	if (Array.isArray(value)) {
		if (prefix.length > 0) {
			paths.add(prefix.join('.'));
		}
		return paths;
	}

	if (typeof value !== 'object') {
		if (prefix.length > 0) {
			paths.add(prefix.join('.'));
		}
		return paths;
	}

	const keys = Object.keys(value);
	if (keys.length === 0 && prefix.length > 0) {
		paths.add(prefix.join('.'));
		return paths;
	}

	for (const key of keys) {
		for (const child of collectThemePaths(
			/** @type {Record<string, unknown>} */ (value)[key],
			[...prefix, key]
		)) {
			paths.add(child);
		}
	}

	return paths;
}

/**
 * @param {FieldDefinition} field
 * @param {unknown} value
 * @param {string} label
 * @return {string|null}
 */
function leafTypeError(field, value, label) {
	if (field.enum?.length) {
		if (typeof value !== 'string' || !field.enum.includes(value)) {
			return `${label} must be one of: ${field.enum
				.map((entry) => `"${entry}"`)
				.join(', ')}.`;
		}
		return null;
	}

	switch (field.type) {
		case 'boolean':
			return typeof value === 'boolean'
				? null
				: `${label} must be a boolean.`;
		case 'number':
			return typeof value === 'number'
				? null
				: `${label} must be a number.`;
		case 'numberPair':
			return Array.isArray(value) &&
				value.length === 2 &&
				typeof value[0] === 'number' &&
				typeof value[1] === 'number'
				? null
				: `${label} must be a [number, number] pair.`;
		case 'color':
		case 'font':
		case 'string':
			if (field.themeable) {
				return typeof value === 'string'
					? null
					: `${label} must be a string.`;
			}
			// Reserved / per-chart slots may be null, arrays, or opaque objects.
			if (
				value === null ||
				typeof value === 'string' ||
				Array.isArray(value) ||
				isPlainObject(value)
			) {
				return null;
			}
			return `${label} has an invalid value.`;
		default: {
			const _exhaustive = /** @type {never} */ (field.type);
			return `${label} has unknown field type "${_exhaustive}".`;
		}
	}
}

/**
 * @param {unknown} palettes
 * @return {string[]}
 */
export function validateThemePalettes(palettes) {
	/** @type {string[]} */
	const errors = [];

	if (palettes === undefined) {
		return errors;
	}

	if (!isPlainObject(palettes)) {
		errors.push('Theme palettes must be an object.');
		return errors;
	}

	for (const key of Object.keys(palettes)) {
		if (key !== 'colors' && key !== 'colorNames') {
			errors.push(`Unknown palettes key "${key}".`);
		}
	}

	if (palettes.colors !== undefined) {
		if (!isPlainObject(palettes.colors)) {
			errors.push('palettes.colors must be an object (slug → swatches).');
		} else {
			for (const [slug, swatches] of Object.entries(palettes.colors)) {
				if (!Array.isArray(swatches)) {
					errors.push(
						`palettes.colors.${slug} must be an array of hex colors.`
					);
					continue;
				}
				for (let i = 0; i < swatches.length; i++) {
					const swatch = swatches[i];
					if (typeof swatch !== 'string' || !HEX_COLOR.test(swatch)) {
						errors.push(
							`palettes.colors.${slug}[${i}] is not a hex color.`
						);
					}
				}
			}
		}
	}

	if (palettes.colorNames !== undefined) {
		if (!Array.isArray(palettes.colorNames)) {
			errors.push('palettes.colorNames must be an array.');
		} else {
			palettes.colorNames.forEach((entry, index) => {
				if (!isPlainObject(entry)) {
					errors.push(
						`palettes.colorNames[${index}] must be an object.`
					);
					return;
				}
				if (typeof entry.label !== 'string' || entry.label === '') {
					errors.push(
						`palettes.colorNames[${index}].label must be a non-empty string.`
					);
				}
				if (typeof entry.value !== 'string' || entry.value === '') {
					errors.push(
						`palettes.colorNames[${index}].value must be a non-empty string.`
					);
				}
			});
		}
	}

	return errors;
}

/**
 * @param {string} groupKey
 * @param {unknown} groupValue
 * @param {FieldDefinition[]} fields
 * @return {string[]}
 */
function validateConfigGroup(groupKey, groupValue, fields) {
	/** @type {string[]} */
	const errors = [];

	if (!isPlainObject(groupValue)) {
		errors.push(`config.${groupKey} must be an object.`);
		return errors;
	}

	/** @type {Map<string, FieldDefinition>} */
	const byPath = new Map(
		fields.map((field) => [field.path.join('.'), field])
	);
	const presentPaths = collectThemePaths(groupValue);

	for (const dotPath of presentPaths) {
		const field = byPath.get(dotPath);
		if (!field) {
			errors.push(`Unknown config path "${groupKey}.${dotPath}".`);
			continue;
		}
		const value = valueAtPath(groupValue, field.path);
		const error = leafTypeError(
			field,
			value,
			`config.${groupKey}.${dotPath}`
		);
		if (error) {
			errors.push(error);
		}
	}

	return errors;
}

/**
 * Validate an uploaded / in-memory theme payload against the field registry.
 *
 * @param {unknown} theme May include `$schema`.
 * @return {string[]} Human-readable errors (empty when valid).
 */
export function validateThemePayload(theme) {
	/** @type {string[]} */
	const errors = [];

	if (!isPlainObject(theme)) {
		errors.push('Theme payload must be a JSON object.');
		return errors;
	}

	for (const key of Object.keys(theme)) {
		if (key !== '$schema' && key !== 'config' && key !== 'palettes') {
			errors.push(`Unknown theme key "${key}".`);
		}
	}

	if (theme.$schema !== undefined && typeof theme.$schema !== 'string') {
		errors.push('"$schema" must be a string when present.');
	}

	if (theme.config !== undefined) {
		if (!isPlainObject(theme.config)) {
			errors.push('Theme config must be an object.');
		} else {
			for (const [groupKey, groupValue] of Object.entries(theme.config)) {
				const fields = FIELD_REGISTRY[groupKey];
				if (!fields?.length) {
					errors.push(`Unknown config group "${groupKey}".`);
					continue;
				}
				errors.push(
					...validateConfigGroup(groupKey, groupValue, fields)
				);
			}
		}
	}

	errors.push(...validateThemePalettes(theme.palettes));

	return errors;
}
