import { dispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import apiFetch from '@wordpress/api-fetch';

// TODO: At some point move this to a shared constants for the Chart Library functionality.
const NAMESPACE = 'prc-chart-builleder__library';
const NAME = 'Chart Library';
const SEARCH_ITEMS = 'Search Chart Library';

// TODO: The preview url and external source need to point to the external chart builder screenshot service. Additionally, we could do some trickery here where we detect a static image inserted from the media inserter and transfrom into a synced chart block on insertion...

export function registerInserterMediaCategory() {
	dispatch('core/block-editor').registerInserterMediaCategory({
		name: NAMESPACE,
		labels: {
			name: 'Chart Library',
			search_items: 'Search Chart Library',
		},
		mediaType: 'image',
		async fetch(query = {}) {
			const defaultArgs = {};
			const finalQuery = { ...query, ...defaultArgs };
			console.log('CHART LIBRARY FETCH', finalQuery);
			// TODO: Implement the query arguments to the apiFetch.

			const response = await apiFetch({
				path: 'wp/v2/chart',
				method: 'GET',
			});

			return response.map((result) => ({
				...result,
				sourceId: result.id,
				id: undefined,
				title: result.title?.rendered,
				caption: result.title?.rendered,
				previewUrl: 'https://placehold.co/600x400',
			}));
		},
		isExternalResource: true,
	});
}

/**
 * Register a media panel for the Chart Library
 */
export default function registerChartLibraryMediaPanel() {
	domReady(() => {
		registerInserterMediaCategory();
	});
}
