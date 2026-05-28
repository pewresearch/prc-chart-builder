/**
 * useDiffColumnHeaderCustomizations Hook
 *
 * Maps diffColumn header fields to the shared text-style shape used by TextStyleControls.
 */

import { useState, useEffect, useCallback } from '@wordpress/element';

/** Matches block.json diffColumn.style defaults. */
const HEADER_DEFAULTS = {
	text: 'Diff',
	fill: '#2a2a2a',
	fontSize: 12,
	fontWeight: 'normal',
	fontStyle: 'normal',
	fontFamily: '',
	textOutline: false,
};

function parseHeaderFontSize(headerFontSize) {
	const parsed = parseInt(String(headerFontSize || '12'), 10);
	return Number.isFinite(parsed) ? parsed : 12;
}

function resolveHeaderTypography(style, field, headerKey, defaultValue) {
	if (style[headerKey] !== undefined && style[headerKey] !== '') {
		return style[headerKey];
	}
	// Charts saved before header-specific keys may have written to shared style.* fields.
	if (
		field === 'fontWeight' ||
		field === 'fontStyle' ||
		field === 'fontFamily'
	) {
		const legacy = style[field];
		if (legacy !== undefined && legacy !== '') {
			return legacy;
		}
	}
	return defaultValue;
}

function diffColumnToTextStyle(diffColumn = {}) {
	const style = diffColumn.style || {};
	return {
		text: diffColumn.columnHeader ?? HEADER_DEFAULTS.text,
		fill: style.headerFill ?? HEADER_DEFAULTS.fill,
		fontSize: parseHeaderFontSize(style.headerFontSize),
		fontWeight: resolveHeaderTypography(
			style,
			'fontWeight',
			'headerFontWeight',
			HEADER_DEFAULTS.fontWeight
		),
		fontStyle: resolveHeaderTypography(
			style,
			'fontStyle',
			'headerFontStyle',
			HEADER_DEFAULTS.fontStyle
		),
		fontFamily: resolveHeaderTypography(
			style,
			'fontFamily',
			'headerFontFamily',
			HEADER_DEFAULTS.fontFamily
		),
		textOutline: style.headerTextOutline ?? HEADER_DEFAULTS.textOutline,
	};
}

function textStyleToDiffColumnUpdates(field, value) {
	switch (field) {
		case 'text':
			return { columnHeader: value };
		case 'fill':
			return { style: { headerFill: value } };
		case 'fontSize':
			return {
				style: {
					headerFontSize: value
						? `${value}px`
						: HEADER_DEFAULTS.fontSize + 'px',
				},
			};
		case 'fontWeight':
			return {
				style: {
					headerFontWeight: value || HEADER_DEFAULTS.fontWeight,
				},
			};
		case 'fontStyle':
			return {
				style: {
					headerFontStyle: value || HEADER_DEFAULTS.fontStyle,
				},
			};
		case 'fontFamily':
			return { style: { headerFontFamily: value ?? '' } };
		case 'textOutline':
			return { style: { headerTextOutline: value } };
		default:
			return {};
	}
}

/**
 * @param {Object}   diffColumn - Current diffColumn block attr
 * @param {Function} onUpdate   - Merges into diffColumn via updateAttributeForDevice
 */
export function useDiffColumnHeaderCustomizations(diffColumn = {}, onUpdate) {
	const [values, setValues] = useState(() =>
		diffColumnToTextStyle(diffColumn)
	);

	useEffect(() => {
		setValues(diffColumnToTextStyle(diffColumn));
	}, [diffColumn]);

	const handleChange = useCallback(
		(field, value) => {
			setValues((prev) => ({ ...prev, [field]: value }));
			onUpdate(textStyleToDiffColumnUpdates(field, value));
		},
		[onUpdate]
	);

	const handleReset = useCallback(() => {
		setValues(HEADER_DEFAULTS);
		onUpdate({
			columnHeader: HEADER_DEFAULTS.text,
			style: {
				headerFill: HEADER_DEFAULTS.fill,
				headerFontSize: `${HEADER_DEFAULTS.fontSize}px`,
				headerFontWeight: HEADER_DEFAULTS.fontWeight,
				headerFontStyle: HEADER_DEFAULTS.fontStyle,
				headerFontFamily: HEADER_DEFAULTS.fontFamily,
				headerTextOutline: HEADER_DEFAULTS.textOutline,
			},
		});
	}, [onUpdate]);

	const hasCustomizations =
		values.text !== HEADER_DEFAULTS.text ||
		values.fill !== HEADER_DEFAULTS.fill ||
		values.fontSize !== HEADER_DEFAULTS.fontSize ||
		values.fontWeight !== HEADER_DEFAULTS.fontWeight ||
		values.fontStyle !== HEADER_DEFAULTS.fontStyle ||
		values.fontFamily !== HEADER_DEFAULTS.fontFamily ||
		values.textOutline !== HEADER_DEFAULTS.textOutline;

	return {
		values,
		hasCustomizations,
		handleChange,
		handleReset,
	};
}

export default useDiffColumnHeaderCustomizations;
