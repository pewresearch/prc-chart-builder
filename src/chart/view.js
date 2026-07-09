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
 * PRC Dependencies
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
import { applyChartPatch } from './utils/apply-deep-patch';
import {
	buildChartInputs,
	resolveChartViewport,
} from './utils/build-chart-inputs';
import { syncControllerSurfaces } from './utils/sync-controller-surfaces';
import {
	isCustomChartSlice,
	mountHasLiveChart,
	getViewportFromWidth,
	attachViewportRenderTrigger,
} from './utils/view-helpers';
import debug from '../debug';

// import './styles.scss';

const CHART_NAMESPACE = 'prc-chart-builder/chart';

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
			const context = getContext();
			const { id } = context;
			return state.charts?.[id]?.currentViewport || 'desktop';
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
			// Deterministically push the controller table + metadata DOM via
			// `syncControllerSurfaces` (the single runtime writer for those
			// surfaces). The chart SVG still updates reactively via
			// `useChartStore` inside the chart's own region.
			syncControllerSurfaces(chartId, slice);
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
		/**
		 * Re-derive chart inputs for a new viewport and update the live slice.
		 *
		 * @param {string} viewport Target viewport ('mobile', 'tablet', 'desktop').
		 */
		switchViewport(viewport) {
			const context = getContext();
			const { id } = context;
			const slice = state.charts?.[id];
			if (!slice || slice.currentViewport === viewport) {
				return;
			}

			slice.currentViewport = viewport;

			const inputs = buildChartInputs(id, slice);
			if (!inputs) {
				return;
			}

			// Wholesale replacement — not applyChartPatch. A viewport switch
			// re-derives the full config from base attributes + deviceType;
			// deep-merging would leave stale keys (e.g. tablet
			// shapes.customStyles entries when switching to mobile).
			slice.data = inputs.data;
			slice.config = inputs.config;
			slice.tableData = inputs.tableData;
			syncControllerSurfaces(id, slice);
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
			// first call here.
			//
			// The store slice is global and survives Interactivity Router
			// navigations, but the mount node is recreated from fresh SSR on
			// each navigation. This happens to both renderer paths: custom
			// charts in parent router regions (e.g. RLS dialogs) and standard
			// charts in router-driven lists (e.g. Roper search results, where
			// re-searching a prior term recreates a node for a chart id whose
			// slice already has `config`). When the live chart is gone from the
			// node (only the SSR `.chart-fallback` remains) the wrapper must be
			// remounted, otherwise later `setChart` mutations update a slice
			// nothing visible is subscribed to and the SSR fallback persists.
			// `mountHasLiveChart` stays true for an already-mounted wrapper, so
			// in-place caller mutations are still never clobbered.
			if (slice.config) {
				if (!mountEl || mountHasLiveChart(mountEl)) {
					return;
				}
				slice.config = undefined;
			}

			// Resize handler only runs on window resize events, not on load.
			// Align the live slice with the client breakpoint before building
			// inputs so tablet/mobile overrides apply on first paint.
			if (typeof window !== 'undefined') {
				const clientViewport = getViewportFromWidth();
				if (clientViewport !== resolveChartViewport(id, slice)) {
					slice.currentViewport = clientViewport;
				}
			}

			const inputs = buildChartInputs(id, slice);
			if (!inputs) {
				return;
			}

			slice.data = inputs.data;
			slice.config = inputs.config;
			slice.tableData = inputs.tableData;

			// Push table + metadata before either renderer path. Renderer-
			// agnostic (Preact module + prc-custom-charts) and covers the
			// client-side `config.metadata` merge that SSR alone cannot know.
			syncControllerSurfaces(id, slice);

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
				if (triggerOnViewport && !state.charts?.[id]?.config) {
					attachViewportRenderTrigger(
						id,
						withScope(() => actions.renderChart())
					);
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
							actions.switchViewport(newViewport);
						}
						timeoutId = null;
					}),
					250
				);
			};
		})(),
	},
});
