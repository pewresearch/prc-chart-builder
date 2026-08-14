/**
 * WordPress Dependencies
 */
import { getServerState } from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import getConfig from './get-config';
import { buildPreviewChartData } from './build-preview-chart-data';

/**
 * Resolve the effective viewport for a chart slice.
 *
 * Mirrors the priority used before the Phase 1 extraction: live store first,
 * then the immutable server snapshot, then `'desktop'`.
 *
 * @param {string}      id        Chart id (matches data-prc-chart-id).
 * @param {Object|null} liveSlice Per-chart live store slice (`state.charts[id]`).
 * @return {string} 'mobile', 'tablet', or 'desktop'.
 */
export function resolveChartViewport(id, liveSlice) {
	const serverSlice = getServerState().charts?.[id];
	return (
		liveSlice?.currentViewport ?? serverSlice?.currentViewport ?? 'desktop'
	);
}

/**
 * Build the `(data, config, tableData)` inputs for a chart from its current
 * server-state slice.
 *
 * Reads unmerged base attributes from the server slice. Pass the live store
 * slice (`state.charts[id]`) so viewport overrides resolve from the same
 * priority chain as before extraction.
 *
 * @param {string}      id        Chart id (matches data-prc-chart-id).
 * @param {Object|null} liveSlice Per-chart live store slice.
 * @return {{data: Array, config: Object, tableData: Object}|null} Inputs, or null when the slice/attributes are unavailable.
 */
export function buildChartInputs(id, liveSlice) {
	const serverState = getServerState();
	const slice = serverState.charts?.[id];
	if (!slice) {
		return null;
	}
	const attributes = slice.attributes;
	if (!attributes) {
		return null;
	}
	const data = slice.data;
	const tableData = slice.tableData;

	const currentViewport = resolveChartViewport(id, liveSlice);
	const config = getConfig(attributes, id, null, currentViewport);

	return {
		data: buildPreviewChartData(attributes, {
			data,
			viewport: currentViewport,
		}),
		config,
		tableData,
	};
}
