/**
 * Which CategoryStyle keys a chart type may offer on the series paint panel.
 *
 * Charts still paint through resolveBarPaint / resolveLinePathPaint /
 * resolvePointPaint / resolveLabelStyle. This table is panel gating only.
 * Key it off block `chartType` (or effectiveChartTypeForControls), not
 * compiled layout.type — get-config rewrites `area` to `line`.
 */

import {
	BAR_CHART_TYPES,
	MAP_CHART_TYPES,
	NODE_CHART_TYPES,
	VALUE_SCALE_CHART_TYPES,
} from './chart-types';

const VALUE_SCALE_MARK_TYPES = [...MAP_CHART_TYPES, ...VALUE_SCALE_CHART_TYPES];

export const SERIES_STYLE_FAMILIES = {
	identityFill: ['fill'],
	filledMark: ['pattern'],
	stroke: ['stroke', 'strokeWidth', 'strokeOpacity', 'strokeDasharray'],
	fade: ['opacity'],
	points: ['pointSize', 'pointStrokeWidth', 'pointFill', 'pointFillOpacity'],
	labels: ['label', 'labelsVisible'],
};

function unionFamilies(...familyNames) {
	return [
		...new Set(familyNames.flatMap((name) => SERIES_STYLE_FAMILIES[name])),
	];
}

const BAR_FIELDS = unionFamilies(
	'identityFill',
	'filledMark',
	'stroke',
	'fade',
	'labels'
);

const LINE_FIELDS = unionFamilies('stroke', 'fade', 'points', 'labels');

const AREA_FIELDS = unionFamilies(
	'identityFill',
	'filledMark',
	'stroke',
	'fade',
	'points',
	'labels'
);

const POINT_FIELDS = unionFamilies(
	'identityFill',
	'stroke',
	'fade',
	'points',
	'labels'
);

const MAP_FIELDS = unionFamilies(
	'identityFill',
	'filledMark',
	'stroke',
	'fade',
	'labels'
).filter((field) => field !== 'strokeDasharray');

// Pie arcs, waffle cells, sankey nodes, and treemap leaves take stroke color and width only.
const SHAPE_FIELDS = unionFamilies(
	'identityFill',
	'filledMark',
	'stroke',
	'fade'
).filter((field) => !['strokeOpacity', 'strokeDasharray'].includes(field));

const LABELED_SHAPE_FIELDS = [...SHAPE_FIELDS, ...SERIES_STYLE_FAMILIES.labels];

const FIELDS_BY_CHART_TYPE = {
	pie: LABELED_SHAPE_FIELDS,
	sankey: LABELED_SHAPE_FIELDS,
	treemap: LABELED_SHAPE_FIELDS,
	waffle: SHAPE_FIELDS,
	...Object.fromEntries(BAR_CHART_TYPES.map((type) => [type, BAR_FIELDS])),
	line: LINE_FIELDS,
	area: AREA_FIELDS,
	'stacked-area': AREA_FIELDS,
	...Object.fromEntries(NODE_CHART_TYPES.map((type) => [type, POINT_FIELDS])),
	...Object.fromEntries(
		VALUE_SCALE_MARK_TYPES.map((type) => [type, MAP_FIELDS])
	),
};

/**
 * Series style keys the paint panel may show for this chart type.
 *
 * Unknown types get labels only so E charts do not offer fields they
 * cannot paint yet.
 *
 * A linear map ramp paints a gradient between stops, so a stop takes a
 * fill and nothing else.
 *
 * @param {string} chartType          Block chart type (not compiled layout.type).
 * @param {Object} [options]
 * @param {string} [options.mapScale] Active map value scale.
 * @return {string[]} CategoryStyle field names.
 */
export function getSeriesStyleFields(chartType, { mapScale } = {}) {
	if (VALUE_SCALE_MARK_TYPES.includes(chartType) && mapScale === 'linear') {
		return SERIES_STYLE_FAMILIES.identityFill;
	}

	return FIELDS_BY_CHART_TYPE[chartType] ?? SERIES_STYLE_FAMILIES.labels;
}

/**
 * Whether the stroke is the series color, as on a line chart: the chart offers
 * a stroke but no fill, so the swatch and the Stroke field edit one value.
 *
 * @param {string} [chartType]        Block chart type (not compiled layout.type).
 * @param {Object} [options]
 * @param {string} [options.mapScale] Active map value scale.
 * @return {boolean} True when the stroke stands in for the fill.
 */
export function strokeIsSeriesColor(chartType, { mapScale } = {}) {
	if (!chartType) {
		return false;
	}

	const fields = getSeriesStyleFields(chartType, { mapScale });
	return fields.includes('stroke') && !fields.includes('fill');
}
