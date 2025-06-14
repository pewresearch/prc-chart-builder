/**
 * WordPress Dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { isURL } from '@wordpress/url';

const getChartRef = async (url) => {
	// Check if the url has a /chart/ in it and get the /chart/... last part of the url and then lets hit the rest api for /wp-json/wp/v2/chart/{thatchartslug}
	const chartSlug = url.split('/chart/').pop();
	const response = await fetch(`${url}/wp-json/wp/v2/chart/${chartSlug}`);
	const data = await response.json();
	return data.id;
};

const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: (node) => {
				const siteDomain = window.location.href
					.split('/')
					.slice(0, 3)
					.join('/');
				const trimmedText = node.textContent.trim();
				return (
					'P' === node.nodeName &&
					isURL(trimmedText) &&
					trimmedText.startsWith(siteDomain) &&
					trimmedText.includes('/chart/')
				);
			},
			transform: async (node) => {
				const url = node.textContent.trim();
				// We should try to get the chart id by passing the url to a rest endpoint to just see if it can return a chart id. This function will probaly need to be async to work correctly...
				const foundChart = await getChartRef(url);
				const { id } = foundChart;
				return createBlock('prc-block/chart', {
					ref: id,
				});
			},
			priority: 0, // Do this before any other match.
		},
	],
};

export default transforms;
