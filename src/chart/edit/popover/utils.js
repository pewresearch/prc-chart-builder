/**
 * Popover Utilities
 *
 * Shared utility functions for popover components.
 */

/**
 * Normalize a value for use in keys.
 * Converts Date objects to ISO strings for consistent keys across editor and frontend.
 *
 * @param {string|number|Date} value - The value to normalize
 * @return {string} Normalized string value
 */
function normalizeKeyValue(value) {
	if (value instanceof Date) {
		return value.toISOString();
	}
	// If it's already an ISO string, return as-is
	return String(value);
}

/**
 * Generate a unique key from x value and category.
 * Used for storing customizations in block attributes.
 * Normalizes Date objects to ISO strings for consistent keys.
 *
 * @param {string|number|Date} x        - The x value
 * @param {string}             category - The category name
 * @return {string} Key in format "xValue::category"
 */
export function generateElementKey(x, category) {
	return `${normalizeKeyValue(x)}::${category}`;
}

/**
 * Format a value for use in keys, handling Date objects.
 *
 * @param {string|number|Date} value - The value to format
 * @return {string} Formatted string value
 */
function formatKeyValue(value) {
	if (value instanceof Date) {
		return value.toISOString();
	}
	return String(value);
}

/**
 * Generate a unique key for a line segment.
 * Used for storing segment customizations in block attributes.
 *
 * @param {string|number|Date} startX   - The start point x value
 * @param {string|number|Date} endX     - The end point x value
 * @param {string}             category - The category/series name
 * @return {string} Key in format "startX::endX::category"
 */
export function generateSegmentKey(startX, endX, category) {
	const start = formatKeyValue(startX);
	const end = formatKeyValue(endX);
	return `${start}::${end}::${category}`;
}

/**
 * Format a value for display, handling Date objects.
 *
 * @param {string|number|Date} value - The value to format
 * @return {string} Human-readable string
 */
export function formatDisplayValue(value) {
	if (value instanceof Date) {
		return value.toLocaleDateString();
	}
	return String(value);
}

/**
 * Font weight options for label styling.
 */
export const FONT_WEIGHT_OPTIONS = [
	{ label: 'Normal', value: 'normal' },
	{ label: 'Bold', value: 'bold' },
	{ label: '600', value: '600' },
	{ label: '700', value: '700' },
];

/**
 * Font style options for label styling.
 */
export const FONT_STYLE_OPTIONS = [
	{ label: 'Normal', value: 'normal' },
	{ label: 'Italic', value: 'italic' },
];

/**
 * Pattern options for shape styling.
 */
export const PATTERN_OPTIONS = [
	{ label: 'Solid', value: 'solid' },
	{ label: 'Striped', value: 'striped' },
	{ label: 'Dotted', value: 'dotted' },
	{ label: 'Crosshatch', value: 'crosshatch' },
];

/**
 * Stroke dash array options for line segment styling.
 */
export const STROKE_DASHARRAY_OPTIONS = [
	{ label: 'Solid', value: '' },
	{ label: 'Dashed', value: '5,5' },
	{ label: 'Dotted', value: '2,2' },
	{ label: 'Long Dash', value: '10,5' },
	{ label: 'Dash-Dot', value: '10,5,2,5' },
];
