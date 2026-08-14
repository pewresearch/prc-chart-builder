/**
 * CSV utilities for chart data handling.
 *
 * Shared between the manual CreateStep (table injection) and AICreateStep
 * (CSV context for AI generation).
 */

export {
	csvToTableAttributes,
	parseCsv,
} from '../../../../src/shared/utils/csv';

/**
 * Infer dataRender.categories from CSV headers.
 * Returns header names whose column values are ≥80% numeric.
 * The first column is always excluded (assumed to be the x-axis label).
 *
 * @param {string[]}   headers Column header names.
 * @param {string[][]} rows    Data rows.
 * @return {string[]} Column names suitable for dataRender.categories.
 */
export function inferCategories(headers, rows) {
	return headers.filter((header, colIndex) => {
		if (colIndex === 0) {
			return false;
		}
		const colValues = rows
			.map((row) => row[colIndex])
			.filter((v) => v !== undefined && v !== '');
		if (!colValues.length) {
			return false;
		}
		const numericCount = colValues.filter(
			(v) => !isNaN(parseFloat(v)) && isFinite(v)
		).length;
		return numericCount / colValues.length >= 0.8;
	});
}
