/* eslint-disable no-console -- devtools helper; logging is the deliverable */

/**
 * prc-chart-builder debug surface.
 *
 * Exposed at `window.prcChartBuilder.debug` after the chart view module
 * initialises the Interactivity store. Convenience aliases are available at
 * `window.prcChartBuilder.update` and `window.prcChartBuilder.randomize`.
 *
 * All handles delegate to `prc-chart-builder/chart` store actions.
 *
 * Full reference: docs/plugins/prc-chart-builder/console-helpers.md
 */

import { store, getServerState } from '@wordpress/interactivity';
import { createChartUpdate } from './chartUpdate';

const CHART_NAMESPACE = 'prc-chart-builder/chart';

// Columns that key/label a row rather than carry a plottable value. Left
// untouched by `randomize` so the axis domain stays stable and you see pure
// geometry transitions. `x` is the independent axis.
const RANDOMIZE_SKIP_KEYS = new Set([
	'x',
	'name',
	'label',
	'group',
	'category',
	'__errorBars',
]);

const isNumericValue = (v) =>
	v !== '' && v !== null && v !== undefined && !Number.isNaN(Number(v));

export const debug = {
	/**
	 * Replace the data array for a chart.
	 *
	 * @param {string} chartId Chart id (matches data-prc-chart-id).
	 * @param {Array}  data    Replacement data.
	 */
	setData(chartId, data) {
		try {
			const { actions } = store(CHART_NAMESPACE);
			actions.setData(chartId, data);
		} catch (err) {
			console.error(
				'[prcChartBuilder.debug.setData] store unavailable',
				err
			);
		}
	},

	/**
	 * Atomically patch a chart's data, config, and/or tableData in a single
	 * re-render. Use this when swapping a dataset that changes the category
	 * universe so the (data, categories, colors) triple stays consistent.
	 *
	 * @param {string} chartId           Chart id (matches data-prc-chart-id).
	 * @param {Object} patch             Partial chart state.
	 * @param {Array}  [patch.data]      Replacement data array.
	 * @param {Object} [patch.config]    Partial config (deep-merged).
	 * @param {Object} [patch.tableData] Replacement table data.
	 */
	setChart(chartId, patch) {
		try {
			const { actions } = store(CHART_NAMESPACE);
			actions.setChart(chartId, patch);
		} catch (err) {
			console.error(
				'[prcChartBuilder.debug.setChart] store unavailable',
				err
			);
		}
	},

	/**
	 * Deep-merge a partial config into a chart. Object branches merge per-key
	 * (siblings preserved); arrays replace wholesale.
	 *
	 * @param {string} chartId       Chart id (matches data-prc-chart-id).
	 * @param {Object} partialConfig Partial config to merge.
	 */
	setConfig(chartId, partialConfig) {
		try {
			const { actions } = store(CHART_NAMESPACE);
			actions.setConfig(chartId, partialConfig);
		} catch (err) {
			console.error(
				'[prcChartBuilder.debug.setConfig] store unavailable',
				err
			);
		}
	},

	/**
	 * Replace the underlying-numbers table for a chart.
	 *
	 * @param {string} chartId   Chart id (matches data-prc-chart-id).
	 * @param {Object} tableData Replacement table data.
	 */
	setTableData(chartId, tableData) {
		try {
			const { actions } = store(CHART_NAMESPACE);
			actions.setTableData(chartId, tableData);
		} catch (err) {
			console.error(
				'[prcChartBuilder.debug.setTableData] store unavailable',
				err
			);
		}
	},

	/**
	 * Toggle verbose table-rebuild logging in the controller watch +
	 * rebuildDataTable util. Reload the page after toggling if watchChart
	 * already initialised — or call before interacting with the table.
	 *
	 * @param {boolean} [enabled=true]
	 */
	enableTableRebuildLogging(enabled = true) {
		window.__PRC_TABLE_REBUILD_DEBUG__ = enabled;
		console.info(
			`[prcChartBuilder.debug] table rebuild logging ${enabled ? 'ON' : 'OFF'}`
		);
	},

	/**
	 * Read-only snapshot of the immutable server-state tableData seed.
	 *
	 * @param {string} chartId Chart id (matches data-prc-chart-id).
	 * @return {Object|null|undefined}
	 */
	getServerTableData(chartId) {
		try {
			const serverState = getServerState();
			const tableData = serverState.charts?.[chartId]?.tableData;
			return tableData
				? JSON.parse(JSON.stringify(tableData))
				: tableData;
		} catch (err) {
			console.error(
				'[prcChartBuilder.debug.getServerTableData] unavailable',
				err
			);
			return undefined;
		}
	},

	/**
	 * Sample live store tableData vs DOM row/column counts over time.
	 * Useful when rows flash then revert — shows whether the store or DOM
	 * is the source of truth at each tick.
	 *
	 * @param {string} [chartId]     Omit to use the first chart on the page.
	 * @param {Object} [options]
	 * @param {number} [options.durationMs=2500] Total sampling window.
	 * @param {number} [options.intervalMs=50]   Poll interval.
	 * @return {Promise<Array<Object>>} Timeline samples.
	 */
	async probeTableSync(chartId, { durationMs = 2500, intervalMs = 50 } = {}) {
		const id = chartId ?? debug.listCharts()[0];
		if (!id) {
			throw new Error('No chart id found on page');
		}

		const tableEl = document.querySelector('.chart-builder-data-table');
		const readDom = () => {
			const table = tableEl?.querySelector('table');
			if (!table) {
				return { domRows: null, domCols: null, visibleBodyCols: [] };
			}
			const headerRow = table.querySelector('thead tr');
			const domCols = headerRow
				? Array.from(headerRow.children).filter(
						(cell) => !cell.classList.contains('is-column-hidden')
					).length
				: 0;
			const bodyRows = Array.from(table.querySelectorAll('tbody > tr'));
			return {
				domRows: bodyRows.length,
				domCols,
				visibleBodyCols: bodyRows.map(
					(row) =>
						Array.from(row.children).filter(
							(cell) =>
								!cell.classList.contains('is-column-hidden')
						).length
				),
			};
		};

		const sample = (label) => {
			const live = debug.getChart(id)?.tableData;
			const server = debug.getServerTableData(id);
			const dom = readDom();
			const row = {
				t: Math.round(performance.now()),
				label,
				storeRows: live?.rows?.length ?? null,
				storeCols: live?.header?.length ?? null,
				serverRows: server?.rows?.length ?? null,
				serverCols: server?.header?.length ?? null,
				...dom,
			};
			console.log('[probeTableSync]', row);
			return row;
		};

		const timeline = [sample('start')];
		const started = performance.now();
		while (performance.now() - started < durationMs) {
			await new Promise((resolve) => {
				window.setTimeout(resolve, intervalMs);
			});
			timeline.push(
				sample(`+${Math.round(performance.now() - started)}ms`)
			);
		}
		return timeline;
	},

	/**
	 * Run an isolated add-row probe with logging enabled. Does not mutate
	 * columns — use after a hard reload for a clean baseline.
	 *
	 * @param {string} [chartId]
	 * @return {Promise<Array<Object>>} Timeline from probeTableSync.
	 */
	async smokeTestAddRow(chartId) {
		const id = chartId ?? debug.listCharts()[0];
		if (!id) {
			throw new Error('No chart found on this page');
		}

		debug.enableTableRebuildLogging(true);

		const before = debug.getChart(id)?.tableData;
		if (!before?.header || !Array.isArray(before.rows)) {
			throw new Error('Chart has no tableData — open the Data tab first');
		}

		console.group('[smokeTestAddRow] baseline');
		console.log('chartId', id);
		console.log('store rows', before.rows.length);
		console.log('server rows', debug.getServerTableData(id)?.rows?.length);
		console.log(
			'DOM rows',
			document.querySelectorAll('.chart-builder-data-table tbody tr')
				.length
		);
		console.groupEnd();

		const next = {
			header: before.header,
			rows: [
				...before.rows,
				before.header.map((_, j) => (j === 0 ? 'NEW ROW' : '—')),
			],
		};

		console.info('[smokeTestAddRow] setTableData →', {
			fromRows: before.rows.length,
			toRows: next.rows.length,
		});
		debug.setTableData(id, next);

		// First frame: store should already reflect the write.
		console.log('[smokeTestAddRow] store immediately after', {
			storeRows: debug.getChart(id)?.tableData?.rows?.length,
			domRows: document.querySelectorAll(
				'.chart-builder-data-table tbody tr'
			).length,
		});

		const timeline = await debug.probeTableSync(id, {
			durationMs: 3000,
			intervalMs: 50,
		});

		const last = timeline[timeline.length - 1];
		console.info('[smokeTestAddRow] summary', {
			expectedRows: next.rows.length,
			finalStoreRows: last.storeRows,
			finalDomRows: last.domRows,
			finalServerRows: last.serverRows,
			storeReverted: last.storeRows === before.rows.length,
			domReverted: last.domRows === before.rows.length,
		});

		return timeline;
	},

	/**
	 * Read-only snapshot of a chart's live store slice. Returns a plain
	 * JSON-safe clone (config functions are dropped by the JSON pass).
	 *
	 * @param {string} chartId Chart id (matches data-prc-chart-id).
	 * @return {Object|undefined} `{ data, config, tableData }` or undefined.
	 */
	getChart(chartId) {
		try {
			const { state } = store(CHART_NAMESPACE);
			const slice = state.charts?.[chartId];
			if (!slice) {
				return undefined;
			}
			return JSON.parse(
				JSON.stringify({
					data: slice.data ?? null,
					config: slice.config ?? null,
					tableData: slice.tableData ?? null,
				})
			);
		} catch (err) {
			console.error(
				'[prcChartBuilder.debug.getChart] store unavailable',
				err
			);
			return undefined;
		}
	},

	/**
	 * List the chart ids present on the page (every element carrying a
	 * `data-prc-chart-id`).
	 *
	 * @return {string[]} Chart ids.
	 */
	listCharts() {
		return Array.from(document.querySelectorAll('[data-prc-chart-id]')).map(
			(el) => el.dataset.prcChartId
		);
	},

	/**
	 * Randomly re-roll every numeric value in a chart's data and push it
	 * through `setData`, so the chart animates to the new geometry.
	 *
	 * @param {string} [chartId]        Chart id. Omit to randomize every chart.
	 * @param {Object} [options]
	 * @param {number} [options.min=0]  Minimum random value.
	 * @param {number} [options.max=10] Maximum random value.
	 * @return {string[]} The chart ids that were updated.
	 */
	randomize(chartId, { min = 0, max = 10 } = {}) {
		try {
			const { state, actions } = store(CHART_NAMESPACE);

			const ids = chartId
				? [chartId]
				: Array.from(
						document.querySelectorAll('[data-prc-chart-id]')
					).map((el) => el.dataset.prcChartId);

			if (!ids.length) {
				console.warn(
					'[prcChartBuilder.debug.randomize] no charts found'
				);
				return [];
			}

			const roll = () => Math.round(min + Math.random() * (max - min));

			const updated = [];
			ids.forEach((id) => {
				const slice = state.charts?.[id];
				if (!Array.isArray(slice?.data)) {
					return;
				}
				const next = slice.data.map((row) => {
					const out = { ...row };
					Object.keys(out).forEach((key) => {
						if (
							RANDOMIZE_SKIP_KEYS.has(key) ||
							!isNumericValue(out[key])
						) {
							return;
						}
						out[key] =
							typeof out[key] === 'string'
								? String(roll())
								: roll();
					});
					return out;
				});
				actions.setData(id, next);
				updated.push(id);
			});

			return updated;
		} catch (err) {
			console.error(
				'[prcChartBuilder.debug.randomize] store unavailable',
				err
			);
			return [];
		}
	},
};

// High-level console helper: atomic data + ephemeral config tweaks.
debug.update = createChartUpdate(debug);

export default debug;
