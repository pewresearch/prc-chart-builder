/**
 * Build and refine the `chartAttributes` object the configure step edits and
 * feeds to the live preview (`getConfig` → `ChartBuilderWrapper`).
 *
 * Everything here operates on plain chart-block attribute objects — no
 * `parse`/`serialize`, so it stays unit-testable. Curated-control patches
 * (Slices 6–8) land alongside these.
 *
 * @typedef {import('./chart-data').PreviewDataSlice} PreviewDataSlice
 */

import { prepareChartAttributesForPreview } from '../../../../../src/chart/utils/prepare-chart-attributes-for-preview';
import { tableAttributesToChartData } from './chart-data';

export { prepareChartAttributesForPreview };

/**
 * Merge a preview data slice into a pattern's chart attributes on first entry
 * to the configure step.
 *
 * @param {Object}           baseAttributes Chart block attributes from the pattern.
 * @param {PreviewDataSlice} previewData    Output from a chart-data adapter.
 * @return {Object} Seeded chart attributes for local configure state.
 */
export function seedChartAttributes(baseAttributes, previewData) {
	const { chartData, availableCategories, categories } = previewData;

	// FIXME (PRC-527): the category resolver is not fully working yet — revisit.
	// The series selection is a curated/editorial choice: prefer the pattern's
	// own `dataRender.categories` (filtered to columns that still exist) over
	// inference, which can wrongly pick numeric geo-id columns (e.g. FIPS) on
	// map charts. Fall back to inferred series only when the pattern has none.
	// Known-incomplete: some chart types still resolve the wrong series/columns.
	const patternCategories = (
		baseAttributes.dataRender?.categories ?? []
	).filter((category) => availableCategories.includes(category));
	const seededCategories = patternCategories.length
		? patternCategories
		: categories;

	return {
		...baseAttributes,
		io: {
			...(baseAttributes.io ?? {}),
			chartData,
			availableCategories,
		},
		dataRender: {
			...(baseAttributes.dataRender ?? {}),
			categories: seededCategories,
		},
	};
}

/**
 * @param {string[]|undefined} previous
 * @param {string[]|undefined} next
 * @return {boolean} Whether the two category lists are identical in order.
 */
function categoriesUnchanged(previous, next) {
	const prev = previous ?? [];
	const nxt = next ?? [];

	if (prev.length !== nxt.length) {
		return false;
	}

	return prev.every((category, index) => category === nxt[index]);
}

/**
 * Clear category-keyed customizations that would carry stale keys after the
 * data source's columns change.
 *
 * @param {Object} chartAttributes Attributes whose category-keyed fields to clear.
 * @return {Object} Attributes with category-keyed customizations reset.
 */
function resetCategoryKeyedCustomizations(chartAttributes) {
	return {
		...chartAttributes,
		io: {
			...(chartAttributes.io ?? {}),
			customColors: [],
		},
		legend: {
			...(chartAttributes.legend ?? {}),
			categories: [],
		},
		labels: {
			...(chartAttributes.labels ?? {}),
			customPositions: {},
			customLabels: {},
			customVisibility: {},
			customStyles: {},
		},
		customTooltips: {},
	};
}

/**
 * Merge a fresh preview slice into existing configure attributes on re-entry
 * from the data step, preserving curated edits when columns are unchanged.
 *
 * @param {Object}           chartAttributes Current edited chart attributes.
 * @param {PreviewDataSlice} previewData     Output from a chart-data adapter.
 * @return {Object} Chart attributes with refreshed data, edits preserved.
 */
export function refreshPreviewData(chartAttributes, previewData) {
	const { chartData, availableCategories, categories } = previewData;
	const headersChanged = !categoriesUnchanged(
		chartAttributes.io?.availableCategories ?? [],
		availableCategories
	);

	// FIXME (PRC-527): category resolver still not fully correct — revisit.
	// Preserve the curated series selection across value edits. When columns
	// change, keep whichever curated categories still exist; only fall back to
	// inference when none survive. (Value edits must never re-pick the series,
	// e.g. flipping a map from its 'Response' column to a numeric 'FIPS' one.)
	const prevCategories = chartAttributes.dataRender?.categories ?? [];
	let nextCategories;
	if (headersChanged) {
		const stillValid = prevCategories.filter((category) =>
			availableCategories.includes(category)
		);
		nextCategories = stillValid.length ? stillValid : categories;
	} else {
		nextCategories = prevCategories.length ? prevCategories : categories;
	}

	const result = {
		...chartAttributes,
		io: {
			...(chartAttributes.io ?? {}),
			chartData,
			availableCategories,
		},
		dataRender: {
			...(chartAttributes.dataRender ?? {}),
			categories: nextCategories,
		},
	};

	return headersChanged ? resetCategoryKeyedCustomizations(result) : result;
}

/**
 * Produce the next chart attributes when the wizard advances from the data
 * step: convert the edited table to a preview slice, then seed (first entry)
 * or refresh (re-entry, preserving curated edits). This is the single seam the
 * modal's "Next" handler calls.
 *
 * @param {Object}      params
 * @param {Object}      params.tableAttributes        Edited `prc-block/table` attributes.
 * @param {Object|null} params.currentChartAttributes Existing configure state, if any.
 * @param {Object}      params.baseAttributes         Pattern's chart block attributes.
 * @return {Object} Next chart attributes for the configure step.
 */
export function deriveChartAttributesOnNext({
	tableAttributes,
	currentChartAttributes,
	baseAttributes,
}) {
	const previewData = tableAttributesToChartData(tableAttributes);

	return currentChartAttributes
		? refreshPreviewData(currentChartAttributes, previewData)
		: seedChartAttributes(baseAttributes, previewData);
}

/** Re-export from shared curated-controls (canonical source). */
export { applyCuratedControl } from '../../../../../src/shared/curated-controls/apply-curated-control';

/**
 * Derive the chart CPT post title from the chart's own metadata title. The
 * chart title (edited in the Markup controls) is the single source of truth —
 * there is no separate post-title field. Any inline formatting is stripped so
 * the stored post_title is plain text.
 *
 * @param {Object} chartAttributes Chart block attributes.
 * @return {string} Plain-text post title (empty string when unset).
 */
export function getChartPostTitle(chartAttributes) {
	const raw = chartAttributes?.metadata?.title ?? '';
	return raw.replace(/<[^>]*>/g, '').trim();
}
