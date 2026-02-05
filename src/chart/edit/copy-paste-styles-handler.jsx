/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useEffect, useCallback } from '@wordpress/element';
import { copy, brush } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import store from './store';
import getCopyableStyleAttributes from '../utils/get-copyable-style-attributes';

const COPY_STYLES_LABEL = __('Copy Chart Styles');
const PASTE_STYLES_LABEL = __('Paste Chart Styles');

/**
 * Deep merge two objects, preserving nested properties.
 * Arrays are replaced entirely, not merged.
 *
 * @param {Object} target - The target object (existing attributes)
 * @param {Object} source - The source object (copied styles)
 * @return {Object} - Merged object
 */
const deepMerge = (target, source) => {
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
 * CopyPasteStylesHandler - Provides copy/paste functionality for chart styles.
 *
 * Styles are persisted to localStorage for cross-window support.
 * Only visual/style attributes are copied, not data-related attributes.
 *
 * @param {Object}   props               - Component props
 * @param {Object}   props.attributes    - The chart block attributes
 * @param {Function} props.setAttributes - Function to update block attributes
 */
const CopyPasteStylesHandler = ({ attributes, setAttributes }) => {
	const styleAttributes = getCopyableStyleAttributes(attributes);
	const { copyChartStyles, refreshFromStorage } = useDispatch(store);

	// Use useSelect for reactive state updates
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

		window.addEventListener('focus', handleFocus);
		// Also listen for storage events from other windows
		const handleStorageChange = (e) => {
			if (e.key === 'prc-chart-builder-copied-styles') {
				refreshFromStorage();
			}
		};
		window.addEventListener('storage', handleStorageChange);

		return () => {
			window.removeEventListener('focus', handleFocus);
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [refreshFromStorage]);

	const copyStyles = useCallback(() => {
		copyChartStyles(styleAttributes);
	}, [copyChartStyles, styleAttributes]);

	const pasteStyles = useCallback(() => {
		if (!copiedStyles || Object.keys(copiedStyles).length === 0) {
			return;
		}

		// Deep merge copied styles into current attributes
		const mergedAttributes = deepMerge(attributes, copiedStyles);
		setAttributes(mergedAttributes);
	}, [copiedStyles, attributes, setAttributes]);

	return (
		<BlockControls group="other">
			<ToolbarGroup>
				<ToolbarButton
					icon={copy}
					name="copy-styles"
					label={COPY_STYLES_LABEL}
					title={COPY_STYLES_LABEL}
					onClick={copyStyles}
				/>
				{hasCopiedStyles && (
					<ToolbarButton
						icon={brush}
						name="paste-styles"
						label={PASTE_STYLES_LABEL}
						title={PASTE_STYLES_LABEL}
						onClick={pasteStyles}
					/>
				)}
			</ToolbarGroup>
		</BlockControls>
	);
};

export default CopyPasteStylesHandler;
