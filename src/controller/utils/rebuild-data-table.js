import DOMPurify from 'dompurify';

/**
 * @param {string} event
 * @param {Object} detail
 */
function logTableRebuild(event, detail) {
	if (typeof window === 'undefined' || !window.__PRC_TABLE_REBUILD_DEBUG__) {
		return;
	}
	// eslint-disable-next-line no-console -- opt-in dev probe
	console.log(`[rebuildDataTable] ${event}`, detail);
}

/**
 * Write trusted-but-sanitized cell HTML.
 *
 * @param {HTMLElement} cell  Target cell.
 * @param {*}           value Cell value (string or HTML fragment).
 */
function setCellHTML(cell, value) {
	cell.innerHTML = DOMPurify.sanitize(String(value ?? ''));
}

/**
 * Visible, non-hidden cells of a row, in document order.
 *
 * @param {HTMLTableRowElement} row Table row.
 * @return {HTMLTableCellElement[]} Non-hidden cells.
 */
function visibleCells(row) {
	return Array.from(row.children).filter(
		(cell) => !cell.classList.contains('is-column-hidden')
	);
}

/**
 * @param {HTMLTableElement|null} table
 * @return {{ bodyRows: number, headerCols: number, visibleBodyCols: number[] }}
 */
function domTableShape(table) {
	if (!table) {
		return { bodyRows: 0, headerCols: 0, visibleBodyCols: [] };
	}
	const headerRow = table.querySelector('thead tr');
	const headerCols = headerRow ? visibleCells(headerRow).length : 0;
	const bodyRows = Array.from(table.querySelectorAll('tbody > tr'));
	return {
		bodyRows: bodyRows.length,
		headerCols,
		visibleBodyCols: bodyRows.map((row) => visibleCells(row).length),
	};
}

/**
 * Whether a `{ header, rows }` projection matches the rendered table shape.
 *
 * @param {HTMLTableElement} table
 * @param {Object}           tableData
 * @return {boolean}
 */
export function tableShapeMatches(table, tableData) {
	if (!table || !tableData || !Array.isArray(tableData.header)) {
		return false;
	}

	const { header, rows = [] } = tableData;
	const rowsData = Array.isArray(rows) ? rows : [];
	const headerRow = table.querySelector('thead tr');
	const headerCells = headerRow ? visibleCells(headerRow) : [];
	const bodyRows = Array.from(table.querySelectorAll('tbody > tr'));

	return (
		(!headerRow || headerCells.length === header.length) &&
		bodyRows.length === rowsData.length &&
		bodyRows.every((row, r) => {
			const rowData = Array.isArray(rowsData[r]) ? rowsData[r] : [];
			return visibleCells(row).length === rowData.length;
		})
	);
}

/**
 * Replace tbody rows from a text-only projection.
 *
 * @param {HTMLTableElement} table
 * @param {string[][]}       rowsData
 */
function rebuildTableBody(table, rowsData) {
	let tbody = table.querySelector('tbody');
	if (!tbody) {
		tbody = document.createElement('tbody');
		table.appendChild(tbody);
	}

	const bodyFragment = document.createDocumentFragment();
	rowsData.forEach((rowData) => {
		const row = document.createElement('tr');
		const cells = Array.isArray(rowData) ? rowData : [];
		cells.forEach((cell) => {
			const td = document.createElement('td');
			setCellHTML(td, cell);
			row.appendChild(td);
		});
		bodyFragment.appendChild(row);
	});
	tbody.replaceChildren(...bodyFragment.childNodes);
}

/**
 * Replace thead/tbody from a text-only projection. Used when row or visible
 * column counts change; Power Table layout chrome (colgroup widths, hidden
 * columns) may be simplified to match the projection.
 *
 * @param {HTMLTableElement} table
 * @param {string[]}         header
 * @param {string[][]}       rowsData
 */
function rebuildTableStructure(table, header, rowsData) {
	let thead = table.querySelector('thead');
	if (!thead) {
		thead = document.createElement('thead');
		table.prepend(thead);
	}

	const headerRow = document.createElement('tr');
	header.forEach((cell) => {
		const th = document.createElement('th');
		setCellHTML(th, cell);
		headerRow.appendChild(th);
	});
	thead.replaceChildren(headerRow);

	rebuildTableBody(table, rowsData);
}

/**
 * Patch cell content in place when shape matches; rebuild thead/tbody when not.
 *
 * @param {HTMLElement} tableEl   `.chart-builder-data-table` figure or `<table>`.
 * @param {Object}      tableData `{ header: string[], rows: string[][] }`.
 */
export function rebuildDataTable(tableEl, tableData) {
	if (!tableEl || !tableData || !Array.isArray(tableData.header)) {
		logTableRebuild('noop', {
			reason: 'invalid-args',
			hasTableEl: !!tableEl,
			hasTableData: !!tableData,
			hasHeader: Array.isArray(tableData?.header),
		});
		return;
	}
	const table = tableEl.matches('table')
		? tableEl
		: tableEl.querySelector('table');
	if (!table) {
		logTableRebuild('noop', { reason: 'missing-table-element' });
		return;
	}

	const { header, rows = [] } = tableData;
	const rowsData = Array.isArray(rows) ? rows : [];
	const beforeDom = domTableShape(table);

	if (!tableShapeMatches(table, tableData)) {
		const headerRow = table.querySelector('thead tr');
		const headerCells = headerRow ? visibleCells(headerRow) : [];
		const headerShapeMatches =
			!headerRow || headerCells.length === header.length;

		if (headerShapeMatches && headerRow) {
			header.forEach((cell, i) => setCellHTML(headerCells[i], cell));
			rebuildTableBody(table, rowsData);
			logTableRebuild('rebuild-tbody', {
				beforeDom,
				afterDom: domTableShape(table),
				storeRows: rowsData.length,
				storeCols: header.length,
			});
		} else {
			rebuildTableStructure(table, header, rowsData);
			logTableRebuild('rebuild-structure', {
				beforeDom,
				afterDom: domTableShape(table),
				storeRows: rowsData.length,
				storeCols: header.length,
			});
		}
		return;
	}

	const headerRow = table.querySelector('thead tr');
	const headerCells = headerRow ? visibleCells(headerRow) : [];
	const bodyRows = Array.from(table.querySelectorAll('tbody > tr'));

	if (headerRow) {
		header.forEach((cell, i) => setCellHTML(headerCells[i], cell));
	}
	bodyRows.forEach((row, r) => {
		const rowData = Array.isArray(rowsData[r]) ? rowsData[r] : [];
		visibleCells(row).forEach((cell, c) => setCellHTML(cell, rowData[c]));
	});
	logTableRebuild('patch-cells', {
		beforeDom,
		afterDom: domTableShape(table),
		storeRows: rowsData.length,
		storeCols: header.length,
	});
}
