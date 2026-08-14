/**
 * CSV utilities for chart data handling.
 *
 * Used by the creation wizard (table injection) and admin configure-preview
 * helpers. Kept under src/shared so both the controller and admin bundles
 * can import the same parsers.
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
