/**
 * useTickLabelCustomizations Hook
 *
 * Manages state and handlers for tick label customization in the popover.
 * Each tick's customization is stored as an object:
 *   { text?, fill?, fontSize?, fontWeight?, fontStyle?, offsetX?, offsetY? }
 *
 * Legacy string values (plain custom text) are handled for backwards compat.
 * Updates are merged into customTickLabels[axisKey][tickKey], where tickKey
 * carries the small-multiples panel when the author edited a tick inside one.
 */

import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import {
	generateTickLabelKey,
	resolveTickLabelEntry,
} from '@prc/charting-utilities';

/**
 * Normalise a stored entry to a style object, handling the legacy string format.
 *
 * @param {string|Object|undefined} entry
 * @return {Object} The entry as a style object.
 */
function normalizeEntry(entry) {
	if (!entry) return {};
	if (typeof entry === 'string') return { text: entry };
	return entry;
}

/**
 * Returns true if an object has at least one meaningful value.
 *
 * @param {Object} obj
 * @return {boolean} True when at least one field is set.
 */
function hasAnyValue(obj) {
	return Object.values(obj).some(
		(v) => v !== undefined && v !== null && v !== ''
	);
}

/**
 * Hook to manage tick label customization state and handlers.
 *
 * @param {string}      axisKey               - 'independent' or 'dependent'
 * @param {unknown}     tickValue             - The raw tick value (used as key)
 * @param {string}      defaultLabel          - The default/formatted label
 * @param {Object}      currentCustomizations - Current customTickLabels from block attrs
 * @param {Function}    onUpdate              - Callback: receives { [axisKey]: { [tickKey]: object } }
 * @param {string|null} panelKey              - Small-multiples panel the tick belongs to, or null
 * @return {Object} State values and handlers
 */
export function useTickLabelCustomizations(
	axisKey,
	tickValue,
	defaultLabel,
	currentCustomizations,
	onUpdate,
	panelKey = null
) {
	const axisLabels = useMemo(
		() => currentCustomizations?.[axisKey] || {},
		[currentCustomizations, axisKey]
	);
	const tickKey = generateTickLabelKey(tickValue, panelKey);
	// Seed from what the tick actually shows, so a panel that inherits
	// chart-wide styling opens with those values rather than empty fields.
	const rawEntry = resolveTickLabelEntry(axisLabels, tickValue, panelKey);
	const savedEntry = normalizeEntry(rawEntry);

	const [styles, setStyles] = useState(savedEntry);

	// Sync when the popover reopens on a different tick
	useEffect(() => {
		setStyles(normalizeEntry(rawEntry));
	}, [rawEntry, tickKey]);

	/**
	 * Update a single field in the style object.
	 *
	 * @param {string} field
	 * @param {*}      value
	 */
	const handleChange = useCallback(
		(field, value) => {
			const next = { ...styles, [field]: value };
			setStyles(next);

			const updated = { ...axisLabels };
			if (!hasAnyValue(next)) {
				delete updated[tickKey];
			} else {
				updated[tickKey] = next;
			}
			onUpdate({ [axisKey]: updated });
		},
		[axisKey, axisLabels, tickKey, styles, onUpdate]
	);

	/**
	 * Remove all customizations for this tick.
	 */
	const handleReset = useCallback(() => {
		setStyles({});
		const updated = { ...axisLabels };
		delete updated[tickKey];
		onUpdate({ [axisKey]: updated });
	}, [axisKey, axisLabels, tickKey, onUpdate]);

	const hasCustomizations = hasAnyValue(styles);

	return {
		text: styles.text ?? '',
		fill: styles.fill ?? '',
		fontSize: styles.fontSize ?? null,
		fontWeight: styles.fontWeight ?? '',
		fontStyle: styles.fontStyle ?? '',
		offsetX: styles.offsetX ?? '',
		offsetY: styles.offsetY ?? '',
		defaultLabel,
		hasCustomizations,
		handleChange,
		handleReset,
	};
}

export default useTickLabelCustomizations;
