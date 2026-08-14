/**
 * WordPress Dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import getChartActions from './actions';
import getChartFields, { getDefaultVisibleFields } from './fields';
import './style.scss';

function isChartList() {
	return 'chart' === window?.prcWpAdminDataview?.postType;
}

addFilter('prcWpAdminDataview.fields', 'prc-chart-builder/fields', (fields) =>
	isChartList() ? getChartFields(fields) : fields
);

addFilter(
	'prcWpAdminDataview.actions',
	'prc-chart-builder/actions',
	(actions, { onRefresh } = {}) =>
		isChartList() ? getChartActions(actions, { onRefresh }) : actions
);

addFilter(
	'prcWpAdminDataview.defaultVisibleFields',
	'prc-chart-builder/default-fields',
	(fields) => (isChartList() ? getDefaultVisibleFields() : fields)
);

addFilter(
	'prcWpAdminDataview.pageDescription',
	'prc-chart-builder/page-description',
	(description) =>
		isChartList()
			? __('Browse and manage charts.', 'prc-chart-builder')
			: description
);
