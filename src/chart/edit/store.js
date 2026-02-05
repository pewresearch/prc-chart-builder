/* eslint-disable no-param-reassign */
/**
 * WordPress Dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * LocalStorage key for persisting copied styles across windows/tabs
 */
const STORAGE_KEY = 'prc-chart-builder-copied-styles';

/**
 * Get copied styles from localStorage (for cross-window persistence)
 */
const getStoredStyles = () => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Check if the stored data is still valid (less than 24 hours old)
			if (parsed.timestamp && Date.now() - parsed.timestamp < 86400000) {
				return parsed.styles;
			}
		}
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn('Failed to read copied styles from localStorage:', e);
	}
	return null;
};

/**
 * Save copied styles to localStorage (for cross-window persistence)
 */
const saveStylesToStorage = (styles) => {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				styles,
				timestamp: Date.now(),
			})
		);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.warn('Failed to save copied styles to localStorage:', e);
	}
};

/**
 * Check if there are stored styles available (from any window)
 */
const hasStoredStyles = () => {
	const styles = getStoredStyles();
	return styles !== null && Object.keys(styles).length > 0;
};

/**
 * Initialize state from localStorage if available
 */
const getInitialState = () => {
	const storedStyles = getStoredStyles();
	return {
		isCopied: storedStyles !== null && Object.keys(storedStyles).length > 0,
		copiedStyles: storedStyles || {},
	};
};

const store = createReduxStore('prc-chart-builder/chart', {
	reducer: (state = getInitialState(), action) => {
		switch (action.type) {
			case 'COPY_CHART_STYLES':
				// Also save to localStorage for cross-window persistence
				saveStylesToStorage(action.payload);
				return {
					...state,
					isCopied: true,
					copiedStyles: action.payload,
				};
			case 'REFRESH_FROM_STORAGE':
				// Refresh state from localStorage (useful when window gains focus)
				const storedStyles = getStoredStyles();
				if (storedStyles) {
					return {
						...state,
						isCopied: true,
						copiedStyles: storedStyles,
					};
				}
				return state;
			case 'CLEAR_COPIED_STYLES':
				try {
					localStorage.removeItem(STORAGE_KEY);
				} catch (e) {
					// Ignore storage errors
				}
				return {
					...state,
					isCopied: false,
					copiedStyles: {},
				};
			default:
				return state;
		}
	},
	actions: {
		copyChartStyles(styles) {
			return {
				type: 'COPY_CHART_STYLES',
				payload: styles,
			};
		},
		refreshFromStorage() {
			return {
				type: 'REFRESH_FROM_STORAGE',
			};
		},
		clearCopiedStyles() {
			return {
				type: 'CLEAR_COPIED_STYLES',
			};
		},
	},
	selectors: {
		getCopiedStylesStatus(state) {
			// Also check localStorage in case styles were copied in another window
			if (!state.isCopied) {
				return hasStoredStyles();
			}
			return state.isCopied;
		},
		getCopiedStyles(state) {
			// Prefer state, but fall back to localStorage for cross-window support
			if (
				state.copiedStyles &&
				Object.keys(state.copiedStyles).length > 0
			) {
				return state.copiedStyles;
			}
			return getStoredStyles() || {};
		},
	},
});

// Register the store
register(store);

export default store;
