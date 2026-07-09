/**
 * @jest-environment jsdom
 */
import { describe, test, expect } from '@jest/globals';
import { rebuildDataTable } from '../../src/controller/utils/rebuild-data-table';

/**
 * @param {string[]}   header
 * @param {string[][]} rows
 * @return {HTMLElement}
 */
function mountTable(header, rows) {
	const figure = document.createElement('figure');
	figure.className = 'chart-builder-data-table';
	const table = document.createElement('table');
	const thead = document.createElement('thead');
	const headerRow = document.createElement('tr');
	header.forEach((cell) => {
		const th = document.createElement('th');
		th.textContent = cell;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');
	rows.forEach((rowData) => {
		const row = document.createElement('tr');
		rowData.forEach((cell) => {
			const td = document.createElement('td');
			td.textContent = cell;
			row.appendChild(td);
		});
		tbody.appendChild(row);
	});
	table.appendChild(tbody);
	figure.appendChild(table);
	document.body.appendChild(figure);
	return figure;
}

/**
 * @param {HTMLElement} tableEl
 * @return {{ header: string[], rows: string[][] }}
 */
function readTable(tableEl) {
	const table = tableEl.querySelector('table');
	const header = Array.from(table.querySelectorAll('thead th')).map(
		(cell) => cell.textContent
	);
	const rows = Array.from(table.querySelectorAll('tbody tr')).map((row) =>
		Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent)
	);
	return { header, rows };
}

describe('rebuildDataTable', () => {
	test('patches cell content in place when shape matches', () => {
		const figure = mountTable(['Year', 'Value'], [['2020', '36%']]);
		const table = figure.querySelector('table');
		const headerRow = table.querySelector('thead tr');
		const bodyRow = table.querySelector('tbody tr');

		rebuildDataTable(figure, {
			header: ['Year', 'Value'],
			rows: [['2021', '42%']],
		});

		expect(readTable(figure)).toEqual({
			header: ['Year', 'Value'],
			rows: [['2021', '42%']],
		});
		expect(table.querySelector('thead tr')).toBe(headerRow);
		expect(table.querySelector('tbody tr')).toBe(bodyRow);
		document.body.removeChild(figure);
	});

	test('rebuilds tbody when row count changes', () => {
		const figure = mountTable(
			['State', 'Pct'],
			[
				['AL', '32'],
				['AK', '14'],
			]
		);
		const table = figure.querySelector('table');
		const originalHeaderRow = table.querySelector('thead tr');

		rebuildDataTable(figure, {
			header: ['State', 'Pct'],
			rows: [
				['AL', '32'],
				['AK', '14'],
				['AZ', '25'],
			],
		});

		expect(readTable(figure)).toEqual({
			header: ['State', 'Pct'],
			rows: [
				['AL', '32'],
				['AK', '14'],
				['AZ', '25'],
			],
		});
		expect(table.querySelector('thead tr')).toBe(originalHeaderRow);
		document.body.removeChild(figure);
	});

	test('rebuilds thead and tbody when header width changes', () => {
		const figure = mountTable(['Year', 'Value'], [['2020', '36%']]);

		rebuildDataTable(figure, {
			header: ['Year', 'Value', 'Margin'],
			rows: [['2020', '36%', '+3']],
		});

		expect(readTable(figure)).toEqual({
			header: ['Year', 'Value', 'Margin'],
			rows: [['2020', '36%', '+3']],
		});
		document.body.removeChild(figure);
	});

	test('sanitizes HTML cell content on patch', () => {
		const figure = mountTable(['Label'], [['plain']]);

		rebuildDataTable(figure, {
			header: ['Label'],
			rows: [['<strong>bold</strong><script>x</script>']],
		});

		const cell = figure.querySelector('tbody td');
		expect(cell.innerHTML).toBe('<strong>bold</strong>');
		document.body.removeChild(figure);
	});

	test('no-ops on invalid tableData', () => {
		const figure = mountTable(['A'], [['1']]);
		const before = readTable(figure);

		rebuildDataTable(figure, null);
		rebuildDataTable(figure, { rows: [] });

		expect(readTable(figure)).toEqual(before);
		document.body.removeChild(figure);
	});
});
