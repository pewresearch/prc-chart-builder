import apiFetch from '@wordpress/api-fetch';

/**
 * Fetch the site-level chart creation UI rollout setting.
 *
 * @return {Promise<{enabled: boolean}>} Resolved setting payload.
 */
export function fetchCreationUiSetting() {
	return apiFetch({ path: '/prc-chart-builder/v1/creation-ui' });
}

/**
 * Persist the site-level chart creation UI rollout setting.
 *
 * @param {boolean} enabled Whether the new creation UI is enabled.
 * @return {Promise<{enabled: boolean}>} Saved setting payload.
 */
export function saveCreationUiSetting(enabled) {
	return apiFetch({
		path: '/prc-chart-builder/v1/creation-ui',
		method: 'POST',
		data: { enabled },
	});
}
