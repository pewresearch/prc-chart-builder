/**
 * Pin the block editor to Top toolbar mode on chart CPT screens.
 *
 * Chart Builder nests chart/table blocks inside a controller; the default
 * inline floating toolbar obscures the wizard and view-mode controls.
 */
import { dispatch, select, subscribe } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';

const CHART_POST_TYPE = 'chart';

function getCurrentPostType() {
	try {
		return select(editorStore)?.getCurrentPostType?.() ?? null;
	} catch {
		return null;
	}
}

function pinFixedToolbarIfNeeded() {
	if (getCurrentPostType() !== CHART_POST_TYPE) {
		return;
	}
	if (select(preferencesStore).get('core', 'fixedToolbar')) {
		return;
	}
	dispatch(preferencesStore).set('core', 'fixedToolbar', true);
}

/**
 * Enable Top toolbar once when a chart post editor loads.
 */
export function initializeChartFixedToolbar() {
	if (getCurrentPostType()) {
		pinFixedToolbarIfNeeded();
		return;
	}

	const bootUnsubscribe = subscribe(() => {
		if (!getCurrentPostType()) {
			return;
		}
		pinFixedToolbarIfNeeded();
		bootUnsubscribe();
	});
}

export default initializeChartFixedToolbar;
