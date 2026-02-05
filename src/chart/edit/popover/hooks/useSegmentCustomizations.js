/**
 * useSegmentCustomizations Hook
 *
 * Manages state and handlers for line segment styling customization in the popover.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Default segment style values.
 */
const DEFAULT_SEGMENT_STYLES = {
	stroke: '',
	strokeWidth: 0,
	opacity: 1,
	strokeDasharray: '',
};

/**
 * Hook to manage segment customization state and handlers.
 *
 * @param {string}   segmentKey            - The unique key for this segment
 * @param {Object}   currentCustomizations - Current customizations from block attrs
 * @param {Function} onUpdate              - Callback to update attributes
 * @return {Object} State values and handlers
 */
export function useSegmentCustomizations(
	segmentKey,
	currentCustomizations,
	onUpdate
) {
	const currentStyles = currentCustomizations.segmentStyles?.[segmentKey] || {};

	const [stroke, setStroke] = useState(currentStyles.stroke || '');
	const [strokeWidth, setStrokeWidth] = useState(
		currentStyles.strokeWidth || 0
	);
	const [opacity, setOpacity] = useState(currentStyles.opacity ?? 1);
	const [strokeDasharray, setStrokeDasharray] = useState(
		currentStyles.strokeDasharray || ''
	);

	// Sync state when currentStyles changes
	useEffect(() => {
		setStroke(currentStyles.stroke || '');
		setStrokeWidth(currentStyles.strokeWidth || 0);
		setOpacity(currentStyles.opacity ?? 1);
		setStrokeDasharray(currentStyles.strokeDasharray || '');
	}, [currentStyles]);

	/**
	 * Update a single style property.
	 */
	const handleStyleChange = useCallback(
		(property, value) => {
			// Update local state
			if (property === 'stroke') setStroke(value);
			if (property === 'strokeWidth') setStrokeWidth(value);
			if (property === 'opacity') setOpacity(value);
			if (property === 'strokeDasharray') setStrokeDasharray(value);

			// Update customizations
			const updated = { ...currentCustomizations.segmentStyles };
			const segmentStyles = { ...(updated[segmentKey] || {}) };

			// Check if value is default - if so, remove it
			const isDefault =
				(property === 'stroke' && (value === '' || value === null)) ||
				(property === 'strokeWidth' && value === 0) ||
				(property === 'opacity' && value === 1) ||
				(property === 'strokeDasharray' && value === '');

			if (isDefault) {
				delete segmentStyles[property];
			} else {
				segmentStyles[property] = value;
			}

			// If no custom styles remain, remove the segment entry entirely
			if (Object.keys(segmentStyles).length === 0) {
				delete updated[segmentKey];
			} else {
				updated[segmentKey] = segmentStyles;
			}

			onUpdate({ segmentStyles: updated });
		},
		[currentCustomizations.segmentStyles, segmentKey, onUpdate]
	);

	/**
	 * Reset all styles to defaults.
	 */
	const handleReset = useCallback(() => {
		setStroke('');
		setStrokeWidth(0);
		setOpacity(1);
		setStrokeDasharray('');

		const updated = { ...currentCustomizations.segmentStyles };
		delete updated[segmentKey];

		onUpdate({ segmentStyles: updated });
	}, [currentCustomizations.segmentStyles, segmentKey, onUpdate]);

	// Check if any customizations exist
	const hasCustomizations =
		stroke !== '' ||
		strokeWidth !== 0 ||
		opacity !== 1 ||
		strokeDasharray !== '';

	return {
		stroke,
		strokeWidth,
		opacity,
		strokeDasharray,
		hasCustomizations,
		handleStyleChange,
		handleReset,
	};
}

export default useSegmentCustomizations;
