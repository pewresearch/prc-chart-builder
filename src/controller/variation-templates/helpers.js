import blockMetadata from '../../chart/block.json';

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
 * Merge custom attributes with defaults
 * This allows you to only specify the properties you want to override
 * while ensuring all other properties come from block.json defaults.
 *
 * @param {Object} overrides - Custom attribute values to override defaults
 * @returns {Object} Complete attribute object ready for variation template
 */
export function mergeWithDefaults(overrides) {
	const defaults = getDefaultBlockAttributes();
	return deepMerge(defaults, overrides);
}
