/**
 * WordPress Dependencies
 */
import {
	store,
	getContext,
	getServerState,
	withScope,
} from '@wordpress/interactivity';

/**
 * @prc Dependencies
 *
 * Top-level static import is the dependency-graph signal that orders the
 * `@prc/charting-library` Script Module BEFORE this view module. Without it,
 * the `wp_enqueue_script_module` call alone is not enough to guarantee
 * evaluation order. The runtime `??` below keeps the legacy
 * `prc-custom-charts` window-global fallback alive until that plugin ships
 * its own dual build.
 */
import { ChartBuilderRenderer as ScriptModuleRenderer } from '@prc/charting-library';

/**
 * Internal  Dependencies
 */
import getConfig from './utils/get-config';
import { mergeCustomLabelData } from './utils/merge-custom-label-data';
import { mergeCustomTooltipData } from './utils/merge-custom-tooltip-data';
import { applyChartPatch } from './utils/apply-deep-patch';
import debug from '../debug';

// import './styles.scss';

/**
 * Whether a chart store slice is a prc-custom-charts chart (e.g. RLS stacked bar).
 *
 * @param {Object|undefined} slice Per-chart state slice from the store.
 * @return {boolean} True when the chart uses the prc-custom-charts renderer path.
 */
function isCustomChartSlice(slice) {
	if (!slice?.attributes) {
		return false;
	}
	const io = slice.attributes.io ?? {};
	return (
		!!io.isCustomChart ||
		!!(io.customAttributes && io.customAttributes.chartType)
	);
}

/**
 * Whether a chart mount element contains live chart content (not SSR fallback).
 *
 * @param {HTMLElement|null} mountEl Chart mount root (`#data-prc-chart-id`).
 * @return {boolean} True when a custom chart is already mounted in the node.
 */
function mountHasLiveChart(mountEl) {
	if (!mountEl || mountEl.childElementCount === 0) {
		return false;
	}
	return Array.from(mountEl.children).some(
		(child) => !child.classList.contains('chart-fallback')
	);
}

/**
 * Determine viewport based on window width.
 * Uses standard breakpoints: mobile ≤ 640px, tablet 641-1023px, desktop ≥ 1024px.
 *
 * @return {string} 'mobile', 'tablet', or 'desktop'
 */
function getViewportFromWidth() {
	if (window.innerWidth <= 640) {
		return 'mobile';
	}
	if (window.innerWidth > 640 && window.innerWidth <= 1023) {
		return 'tablet';
	}
	return 'desktop';
}

/**
 * Build URL with viewport query param, preserving existing params.
 *
 * @param {string} viewport The viewport to set.
 * @return {string} The new URL.
 */
function buildViewportUrl(viewport) {
	const url = new URL(window.location.href);
	url.searchParams.set('cb_viewport', viewport);
	return url.toString();
}

const CHART_NAMESPACE = 'prc-chart-builder/chart';

/**
 * Chart ids that already have a viewport IntersectionObserver attached.
 * Guards against watchForRender attaching a second observer on re-runs.
 *
 * @type {Set<string>}
 */
const viewportObserverIds = new Set();

/**
 * Chart ids whose `syncOnNavigation` watch has already run its initial pass.
 *
 * The watch fires once at registration (mount) and again on every
 * interactivity-router navigation. We skip the first pass per id because
 * `renderChart` already seeds the live slice on mount and the server payload
 * matches the server-rendered markup — only subsequent (navigation) passes
 * need to re-seed.
 *
 * @type {Set<string>}
 */
const navSeededIds = new Set();

/**
 * Build the `(data, config, tableData)` inputs for a chart from its current
 * server-state slice.
 *
 * Pulled out of `renderChart` so the navigation watch can reuse the exact same
 * derivation (viewport-aware `getConfig` + label / error-bar / tooltip merges)
 * when re-seeding the live store slice after a router navigation. Always reads
 * `getServerState()`, which the router refreshes on every navigation.
 *
 * @param {string} id Chart id (matches data-prc-chart-id).
 * @return {{data: Array, config: Object, tableData: Object}|null} Inputs, or null when the slice/attributes are unavailable.
 */
