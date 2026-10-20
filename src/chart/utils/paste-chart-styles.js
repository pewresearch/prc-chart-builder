/**
 * Internal Dependencies
 */
import { getSeriesColorKeys } from './get-series-color-keys';
import getSmallMultiplesPanels from './get-small-multiples-panels';

/**
 * Deep merge two objects, preserving nested properties.
 * Arrays are replaced entirely, not merged.
 *
 * @param {Object} target - The target object (existing attributes)
 * @param {Object} source - The source object (copied styles)
 * @return {Object} - Merged object
 */
const deepMerge = (target, source) => {
	const result = { ...target };

	Object.keys(source).forEach((key) => {
		const sourceValue = source[key];
		const targetValue = target[key];

		if (
			sourceValue &&
			typeof sourceValue === 'object' &&
			!Array.isArray(sourceValue) &&
			targetValue &&
			typeof targetValue === 'object' &&
			!Array.isArray(targetValue)
		) {
			result[key] = deepMerge(targetValue, sourceValue);
		} else if (sourceValue !== undefined) {
			result[key] = sourceValue;
		}
	});

	return result;
};

/**
 * Keep only the rows the target draws.
 *
 * @param {Object}   rows Style rows keyed by name.
 * @param {string[]} keys Names the target draws.
 * @return {Object} Filtered rows.
 */
const pickRows = (rows = {}, keys) =>
	Object.fromEntries(
		Object.entries(rows).filter(([key]) => keys.includes(key))
	);

/**
 * Whether the source covers every name the target draws.
 *
 * @param {string[]} targetKeys Names the target draws.
 * @param {string[]} sourceKeys Names the source drew.
 * @return {boolean} True when every target name is on the source.
 */
const covers = (targetKeys, sourceKeys) =>
	targetKeys.length > 0 &&
	targetKeys.every((key) => sourceKeys.includes(key));

/**
 * Paste copied chart styles onto a chart.
 *
 * Series and panel rows are all-or-nothing: they paste only when every
 * series (and panel) the target draws also exists on the source chart. A
 * partial match would leave unmatched series on palette colors that can
 * clash with pasted ones.
 *
 * @param {Object} attributes Target chart block attributes.
 * @param {Object} copied     Clipboard from getCopyableStyleAttributes.
 * @return {{ attributes: Object, seriesStylesSkipped: boolean, panelStylesSkipped: boolean }} Next attributes and which row sets did not paste.
 */
export default function pasteChartStyles(attributes, copied) {
	const {
		seriesStyles,
		copiedSeriesKeys = [],
		panelStyles,
		copiedPanelKeys = [],
		...styles
	} = copied;
	const merged = deepMerge(attributes, styles);

	const targetKeys = getSeriesColorKeys(attributes);
	const seriesMatch = covers(targetKeys, copiedSeriesKeys);
	if (seriesMatch) {
		merged.seriesStyles = pickRows(seriesStyles, targetKeys);
	}

	const targetPanels = getSmallMultiplesPanels(attributes);
	const panelsMatch =
		seriesMatch &&
		covers(
			targetPanels.map((panel) => panel.key),
			copiedPanelKeys
		);
	if (panelsMatch) {
		merged.smallMultiples = {
			...merged.smallMultiples,
			panelStyles: Object.fromEntries(
				targetPanels
					.filter((panel) => panelStyles?.[panel.key])
					.map((panel) => [
						panel.key,
						pickRows(panelStyles[panel.key], panel.seriesKeys),
					])
			),
		};
	}

	return {
		attributes: merged,
		seriesStylesSkipped: !seriesMatch,
		panelStylesSkipped: !panelsMatch,
	};
}
