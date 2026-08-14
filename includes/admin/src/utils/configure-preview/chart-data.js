/**
 * Turn a raw data source into the preview data slice the configure step
 * consumes: `{ chartData, availableCategories, categories }`.
 *
 * This is the single home for source → slice adapters. CSV lives here today;
 * the table-attributes adapter (Slice 3b) joins it next to its sibling.
 */

import { formatCellContentTyped } from '../../../../../src/chart/utils/helpers';
import { inferCategories, parseCsv } from '../csv';

/**
 * @typedef {Object} PreviewDataSlice
 * @property {Array<Record<string, string|number>>} chartData           Flat chart rows keyed by column.
 * @property {string[]}                             availableCategories Series column names (after x).
 * @property {string[]}                             categories          Series columns inferred as numeric.
 */

/**
 * Coerce a dependent-series cell value for chart preview data.
 *
 * @param {string} value Raw cell text.
 * @return {string|number} A number when parseable, otherwise the raw value.
 */
function coerceCategoryValue(value) {
	if (value === undefined || value === '') {
		return value;
	}

	const numeric = parseFloat(value);
	if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
		return numeric;
	}

	return value;
}

/**
 * Build flat chart rows from parsed CSV headers and rows.
 *
 * @param {string[]}   headers Column header names.
 * @param {string[][]} rows    Raw CSV data rows.
 * @return {Array<Record<string, string|number>>} Flat chart rows keyed by column.
 */
function buildChartDataFromCsv(headers, rows) {
	return rows.map((row) =>
		headers.reduce((acc, header, index) => {
			const key = index === 0 ? 'x' : header;
			const rawValue = row[index] ?? '';
			const value =
				index === 0 ? rawValue : coerceCategoryValue(rawValue);

			return {
				...acc,
				[key]: value,
			};
		}, {})
	);
}

/**
 * Convert CSV text into a preview data slice.
 *
 * @param {string}                               csvText                        Raw CSV string.
 * @param {Object}                               [fallback]                     Slice returned when CSV is empty.
 * @param {Array<Record<string, string|number>>} [fallback.chartData]           Fallback chart rows.
 * @param {string[]}                             [fallback.availableCategories] Fallback series columns.
 * @param {string[]}                             [fallback.categories]          Fallback numeric series.
 * @return {PreviewDataSlice} The preview data slice.
 */
export function csvToChartData(csvText, fallback = {}) {
	const emptySlice = () => ({
		chartData: fallback.chartData ?? [],
		availableCategories: fallback.availableCategories ?? [],
		categories: fallback.categories ?? [],
	});

	const trimmed = (csvText || '').trim();
	if (!trimmed) {
		return emptySlice();
	}

	const { headers, rows } = parseCsv(trimmed);
	if (!headers.length || !rows.length) {
		return emptySlice();
	}

	return {
		chartData: buildChartDataFromCsv(headers, rows),
		availableCategories: headers.slice(1),
		categories: inferCategories(headers, rows),
	};
}

/**
 * Read a prc-block/table cell's text, matching the chart edit component's
 * getCellContent (cells may store a rich object or a plain string).
 *
 * @param {Object|string} cell Table cell object or plain string.
 * @return {string} The cell's text content.
 */
function getCellContent(cell) {
	return (
		cell?.content?.originalContent ||
		cell?.content?.originalHTML ||
		cell?.content?.text ||
		cell?.content ||
		''
	);
}

/**
 * Convert prc-block/table attributes into a preview data slice, mirroring the
 * chart edit component's table → chartData conversion (typed columns via
 * columnMeta, first column as the `x` key).
 *
 * @param {Object}   tableAttributes              The table block attributes.
 * @param {Array}    [tableAttributes.head]       Header rows (`[{ cells }]`).
 * @param {Array}    [tableAttributes.body]       Body rows (`[{ cells }]`).
 * @param {Object[]} [tableAttributes.columnMeta] Per-column data-type metadata.
 * @return {PreviewDataSlice} The preview data slice.
 */
export function tableAttributesToChartData(tableAttributes = {}) {
	const { head = [], body = [], columnMeta = [] } = tableAttributes;
	const headerCells = head[0]?.cells ?? [];

	if (!headerCells.length || !body.length) {
		return { chartData: [], availableCategories: [], categories: [] };
	}

	const headers = headerCells.map((headerCell) => getCellContent(headerCell));

	const chartData = body.map((row) =>
		(row.cells ?? []).reduce((acc, bodyCell, index) => {
			const key = index === 0 ? 'x' : headers[index];
			acc[key] = formatCellContentTyped(
				getCellContent(bodyCell),
				key,
				columnMeta,
				index
			);
			return acc;
		}, {})
	);

	const rawRows = body.map((row) =>
		(row.cells ?? []).map((bodyCell) => getCellContent(bodyCell))
	);

	return {
		chartData,
		availableCategories: headers.slice(1),
		categories: inferCategories(headers, rawRows),
	};
}
