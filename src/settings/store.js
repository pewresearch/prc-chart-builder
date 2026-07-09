import { createSettingsStore } from '@prc/components';

import { applyConfigGroupPartial } from './utils';
import {
	applyFieldEdit,
	getConfigGroup,
	getAtPath,
	replaceConfigGroup,
	unsetAtPath,
	cloneTheme,
} from './path-utils';
import { getShippedGroupDefault } from './shipped-defaults';
import {
	addPalette,
	renamePalette,
	deletePalette,
	togglePaletteColor,
	reorderPaletteColors,
	setPaletteColors,
	getPalettes,
} from './palette-utils';

export const STORE_NAME = 'prc/chart-builder-theme-settings';

/** @typedef {{ config?: Record<string, unknown>, palettes?: Record<string, unknown> }} ChartTheme */

/**
 * @typedef {Object} ThemeSettingsStoreState
 * @property {ChartTheme} settings
 * @property {ChartTheme} savedSettings
 * @property {boolean} isLoaded
 */

export const store = createSettingsStore({
	name: STORE_NAME,
	defaultState: {
		settings: {
			config: {},
			palettes: {},
		},
		savedSettings: {
			config: {},
			palettes: {},
		},
		selectedPaletteSlug: null,
		colorPreviewMode: 'light',
		isLoaded: false,
	},
	getSettingsFromResponse: (response) => response,
	mapResponseToState: (_state, response) => {
		const settings =
			response && typeof response === 'object' && !Array.isArray(response)
				? /** @type {ChartTheme} */ (response)
				: { config: {}, palettes: {} };

		return {
			savedSettings: cloneTheme(settings),
		};
	},
	extraActions: {
		updateConfigGroupPartial(groupKey, partial) {
			return {
				type: 'UPDATE_CONFIG_GROUP_PARTIAL',
				payload: { groupKey, partial },
			};
		},
		setConfigField(groupKey, pathParts, value, options = {}) {
			return {
				type: 'SET_CONFIG_FIELD',
				payload: { groupKey, pathParts, value, options },
			};
		},
		resetConfigField(groupKey, pathParts) {
			return {
				type: 'RESET_CONFIG_FIELD',
				payload: { groupKey, pathParts },
			};
		},
		selectPalette(slug) {
			return { type: 'SELECT_PALETTE', payload: { slug } };
		},
		addPalette(name) {
			return { type: 'ADD_PALETTE', payload: { name } };
		},
		renamePalette(slug, name) {
			return { type: 'RENAME_PALETTE', payload: { slug, name } };
		},
		deletePalette(slug) {
			return { type: 'DELETE_PALETTE', payload: { slug } };
		},
		togglePaletteColor(slug, hex) {
			return {
				type: 'TOGGLE_PALETTE_COLOR',
				payload: { slug, hex },
			};
		},
		reorderPaletteColors(slug, fromIndex, toIndex) {
			return {
				type: 'REORDER_PALETTE_COLORS',
				payload: { slug, fromIndex, toIndex },
			};
		},
		setPaletteColors(slug, colors) {
			return {
				type: 'SET_PALETTE_COLORS',
				payload: { slug, colors },
			};
		},
		setColorPreviewMode(mode) {
			return { type: 'SET_COLOR_PREVIEW_MODE', payload: { mode } };
		},
	},
	extraReducer: (state, action) => {
		if (action.type === 'UPDATE_CONFIG_GROUP_PARTIAL') {
			const { groupKey, partial } =
				/** @type {{ groupKey: string, partial: Record<string, unknown> }} */ (
					action.payload
				);

			return {
				...state,
				settings: applyConfigGroupPartial(
					state.settings,
					groupKey,
					partial
				),
			};
		}

		if (action.type === 'SET_CONFIG_FIELD') {
			const {
				groupKey,
				pathParts,
				value,
				options = {},
			} = /** @type {{ groupKey: string, pathParts: string[], value: unknown, options?: { unsetOnShippedMatch?: boolean } }} */ (
				action.payload
			);
			const shipped = getShippedGroupDefault(groupKey);
			const shippedValue = getAtPath(shipped, pathParts);

			return {
				...state,
				settings: applyFieldEdit(
					state.settings,
					groupKey,
					pathParts,
					value,
					shippedValue,
					options
				),
			};
		}

		if (action.type === 'RESET_CONFIG_FIELD') {
			const { groupKey, pathParts } =
				/** @type {{ groupKey: string, pathParts: string[] }} */ (
					action.payload
				);
			const currentGroup = getConfigGroup(state.settings, groupKey);

			return {
				...state,
				settings: replaceConfigGroup(
					state.settings,
					groupKey,
					unsetAtPath(currentGroup, pathParts)
				),
			};
		}

		if (action.type === 'SELECT_PALETTE') {
			const { slug } = /** @type {{ slug: string|null }} */ (
				action.payload
			);
			return { ...state, selectedPaletteSlug: slug };
		}

		if (action.type === 'ADD_PALETTE') {
			const { name } = /** @type {{ name: string }} */ (action.payload);
			const { theme, slug } = addPalette(state.settings, name);
			return {
				...state,
				settings: theme,
				selectedPaletteSlug: slug,
			};
		}

		if (action.type === 'RENAME_PALETTE') {
			const { slug, name } =
				/** @type {{ slug: string, name: string }} */ (action.payload);
			const { theme, slug: nextSlug } = renamePalette(
				state.settings,
				slug,
				name
			);
			return {
				...state,
				settings: theme,
				selectedPaletteSlug:
					state.selectedPaletteSlug === slug
						? nextSlug
						: state.selectedPaletteSlug,
			};
		}

		if (action.type === 'DELETE_PALETTE') {
			const { slug } = /** @type {{ slug: string }} */ (action.payload);
			const settings = deletePalette(state.settings, slug);
			return {
				...state,
				settings,
				selectedPaletteSlug:
					state.selectedPaletteSlug === slug
						? (getPalettes(settings)[0]?.value ?? null)
						: state.selectedPaletteSlug,
			};
		}

		if (action.type === 'TOGGLE_PALETTE_COLOR') {
			const { slug, hex } = /** @type {{ slug: string, hex: string }} */ (
				action.payload
			);
			return {
				...state,
				settings: togglePaletteColor(state.settings, slug, hex),
			};
		}

		if (action.type === 'REORDER_PALETTE_COLORS') {
			const { slug, fromIndex, toIndex } =
				/** @type {{ slug: string, fromIndex: number, toIndex: number }} */ (
					action.payload
				);
			return {
				...state,
				settings: reorderPaletteColors(
					state.settings,
					slug,
					fromIndex,
					toIndex
				),
			};
		}

		if (action.type === 'SET_PALETTE_COLORS') {
			const { slug, colors } =
				/** @type {{ slug: string, colors: string[] }} */ (
					action.payload
				);
			return {
				...state,
				settings: setPaletteColors(state.settings, slug, colors),
			};
		}

		if (action.type === 'SET_COLOR_PREVIEW_MODE') {
			const { mode } = /** @type {{ mode: 'light' | 'dark' }} */ (
				action.payload
			);
			if (mode !== 'light' && mode !== 'dark') {
				return null;
			}
			return { ...state, colorPreviewMode: mode };
		}

		return null;
	},
	extraSelectors: {
		isDirty(state) {
			return (
				JSON.stringify(state.settings) !==
				JSON.stringify(state.savedSettings)
			);
		},
		/**
		 * Resolved active palette slug: the stored selection when it still
		 * exists, otherwise the first palette (so the designer always has a
		 * target without needing an on-load initializer).
		 */
		getSelectedPaletteSlug(state) {
			const palettes = getPalettes(state.settings);
			const stored = state.selectedPaletteSlug;
			if (stored && palettes.some((entry) => entry.value === stored)) {
				return stored;
			}
			return palettes[0]?.value ?? null;
		},
		getColorPreviewMode(state) {
			return state.colorPreviewMode === 'dark' ? 'dark' : 'light';
		},
	},
});
