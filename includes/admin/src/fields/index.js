/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */

import chartPreview from './chart-preview';

export default [
	{ ...chartPreview },
	{
		id: 'title',
		type: 'string',
		label: __('Title', 'prc-chart-builder'),
		getValue: ({ item }) => item?.title?.rendered,
		enableGlobalSearch: true,
		enableSorting: true,
	},
	{
		id: 'description',
		type: 'string',
		label: __('Description', 'prc-chart-builder'),
		getValue: ({ item }) => 'Chart Type | Research Team',
	},
	{
		id: 'date',
		type: 'datetime',
		label: __('Date', 'prc-chart-builder'),
		getValue: ({ item }) => new Date(item?.date).toLocaleDateString(),
	},
];
