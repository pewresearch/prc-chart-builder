/**
 * WordPress Dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';

/**
 * Duplicate a chart via a full GET then POST so content.raw and meta are copied.
 *
 * @param {Object} item Shell list row.
 * @param {Function} [onRefresh] Refresh callback from the shell.
 */
async function duplicateChart(item, onRefresh) {
	const source = await apiFetch({
		path: `/wp/v2/chart/${item.id}?context=edit`,
	});
	const title =
		typeof source?.title === 'object'
			? source.title.raw || source.title.rendered || 'Chart'
			: source?.title || item?.title || 'Chart';
	const newChart = await apiFetch({
		path: '/wp/v2/chart',
		method: 'POST',
		data: {
			title: `${title} (copy)`,
			content: source?.content?.raw || '',
			status: 'draft',
			meta: source?.meta || {},
		},
	});
	if (newChart?.id) {
		window.location.href = `post.php?post=${newChart.id}&action=edit`;
		return;
	}
	onRefresh?.();
}

/**
 * Append chart-specific row actions; keep shell edit/view/trash.
 *
 * @param {Array} actions Shell actions.
 * @param {Object} options
 * @param {Function} [options.onRefresh] Refresh callback.
 * @return {Array} Actions for the chart list.
 */
export default function getChartActions(actions, { onRefresh } = {}) {
	const editIndex = actions.findIndex((action) => action.id === 'edit');
	const insertAt = editIndex >= 0 ? editIndex + 1 : actions.length;

	const duplicate = {
		id: 'duplicate-chart',
		label: __('Duplicate Chart', 'prc-chart-builder'),
		icon: copy,
		isEligible: (item) => !!item?.id && item?.status !== 'trash',
		callback: async ([item]) => {
			try {
				await duplicateChart(item, onRefresh);
			} catch (error) {
				// eslint-disable-next-line no-alert
				window.alert(
					__(
						'Failed to duplicate chart. Please try again.',
						'prc-chart-builder'
					)
				);
			}
		},
	};

	return [
		...actions.slice(0, insertAt),
		duplicate,
		...actions.slice(insertAt),
	];
}

/**
 * Eligibility helpers exported for unit tests.
 *
 * @param {Object} item List row.
 * @return {boolean} Whether duplicate is available.
 */
export function isDuplicateEligible(item) {
	return !!item?.id && item?.status !== 'trash';
}
