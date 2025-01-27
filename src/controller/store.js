/* eslint-disable no-param-reassign */
/**
 * WordPress Dependencies
 */
import { createReduxStore } from '@wordpress/data';

const store = createReduxStore('prc-block/chart-builder-controller', {
	reducer: (
		state = {
			tableVisibility: false,
		},
		action
	) => {
		switch (action.type) {
			case 'TOGGLE_ALL_TABLE_VISIBILITY':
				return {
					...state,
					tableVisibility: !state.tableVisibility,
				};
			default:
				return state;
		}
	},
	actions: {
		toggleAllTableVisibility() {
			return {
				type: 'TOGGLE_ALL_TABLE_VISIBILITY',
			};
		},
	},
	selectors: {
		getAllTableVisibility(state) {
			return state.tableVisibility;
		},
	},
});

export default store;
