/**
 * useDiffColumnLabelCustomizations Hook
 *
 * Manages per-cell diff column styling stored in diffColumn.customLabels[rowKey].
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

function hasAnyValue(obj) {
	return Object.values(obj).some(
		(v) => v !== undefined && v !== null && v !== ''
	);
}

/**
 * @param {string}   rowKey
 * @param {Object}   currentCustomLabels - diffColumn.customLabels from block attrs
 * @param {Function} onUpdate           - Receives { customLabels }
 */
export function useDiffColumnLabelCustomizations(
	rowKey,
	currentCustomLabels = {},
	onUpdate
) {
	const savedEntry = currentCustomLabels?.[rowKey] || {};
	const [styles, setStyles] = useState(savedEntry);

	useEffect(() => {
		setStyles(currentCustomLabels?.[rowKey] || {});
	}, [currentCustomLabels, rowKey]);

	const handleChange = useCallback(
		(field, value) => {
			const next = { ...styles, [field]: value };
			if (field === 'text' && String(value).trim() === '') {
				delete next.text;
			}
			setStyles(next);

			const updated = { ...currentCustomLabels };
			if (!hasAnyValue(next)) {
				delete updated[rowKey];
			} else {
				updated[rowKey] = next;
			}
			onUpdate({ customLabels: updated });
		},
		[currentCustomLabels, rowKey, styles, onUpdate]
	);

	const handleReset = useCallback(() => {
		setStyles({});
		const updated = { ...currentCustomLabels };
		delete updated[rowKey];
		onUpdate({ customLabels: updated });
	}, [currentCustomLabels, rowKey, onUpdate]);

	return {
		values: {
			text: styles.text ?? '',
			fill: styles.fill ?? '',
			fontWeight: styles.fontWeight ?? '',
			fontStyle: styles.fontStyle ?? '',
			fontSize: styles.fontSize ?? null,
			textOutline: styles.textOutline ?? false,
		},
		hasCustomizations: hasAnyValue(styles),
		handleChange,
		handleReset,
	};
}

export default useDiffColumnLabelCustomizations;
