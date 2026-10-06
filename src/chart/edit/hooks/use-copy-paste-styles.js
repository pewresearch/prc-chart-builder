/**
 * WordPress Dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useCallback } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import store from '../store';
import getCopyableStyleAttributes from '../../utils/get-copyable-style-attributes';

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
		setAttributes(deepMerge(attributes, copiedStyles));
	}, [copiedStyles, attributes, setAttributes]);

	return { hasCopiedStyles, copyStyles, pasteStyles };
}
