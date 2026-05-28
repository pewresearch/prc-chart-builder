/**
 * useAnnotationCustomizations Hook
 *
 * Manages state and handlers for annotation customization in the popover.
 * Updates are merged into the annotation at the given index.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

/**
 * Hook to manage annotation customization state and handlers.
 *
 * @param {Object}   annotation - The current annotation object
 * @param {string}   annotationId - The annotation index as string
 * @param {Function} onUpdate     - Callback to update annotation (receives partial updates)
 * @param {Object}   [customDefaults] - Optional defaults for reset (e.g. diff column header)
 * @return {Object} State values and handlers
 */
export function useAnnotationCustomizations(
	annotation,
	annotationId,
	onUpdate,
	customDefaults = null
) {
	const defaults = customDefaults ?? {
		text: '',
		fontSize: 14,
		fontWeight: 'normal',
		fontStyle: 'normal',
		fontFamily: '',
		fill: 'light-dark(#000000, #f0f0f0)',
		textAnchor: 'start',
		verticalAnchor: 'start',
		rotation: 0,
		maxWidth: 200,
		opacity: 1,
		positioningContext: 'chart',
		textOutline: false,
	};

	const [text, setText] = useState(annotation?.text ?? defaults.text);
	const [fontSize, setFontSize] = useState(
		annotation?.fontSize ?? defaults.fontSize
	);
	const [fontWeight, setFontWeight] = useState(
		annotation?.fontWeight ?? defaults.fontWeight
	);
	const [fontStyle, setFontStyle] = useState(
		annotation?.fontStyle ?? defaults.fontStyle
	);
	const [fontFamily, setFontFamily] = useState(
		annotation?.fontFamily ?? defaults.fontFamily
	);
	const [fill, setFill] = useState(annotation?.fill ?? defaults.fill);
	const [textAnchor, setTextAnchor] = useState(
		annotation?.textAnchor ?? defaults.textAnchor
	);
	const [verticalAnchor, setVerticalAnchor] = useState(
		annotation?.verticalAnchor ?? defaults.verticalAnchor
	);
	const [rotation, setRotation] = useState(
		annotation?.rotation ?? defaults.rotation
	);
	const [maxWidth, setMaxWidth] = useState(
		annotation?.maxWidth ?? defaults.maxWidth
	);
	const [opacity, setOpacity] = useState(
		annotation?.opacity ?? defaults.opacity
	);
	const [positioningContext, setPositioningContext] = useState(
		annotation?.positioningContext ?? defaults.positioningContext
	);
	const [textOutline, setTextOutline] = useState(
		annotation?.textOutline ?? defaults.textOutline
	);

	useEffect(() => {
		if (annotation) {
			setText(annotation.text ?? defaults.text);
			setFontSize(annotation.fontSize ?? defaults.fontSize);
			setFontWeight(annotation.fontWeight ?? defaults.fontWeight);
			setFontStyle(annotation.fontStyle ?? defaults.fontStyle);
			setFontFamily(annotation.fontFamily ?? defaults.fontFamily);
			setFill(annotation.fill ?? defaults.fill);
			setTextAnchor(annotation.textAnchor ?? defaults.textAnchor);
			setVerticalAnchor(
				annotation.verticalAnchor ?? defaults.verticalAnchor
			);
			setRotation(annotation.rotation ?? defaults.rotation);
			setMaxWidth(annotation.maxWidth ?? defaults.maxWidth);
			setOpacity(annotation.opacity ?? defaults.opacity);
			setPositioningContext(
				annotation.positioningContext ?? defaults.positioningContext
			);
			setTextOutline(annotation.textOutline ?? defaults.textOutline);
		}
	}, [annotation, annotationId]);

	const handleChange = useCallback(
		(key, value) => {
			const setters = {
				text: setText,
				fontSize: setFontSize,
				fontWeight: setFontWeight,
				fontStyle: setFontStyle,
				fontFamily: setFontFamily,
				fill: setFill,
				textAnchor: setTextAnchor,
				verticalAnchor: setVerticalAnchor,
				rotation: setRotation,
				maxWidth: setMaxWidth,
				opacity: setOpacity,
				positioningContext: setPositioningContext,
				textOutline: setTextOutline,
			};
			if (setters[key]) setters[key](value);
			onUpdate({ [key]: value });
		},
		[onUpdate]
	);

	const handleReset = useCallback(() => {
		setText(defaults.text);
		setFontSize(defaults.fontSize);
		setFontWeight(defaults.fontWeight);
		setFontStyle(defaults.fontStyle);
		setFontFamily(defaults.fontFamily);
		setFill(defaults.fill);
		setTextAnchor(defaults.textAnchor);
		setVerticalAnchor(defaults.verticalAnchor);
		setRotation(defaults.rotation);
		setMaxWidth(defaults.maxWidth);
		setOpacity(defaults.opacity);
		setPositioningContext(defaults.positioningContext);
		setTextOutline(defaults.textOutline);
		onUpdate(defaults);
	}, [onUpdate]);

	const hasCustomizations =
		text !== defaults.text ||
		fontSize !== defaults.fontSize ||
		fontWeight !== defaults.fontWeight ||
		fontStyle !== defaults.fontStyle ||
		(fontFamily && fontFamily !== defaults.fontFamily) ||
		fill !== defaults.fill ||
		textAnchor !== defaults.textAnchor ||
		verticalAnchor !== defaults.verticalAnchor ||
		rotation !== defaults.rotation ||
		maxWidth !== defaults.maxWidth ||
		opacity !== defaults.opacity ||
		positioningContext !== defaults.positioningContext ||
		textOutline !== defaults.textOutline;

	return {
		text,
		fontSize,
		fontWeight,
		fontStyle,
		fontFamily,
		fill,
		textAnchor,
		verticalAnchor,
		rotation,
		maxWidth,
		opacity,
		positioningContext,
		textOutline,
		hasCustomizations,
		handleChange,
		handleReset,
	};
}

export default useAnnotationCustomizations;
