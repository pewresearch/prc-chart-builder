/**
 * Internal Dependencies
 */
import { resolveChartMetadataField } from './resolve-metadata';
import { rebuildDataTable } from '../../controller/utils/rebuild-data-table';

/**
 * Deterministically sync the server-rendered underlying-numbers table and
 * metadata text to the current chart slice.
 *
 * Single runtime writer for controller-owned surfaces. Called from
 * `setChart`, `switchViewport`, and `renderChart` — not from reactive
 * cross-store watches (those do not reliably track deeply nested signals).
 *
 * The chart SVG still updates reactively via `useChartStore` inside the
 * chart's own region.
 *
 * @param {string} chartId Chart id (matches data-prc-chart-id).
 * @param {Object} slice   Per-chart live store slice.
 */
export function syncControllerSurfaces(chartId, slice) {
	if (typeof document === 'undefined' || !slice) {
		return;
	}
	const mountEl = document.querySelector(`[data-prc-chart-id="${chartId}"]`);
	if (!mountEl) {
		return;
	}

	const controllerEl = mountEl.closest('.wp-chart-builder-wrapper');
	// Chart-tab metadata lives on the chart block (`class-chart.php`). Under
	// normal registration the chart is always a child of the controller
	// (`block.json` `parent`), so `controllerEl` covers every `[data-meta-field]`.
	// Fall back to the chart block wrapper for belt-and-suspenders.
	const metadataRoot =
		controllerEl ?? mountEl.closest('.wp-block-prc-chart-builder-chart');

	if (controllerEl) {
		const tableEl = controllerEl.querySelector('.chart-builder-data-table');
		if (tableEl && slice.tableData) {
			rebuildDataTable(tableEl, slice.tableData);
		}
	}

	if (metadataRoot) {
		metadataRoot.querySelectorAll('[data-meta-field]').forEach((ref) => {
			const field = ref?.dataset?.metaField;
			if (field) {
				ref.innerHTML = resolveChartMetadataField(slice, field);
			}
		});
	}
}
