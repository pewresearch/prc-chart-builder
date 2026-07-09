/**
 * Apply active chart theme config to block.json attribute defaults (PRC-528).
 *
 * Editor-side via blocks.registerBlockType; server parity in Theme_Block_Defaults.
 */
import { deepMergeDefaults, getRuntimeTheme } from './resolve-defaults';
import {
	CURATED_THEME_CONFIG_GROUPS,
	isThemeableConfigPartial,
} from './theme-config-groups';

export const CHART_BLOCK_NAME = 'prc-chart-builder/chart';

/**
 * Deep-merge a theme partial into a block attribute default object.
 *
 * @param {Object}           blockDefault block.json default for the attribute group.
 * @param {Object|undefined} themePartial Active theme config for the group.
 * @return {Object} Merged default (does not mutate inputs).
 */
export function applyThemeGroupDefault(blockDefault, themePartial) {
	if (!isThemeableConfigPartial(themePartial)) {
		return blockDefault;
	}

	return deepMergeDefaults(blockDefault ?? {}, themePartial);
}

/** @deprecated Slice 3 alias — use applyThemeGroupDefault. */
export const applyThemeLayoutDefault = applyThemeGroupDefault;

/**
 * Merge all curated theme.config groups into block attribute defaults.
 *
 * @param {Object} defaults Block.json attribute defaults keyed by group.
 * @return {Object} Defaults with active theme.config groups merged in.
 */
export function applyThemeConfigLayerToDefaults(defaults) {
	const { config } = getRuntimeTheme();

	if (!config || typeof config !== 'object' || Array.isArray(config)) {
		return defaults;
	}

	let output = { ...defaults };

	for (const group of CURATED_THEME_CONFIG_GROUPS) {
		const themePartial = config[group];
		if (!isThemeableConfigPartial(themePartial)) {
			continue;
		}

		output = {
			...output,
			[group]: applyThemeGroupDefault(output[group] ?? {}, themePartial),
		};
	}

	return output;
}

/**
 * blocks.registerBlockType filter — inject theme.config into chart defaults.
 *
 * @param {Object} settings  Block type settings passed to registerBlockType.
 * @param {string} blockName Registered block name.
 * @return {Object} Settings with themed defaults when applicable.
 */
export function applyThemeBlockDefaults(settings, blockName) {
	if (blockName !== CHART_BLOCK_NAME) {
		return settings;
	}

	const { config } = getRuntimeTheme();
	if (!config || typeof config !== 'object' || Array.isArray(config)) {
		return settings;
	}

	let attributes = settings.attributes ?? {};
	let changed = false;

	for (const group of CURATED_THEME_CONFIG_GROUPS) {
		const themePartial = config[group];
		if (!isThemeableConfigPartial(themePartial)) {
			continue;
		}

		const groupAttribute = attributes[group];
		if (!groupAttribute || groupAttribute.type !== 'object') {
			continue;
		}

		const blockDefault = groupAttribute.default ?? {};

		attributes = {
			...attributes,
			[group]: {
				...groupAttribute,
				default: applyThemeGroupDefault(blockDefault, themePartial),
			},
		};
		changed = true;
	}

	if (!changed) {
		return settings;
	}

	return {
		...settings,
		attributes,
	};
}
