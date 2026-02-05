/**
 * useShapeCustomizations Hook
 *
 * Manages state and handlers for shape styling customization in the popover.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Default shape style values.
 */
const DEFAULT_SHAPE_STYLES = {
	fill: '',
	stroke: '',
	opacity: 1,
	strokeWidth: 0,
	pattern: 'solid',
};

/**
 * Hook to manage shape customization state and handlers.
 *
 * @param {string}   shapeKey              - The unique key for this shape
 * @param {Object}   currentCustomizations - Current customizations from block attrs
 * @param {Function} onUpdate              - Callback to update attributes
 * @return {Object} State values and handlers
 */
export function useShapeCustomizations(shapeKey, currentCustomizations, onUpdate) {
	const currentStyles = currentCustomizations.customStyles?.[shapeKey] || {};

	const [fill, setFill] = useState(currentStyles.fill || '');
	const [stroke, setStroke] = useState(currentStyles.stroke || '');
	const [opacity, setOpacity] = useState(currentStyles.opacity ?? 1);
	const [strokeWidth, setStrokeWidth] = useState(currentStyles.strokeWidth || 0);
	const [pattern, setPattern] = useState(currentStyles.pattern || 'solid');

	// Sync state when currentStyles changes
	useEffect(() => {
		setFill(currentStyles.fill || '');
		setStroke(currentStyles.stroke || '');
		setOpacity(currentStyles.opacity ?? 1);
		setStrokeWidth(currentStyles.strokeWidth || 0);
		setPattern(currentStyles.pattern || 'solid');
	}, [currentStyles]);

	/**
	 * Update a single style property.
	 */
	const handleStyleChange = useCallback(
		(property, value) => {
			// Update local state
			if (property === 'fill') setFill(value);
			if (property === 'stroke') setStroke(value);
			if (property === 'opacity') setOpacity(value);
			if (property === 'strokeWidth') setStrokeWidth(value);
			if (property === 'pattern') setPattern(value);

			// Update customizations
			const updated = { ...currentCustomizations.customStyles };
			const shapeStyles = { ...(updated[shapeKey] || {}) };

			// Check if value is default - if so, remove it
			const isDefault =
				(property === 'fill' && (value === '' || value === null)) ||
				(property === 'stroke' && (value === '' || value === null)) ||
				(property === 'opacity' && value === 1) ||
				(property === 'strokeWidth' && value === 0) ||
				(property === 'pattern' && value === 'solid');

			if (isDefault) {
				delete shapeStyles[property];
			} else {
				shapeStyles[property] = value;
			}

			// If no custom styles remain, remove the shape entry entirely
			if (Object.keys(shapeStyles).length === 0) {
				delete updated[shapeKey];
			} else {
				updated[shapeKey] = shapeStyles;
			}

			onUpdate({ customStyles: updated });
		},
		[currentCustomizations.customStyles, shapeKey, onUpdate]
	);

	/**
	 * Reset all styles to defaults.
	 */
	const handleReset = useCallback(() => {
		setFill('');
		setStroke('');
		setOpacity(1);
		setStrokeWidth(0);
		setPattern('solid');

		const updated = { ...currentCustomizations.customStyles };
		delete updated[shapeKey];

		onUpdate({ customStyles: updated });
	}, [currentCustomizations.customStyles, shapeKey, onUpdate]);

	// Check if any customizations exist
	const hasCustomizations =
		fill !== '' ||
		stroke !== '' ||
		opacity !== 1 ||
		strokeWidth !== 0 ||
		pattern !== 'solid';

	return {
		fill,
		stroke,
		opacity,
		strokeWidth,
		pattern,
		hasCustomizations,
		handleStyleChange,
		handleReset,
	};
}

export default useShapeCustomizations;
