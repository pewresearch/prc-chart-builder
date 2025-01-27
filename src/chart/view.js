/**
 * WordPress Dependencies
 */
import {
	store,
	getElement,
	getContext,
	getServerState,
	withScope,
} from '@wordpress/interactivity';

/**
 * Internal  dependencies
 */
import getConfig from './utils/getConfig';
// import ShareModal from './view/ShareModal';
import './styles.scss';

const { ChartBuilderRenderer } = window.prcChartBuilder;

const { actions, state } = store('prc-block/chart-builder', {
	actions: {
		renderChart() {
			const serverState = getServerState();
			const context = getContext();
			const { id, attributes } = context;
			const data = serverState[id]['chart-data'];
			const tableData = serverState[id]['table-data'];

			const config = getConfig(attributes, id);
			ChartBuilderRenderer(id, data, config, tableData);
		},
		// TODO: this is a POC of how to update data. will need more unique query params
		*updateData(param) {
			const newUrl = `${window.location.href}?chartBuilderFilterParam=${param}`;
			const router = yield import('@wordpress/interactivity-router');
			yield router.actions.navigate(newUrl);
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
