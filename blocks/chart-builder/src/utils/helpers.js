/**
 * WordPress Dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal Dependencies
 */
import {
	legacyBarTemplate,
	legacyStackedBarTemplate,
	legacyLineTemplate,
	legacyColumnTemplate,
	legacyAreaTemplate,
	legacyScatterTemplate,
	legacyStackedColumnTemplate,
	legacyStackedAreaTemplate,
	pieTemplate,
} from '../../../../.shared/variation-templates';

export function handleLegacyConversion(postId) {
	return new Promise((resolve) => {
		apiFetch({
			path: addQueryArgs('/prc-api/v2/chart-builder-migration', {
				postId,
			}),
		}).then((data) => {
			console.log(data);
			resolve(data);
		});
	});
}

/**
 *  Internal Dependencies
 */

// Transform data from table block into json useable for chart builder
export const formattedData = (data, scale, chartType) => {
	const { body, tableHeaders } = data;
	const seriesData = [];
	const scaleData = (d, s) => {
		if (
			'bar' === chartType ||
			'stacked-bar' === chartType ||
			'pie' === chartType ||
			'dot-plot' === chartType
		) {
			return d;
		}
		if ('time' === s) {
			return new Date(d);
		}
		return parseFloat(d);
	};
	for (let i = 1; i < tableHeaders.length; i++) {
		const series = body
			.filter(
				(row) =>
					!Number.isNaN(
						parseFloat(row.cells[i].content.replace(/[^0-9.]/g, ''))
					)
			)
			.map((row) => ({
				x: scaleData(row.cells[0].content, scale),
				y: parseFloat(row.cells[i].content.replace(/[^0-9.]/g, '')),
				category: tableHeaders[i],
				// yLabel: `${parseFloat(row.cells[i].content)}`,
			}));
		seriesData.push(series);
	}
	return seriesData;
};

export const stringToArrayOfNums = (str) =>
	str
		.split(',')
		.map(Number)
		.filter((num) => !Number.isNaN(num));

export const getDomain = (min, max, type, scale, axis) => {
	if (Number.isNaN(min) || Number.isNaN(max)) {
		return [0, 100];
	}
	// x axis is a bit of a misnomer for bar types. It refers exclusively to the dependent axis.
	if ('bar' === type && 'x' === axis) {
		return null;
	}
	if ('stacked-bar' === type && 'x' === axis) {
		return null;
	}
	if ('dot-plot' === type && 'x' === axis) {
		return null;
	}
	// likewise, no domain for a pie chart
	if ('pie' === type) {
		return null;
	}
	if ('time' === scale && 'x' === axis) {
		return [new Date(min, 0), new Date(max, 0)];
	}
	return [parseFloat(min), parseFloat(max)];
};

export const getTicks = (ticks, scale) => {
	if ('time' === scale) {
		return ticks.map((tick) => new Date(`${tick}`));
	}
	return ticks;
};

export const formatNum = (num, output) => {
	if ('string' === typeof num && 'integer' === output) {
		return parseInt(num, 10);
	}
	if ('string' === typeof num && 'float' === output) {
		return parseFloat(num);
	}
	return num;
};

export const formatLegacyAttrs = (legacyMeta, attributes, siteID) => {
	const checkEmptyStr = (legacyAttr, attr) =>
		0 !== legacyAttr.length ? legacyAttr : attr;
	const getLegacyConfig = (type, stack) => {
		if ('bar' === type) {
			if ('1' === stack) {
				return legacyStackedBarTemplate[1][1];
			}
			return legacyBarTemplate[1][1];
		}
		if ('column' === type) {
			if ('1' === stack) {
				return legacyStackedColumnTemplate[1][1];
			}
			return legacyColumnTemplate[1][1];
		}
		if ('line' === type) {
			return legacyLineTemplate[1][1];
		}
		if ('area' === type) {
			if ('1' === stack) {
				return legacyStackedAreaTemplate[1][1];
			}
			return legacyAreaTemplate[1][1];
		}
		if ('scatter' === type) {
			return legacyScatterTemplate[1][1];
		}
		if ('pie' === type) {
			return pieTemplate[1][1];
		}
		return legacyColumnTemplate[1][1];
	};
	const getColorSpectrum = (id) => {
		switch (id) {
			case 1:
				return 'general';
			case 2:
				return 'global-spectrum';
			case 3:
				return 'social-trends-spectrum';
			case 4:
				return 'politics-spectrum';
			case 5:
				return 'hispanic-spectrum';
			case 7:
				return 'religion-spectrum';
			case 8:
				return 'journalism-spectrum';
			case 9:
				return 'internet-spectrum';
			case 10:
				return 'purple-spectrum';
			case 18:
				return 'hispanic-spectrum';
			default:
				return 'general';
		}
	};
	const legacyConfig = getLegacyConfig(
		legacyMeta.cb_type,
		legacyMeta.cb_stack_multiple_series
	);
	return {
		...legacyConfig,
		xScale:
			'datetime' === legacyMeta.cb_xaxis_type &&
			'column' !== legacyMeta.cb_type
				? 'time'
				: 'linear',
		xLabel: checkEmptyStr(legacyMeta.cb_xaxis_label, attributes.xLabel),
		yLabel: checkEmptyStr(legacyMeta.cb_yaxis_label, attributes.yLabel),
		yMaxDomain: checkEmptyStr(
			legacyMeta.cb_yaxis_max_value,
			attributes.yMaxDomain
		),
		metaTitle: checkEmptyStr(legacyMeta.title, attributes.metaTitle),
		metaSubtitle: checkEmptyStr(
			legacyMeta.cb_subtitle,
			attributes.metaSubtitle
		),
		xMinDomain: 'datetime' === legacyMeta.cb_xaxis_type ? 1960 : 0,
		xMaxDomain: 'datetime' === legacyMeta.cb_xaxis_type ? 2020 : 100,
		lineNodes: !legacyMeta.cb_hide_markers,
		tooltipActive: legacyMeta.cb_enable_inline_tooltips,
		isConvertedChart: false,
		colorValue: getColorSpectrum(siteID),
	};
};
