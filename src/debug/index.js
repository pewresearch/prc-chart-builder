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
 * Full reference: prc-chart-builder/docs/console-helpers.md
 */

import { store } from '@wordpress/interactivity';
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
