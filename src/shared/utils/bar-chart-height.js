/**
 * Chart height from the number of bars, applied when data is uploaded (PRC-1037).
 *
 * A 32px band leaves a bar of about 16px once the default band padding is
 * applied. Horizontal bar, stacked bar, diverging bar, and dot plot charts
 * use this. Grouped bars get one band per series in each row. The result is
 * capped at 800px. The height control can replace it until the next upload.
 */

const BAR_BAND_PX = 32;
const MAX_HEIGHT_PX = 800;
const DEFAULT_PADDING_TOP = 20;
const DEFAULT_PADDING_BOTTOM = 25;

/** Horizontal charts whose height should follow the row count. */
const ROW_HEIGHT_TYPES = new Set([
	'bar',
	'stacked-bar',
	'diverging-bar',
	'dot-plot',
]);

/**
 * @param {Object} layout Chart layout attribute.
 * @return {boolean} Whether this chart's height should follow its rows.
 */
function usesRowHeight(layout) {
	if (!ROW_HEIGHT_TYPES.has(layout?.type)) {
		return false;
	}
	if (
		layout.type === 'bar' ||
		layout.type === 'stacked-bar' ||
		layout.type === 'diverging-bar'
	) {
		return !layout.orientation || layout.orientation === 'horizontal';
	}
	return true;
}

/**
 * @param {Object|undefined} padding  Layout padding, which may omit an edge.
 * @param {'top'|'bottom'}   edge     Padding edge to read.
 * @param {number}           fallback Block default used when the edge is absent.
 * @return {number} Pixel padding for that edge.
 */
function paddingPx(padding, edge, fallback) {
	const value = Number(padding?.[edge]);
	return Number.isFinite(value) ? value : fallback;
}

/**
 * @param {Object|string|undefined} cell Table cell, plain string, or empty.
 * @return {string} Trimmed cell text.
 */
function cellText(cell) {
	if (cell === null || cell === undefined) {
		return '';
	}
	if (typeof cell === 'string') {
		return cell.trim();
	}
	const content = cell.content;
	if (typeof content === 'string') {
		return content.trim();
	}
	if (content && typeof content === 'object') {
		return String(
			content.originalContent ||
				content.originalHTML ||
				content.text ||
				''
		).trim();
	}
	return '';
}

/**
 * @param {Object} tableAttributes Uploaded table attributes.
 * @return {number} Body rows that have a label in the first cell.
 */
function dataRowCount(tableAttributes) {
	const body = tableAttributes?.body ?? [];
	return body.filter((row) => cellText(row?.cells?.[0])).length;
}

/**
 * @param {string} value Cell text.
 * @return {boolean} Whether the text parses as a finite number.
 */
function isNumeric(value) {
	if (value === '') {
		return false;
	}
	const numeric = parseFloat(value);
	return !Number.isNaN(numeric) && Number.isFinite(numeric);
}

/**
 * Numeric columns after the label column. Matches the wizard's 80% rule.
 *
 * @param {Object} tableAttributes Uploaded table attributes.
 * @return {number} Count of numeric series columns.
 */
function inferredSeriesCount(tableAttributes) {
	const headerCells = tableAttributes?.head?.[0]?.cells ?? [];
	const rows = tableAttributes?.body ?? [];
	let count = 0;

	for (let index = 1; index < headerCells.length; index++) {
		const values = rows
			.map((row) => cellText(row?.cells?.[index]))
			.filter((value) => value !== '');
		if (!values.length) {
			continue;
		}
		const numericCount = values.filter((value) => isNumeric(value)).length;
		if (numericCount / values.length >= 0.8) {
			count += 1;
		}
	}

	return count;
}

/**
 * Series the chart will draw after this upload. A saved selection wins when
 * those columns are still in the file. Otherwise count numeric columns.
 *
 * @param {Object} chartAttributes Chart block attributes.
 * @param {Object} tableAttributes Uploaded table attributes.
 * @return {number} Series that occupy their own band on a grouped bar.
 */
function seriesCount(chartAttributes, tableAttributes) {
	const headers = (tableAttributes?.head?.[0]?.cells ?? []).map(cellText);
	const headerSet = new Set(headers);
	const selected = (chartAttributes?.dataRender?.categories ?? []).filter(
		(name) => typeof name === 'string' && headerSet.has(name)
	);
	if (selected.length > 0) {
		return selected.length;
	}
	return inferredSeriesCount(tableAttributes);
}

/**
 * @param {Object} chartAttributes
 * @param {Object} tableAttributes
 * @return {number} Bands that share the chart height.
 */
function bandCount(chartAttributes, tableAttributes) {
	const rows = dataRowCount(tableAttributes);
	if (chartAttributes?.layout?.type !== 'bar') {
		return rows;
	}

	return rows * Math.max(seriesCount(chartAttributes, tableAttributes), 1);
}

/**
 * Replace layout.height for a horizontal bar chart after a data upload.
 *
 * @param {Object} chartAttributes Chart block attributes.
 * @param {Object} tableAttributes Uploaded prc-block/table attributes.
 * @return {Object} Attributes with a calculated height, or the same object.
 */
export function applyUploadedBarChartHeight(chartAttributes, tableAttributes) {
	const layout = chartAttributes?.layout;
	if (!usesRowHeight(layout)) {
		return chartAttributes;
	}

	const bands = bandCount(chartAttributes, tableAttributes);
	if (bands < 1) {
		return chartAttributes;
	}

	const height = Math.min(
		MAX_HEIGHT_PX,
		paddingPx(layout.padding, 'top', DEFAULT_PADDING_TOP) +
			paddingPx(layout.padding, 'bottom', DEFAULT_PADDING_BOTTOM) +
			BAR_BAND_PX * bands
	);

	if (height === layout.height) {
		return chartAttributes;
	}

	return {
		...chartAttributes,
		layout: {
			...layout,
			height,
		},
	};
}
