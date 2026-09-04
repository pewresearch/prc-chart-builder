import apiFetch from '@wordpress/api-fetch';

/**
 * Fetch site-level screenshot capture settings.
 *
 * @return {Promise<Object>} REST payload with settings, providers, and lock state.
 */
export function fetchScreenshotSettings() {
	return apiFetch({ path: '/prc-chart-builder/v1/screenshot-settings' });
}

/**
 * Persist site-level screenshot capture settings.
 *
 * @param {Object} settings Settings object matching PHP defaults.
 * @return {Promise<Object>} Fresh REST payload.
 */
export function saveScreenshotSettings(settings) {
	return apiFetch({
		path: '/prc-chart-builder/v1/screenshot-settings',
		method: 'POST',
		data: { settings },
	});
}
