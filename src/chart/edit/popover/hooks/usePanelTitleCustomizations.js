/**
 * usePanelTitleCustomizations Hook
 *
 * Same text/position fields as legend items (customLegendLabels), stored in
 * customPanelTitles[panelKey].
 */

import { useCallback, useEffect, useState } from '@wordpress/element';

function hasAnyValue(obj) {
	return Object.values(obj).some(
		(v) => v !== undefined && v !== null && v !== ''
	);
}

/**
 * @param {string}   panelKey              - Panel key (column/group name).
 * @param {string}   defaultLabel          - Default title text.
 * @param {Object}   currentCustomizations - Current customPanelTitles from attrs.
 * @param {Function} onUpdate              - Callback: { customPanelTitles }.
 */
export function usePanelTitleCustomizations(
	panelKey,
	defaultLabel,
	currentCustomizations,
	onUpdate
) {
	const key = String(panelKey);
	const savedEntry = currentCustomizations?.[key] || {};

	const [styles, setStyles] = useState(savedEntry);

	useEffect(() => {
		setStyles(currentCustomizations?.[key] || {});
	}, [key, currentCustomizations]);

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
			onUpdate({ customPanelTitles: updated });
		},
		[key, currentCustomizations, styles, onUpdate]
	);

	const handleReset = useCallback(() => {
		setStyles({});
		const updated = { ...(currentCustomizations || {}) };
		delete updated[key];
		onUpdate({ customPanelTitles: updated });
	}, [key, currentCustomizations, onUpdate]);

	return {
		text: styles.text ?? '',
		color: styles.color ?? '',
		fontWeight: styles.fontWeight ?? '',
		fontStyle: styles.fontStyle ?? '',
		fontFamily: styles.fontFamily ?? '',
		fontSize: styles.fontSize ?? '',
		maxWidth: styles.maxWidth ?? 0,
		lineHeight: styles.lineHeight ?? '',
		textAlign: styles.textAlign ?? '',
		letterSpacing: styles.letterSpacing ?? '',
		textOutline: styles.textOutline ?? false,
		offsetX: styles.offsetX ?? '',
		offsetY: styles.offsetY ?? '',
		defaultLabel,
		hasCustomizations: hasAnyValue(styles),
		handleChange,
		handleReset,
	};
}
