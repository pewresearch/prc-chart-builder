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
import { mergeCustomLabelPositions } from './utils/merge-custom-label-positions';

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

			// Merge custom label positions from attributes into data
			// Get viewport-aware customPositions based on currentViewport
			const labels = attributes.labels || {};
			const customPositions =
				currentViewport !== 'desktop' &&
				attributes[currentViewport]?.labels?.customPositions
					? attributes[currentViewport].labels.customPositions
					: labels.customPositions || {};

			const dataWithPositions = mergeCustomLabelPositions(
				data,
				customPositions
			);

			if (!ChartBuilderRenderer) {
				// eslint-disable-next-line no-console
				console.error('ChartBuilderRenderer is not loaded');
			} else {
				ChartBuilderRenderer(id, dataWithPositions, config, tableData);
			}
		},
		/**
		 * Navigate to trigger server-side viewport rehydration.
		 *
		 * @param {string} viewport The viewport to navigate to.
		 */
		*navigateToViewport(viewport) {
			const newUrl = buildViewportUrl(viewport);
			const router = yield import('@wordpress/interactivity-router');
			yield router.actions.navigate(newUrl);
		},
		// TODO: this is a POC of how to update data. will need more unique query params
		*updateData(param) {
			const newUrl = `${window.location.href}?chartBuilderFilterParam=${param}`;
			const router = yield import('@wordpress/interactivity-router');
			yield router.actions.navigate(newUrl);
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
