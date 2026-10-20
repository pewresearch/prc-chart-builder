/* eslint-disable no-param-reassign */
/**
 * WordPress Dependencies
 */
import { createReduxStore } from '@wordpress/data';

const DEFAULT_VIEW = 'chart';

const store = createReduxStore('prc-chart-builder/controller', {
	reducer: (
		state = {
			tableVisibility: false,
			controllerClientIds: [],
			currentlySelectController: null,
			viewModes: {},
			showBothMap: {},
			previewDeviceType: null,
		},
		action
	) => {
		switch (action.type) {
			case 'TOGGLE_ALL_TABLE_VISIBILITY':
				return {
					...state,
					tableVisibility: !state.tableVisibility,
				};
			case 'SET_CONTROLLER_VIEW':
				if (!action.controllerId) {
					return state;
				}
				return {
					...state,
					viewModes: {
						...state.viewModes,
						[action.controllerId]: action.view,
					},
				};
			case 'SET_CONTROLLER_SHOW_BOTH':
				if (!action.controllerId) {
					return state;
				}
				return {
					...state,
					showBothMap: {
						...state.showBothMap,
						[action.controllerId]: action.showBoth,
					},
				};
			case 'SET_PREVIEW_DEVICE_TYPE':
				return {
					...state,
					previewDeviceType: action.deviceType || null,
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
		setControllerView(controllerId, view) {
			return {
				type: 'SET_CONTROLLER_VIEW',
				controllerId,
				view,
			};
		},
		setControllerShowBoth(controllerId, showBoth) {
			return {
				type: 'SET_CONTROLLER_SHOW_BOTH',
				controllerId,
				showBoth: !!showBoth,
			};
		},
		/**
		 * @param {string|null} deviceType The chart wizard's preview viewport
		 *                                 (`'desktop'` | `'tablet'` | `'mobile'`),
		 *                                 or null to follow the editor device type.
		 */
		setPreviewDeviceType(deviceType) {
			return {
				type: 'SET_PREVIEW_DEVICE_TYPE',
				deviceType,
			};
		},
	},
	selectors: {
		getAllTableVisibility(state) {
			return state.tableVisibility;
		},
		getControllerView(state, controllerId) {
			if (!controllerId) {
				return DEFAULT_VIEW;
			}
			return state.viewModes[controllerId] ?? DEFAULT_VIEW;
		},
		getControllerShowBoth(state, controllerId) {
			if (!controllerId) {
				return false;
			}
			return !!state.showBothMap[controllerId];
		},
		getPreviewDeviceType(state) {
			return state.previewDeviceType;
		},
	},
});

export default store;