function buildChartInputs(id) {
	const serverState = getServerState();
	const slice = serverState.charts?.[id];
	if (!slice) {
		return null;
	}
	const attributes = slice.attributes;
	if (!attributes) {
		return null;
	}
	const data = slice.data;
	const tableData = slice.tableData;

	// Use the server-provided viewport from the slice (mirrors the
	// state.currentViewport getter without needing a directive context).
	const currentViewport = slice.currentViewport || 'desktop';
	const config = getConfig(attributes, id, null, currentViewport);

	// Merge all custom label data from attributes into data.
	// Get viewport-aware customizations based on currentViewport.
	const labels = attributes.labels || {};
	const viewportLabels =
		currentViewport !== 'desktop'
			? attributes[currentViewport]?.labels || {}
			: {};

	// Build label customizations object with viewport overrides.
	const labelCustomizations = {
		customPositions:
			viewportLabels.customPositions || labels.customPositions || {},
		customLabels: viewportLabels.customLabels || labels.customLabels || {},
		customVisibility:
			viewportLabels.customVisibility || labels.customVisibility || {},
		customStyles: viewportLabels.customStyles || labels.customStyles || {},
	};

	// Determine group breaks category for key matching.
	const activeGroupBreaksCategory =
		config.dataRender?.groupBreaksActive &&
		config.dataRender?.groupBreaksCategory
			? config.dataRender.groupBreaksCategory
			: null;

	const dataWithLabelCustomizations = mergeCustomLabelData(
		data,
		labelCustomizations,
		activeGroupBreaksCategory
	);

	// Enrich data with __errorBars from column mappings (dot-plot only).
	let dataWithCustomizations = dataWithLabelCustomizations;
	if (
		config.layout?.type === 'dot-plot' &&
		config.errorBars?.enabled &&
		config.errorBars?.categories
	) {
		const mappingEntries = Object.entries(config.errorBars.categories);
		if (mappingEntries.length > 0) {
			const defaultStyles = config.errorBars.defaultStyles || {};
			dataWithCustomizations = dataWithLabelCustomizations.map((row) => {
				const bars = {};
				for (const [catKey, mapping] of mappingEntries) {
					if (mapping.lowColumn && mapping.highColumn) {
						const low = parseFloat(row[mapping.lowColumn]);
						const high = parseFloat(row[mapping.highColumn]);
						if (!isNaN(low) && !isNaN(high)) {
							bars[catKey] = {
								min: low,
								max: high,
								...defaultStyles,
								...(mapping.styles || {}),
							};
						}
					}
				}
				return Object.keys(bars).length > 0
					? { ...row, __errorBars: bars }
					: row;
			});
		}
	}

	// Merge customTooltips (top-level block attribute) as the final pass.
	const customTooltips = attributes.customTooltips || {};
	const dataWithAllCustomizations = mergeCustomTooltipData(
		dataWithCustomizations,
		customTooltips,
		activeGroupBreaksCategory
	);

	return { data: dataWithAllCustomizations, config, tableData };
}

/**
 * Expose the debug surface on `window.prcChartBuilder`.
 *
 * Shape:
 *   window.prcChartBuilder.debug      — full debug API
 *   window.prcChartBuilder.update     — convenience alias (was window.prcChartUpdate)
 *   window.prcChartBuilder.randomize  — convenience alias (was window.randomize)
 */
if (typeof window !== 'undefined') {
	window.prcChartBuilder = {
		...(window.prcChartBuilder ?? {}),
		debug,
		update: debug.update,
		randomize: debug.randomize,
	};
}

