/**
 * useErrorBarCustomizations Hook
 *
 * Manages state and handlers for error bar styling customization in the popover.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Hook to manage error bar customization state and handlers.
 *
 * @param {string}   elementKey            - The unique key for this error bar element
 * @param {Object}   currentCustomizations - Current customizations from block attrs
 * @param {Function} onUpdate              - Callback to update attributes
 * @return {Object} State values and handlers
 */
export function useErrorBarCustomizations(
	elementKey,
	currentCustomizations,
	onUpdate
) {
	const currentStyles =
		currentCustomizations.customStyles?.[elementKey] || {};

	const [stroke, setStroke] = useState(currentStyles.stroke || '');
	const [strokeWidth, setStrokeWidth] = useState(
		currentStyles.strokeWidth || 0
	);
	const [strokeOpacity, setStrokeOpacity] = useState(
		currentStyles.strokeOpacity ?? 1
	);
	const [strokeDasharray, setStrokeDasharray] = useState(
		currentStyles.strokeDasharray || ''
	);

	useEffect(() => {
		setStroke(currentStyles.stroke || '');
		setStrokeWidth(currentStyles.strokeWidth || 0);
		setStrokeOpacity(currentStyles.strokeOpacity ?? 1);
		setStrokeDasharray(currentStyles.strokeDasharray || '');
	}, [currentStyles]);

	const handleStyleChange = useCallback(
		(property, value) => {
			if (property === 'stroke') setStroke(value);
			if (property === 'strokeWidth') setStrokeWidth(value);
			if (property === 'strokeOpacity') setStrokeOpacity(value);
			if (property === 'strokeDasharray') setStrokeDasharray(value);

			const updated = { ...currentCustomizations.customStyles };
			const styles = { ...(updated[elementKey] || {}) };

			const isDefault =
				(property === 'stroke' &&
					(value === '' || value === null)) ||
				(property === 'strokeWidth' && value === 0) ||
				(property === 'strokeOpacity' && value === 1) ||
				(property === 'strokeDasharray' && value === '');

			if (isDefault) {
				delete styles[property];
			} else {
				styles[property] = value;
			}

			if (Object.keys(styles).length === 0) {
				delete updated[elementKey];
			} else {
				updated[elementKey] = styles;
			}

			onUpdate({ customStyles: updated });
		},
		[currentCustomizations.customStyles, elementKey, onUpdate]
	);

	const handleReset = useCallback(() => {
		setStroke('');
		setStrokeWidth(0);
		setStrokeOpacity(1);
		setStrokeDasharray('');

		const updated = { ...currentCustomizations.customStyles };
		delete updated[elementKey];

		onUpdate({ customStyles: updated });
	}, [currentCustomizations.customStyles, elementKey, onUpdate]);

	const hasCustomizations =
		stroke !== '' ||
		strokeWidth !== 0 ||
		strokeOpacity !== 1 ||
		strokeDasharray !== '';

	return {
		stroke,
		strokeWidth,
		strokeOpacity,
		strokeDasharray,
		hasCustomizations,
		handleStyleChange,
		handleReset,
	};
}

export default useErrorBarCustomizations;
