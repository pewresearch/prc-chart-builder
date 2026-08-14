// V2
/* eslint-disable max-lines */
/* eslint-disable no-console */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-undef */
/**
 * WordPress Dependencies
 */
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';
import {
	BoxControl,
	PanelBody,
	PanelRow,
	RangeControl,
	SelectControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import {
	ANIMATED_CHART_TYPES,
	BAR_CHART_TYPES,
	LINE_CHART_TYPES,
	NODE_CHART_TYPES,
	REGRESSION_CHART_TYPES,
	SUPPLEMENTAL_COLUMN_CHART_TYPES,
	chartTypeMatches,
	effectiveChartTypeForControls,
} from '../utils/chart-types';
import { formatNum } from '../utils/helpers';
import AnimationControls from './animation-controls';
import AnnotationControls from './annotation-controls';
import BarControls from './bar-controls';
import BeeSwarmControls from './bee-swarm-controls';
import ColorControls from './color-controls';
import DataControls from './data-controls';
import DependentAxisControls from './dependent-axis-controls';
import DiffColumnControls from './diff-column-controls';
import DivergingBarControls from './diverging-bar-control';
import DotPlotControls from './dot-plot-controls';
import DrawingControls from './drawing-controls';
import IndependentAxisControls from './independent-axis-controls';
import LabelControls from './label-controls';
import LegendControls from './legend-controls';
import LineControls from './line-controls';
import MapControls from './map-controls';
import NetValueControls from './net-value-controls';
import NodeControls from './node-controls';
import PieControls from './pie-controls';
import PlotBandControls from './plot-band-controls';
import RegressionControls from './regression-controls';
import SankeyControls from './sankey-controls';
import SmallMultiplesControls from './small-multiples-controls';
import TextFieldControls from './text-field-controls';
import TooltipControls from './tooltip-controls';
import TreemapControls from './treemap-controls';
import WaffleControls from './waffle-controls';
import HeatMapTableControls from './heat-map-table-controls';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import ProductionControls from './production-controls';

function ControlSections(props) {
	const { attributes, limitControls } = props;
	if (limitControls) {
		return <TextFieldControls {...props} />;
	}
	// Access viewport-aware and non-viewport-aware attributes
	const io = attributes.io || {}; // io is not viewport-aware
	const layout = attributes.layout || {}; // Will use getCurrentValue in specific controls
	const diffColumn = attributes.diffColumn || {};
	const netValues = attributes.netValues || {};

	const { type: chartType } = layout;
	const { chartFamily } = io;
	const isSmallMultiples = chartType === 'small-multiples';
	const effectiveType = effectiveChartTypeForControls(attributes);
	const showAxes =
		'map' !== chartFamily &&
		chartType !== 'waffle' &&
		!(
			isSmallMultiples &&
			(effectiveType === 'pie' || effectiveType === 'waffle')
		);
	const showIndependentAxis = showAxes || chartType === 'heat-map-table';
	const showDependentAxis = showAxes || chartType === 'heat-map-table';
	const showLineControls = chartTypeMatches(attributes, LINE_CHART_TYPES);
	const showBarControls = chartTypeMatches(attributes, BAR_CHART_TYPES);
	const showPieControls = chartTypeMatches(attributes, ['pie']);
	const showNodeControls =
		NODE_CHART_TYPES.includes(chartType) || showLineControls;
	const showAnimationControls = chartTypeMatches(
		attributes,
		ANIMATED_CHART_TYPES
	);

	return (
		<>
			<TextFieldControls {...props} />
			<DataControls {...props} />
			<ColorControls {...props} chartType={chartType} />
			{isSmallMultiples && <SmallMultiplesControls {...props} />}
			{showIndependentAxis && <IndependentAxisControls {...props} />}
			{showDependentAxis && <DependentAxisControls {...props} />}
			{'map' === chartFamily && <MapControls {...props} />}

			{showBarControls && <BarControls {...props} />}
			{'diverging-bar' === chartType && (
				<DivergingBarControls {...props} />
			)}
			{showLineControls && (
				<>
					{/* Plot bands are consumed by SM line panels too. */}
					<PlotBandControls {...props} />
					<LineControls {...props} />
				</>
			)}
			{'dot-plot' === chartType && <DotPlotControls {...props} />}
			{'bee-swarm' === chartType && <BeeSwarmControls {...props} />}
			{showPieControls && <PieControls {...props} />}
			{'treemap' === chartType && <TreemapControls {...props} />}
			{(chartType === 'waffle' ||
				(isSmallMultiples && effectiveType === 'waffle')) && (
				<WaffleControls {...props} />
			)}
			{'heat-map-table' === chartType && (
				<HeatMapTableControls {...props} />
			)}
			{'sankey' === chartType && <SankeyControls {...props} />}
			{showNodeControls && (
				<NodeControls
					{...props}
					chartType={isSmallMultiples ? effectiveType : chartType}
				/>
			)}
			{REGRESSION_CHART_TYPES.includes(chartType) && (
				<RegressionControls {...props} />
			)}
			{SUPPLEMENTAL_COLUMN_CHART_TYPES.includes(chartType) &&
				diffColumn.active && <DiffColumnControls {...props} />}
			{SUPPLEMENTAL_COLUMN_CHART_TYPES.includes(chartType) &&
				netValues.active && <NetValueControls {...props} />}
			<AnnotationControls {...props} />
			<LabelControls {...props} />
			<TooltipControls {...props} />
			<LegendControls {...props} />
			{showAnimationControls && <AnimationControls {...props} />}
			<DrawingControls {...props} />
		</>
	);
}

function ChartControls({
	attributes,
	setAttributes,
	clientId,
	onPreviewAnimation,
	isPreviewingAnimation,
	isDrawingMode,
	drawingTool,
	onDrawingModeChange,
	onToolChange,
	strokeColor,
	strokeWidth,
	onStrokeColorChange,
	onStrokeWidthChange,
	selectedDrawingId,
	onSelectedDrawingChange,
}) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	// Get viewport-aware values
	const layout = getCurrentValue('layout') || {};
	const {
		type: chartType,
		orientation,
		width,
		height,
		padding,
		overflowX,
	} = layout;
	// Content attribute - NOT viewport-aware
	const io = attributes.io || {};
	const { isStaticChart, isFreeformChart } = io;
	const limitControls = isFreeformChart || isStaticChart;

	// Get controller block to update chartType
	const controllerClientId = useSelect(
		(select) => {
			const { getBlockParentsByBlockName } = select(blockEditorStore);
			return getBlockParentsByBlockName(
				clientId,
				'prc-chart-builder/controller'
			)?.[0];
		},
		[clientId]
	);

	const controllerChartType = useSelect(
		(select) => {
			if (!controllerClientId) return null;
			const { getBlock } = select(blockEditorStore);
			const controllerBlock = getBlock(controllerClientId);
			return controllerBlock?.attributes?.chartType;
		},
		[controllerClientId]
	);

	const { updateBlockAttributes } = useDispatch(blockEditorStore);
	const variations = useSelect((select) => {
		const { getBlockVariations } = select(blocksStore);
		return getBlockVariations('prc-chart-builder/controller');
	}, []);

	// Filter out map types and create options
	const NON_TRANSFORMABLE_TYPES = [
		'us-map',
		'us-map-county',
		'us-map-block',
		'world-map',
	];

	const chartTypeOptions =
		variations
			?.filter(
				(v) =>
					v.attributes?.chartType &&
					!NON_TRANSFORMABLE_TYPES.includes(v.attributes.chartType)
			)
			.map((v) => ({
				value: v.attributes.chartType,
				label: v.title,
			})) || [];

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Chart Layout')} initialOpen={false}>
					{!limitControls && chartTypeOptions.length > 0 && (
						<SelectControl
							label={__('Chart Type')}
							value={controllerChartType || chartType}
							options={chartTypeOptions}
							onChange={(newChartType) => {
								if (controllerClientId) {
									updateBlockAttributes(controllerClientId, {
										chartType: newChartType,
									});
								}
							}}
						/>
					)}
					{!limitControls &&
						('bar' === chartType ||
							'stacked-bar' === chartType) && (
							<SelectControl
								label={__(
									'Chart Orientation (Bar charts only)'
								)}
								value={orientation}
								options={[
									{
										value: 'vertical',
										label: 'Vertical',
									},
									{
										value: 'horizontal',
										label: 'Horizontal',
									},
								]}
								onChange={(o) => {
									updateAttributeForDevice('layout', {
										orientation: o,
									});
								}}
							/>
						)}
					<RangeControl
						label={__('Width')}
						withInputField
						min={0}
						max={1152}
						value={parseInt(width, 10)}
						onChange={(w) =>
							updateAttributeForDevice('layout', {
								width: formatNum(w, 'integer'),
							})
						}
					/>
					<RangeControl
						label={__('Height')}
						withInputField
						min={0}
						max={1200}
						value={parseInt(height, 10)}
						onChange={(h) =>
							updateAttributeForDevice('layout', {
								height: formatNum(h, 'integer'),
							})
						}
					/>
					<SelectControl
						label={__('Overflow')}
						value={overflowX}
						help={__(
							'Choose how the chart should handle overflow on the x-axis when the chart width is wider than the window. "Responsive" will resize the chart width to fit the window, "Scroll" will allow the chart to be scrolled horizontally, and "Scroll (fixed y-axis)" will allow the chart to be scrolled horizontally while keeping the y-axis fixed (if applicable).'
						)}
						options={[
							{
								value: 'responsive',
								label: 'Responsive (Recommended)',
							},
							{
								value: 'scroll',
								label: 'Scroll',
							},
							// {
							// 	value: 'scroll-fixed-y-axis',
							// 	label: 'Scroll (fixed y-axis)',
							// },
							{
								value: 'preserve-aspect-ratio',
								label: 'Preserve Aspect Ratio',
							},
						]}
						onChange={(overflow) =>
							updateAttributeForDevice('layout', {
								overflowX: overflow,
							})
						}
					/>
					{!limitControls && (
						<BoxControl
							label={__('Padding')}
							values={{
								top: padding.top,
								right: padding.right,
								bottom: padding.bottom,
								left: padding.left,
							}}
							resetValues={{
								top: 0,
								right: 0,
								bottom: 0,
								left: 0,
							}}
							onChange={(value) =>
								updateAttributeForDevice('layout', {
									padding: {
										...padding,
										top: formatNum(value.top, 'integer'),
										right: formatNum(
											value.right,
											'integer'
										),
										bottom: formatNum(
											value.bottom,
											'integer'
										),
										left: formatNum(value.left, 'integer'),
									},
								})
							}
						/>
					)}
				</PanelBody>
				<ControlSections
					attributes={attributes}
					setAttributes={setAttributes}
					clientId={clientId}
					limitControls={limitControls}
					onPreviewAnimation={onPreviewAnimation}
					isPreviewingAnimation={isPreviewingAnimation}
					isDrawingMode={isDrawingMode}
					drawingTool={drawingTool}
					onDrawingModeChange={onDrawingModeChange}
					onToolChange={onToolChange}
					strokeColor={strokeColor}
					strokeWidth={strokeWidth}
					onStrokeColorChange={onStrokeColorChange}
					onStrokeWidthChange={onStrokeWidthChange}
					selectedDrawingId={selectedDrawingId}
					onSelectedDrawingChange={onSelectedDrawingChange}
				/>
			</InspectorControls>
			<ProductionControls
				attributes={attributes}
				setAttributes={setAttributes}
				clientId={clientId}
			/>
		</>
	);
}

export default ChartControls;
