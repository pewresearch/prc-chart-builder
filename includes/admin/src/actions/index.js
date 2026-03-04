/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { edit, seen, trash, copy } from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';

/**
 * Build an edit URL for a given post ID, preserving the current origin and
 * subsite path (multisite-safe). Mirrors the pattern used in synced-chart/controls.jsx.
 *
 * @param {number} postId The post ID to edit.
 * @return {string} Full edit URL.
 */
function getEditUrl(postId) {
	const url = new URL(window.location.href);
	url.pathname = url.pathname.replace(/\/wp-admin\/.*/, '/wp-admin/post.php');
	url.search = '';
	url.searchParams.set('post', postId);
	url.searchParams.set('action', 'edit');
	return url.toString();
}

const actions = [
	{
		id: 'edit-chart',
		label: __('Edit Chart', 'prc-chart-builder'),
		icon: edit,
		isPrimary: true,
		isEligible: (item) => !!item?.id,
		callback: ([item]) => {
			window.location.href = getEditUrl(item.id);
		},
	},
	{
		id: 'view-chart',
		label: __('View Chart', 'prc-chart-builder'),
		icon: seen,
		isEligible: (item) => item?.status === 'publish' && !!item?.link,
		callback: ([item]) => {
			window.open(item.link, '_blank');
		},
	},
	{
		id: 'duplicate-chart',
		label: __('Duplicate Chart', 'prc-chart-builder'),
		icon: copy,
		isEligible: (item) => !!item?.id,
		callback: ([item], { onActionPerformed }) => {
			apiFetch({
				path: '/wp/v2/chart',
				method: 'POST',
				data: {
					title: `${item.title?.rendered || 'Chart'} (copy)`,
					content: item.content?.raw || '',
					status: 'draft',
					meta: item.meta || {},
				},
			})
				.then((newChart) => {
					if (newChart?.id) {
						window.location.href = getEditUrl(newChart.id);
					}
					onActionPerformed?.([item]);
				})
				.catch(() => {
					// eslint-disable-next-line no-alert
					window.alert(
						__(
							'Failed to duplicate chart. Please try again.',
							'prc-chart-builder'
						)
					);
				});
		},
	},
	{
		id: 'trash-chart',
		label: __('Move to Trash', 'prc-chart-builder'),
		icon: trash,
		supportsBulk: true,
		isEligible: (item) => item?.status !== 'trash',
		RenderModal: ({ items, closeModal, onActionPerformed }) => {
			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const {
				Button,
				__experimentalText: Text,
				VStack,
			} = window.wp?.components || {};
			const count = items.length;
			const message =
				count === 1
					? __(
							'Are you sure you want to move this chart to the trash?',
							'prc-chart-builder'
						)
					: __(
							'Are you sure you want to move these charts to the trash?',
							'prc-chart-builder'
						);

			const handleConfirm = () => {
				Promise.all(
					items.map((item) =>
						apiFetch({
							path: `/wp/v2/chart/${item.id}`,
							method: 'DELETE',
						})
					)
				).finally(() => {
					onActionPerformed?.(items);
					closeModal?.();
				});
			};

			return (
				<VStack spacing={3}>
					<Text>{message}</Text>
					<VStack spacing={2} direction="row" justify="flex-end">
						<Button variant="tertiary" onClick={closeModal}>
							{__('Cancel', 'prc-chart-builder')}
						</Button>
						<Button
							variant="primary"
							isDestructive
							onClick={handleConfirm}
						>
							{__('Move to Trash', 'prc-chart-builder')}
						</Button>
					</VStack>
				</VStack>
			);
		},
	},
];

export default actions;
