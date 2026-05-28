/**
 * useLegendItemCustomizations Hook
 *
 * Manages state and handlers for legend item customization in the popover.
 * Each item's customization is stored as an object keyed by category/domain
 * value in customLegendLabels. Supported fields:
 *   text        - override label text
 *   color       - override swatch/label color
 *   fontWeight  - override font weight ('normal' | 'bold' | '600' | '700')
 *   fontStyle   - override font style ('normal' | 'italic')
 *   fontFamily  - override font family
 *   fontSize    - override font size (number, px)
 *   maxWidth    - max width for text wrapping (number, px; 0 = no limit)
 *   textOutline - add contrasting outline behind text (boolean)
 *   markerStyle - override swatch shape ('' | 'circle' | 'square' | 'line' | 'none')
 *   markerFill  - override marker fill ( 'solid' | 'outline')
 *   offsetX     - horizontal position offset (detached mode only, number px)
 *   offsetY     - vertical position offset (detached mode only, number px)
 */

import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Returns true if an object has at least one meaningful value.
 *
 * @param {Object} obj - Object to check.
 * @return {boolean} Whether the object has any non-empty values.
 */
function hasAnyValue(obj) {
	return Object.values(obj).some(
		(v) => v !== undefined && v !== null && v !== ''
	);
}

/**
 * Hook to manage legend item customization state and handlers.
 *
 * @param {string}   categoryValue         - The category/domain value (used as key).
 * @param {string}   defaultLabel          - The default rendered label text.
 * @param {Object}   currentCustomizations - Current customLegendLabels from block attrs.
 * @param {Function} onUpdate              - Callback: receives { customLegendLabels: { ... } }.
 * @return {Object} State values and handlers.
 */
export function useLegendItemCustomizations(
	categoryValue,
	defaultLabel,
	currentCustomizations,
	onUpdate
) {
	const key = String(categoryValue);
	const savedEntry = currentCustomizations?.[key] || {};

	const [styles, setStyles] = useState(savedEntry);

	// Sync when the popover reopens on a different legend item
	useEffect(() => {
		setStyles(currentCustomizations?.[key] || {});
	}, [key, currentCustomizations]);

	/**
	 * Update a single field in the customization object.
	 *
	 * @param {string} field - Field name.
	 * @param {*}      value - New value.
	 */
	const handleChange = useCallback(
		(field, value) => {
			const next = { ...styles, [field]: value };
			setStyles(next);

			const updated = { ...(currentCustomizations || {}) };
			if (!hasAnyValue(next)) {
				delete updated[key];
			} else {
				updated[key] = next;
			}
			onUpdate({ customLegendLabels: updated });
		},
		[key, currentCustomizations, styles, onUpdate]
	);

	/**
	 * Remove all customizations for this legend item.
	 */
	const handleReset = useCallback(() => {
		setStyles({});
		const updated = { ...(currentCustomizations || {}) };
		delete updated[key];
		onUpdate({ customLegendLabels: updated });
	}, [key, currentCustomizations, onUpdate]);

	const hasCustomizations = hasAnyValue(styles);

	return {
		text: styles.text ?? '',
		color: styles.color ?? '',
		fontWeight: styles.fontWeight ?? '',
		fontStyle: styles.fontStyle ?? '',
		fontFamily: styles.fontFamily ?? '',
		fontSize: styles.fontSize ?? '',
		maxWidth: styles.maxWidth ?? 0,
		textOutline: styles.textOutline ?? false,
		markerStyle: styles.markerStyle ?? '',
		markerFill: styles.markerFill ?? '',
		offsetX: styles.offsetX ?? '',
		offsetY: styles.offsetY ?? '',
		defaultLabel,
		hasCustomizations,
		handleChange,
		handleReset,
	};
}

export default useLegendItemCustomizations;
