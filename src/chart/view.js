/**
 * WordPress Dependencies
 */
import { store, getContext, getServerState } from '@wordpress/interactivity';

/**
 * Internal  Dependencies
 */
import getConfig from './utils/get-config';

// import './styles.scss';

const { ChartBuilderRenderer } =
	window.prcCustomCharts || window.prcChartingLibrary;
const { actions, state } = store('prc-chart-builder/chart', {
	state: {
		get isQuestionExpanded() {
			const context = getContext();
			const { id } = context;
			return state[id]?.isQuestionExpanded || false;
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
			const attributes = serverState[id]['attributes'];
			const data = serverState[id]['chart-data'];
			const tableData = serverState[id]['table-data'];
			if (!attributes) {
				return;
			}

			const config = getConfig(attributes, id);
			if (!ChartBuilderRenderer) {
				console.error('ChartBuilderRenderer is not loaded');
				return;
			} else {
				ChartBuilderRenderer(id, data, config, tableData);
			}
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
	},
});
