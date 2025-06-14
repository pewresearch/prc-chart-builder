/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

export default [
	{
		id: 'view-chart',
		label: __('View Chart'),
		callback: ([item]) => {
			const url = item.link;
			window.open(url, '_blank');
		},
	},
	{
		id: 'edit-chart',
		label: __('Edit Chart'),
		callback: ([item]) => {
			const url =
				item.edit_link ||
				`/wp-admin/post.php?post=${item?.id}&action=edit`;
			window.open(url, '_blank');
		},
	},
];
