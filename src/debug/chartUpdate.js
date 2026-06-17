/* eslint-disable no-console -- devtools helper; logging is the deliverable */

// Columns that key/label a row rather than carry a plottable value.
const SKIP_KEYS = new Set([
	'x',
	'name',
	'label',
	'group',
	'category',
	'__errorBars',
]);

/**
 * Build the `debug.update` / `prcChartUpdate` console helper. Atomically patches
 * a chart's data and ephemeral config (colors, animation, arbitrary deep-merge
 * partials such as `dependentAxis.domain`).
 *
 * @param {Object} api Slice-4 debug primitives (`setChart`, `setConfig`, …).
 * @return {Function} chartUpdate(chartId?, opts?) → string[] of updated ids.
 */
export function createChartUpdate(api) {
	/**
	 * Atomically update chart data and ephemeral config.
	 *
	 * @param {string} [chartId] Target chart id. Omit for every chart on page.
	 * @param {Object} [opts]    scale, jitter, data, colors, animationDuration, config, atomic.
	 * @return {string[]} Updated chart ids.
	 */
	return function chartUpdate(chartId, opts = {}) {
		const {
			scale = 1,
			jitter = 0,
			data = null,
			colors = null,
			animationDuration = null,
			config = null,
			atomic = true,
		} = opts;

		if (!api?.setChart || !api?.getChart) {
			console.error(
				'[prcChartUpdate] slice-4 debug API missing — rebuild @prc/chart-builder and hard-reload.'
			);
			return [];
		}

		const ids = chartId ? [chartId] : api.listCharts();
		if (!ids.length) {
			console.warn('[prcChartUpdate] no charts found on this page');
			return [];
		}

		const counts =
			typeof window !== 'undefined'
				? (window.__PRC_CHART_RENDER_COUNTS__ =
						window.__PRC_CHART_RENDER_COUNTS__ || {})
				: {};

		ids.forEach((id) => {
			const before = api.getChart(id);
			if (!before) {
				console.warn(`[prcChartUpdate] ${id}: no store slice`);
				return;
			}

			let nextData = data;
			if (!nextData && Array.isArray(before.data)) {
				nextData = before.data.map((row) => {
					const out = { ...row };
					for (const key of Object.keys(out)) {
						if (SKIP_KEYS.has(key)) {
							continue;
						}
						const raw = out[key];
						const num = Number(raw);
						if (
							raw === '' ||
							raw === null ||
							raw === undefined ||
							Number.isNaN(num)
						) {
							continue;
						}
						let v = num * scale;
						if (jitter) {
							v *= 1 + (Math.random() * 2 - 1) * jitter;
						}
						v = Math.round(v * 100) / 100;
						out[key] = typeof raw === 'string' ? String(v) : v;
					}
					return out;
				});
			}

			const configPatch = config ? { ...config } : {};
			if (colors) {
				configPatch.colors = colors;
			}
			if (animationDuration !== null) {
				configPatch.animation = { duration: animationDuration };
			}

			const r0 = counts[id] || 0;

			if (atomic) {
				api.setChart(id, {
					...(nextData ? { data: nextData } : {}),
					...(Object.keys(configPatch).length
						? { config: configPatch }
						: {}),
				});
			} else {
				if (nextData) {
					api.setData(id, nextData);
				}
				if (Object.keys(configPatch).length) {
					api.setConfig(id, configPatch);
				}
			}

			setTimeout(() => {
				const renders = (counts[id] || 0) - r0;
				const configKeys = Object.keys(configPatch);
				console.log(
					`[prcChartUpdate] ${id} | ${
						atomic ? 'atomic setChart' : 'setData+setConfig'
					} | data: ${
						nextData ? `${nextData.length} rows` : 'unchanged'
					} | config: {${configKeys.join(', ') || '—'}} | renders: ${renders}`
				);
			}, 0);
		});

		return ids;
	};
}
