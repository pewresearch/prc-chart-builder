/**
 * WordPress Dependencies
 */
import { getServerState } from '@wordpress/interactivity';

/**
 * Internal Dependencies
 */
import getConfig from './get-config';
import { mergeCustomLabelData } from './merge-custom-label-data';
import { mergeCustomTooltipData } from './merge-custom-tooltip-data';

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

	// Merge all custom label data from attributes into data.
	// Get viewport-aware customizations based on currentViewport.
	const labels = attributes.labels || {};
	const viewportLabels =
		currentViewport !== 'desktop'
			? attributes[currentViewport]?.labels || {}
			: {};

	// Build label customizations object with viewport overrides.
	const labelCustomizations = {
		customPositions:
			viewportLabels.customPositions || labels.customPositions || {},
		customLabels: viewportLabels.customLabels || labels.customLabels || {},
		customVisibility:
			viewportLabels.customVisibility || labels.customVisibility || {},
		customStyles: viewportLabels.customStyles || labels.customStyles || {},
	};

	// Determine group breaks category for key matching.
	const activeGroupBreaksCategory =
		config.dataRender?.groupBreaksActive &&
		config.dataRender?.groupBreaksCategory
			? config.dataRender.groupBreaksCategory
			: null;

	const dataWithLabelCustomizations = mergeCustomLabelData(
		data,
		labelCustomizations,
		activeGroupBreaksCategory
	);

	// Enrich data with __errorBars from column mappings (dot-plot only).
	let dataWithCustomizations = dataWithLabelCustomizations;
	if (
		config.layout?.type === 'dot-plot' &&
		config.errorBars?.enabled &&
		config.errorBars?.categories
	) {
		const mappingEntries = Object.entries(config.errorBars.categories);
		if (mappingEntries.length > 0) {
			const defaultStyles = config.errorBars.defaultStyles || {};
			dataWithCustomizations = dataWithLabelCustomizations.map((row) => {
				const bars = {};
				for (const [catKey, mapping] of mappingEntries) {
					if (mapping.lowColumn && mapping.highColumn) {
						const low = parseFloat(row[mapping.lowColumn]);
						const high = parseFloat(row[mapping.highColumn]);
						if (!isNaN(low) && !isNaN(high)) {
							bars[catKey] = {
								min: low,
								max: high,
								...defaultStyles,
								...(mapping.styles || {}),
							};
						}
					}
				}
				return Object.keys(bars).length > 0
					? { ...row, __errorBars: bars }
					: row;
			});
		}
	}

	// Merge customTooltips (top-level block attribute) as the final pass.
	const customTooltips = attributes.customTooltips || {};
	const dataWithAllCustomizations = mergeCustomTooltipData(
		dataWithCustomizations,
		customTooltips,
		activeGroupBreaksCategory
	);

	return { data: dataWithAllCustomizations, config, tableData };
}
