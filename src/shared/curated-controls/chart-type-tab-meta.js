/**
 * Chart-type wildcard tab metadata for the Style Chart step.
 */
import { __ } from '@wordpress/i18n';

import {
	BAR_CHART_TYPES,
	LINE_CHART_TYPES,
	MAP_CHART_TYPES,
	NODE_CHART_TYPES,
	REGRESSION_CHART_TYPES,
	chartTypeMatches,
	effectiveChartTypeForControls,
} from '../../chart/utils/chart-types';

/**
 * @param {Object} attributes Chart attributes.
 * @return {{ id: string, label: string }|null} Tab meta when the type has
 *   dedicated controls; otherwise null (hide the wildcard tab).
 */
export function getChartTypeTabMeta(attributes = {}) {
	const chartType = attributes?.layout?.type;
	if (!chartType) {
		return null;
	}

	if (chartType === 'small-multiples') {
		return {
			id: 'small-multiples',
			label: __('Multiples', 'prc-chart-builder'),
		};
	}

	if (MAP_CHART_TYPES.includes(chartType)) {
		return { id: 'map', label: __('Map', 'prc-chart-builder') };
	}

	if (chartType === 'diverging-bar') {
		return {
			id: 'diverging-bar',
			label: __('Diverging', 'prc-chart-builder'),
		};
	}

	if (BAR_CHART_TYPES.includes(chartType)) {
		return { id: 'bar', label: __('Bar', 'prc-chart-builder') };
	}

	if (LINE_CHART_TYPES.includes(chartType)) {
		return { id: 'line', label: __('Line', 'prc-chart-builder') };
	}

	if (chartType === 'dot-plot') {
		return { id: 'dot-plot', label: __('Dot Plot', 'prc-chart-builder') };
	}

	if (chartType === 'scatter') {
		return { id: 'scatter', label: __('Scatter', 'prc-chart-builder') };
	}

	if (chartTypeMatches(attributes, ['pie'])) {
		return { id: 'pie', label: __('Pie', 'prc-chart-builder') };
	}

	if (chartType === 'treemap') {
		return { id: 'treemap', label: __('Treemap', 'prc-chart-builder') };
	}

	if (
		chartType === 'waffle' ||
		effectiveChartTypeForControls(attributes) === 'waffle'
	) {
		return { id: 'waffle', label: __('Waffle', 'prc-chart-builder') };
	}

	if (chartType === 'heat-map-table') {
		return {
			id: 'heat-map-table',
			label: __('Heat Map Table', 'prc-chart-builder'),
		};
	}

	if (chartType === 'sankey') {
		return { id: 'sankey', label: __('Sankey', 'prc-chart-builder') };
	}

	if (
		NODE_CHART_TYPES.includes(chartType) ||
		REGRESSION_CHART_TYPES.includes(chartType)
	) {
		return { id: chartType, label: __('Chart', 'prc-chart-builder') };
	}

	return null;
}
