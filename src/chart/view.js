/**
 * WordPress Dependencies
 */
import { store, getContext, getServerState } from '@wordpress/interactivity';

/**
 * Internal  Dependencies
 */
import getConfig from './utils/get-config';

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
			console.log('TABLE DATA: ', context, state);

			const config = getConfig(attributes, id);
			console.log('CONFIG: ', config);
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
			console.log('SHOULD RENDER: ', shouldRender, context);

			if (shouldRender) {
				actions.renderChart();
			}
		},
	},
});
