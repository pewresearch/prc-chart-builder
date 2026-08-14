import { cloneTheme } from './path-utils';

/**
 * Replace the in-editor draft; leave savedSettings alone so isDirty becomes true.
 *
 * Uploaded payloads may omit `config` or `palettes`. Missing root keys are
 * preserved from the current draft so a Save cannot wipe them from the option.
 *
 * @param {import('../store').ThemeSettingsStoreState} state Current store state.
 * @param {import('../store').ChartTheme|unknown}      theme Uploaded theme payload.
 * @return {import('../store').ThemeSettingsStoreState} State with replaced settings draft.
 */
export function applyReplaceTheme(state, theme) {
	const current =
		state.settings &&
		typeof state.settings === 'object' &&
		!Array.isArray(state.settings)
			? state.settings
			: { config: {}, palettes: {} };

	if (!theme || typeof theme !== 'object' || Array.isArray(theme)) {
		return {
			...state,
			settings: { config: {}, palettes: {} },
		};
	}

	const patch = /** @type {Record<string, unknown>} */ (theme);

	const next = cloneTheme({
		config: Object.prototype.hasOwnProperty.call(patch, 'config')
			? patch.config
			: (current.config ?? {}),
		palettes: Object.prototype.hasOwnProperty.call(patch, 'palettes')
			? patch.palettes
			: (current.palettes ?? {}),
	});

	return {
		...state,
		settings: next,
	};
}
