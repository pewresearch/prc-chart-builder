/**
 * Apply bar-chart height when a CSV is dropped on this wizard's table.
 *
 * The upload button calls applyUploadedBarChartHeight directly. A drop on the
 * data table is handled by the power table, which announces the import on
 * `prc-block.table.import-csv` (see prc-block-tables csv-parser).
 */
import { addAction, removeAction } from '@wordpress/hooks';

import { applyUploadedBarChartHeight } from './bar-chart-height';

/** Matches TABLE_CSV_IMPORT_ACTION in prc-block-tables csv-parser. */
export const TABLE_CSV_IMPORT_ACTION = 'prc-block.table.import-csv';

/**
 * @param {Object}   options
 * @param {string}   options.namespace               Unique hooks namespace for this wizard.
 * @param {Function} options.getChartAttributes      Current chart block attributes.
 * @param {Function} options.getTableClientId        prc-block/table clientId for this chart.
 * @param {Function} options.onChartAttributesChange Called with the next chart attributes.
 * @return {Function} Remove the listener.
 */
export function bindBarChartHeightToCsvImport({
	namespace,
	getChartAttributes,
	getTableClientId,
	onChartAttributesChange,
}) {
	const onCsvImport = (detail) => {
		const tableClientId = getTableClientId();
		if (!tableClientId || detail?.clientId !== tableClientId) {
			return;
		}
		const chartAttributes = getChartAttributes();
		if (!chartAttributes || typeof onChartAttributesChange !== 'function') {
			return;
		}
		const next = applyUploadedBarChartHeight(chartAttributes, {
			head: detail.head,
			body: detail.body,
		});
		if (next !== chartAttributes) {
			onChartAttributesChange(next);
		}
	};

	addAction(TABLE_CSV_IMPORT_ACTION, namespace, onCsvImport);
	return () => removeAction(TABLE_CSV_IMPORT_ACTION, namespace);
}
