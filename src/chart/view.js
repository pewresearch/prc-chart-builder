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
 * Internal  Dependencies
 */
import getConfig from './utils/get-config';
import { mergeCustomLabelData } from './utils/merge-custom-label-data';
import { mergeCustomTooltipData } from './utils/merge-custom-tooltip-data';

// import './styles.scss';

const { ChartBuilderRenderer } =
	window.prcCustomCharts || window.prcChartingLibrary;

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

const { actions, state } = store('prc-chart-builder/chart', {
	state: {
		get isQuestionExpanded() {
			const context = getContext();
			const { id } = context;
			return state[id]?.isQuestionExpanded || false;
		},
		get currentViewport() {
			const serverState = getServerState();
			const context = getContext();
			const { id } = context;
			return serverState[id]?.currentViewport || 'desktop';
		},
	},
	actions: {
		renderChart() {
			const serverState = getServerState();
			const context = getContext();
			const { id } = context;
			if (!serverState[id]) {
				return;
			}
			const attributes = serverState[id].attributes;
			const data = serverState[id]['chart-data'];
			const tableData = serverState[id]['table-data'];
			if (!attributes) {
				return;
			}

			// Use server-provided viewport from state.
			const currentViewport = state.currentViewport;
			const config = getConfig(attributes, id, null, currentViewport);

			// Merge all custom label data from attributes into data
			// Get viewport-aware customizations based on currentViewport
			const labels = attributes.labels || {};
			const viewportLabels =
				currentViewport !== 'desktop'
					? attributes[currentViewport]?.labels || {}
					: {};

			// Build label customizations object with viewport overrides
			const labelCustomizations = {
				customPositions:
					viewportLabels.customPositions ||
					labels.customPositions ||
					{},
				customLabels:
					viewportLabels.customLabels || labels.customLabels || {},
				customVisibility:
					viewportLabels.customVisibility ||
					labels.customVisibility ||
					{},
				customStyles:
					viewportLabels.customStyles || labels.customStyles || {},
			};

			// Determine group breaks category for key matching
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

			// Enrich data with __errorBars from column mappings (dot-plot only)
			let dataWithCustomizations = dataWithLabelCustomizations;
			if (
				config.layout?.type === 'dot-plot' &&
				config.errorBars?.enabled &&
				config.errorBars?.categories
			) {
				const mappingEntries = Object.entries(
					config.errorBars.categories
				);
				if (mappingEntries.length > 0) {
					const defaultStyles = config.errorBars.defaultStyles || {};
					dataWithCustomizations = dataWithLabelCustomizations.map(
						(row) => {
							const bars = {};
							for (const [catKey, mapping] of mappingEntries) {
								if (mapping.lowColumn && mapping.highColumn) {
									const low = parseFloat(
										row[mapping.lowColumn]
									);
									const high = parseFloat(
										row[mapping.highColumn]
									);
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
						}
					);
				}
			}

			// Merge customTooltips (top-level block attribute) as the final pass.
			const customTooltips = attributes.customTooltips || {};
			const dataWithAllCustomizations = mergeCustomTooltipData(
				dataWithCustomizations,
				customTooltips,
				activeGroupBreaksCategory
			);

			if (!ChartBuilderRenderer) {
				// eslint-disable-next-line no-console
				console.error('ChartBuilderRenderer is not loaded');
			} else {
				ChartBuilderRenderer(
					id,
					dataWithAllCustomizations,
					config,
					tableData
				);
			}
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
		// TODO: this is a POC of how to update data. will need more unique query params
		*updateData(param) {
			const newUrl = `${window.location.href}?chartBuilderFilterParam=${param}`;
			const { actions: routerActions } =
				yield import('@wordpress/interactivity-router');
			yield routerActions.navigate(newUrl, { replace: false });
		},
		toggleQuestionWordingExpanded() {
			const context = getContext();
			const { id } = context;
			state[id].isQuestionExpanded = !state[id].isQuestionExpanded;
		},
	},
	callbacks: {
		onRun: () => {
			actions.renderChart();
		},
		watchForRender: () => {
			const context = getContext();
			const { id } = context;
			const shouldRender = state[id]['should-render'];
			if (shouldRender) {
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
