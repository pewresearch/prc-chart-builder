/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useCallback } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal Dependencies
 */
import store from '../store';
import getCopyableStyleAttributes from '../../utils/get-copyable-style-attributes';
import pasteChartStyles from '../../utils/paste-chart-styles';

/**
 * Deep merge two objects, preserving nested properties.
 * Arrays are replaced entirely, not merged.
 *
 * @param {Object} target - The target object (existing attributes)
 * @param {Object} source - The source object (copied styles)
 * @return {Object} - Merged object
 */
export const deepMerge = (target, source) => {
	const result = { ...target };

	Object.keys(source).forEach((key) => {
		const sourceValue = source[key];
		const targetValue = target[key];

		// If both are objects (not arrays), recursively merge
		if (
			sourceValue &&
			typeof sourceValue === 'object' &&
			!Array.isArray(sourceValue) &&
			targetValue &&
			typeof targetValue === 'object' &&
			!Array.isArray(targetValue)
		) {
			result[key] = deepMerge(targetValue, sourceValue);
		} else if (sourceValue !== undefined) {
			// For arrays and primitives, replace entirely
			result[key] = sourceValue;
		}
	});

	return result;
};

/**
 * Copy/paste chart style attributes between chart blocks.
 *
 * Styles are persisted to localStorage for cross-window support.
 * Only visual/style attributes are copied, not data-related attributes.
 *
 * @param {Object}   attributes    - The chart block attributes
 * @param {Function} setAttributes - Function to update block attributes
 * @return {{hasCopiedStyles: boolean, copyStyles: Function, pasteStyles: Function}} Copy/paste state and handlers.
 */
export default function useCopyPasteStyles(attributes, setAttributes) {
	const { copyChartStyles, refreshFromStorage } = useDispatch(store);
	const { createInfoNotice } = useDispatch(noticesStore);

	const { hasCopiedStyles, copiedStyles } = useSelect(
		(select) => ({
			hasCopiedStyles: select(store).getCopiedStylesStatus(),
			copiedStyles: select(store).getCopiedStyles(),
		}),
		[]
	);

	// Refresh from localStorage when window gains focus (cross-window support)
	useEffect(() => {
		const handleFocus = () => {
			refreshFromStorage();
		};
		const handleStorageChange = (e) => {
			if (e.key === 'prc-chart-builder-copied-styles') {
				refreshFromStorage();
			}
		};

		window.addEventListener('focus', handleFocus);
		window.addEventListener('storage', handleStorageChange);

		return () => {
			window.removeEventListener('focus', handleFocus);
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [refreshFromStorage]);

	const copyStyles = useCallback(() => {
		copyChartStyles(getCopyableStyleAttributes(attributes));
	}, [copyChartStyles, attributes]);

	const pasteStyles = useCallback(() => {
		if (!copiedStyles || Object.keys(copiedStyles).length === 0) {
			return;
		}

		const {
			attributes: next,
			seriesStylesSkipped,
			panelStylesSkipped,
		} = pasteChartStyles(attributes, copiedStyles);
		setAttributes(next);

		const hasRows = (rows) => Object.keys(rows ?? {}).length > 0;
		if (
			(seriesStylesSkipped && hasRows(copiedStyles.seriesStyles)) ||
			(panelStylesSkipped && hasRows(copiedStyles.panelStyles))
		) {
			createInfoNotice(
				__(
					'Series colors were not pasted because this chart has series or panels the copied chart does not. The palette and other styles were pasted.',
					'prc-chart-builder'
				),
				{ type: 'snackbar' }
			);
		}
	}, [copiedStyles, attributes, setAttributes, createInfoNotice]);

	return { hasCopiedStyles, copyStyles, pasteStyles };
}
