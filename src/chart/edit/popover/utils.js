/**
 * Popover Utilities
 *
 * Shared utility functions for popover components.
 */

import { generateSegmentKey } from '@prc/charting-utilities';
import { BAR_CHART_TYPES } from '../../utils/chart-types';

export { generateSegmentKey };

/**
 * Chart types where label positions are algorithmically determined
 * and should not support manual drag positioning.
 */
export const POSITION_DISABLED_CHART_TYPES = ['treemap'];

/**
 * Rollout pattern: use these arrays to gate new popover features to a subset
 * of chart types during development, then expand or remove the restriction
 * once validated. Pass the array to a helper like:
 *
 *   const featureEnabled = SOME_FEATURE_CHART_TYPES.includes(chartType);
 *
 * or use `null` to mean "all chart types" (no restriction).
 */

/**
 * Chart types that support inline annotation editing via click-to-popover.
 * Validated on horizontal bar; now enabled for all chart types.
 * Set to a string array to restrict to specific types during future rollouts.
 */
export const ANNOTATION_POPOVER_CHART_TYPES = null; // null = all chart types

/**
 * Panel keys for small-multiples annotation/drawing anchoring.
 * Column facet → series categories; group facet → group break values.
 * Falls back to `io.availableCategories` when `dataRender.categories` is empty
 * (categories are often derived at get-config time, not stored on the attr).
 *
 * @param {Object} attributes - Chart block attributes (or viewport attrs)
 * @return {string[]} Panel key strings
 */
export function getSmallMultiplesPanelKeys(attributes = {}) {
	const dataRender = attributes?.dataRender || {};
	if (
		dataRender.groupBreaksActive &&
		Array.isArray(dataRender.groupBreaksCategoryValues) &&
		dataRender.groupBreaksCategoryValues.length > 0
	) {
		return dataRender.groupBreaksCategoryValues.map(String).filter(Boolean);
	}
	const fromDataRender = (dataRender.categories || [])
		.map(String)
		.filter(Boolean);
	if (fromDataRender.length > 0) {
		return fromDataRender;
	}
	return (attributes?.io?.availableCategories || [])
		.map(String)
		.filter(Boolean);
}

/**
 * Chart types that support inline tick label editing via click-to-popover.
 * Start with a restricted list (e.g. ['bar']) when rolling out, then set
 * to null once validated across all chart types.
 */
export const TICK_LABEL_POPOVER_CHART_TYPES = null; // null = all chart types

/**
 * Chart types that support click-to-edit on the diff column header and cells.
 */
export const DIFF_COLUMN_POPOVER_CHART_TYPES = [...BAR_CHART_TYPES, 'dot-plot'];

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
 * Generate a unique key from x value, category, and optional group value.
 * Used for storing customizations in block attributes.
 * Normalizes Date objects to ISO strings for consistent keys.
 *
 * @param {string|number|Date} x          - The x value
 * @param {string}             category   - The category name
 * @param {string|null}        groupValue - The group value (when groupBreaksActive), or null
 * @return {string} Key in format "xValue::category" or "xValue::category::groupValue"
 */
export function generateElementKey(x, category, groupValue = null) {
	const normalizedX = normalizeKeyValue(x);
	if (groupValue) {
		return `${normalizedX}::${category}::${groupValue}`;
	}
	return `${normalizedX}::${category}`;
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
