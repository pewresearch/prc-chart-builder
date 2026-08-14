/**
 * Chart width presets for the curated Appearance tab.
 */
import { __ } from '@wordpress/i18n';

export const CUSTOM_WIDTH = 'custom';

export const WIDTH_PRESETS = [
	{ value: CUSTOM_WIDTH, label: __('Custom', 'prc-chart-builder') },
	{ value: '200', label: '200px' },
	{ value: '310', label: '310px' },
	{ value: '420', label: '420px' },
	{ value: '640', label: '640px' },
];

/**
 * Resolve a chart width to its preset option value.
 *
 * @param {number} width Chart layout width in pixels.
 * @return {string} Matching preset value, or `custom`.
 */
export function getWidthPresetValue(width) {
	const match = WIDTH_PRESETS.some(
		(option) => option.value === String(width)
	);
	return match ? String(width) : CUSTOM_WIDTH;
}
