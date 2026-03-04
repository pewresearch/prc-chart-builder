/**
 * CSV utilities for chart data handling.
 *
 * Shared between the manual CreateStep (table injection) and AICreateStep
 * (CSV context for AI generation).
 */

/**
 * Parse a CSV string into headers and rows.
 * Handles quoted fields containing commas or newlines.
 *
 * @param {string} text Raw CSV text.
 * @return {{ headers: string[], rows: string[][] }}
 */
export function parseCsv(text) {
	const lines = (text || '').trim().split(/\r?\n/);
	if (!lines.length || !lines[0].trim()) {
		return { headers: [], rows: [] };
	}

	const parseRow = (line) => {
		const cells = [];
		let current = '';
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			if (char === '"') {
				// Escaped quote inside a quoted field.
				if (inQuotes && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				cells.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		cells.push(current.trim());
		return cells;
	};

	const headers = parseRow(lines[0]);
	const rows = lines
		.slice(1)
		.filter((l) => l.trim())
		.map(parseRow);

	return { headers, rows };
}

/**
 * Convert CSV text to prc-block/table attribute shape ({ head, body }).
 *
 * @param {string} text Raw CSV text.
 * @return {{ head: Array, body: Array }}
 */
export function csvToTableAttributes(text) {
	const { headers, rows } = parseCsv(text);
	return {
		head: [
			{
				cells: headers.map((h) => ({ content: h, tag: 'th' })),
			},
		],
		body: rows.map((row) => ({
			cells: row.map((cell) => ({ content: cell, tag: 'td' })),
		})),
	};
}

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