const { actions, state } = store(CHART_NAMESPACE, {
	state: {
		get isQuestionExpanded() {
			const context = getContext();
			const { id } = context;
			return state.charts?.[id]?.isQuestionExpanded || false;
		},
		get currentViewport() {
			const serverState = getServerState();
			const context = getContext();
			const { id } = context;
			return serverState.charts?.[id]?.currentViewport || 'desktop';
		},
	},
	actions: {
		/**
		 * Atomic chart update — the load-bearing correctness primitive
		 * (PRC-17 slice 4). Applies every provided patch field to
		 * state.charts[chartId] in a single synchronous pass before the
		 * action returns, so preact-signal subscribers collapse the
		 * change into ONE useSyncExternalStore re-render. This is what
		 * lets a caller swap to a dataset with a different category
		 * universe (variant button, scrollytelling step, REST poller)
		 * without the wrapper ever observing a torn
		 * (data, categories, colors) triple.
		 *
		 * Field semantics (data↔config coupling contract):
		 * - data / tableData replace wholesale
		 * - config deep-merges (object-merge, array-replace)
		 *
		 * @param {string} chartId           Chart id (matches data-prc-chart-id).
		 * @param {Object} patch             Partial chart state.
		 * @param {Array}  [patch.data]      Replacement data array.
		 * @param {Object} [patch.config]    Partial config (deep-merged).
		 * @param {Object} [patch.tableData] Replacement table data.
		 */
		setChart(chartId, patch) {
			const slice = state.charts?.[chartId];
			if (!slice) {
				return;
			}
			applyChartPatch(slice, patch);
		},
		/**
		 * Replace the data slice for a chart. Thin single-field wrapper
		 * around `setChart`. The wrapper subscribes to
		 * state.charts[chartId].data via useChartStore, so any caller —
		 * a sibling block, a scrollytelling step, a REST poller, the
		 * debug handle — can drive a chart by calling this action with
		 * the target chart id.
		 *
		 * @param {string} chartId Chart block id (matches data-prc-chart-id).
		 * @param {Array}  data    Replacement data array.
		 */
		setData(chartId, data) {
			actions.setChart(chartId, { data });
		},
		/**
		 * Deep-merge a partial config into a chart. Object branches merge
		 * per-key (siblings preserved); arrays replace wholesale. Thin
		 * single-field wrapper around `setChart`.
		 *
		 * @param {string} chartId Chart id (matches data-prc-chart-id).
		 * @param {Object} partial Partial config to merge.
		 */
		setConfig(chartId, partial) {
			actions.setChart(chartId, { config: partial });
		},
		/**
		 * Replace the underlying-numbers table for a chart. Thin
		 * single-field wrapper around `setChart`.
		 *
		 * @param {string} chartId   Chart id (matches data-prc-chart-id).
		 * @param {Object} tableData Replacement table data.
		 */
		setTableData(chartId, tableData) {
			actions.setChart(chartId, { tableData });
		},
		renderChart() {
			const context = getContext();
			const { id } = context;
			const slice = state.charts?.[id];

			if (!slice) {
				return;
			}

			const isCustom = isCustomChartSlice(slice);
			const mountEl = document.getElementById(id);

			// Seed the live store slice and mount the wrapper exactly once
			// per chart id. After the wrapper subscribes via useChartStore,
			// subsequent mutations (debug.setData, scrollytelling steps,
			// REST pollers) flow through the same signal — re-running this
			// block would overwrite caller mutations with the immutable
			// serverState payload. `config` is the seeded sentinel: it is
			// undefined in the server-emitted slice and populated by the
			// first call here. The navigation re-seed (syncOnNavigation)
			// deliberately resets it before re-running this flow.
			//
			// Custom charts inside parent router regions (e.g. RLS dialogs)
			// get a fresh mount node on each navigation while the store
			// slice persists — remount when the node is empty.
			if (slice.config) {
				if (!isCustom || mountHasLiveChart(mountEl)) {
					return;
				}
				slice.config = undefined;
			}

			const inputs = buildChartInputs(id);
			if (!inputs) {
				return;
			}

			slice.data = inputs.data;
			slice.config = inputs.config;
			slice.tableData = inputs.tableData;

			if (isCustom) {
				const customRenderer =
					window.prcCustomCharts?.ChartBuilderRenderer;
				if (!customRenderer) {
					// eslint-disable-next-line no-console
					console.error(
						'prc-custom-charts ChartBuilderRenderer is not loaded'
					);
					return;
				}
				customRenderer(
					id,
					inputs.data,
					inputs.config,
					inputs.tableData
				);
				return;
			}

			if (!ScriptModuleRenderer) {
				// eslint-disable-next-line no-console
				console.error('ChartBuilderRenderer is not loaded');
				return;
			}

			// `(id, { namespace, chartId })` mounts the wrapper with a live
			// subscription to state.charts[chartId].
			ScriptModuleRenderer(id, {
				namespace: CHART_NAMESPACE,
				chartId: id,
				fallbackData: inputs.data,
				fallbackConfig: inputs.config,
				fallbackTableData: inputs.tableData,
			});
		},
		/**
		 * Navigate to trigger server-side viewport rehydration.
		 *
		 * @param {string} viewport The viewport to navigate to.
		 */
		*navigateToViewport(viewport) {
			const newUrl = buildViewportUrl(viewport);
			const { actions: routerActions } =
				yield import('@wordpress/interactivity-router');
			yield routerActions.navigate(newUrl, { replace: true });
			// Strip the viewport param from the URL bar after navigation so it
			// doesn't persist visibly in the browser bar.
			const cleanUrl = new URL(window.location.href);
			cleanUrl.searchParams.delete('cb_viewport');
			window.history.replaceState(
				window.history.state,
				'',
				cleanUrl.toString()
			);
		},
		toggleQuestionWordingExpanded() {
			const context = getContext();
			const { id } = context;
			if (!state.charts?.[id]) {
				return;
			}
			state.charts[id].isQuestionExpanded =
				!state.charts[id].isQuestionExpanded;
		},
	},
	callbacks: {
		onRun: () => {
			actions.renderChart();
		},
		/**
		 * Re-seed the live chart slice from server state after a router
		 * navigation.
		 *
		 * `getServerState()` reads the interactivity-router's navigation
		 * signal, so this watch re-runs after every client-side navigation
		 * (e.g. `navigateToViewport` or any site-wide router link). The router
		 * merges the new server payload with
		 * `deepMerge(state, serverState, false)` — `override=false` — so it
		 * never refreshes the already-seeded leaves of `state.charts[id]`
		 * (`data` / `config` / `tableData` / `attributes`). Only
		 * `getServerState()` reflects the navigated values.
		 *
		 * The chart itself updates on navigation because it lives inside its
		 * own `data-wp-router-region`, but the controller's visible table and
		 * metadata are rebuilt by `controller/view.js`'s `watchChart`, which
		 * subscribes to the LIVE slice — so without this re-seed they keep
		 * their mount-time values. Replacing the slice's `data` / `config` /
		 * `tableData` here (top-level signal writes) makes the wrapper and the
		 * controller watches reconverge on the navigated chart.
		 */
		syncOnNavigation: () => {
			const context = getContext();
			const { id } = context;
			// Read server state up front so the watch subscribes to the
			// navigation signal (and to this chart's slice presence).
			const serverState = getServerState();
			const hasServerSlice = !!serverState.charts?.[id];

			// Skip the initial pass: renderChart already seeds the live slice
			// on mount and the server payload matches the rendered markup.
			if (!navSeededIds.has(id)) {
				navSeededIds.add(id);
				return;
			}

			// Only act once the chart has been mounted/seeded (config set) and
			// the navigated server payload is available.
			if (!hasServerSlice || !state.charts?.[id]?.config) {
				return;
			}

			const inputs = buildChartInputs(id);
			if (!inputs) {
				return;
			}

			// Wholesale top-level replacements: the wrapper (useChartStore)
			// re-renders the chart and the controller's watchChart watches
			// rebuild the visible table + metadata text in place.
			state.charts[id].data = inputs.data;
			state.charts[id].config = inputs.config;
			state.charts[id].tableData = inputs.tableData;
		},
		watchForRender: () => {
			const context = getContext();
			const { id } = context;
			// IMPORTANT: do NOT read `state.charts[id].data` (or any other
			// signal we don't intend to react to) inside this watch — the
			// interactivity runtime auto-subscribes the watch to every
			// signal it reads. A stray `.data` read here causes setData()
			// to re-trigger this callback, which calls renderChart, which
			// overwrites the just-mutated slice from serverState. Keep the
			// dependency surface scoped to `shouldRender` only.
			const shouldRender = state.charts?.[id]?.shouldRender;
			if (shouldRender) {
				const serverState = getServerState();
				const triggerOnViewport =
					serverState.charts?.[id]?.attributes?.animation
						?.triggerOnViewport ?? false;

				// When the viewport-entry trigger is active and the chart
				// hasn't rendered yet, attach an IntersectionObserver and
				// defer renderChart() until the element enters the viewport.
				// The Set guard prevents a second observer on re-runs.
				if (triggerOnViewport && !state.charts?.[id]?.config) {
					if (!viewportObserverIds.has(id)) {
						viewportObserverIds.add(id);
						const el = document.querySelector(
							`[data-prc-chart-id="${id}"]`
						);
						if (
							el &&
							typeof window.IntersectionObserver !== 'undefined'
						) {
							const observer = new window.IntersectionObserver(
								withScope((entries) => {
									if (entries[0]?.isIntersecting) {
										observer.disconnect();
										actions.renderChart();
									}
								}),
								{ threshold: 0.1 }
							);
							observer.observe(el);
						} else {
							// Fallback: observer unavailable or element missing.
							actions.renderChart();
						}
					}
					return;
				}
				actions.renderChart();
			}
		},
		watchForResize: (() => {
			let timeoutId = null;
			return () => {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				timeoutId = setTimeout(
					withScope(() => {
						const newViewport = getViewportFromWidth();
						const currentViewport = state.currentViewport;
						if (newViewport !== currentViewport) {
							// TODO: need to update the current viewport to reflect the new viewport
							actions.navigateToViewport(newViewport);
						}
						timeoutId = null;
					}),
					250
				);
			};
		})(),
	},
});
