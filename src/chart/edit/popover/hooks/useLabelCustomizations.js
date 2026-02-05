/**
 * useLabelCustomizations Hook
 *
 * Manages state and handlers for label customization in the popover.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Hook to manage label customization state and handlers.
 *
 * @param {string}   labelKey              - The unique key for this label
 * @param {Object}   currentCustomizations - Current customizations from block attrs
 * @param {Function} onUpdate              - Callback to update attributes
 * @return {Object} State values and handlers
 */
export function useLabelCustomizations(labelKey, currentCustomizations, onUpdate) {
	const currentText = currentCustomizations.customLabels?.[labelKey] || '';
	const currentVisible =
		currentCustomizations.customVisibility?.[labelKey] !== false;
	const currentPosition = currentCustomizations.customPositions?.[
		labelKey
	] || {
		dx: 0,
		dy: 0,
	};
	const currentStyles = currentCustomizations.customStyles?.[labelKey] || {};

	const [customText, setCustomText] = useState(currentText);
	const [isVisible, setIsVisible] = useState(currentVisible);
	const [positionDx, setPositionDx] = useState(currentPosition.dx || 0);
	const [positionDy, setPositionDy] = useState(currentPosition.dy || 0);
	const [customColor, setCustomColor] = useState(currentStyles.color || '');
	const [fontWeight, setFontWeight] = useState(
		currentStyles.fontWeight || 'normal'
	);
	const [fontStyle, setFontStyle] = useState(
		currentStyles.fontStyle || 'normal'
	);
	const [fontFamily, setFontFamily] = useState(
		currentStyles.fontFamily || ''
	);
	const [maxWidth, setMaxWidth] = useState(currentStyles.maxWidth || 0);

	useEffect(() => {
		setCustomText(currentText);
		setIsVisible(currentVisible);
		setPositionDx(currentPosition.dx || 0);
		setPositionDy(currentPosition.dy || 0);
		setCustomColor(currentStyles.color || '');
		setFontWeight(currentStyles.fontWeight || 'normal');
		setFontStyle(currentStyles.fontStyle || 'normal');
		setFontFamily(currentStyles.fontFamily || '');
		setMaxWidth(currentStyles.maxWidth || 0);
	}, [currentText, currentVisible, currentPosition, currentStyles]);

	const handleTextChange = useCallback(
		(value) => {
			setCustomText(value);
			const updated = { ...currentCustomizations.customLabels };
			if (value.trim() === '') {
				delete updated[labelKey];
			} else {
				updated[labelKey] = value;
			}
			onUpdate({ customLabels: updated });
		},
		[currentCustomizations.customLabels, labelKey, onUpdate]
	);

	const handleVisibilityChange = useCallback(
		(value) => {
			setIsVisible(value);
			const updated = { ...currentCustomizations.customVisibility };
			if (value === true) {
				delete updated[labelKey];
			} else {
				updated[labelKey] = false;
			}
			onUpdate({ customVisibility: updated });
		},
		[currentCustomizations.customVisibility, labelKey, onUpdate]
	);

	const handlePositionChange = useCallback(
		(axis, value) => {
			const numValue = parseFloat(value) || 0;
			const newDx = axis === 'dx' ? numValue : positionDx;
			const newDy = axis === 'dy' ? numValue : positionDy;
			if (axis === 'dx') setPositionDx(numValue);
			else setPositionDy(numValue);

			const updated = { ...currentCustomizations.customPositions };
			if (newDx === 0 && newDy === 0) {
				delete updated[labelKey];
			} else {
				updated[labelKey] = { dx: newDx, dy: newDy };
			}
			onUpdate({ customPositions: updated });
		},
		[
			currentCustomizations.customPositions,
			labelKey,
			positionDx,
			positionDy,
			onUpdate,
		]
	);

	const handleStyleChange = useCallback(
		(property, value) => {
			if (property === 'color') setCustomColor(value);
			if (property === 'fontWeight') setFontWeight(value);
			if (property === 'fontStyle') setFontStyle(value);
			if (property === 'fontFamily') setFontFamily(value);
			if (property === 'maxWidth') setMaxWidth(value);

			const updated = { ...currentCustomizations.customStyles };
			const labelStyles = updated[labelKey] || {};

			if (!value || value === '' || value === 'normal') {
				delete labelStyles[property];
			} else {
				labelStyles[property] = value;
			}

			if (Object.keys(labelStyles).length === 0) {
				delete updated[labelKey];
			} else {
				updated[labelKey] = labelStyles;
			}
			onUpdate({ customStyles: updated });
		},
		[currentCustomizations.customStyles, labelKey, onUpdate]
	);

	const handleReset = useCallback(() => {
		setCustomText('');
		setIsVisible(true);
		setPositionDx(0);
		setPositionDy(0);
		setCustomColor('');
		setFontWeight('normal');
		setFontStyle('normal');
		setFontFamily('');
		setMaxWidth(0);

		const labels = { ...currentCustomizations.customLabels };
		const visibility = { ...currentCustomizations.customVisibility };
		const positions = { ...currentCustomizations.customPositions };
		const styles = { ...currentCustomizations.customStyles };

		delete labels[labelKey];
		delete visibility[labelKey];
		delete positions[labelKey];
		delete styles[labelKey];

		onUpdate({
			customLabels: labels,
			customVisibility: visibility,
			customPositions: positions,
			customStyles: styles,
		});
	}, [currentCustomizations, labelKey, onUpdate]);

	const hasCustomizations =
		customText !== '' ||
		!isVisible ||
		positionDx !== 0 ||
		positionDy !== 0 ||
		customColor !== '' ||
		fontWeight !== 'normal' ||
		fontStyle !== 'normal' ||
		fontFamily !== '' ||
		maxWidth > 0;

	return {
		customText,
		isVisible,
		positionDx,
		positionDy,
		customColor,
		fontWeight,
		fontStyle,
		fontFamily,
		maxWidth,
		hasCustomizations,
		handleTextChange,
		handleVisibilityChange,
		handlePositionChange,
		handleStyleChange,
		handleReset,
	};
}

export default useLabelCustomizations;
