import blockMetadata from '../../chart/block.json';
import { applyThemeConfigLayerToDefaults } from '../../chart/utils/apply-theme-block-defaults';
import {
	CURATED_THEME_CONFIG_GROUPS,
	isThemeableConfigPartial,
} from '../../chart/utils/theme-config-groups';
import {
	deepMergeDefaults,
	getRuntimeTheme,
} from '../../chart/utils/resolve-defaults';

/**
 * Get default block attributes from block.json
 * This ensures variation templates properly inherit all nested defaults
 * to avoid WordPress's shallow merge issues.
 *
 * @returns {Object} All default attribute values from block.json
 */
export function getDefaultBlockAttributes() {
	const defaults = {};

	for (const [key, config] of Object.entries(blockMetadata.attributes)) {
		if (config.default !== undefined) {
			defaults[key] = config.default;
		}
	}

	return defaults;
}

/**
 * Deep merge helper - recursively merges objects and arrays
 *
 * @param {Object} target - The target object (defaults)
 * @param {Object} source - The source object (overrides)
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
	const output = { ...target };

	for (const key in source) {
		if (
			source[key] &&
			typeof source[key] === 'object' &&
			!Array.isArray(source[key])
		) {
			if (
				target[key] &&
				typeof target[key] === 'object' &&
				!Array.isArray(target[key])
			) {
				output[key] = deepMerge(target[key], source[key]);
			} else {
				output[key] = source[key];
			}
		} else {
			output[key] = source[key];
		}
	}

	return output;
}

/**
 * Extract attribute values that differ from block.json defaults (i.e. the
 * variation-specific overrides), recursively for nested objects.
 *
 * @param {*} base     Default value from block.json.
 * @param {*} merged   Fully merged attribute value from a variation template.
 * @return {*} Subtree containing only keys that differ from base, or undefined.
 */
function extractVariationOverrides(base, merged) {
	if (merged === undefined) {
		return undefined;
	}

	if (
		base &&
		merged &&
		typeof base === 'object' &&
		typeof merged === 'object' &&
		!Array.isArray(base) &&
		!Array.isArray(merged)
	) {
		const overrides = {};

		for (const key of Object.keys(merged)) {
			const childOverride = extractVariationOverrides(
				base[key],
				merged[key]
			);
			if (childOverride !== undefined) {
				overrides[key] = childOverride;
			}
		}

		return Object.keys(overrides).length > 0 ? overrides : undefined;
	}

	return JSON.stringify(base) !== JSON.stringify(merged) ? merged : undefined;
}

/**
 * Apply the active theme config layer between block.json defaults and overrides.
 *
 * Merge order: block.json defaults → theme.config → variation overrides.
 * Chart-type variation templates intentionally win on fields they set (width,
 * padding, orientation, etc.); theme fills in the rest.
 *
 * @param {Object} defaults Block.json attribute defaults.
 * @return {Object} Defaults with theme.config groups merged in when present.
 */
export function applyThemeConfigLayer(defaults) {
	return applyThemeConfigLayerToDefaults(defaults);
}

/**
 * Whether the active theme has any curated config groups to apply.
 *
 * @param {Object} config theme.config from getRuntimeTheme().
 * @return {boolean}
 */
function hasThemeConfigGroups(config) {
	if (!config || typeof config !== 'object' || Array.isArray(config)) {
		return false;
	}

	return CURATED_THEME_CONFIG_GROUPS.some((group) =>
		isThemeableConfigPartial(config[group])
	);
}

/**
 * Re-apply the theme config layer on a variation innerBlocks template at insert
 * time (handles stale module-import merges after the theme option changes).
 *
 * @param {Array} template Inner blocks template tuple array.
 * @return {Array} Template with themed defaults on chart inner blocks.
 */
export function applyThemeToInnerBlocksTemplate(template) {
	const { config } = getRuntimeTheme();

	if (!hasThemeConfigGroups(config)) {
		return template;
	}

	const blockDefaults = getDefaultBlockAttributes();
	const themedDefaults = applyThemeConfigLayer(blockDefaults);

	return template.map((block) => {
		if (!Array.isArray(block)) {
			return block;
		}

		const [blockName, attributes, ...rest] = block;

		if (blockName !== 'prc-chart-builder/chart' || !attributes) {
			return block;
		}

		const themedAttributes = { ...attributes };

		for (const group of CURATED_THEME_CONFIG_GROUPS) {
			if (!(group in attributes)) {
				continue;
			}

			const groupDefaults = blockDefaults[group] ?? {};
			const groupAttributes = attributes[group] ?? {};
			const variationOverrides =
				extractVariationOverrides(groupDefaults, groupAttributes) ?? {};

			themedAttributes[group] = deepMerge(
				themedDefaults[group] ?? groupDefaults,
				variationOverrides
			);
		}

		return [blockName, themedAttributes, ...rest];
	});
}

/**
 * Merge custom attributes with defaults
 * This allows you to only specify the properties you want to override
 * while ensuring all other properties come from block.json defaults.
 *
 * @param {Object} overrides - Custom attribute values to override defaults
 * @returns {Object} Complete attribute object ready for variation template
 */
export function mergeWithDefaults(overrides) {
	const defaults = applyThemeConfigLayer(getDefaultBlockAttributes());
	return deepMerge(defaults, overrides);
}
