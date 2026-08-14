/**
 * Chart-type wildcard tab — mounts the same type-gated inspector panels
 * used in the full chart sidebar.
 */
import { __experimentalVStack as VStack } from '@wordpress/components';

import BarControls from '../../chart/edit/bar-controls';
import DiffColumnControls from '../../chart/edit/diff-column-controls';
import DivergingBarControls from '../../chart/edit/diverging-bar-control';
import DotPlotControls from '../../chart/edit/dot-plot-controls';
import LineControls from '../../chart/edit/line-controls';
import MapControls from '../../chart/edit/map-controls';
import NetValueControls from '../../chart/edit/net-value-controls';
import NodeControls from '../../chart/edit/node-controls';
import PieControls from '../../chart/edit/pie-controls';
import PlotBandControls from '../../chart/edit/plot-band-controls';
import RegressionControls from '../../chart/edit/regression-controls';
import SankeyControls from '../../chart/edit/sankey-controls';
import SmallMultiplesControls from '../../chart/edit/small-multiples-controls';
import TreemapControls from '../../chart/edit/treemap-controls';
import WaffleControls from '../../chart/edit/waffle-controls';
import HeatMapTableControls from '../../chart/edit/heat-map-table-controls';
import {
	BAR_CHART_TYPES,
	LINE_CHART_TYPES,
	NODE_CHART_TYPES,
	REGRESSION_CHART_TYPES,
	SUPPLEMENTAL_COLUMN_CHART_TYPES,
	chartTypeMatches,
	effectiveChartTypeForControls,
} from '../../chart/utils/chart-types';

const CLIENT_ID = 'prc-chart-modal-configure-type';

/**
 * @param {Object}   props
 * @param {Object}   props.chartAttributes
 * @param {Function} props.setAttributes
 */
export default function ChartTypeTab({ chartAttributes, setAttributes }) {
	const layout = chartAttributes.layout || {};
	const io = chartAttributes.io || {};
	const diffColumn = chartAttributes.diffColumn || {};
	const netValues = chartAttributes.netValues || {};
	const { type: chartType } = layout;
	const { chartFamily } = io;
	const isSmallMultiples = chartType === 'small-multiples';
	const effectiveType = effectiveChartTypeForControls(chartAttributes);

	const showLineControls = chartTypeMatches(
		chartAttributes,
		LINE_CHART_TYPES
	);
	const showBarControls = chartTypeMatches(chartAttributes, BAR_CHART_TYPES);
	const showPieControls = chartTypeMatches(chartAttributes, ['pie']);
	const showNodeControls =
		NODE_CHART_TYPES.includes(chartType) || showLineControls;

	const controlProps = {
		attributes: chartAttributes,
		setAttributes,
		clientId: CLIENT_ID,
		curated: true,
	};

	return (
		<VStack spacing={2} className="prc-chart-modal__configure-tab-panel">
			{isSmallMultiples && <SmallMultiplesControls {...controlProps} />}
			{chartFamily === 'map' && <MapControls {...controlProps} />}
			{showBarControls && <BarControls {...controlProps} />}
			{chartType === 'diverging-bar' && (
				<DivergingBarControls {...controlProps} />
			)}
			{showLineControls && (
				<>
					<PlotBandControls {...controlProps} />
					<LineControls {...controlProps} />
				</>
			)}
			{chartType === 'dot-plot' && <DotPlotControls {...controlProps} />}
			{showPieControls && <PieControls {...controlProps} />}
			{chartType === 'treemap' && <TreemapControls {...controlProps} />}
			{(chartType === 'waffle' ||
				(isSmallMultiples && effectiveType === 'waffle')) && (
				<WaffleControls {...controlProps} />
			)}
			{chartType === 'heat-map-table' && (
				<HeatMapTableControls {...controlProps} />
			)}
			{chartType === 'sankey' && <SankeyControls {...controlProps} />}
			{showNodeControls && (
				<NodeControls
					{...controlProps}
					chartType={isSmallMultiples ? effectiveType : chartType}
				/>
			)}
			{REGRESSION_CHART_TYPES.includes(chartType) && (
				<RegressionControls {...controlProps} />
			)}
			{SUPPLEMENTAL_COLUMN_CHART_TYPES.includes(chartType) &&
				diffColumn.active && <DiffColumnControls {...controlProps} />}
			{SUPPLEMENTAL_COLUMN_CHART_TYPES.includes(chartType) &&
				netValues.active && <NetValueControls {...controlProps} />}
		</VStack>
	);
}
