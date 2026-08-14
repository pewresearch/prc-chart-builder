/**
 * Validate includes/settings/chart-theme.json against the editor schema.
 *
 * Reuses the same path / enum / scalar-kind checks as block.json validation so
 * the committed seed cannot drift from schema.mjs. Palettes are shape-checked
 * separately (they are not schema-owned).
 */
import { validateSchemaGroup } from './validate-schema.mjs';

const THEME_SOURCE = 'chart-theme.json';

/**
 * @param {unknown} value
 * @return {value is Record<string, unknown>}
 */
function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
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
		errors.push(`${THEME_SOURCE} \`palettes\` must be an object.`);
		return errors;
	}

	for (const key of Object.keys(palettes)) {
		if (key !== 'colors' && key !== 'colorNames') {
			errors.push(
				`${THEME_SOURCE} \`palettes\` has unknown key \`${key}\`.`
			);
		}
	}

	if (palettes.colors !== undefined) {
		if (!isPlainObject(palettes.colors)) {
			errors.push(
				`${THEME_SOURCE} \`palettes.colors\` must be an object (slug → swatches).`
			);
		} else {
			for (const [slug, swatches] of Object.entries(palettes.colors)) {
				if (!Array.isArray(swatches)) {
					errors.push(
						`${THEME_SOURCE} \`palettes.colors.${slug}\` must be an array of hex strings.`
					);
					continue;
				}
				for (let i = 0; i < swatches.length; i++) {
					const swatch = swatches[i];
					if (
						typeof swatch !== 'string' ||
						!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(swatch)
					) {
						errors.push(
							`${THEME_SOURCE} \`palettes.colors.${slug}[${i}]\` is not a hex color.`
						);
					}
				}
			}
		}
	}

	if (palettes.colorNames !== undefined) {
		if (!Array.isArray(palettes.colorNames)) {
			errors.push(
				`${THEME_SOURCE} \`palettes.colorNames\` must be an array.`
			);
		} else {
			palettes.colorNames.forEach((entry, index) => {
				if (!isPlainObject(entry)) {
					errors.push(
						`${THEME_SOURCE} \`palettes.colorNames[${index}]\` must be an object.`
					);
					return;
				}
				if (typeof entry.label !== 'string' || entry.label === '') {
					errors.push(
						`${THEME_SOURCE} \`palettes.colorNames[${index}].label\` must be a non-empty string.`
					);
				}
				if (typeof entry.value !== 'string' || entry.value === '') {
					errors.push(
						`${THEME_SOURCE} \`palettes.colorNames[${index}].value\` must be a non-empty string.`
					);
				}
			});
		}
	}

	return errors;
}

/**
 * @param {Record<string, Record<string, import('../../src/settings/field-registry/schema.mjs').SchemaField>>} schema
 * @param {unknown} theme Decoded chart-theme.json (may include `$schema`).
 * @return {{ errors: string[] }}
 */
export function validateChartTheme(schema, theme) {
	/** @type {string[]} */
	const errors = [];

	if (!isPlainObject(theme)) {
		errors.push(`${THEME_SOURCE} must be a JSON object.`);
		return { errors };
	}

	for (const key of Object.keys(theme)) {
		if (key !== '$schema' && key !== 'config' && key !== 'palettes') {
			errors.push(`${THEME_SOURCE} has unknown root key \`${key}\`.`);
		}
	}

	if (theme.$schema !== undefined && typeof theme.$schema !== 'string') {
		errors.push(
			`${THEME_SOURCE} \`$schema\` must be a string when present.`
		);
	}

	if (theme.config === undefined) {
		errors.push(`${THEME_SOURCE} is missing \`config\`.`);
	} else if (!isPlainObject(theme.config)) {
		errors.push(`${THEME_SOURCE} \`config\` must be an object.`);
	} else {
		const config = /** @type {Record<string, unknown>} */ (theme.config);
		const schemaKeys = new Set(Object.keys(schema));
		for (const groupKey of Object.keys(config)) {
			if (!schemaKeys.has(groupKey)) {
				errors.push(
					`${THEME_SOURCE} \`config\` has unknown group \`${groupKey}\`.`
				);
			}
		}
		for (const [groupKey, schemaGroup] of Object.entries(schema)) {
			const result = validateSchemaGroup(
				groupKey,
				schemaGroup,
				config[groupKey],
				THEME_SOURCE
			);
			errors.push(...result.errors);
		}
	}

	errors.push(...validateThemePalettes(theme.palettes));

	return { errors };
}
