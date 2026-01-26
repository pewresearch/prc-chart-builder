// V2
/* eslint-disable max-lines */
/* eslint-disable no-console */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-undef */
/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	SelectControl,
	RangeControl,
	BoxControl,
	ExternalLink,
	Button,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */
import { formatNum } from '../utils/helpers';
import { createPNG, createSVG } from '../utils/image-exports';
import { useViewportAttributes } from './use-viewport-attributes';
import BarControls from './bar-controls';
import ColorControls from './color-controls';
import IndependentAxisControls from './independent-axis-controls';
import DependentAxisControls from './dependent-axis-controls';
import DataControls from './data-controls';
import LineControls from './line-controls';
import LabelControls from './label-controls';
import LegendControls from './legend-controls';
import TooltipControls from './tooltip-controls';
import TextFieldControls from './text-field-controls';
import NodeControls from './node-controls';
import DivergingBarControls from './diverging-bar-control';
import DotPlotControls from './dot-plot-controls';
import PlotBandControls from './plot-band-controls';
import AnnotationControls from './annotation-controls';
import DiffColumnControls from './diff-column-controls';
import MapControls from './map-controls';
// EXPERIMENTAL: Drawing Tools - Commented out for now, not ready for production
// import DrawingControls from './drawing-controls';

function ControlSections(props) {
	const { attributes, limitControls, clientId } = props;
	if (limitControls) {
		return <TextFieldControls {...props} />;
	}
	const barTypes = ['bar', 'stacked-bar', 'diverging-bar', 'exploded-bar'];
	const lineTypes = ['line', 'area', 'stacked-area'];
	const nodeTypes = ['scatter', 'dot-plot'];

	// Access viewport-aware and non-viewport-aware attributes
	const io = attributes.io || {}; // io is not viewport-aware
	const layout = attributes.layout || {}; // Will use getCurrentValue in specific controls
	const diffColumn = attributes.diffColumn || {};

	const { type: chartType } = layout;
	const { chartFamily } = io;

	return (
		<>
			<TextFieldControls {...props} />
			<DataControls {...props} />
			<ColorControls {...props} />
			{'map' !== chartFamily && (
				<>
					<IndependentAxisControls {...props} />
					<DependentAxisControls {...props} />
				</>
			)}
			{'map' === chartFamily && <MapControls {...props} />}

			{barTypes.includes(chartType) && <BarControls {...props} />}
			{'diverging-bar' === chartType && (
				<DivergingBarControls {...props} />
			)}
			{lineTypes.includes(chartType) && (
				<>
					<PlotBandControls {...props} />
					<LineControls {...props} />
				</>
			)}
			{'dot-plot' === chartType && <DotPlotControls {...props} />}
			{nodeTypes.includes(chartType) ||
				(lineTypes.includes(chartType) && (
					<NodeControls {...props} chartType={chartType} />
				))}
			{diffColumn.active && <DiffColumnControls {...props} />}
			<AnnotationControls {...props} />
			<LabelControls {...props} />
			<TooltipControls {...props} />
			<LegendControls {...props} />
			{/* EXPERIMENTAL: Drawing Tools - Commented out for now, not ready for production */}
			{/* <DrawingControls {...props} /> */}
		</>
	);
}

function ChartControls({
	attributes,
	setAttributes,
	clientId,
	isDrawingMode,
	drawingTool,
	onDrawingModeChange,
	onToolChange,
	strokeColor,
	strokeWidth,
	onStrokeColorChange,
	onStrokeWidthChange,
}) {
	const [imageLoading, setImageLoading] = useState(false);
	const [svgLoading, setSVGLoading] = useState(false);
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
	const {
		chartFamily,
		pngUrl,
		allowDataDownload,
		isStaticChart,
		isFreeformChart,
	} = io;
	const limitControls = isFreeformChart || isStaticChart;

	// Use centralized image export utilities
	const handleCreateSvg = () => {
		setSVGLoading(true);
		createSVG({
			clientId,
			upload: false, // Just download
			onComplete: () => setSVGLoading(false),
			onError: () => setSVGLoading(false),
		});
	};

	const handleCreatePng = () => {
		setImageLoading(true);
		createPNG({
			clientId,
			onComplete: () => setImageLoading(false),
			onError: () => setImageLoading(false),
		});
	};

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
					('bar' === chartType || 'stacked-bar' === chartType) && (
						<SelectControl
							label={__('Chart Orientation (Bar charts only)')}
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
									right: formatNum(value.right, 'integer'),
									bottom: formatNum(value.bottom, 'integer'),
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
				isDrawingMode={isDrawingMode}
				drawingTool={drawingTool}
				onDrawingModeChange={onDrawingModeChange}
				onToolChange={onToolChange}
				strokeColor={strokeColor}
				strokeWidth={strokeWidth}
				onStrokeColorChange={onStrokeColorChange}
				onStrokeWidthChange={onStrokeWidthChange}
			/>
			<PanelBody title="Image and Data Exports" initialOpen={false}>
				<ToggleControl
					label={__('Allow user to download data')}
					checked={allowDataDownload}
					help={__(
						'If checked, a link to download a .csv of the table data will be displayed below the table and on the share tab.'
					)}
					onChange={() =>
						setAttributes({
							io: {
								...io,
								allowDataDownload: !allowDataDownload,
							},
						})
					}
				/>
				<PanelRow>
					<Button
						isSecondary
						isBusy={svgLoading}
						onClick={handleCreateSvg}
					>
						Download SVG
					</Button>
				</PanelRow>
				<PanelRow>
					<Button
						isSecondary
						isBusy={imageLoading}
						onClick={handleCreatePng}
					>
						Upload Chart PNG to Media Library
					</Button>
				</PanelRow>
				<PanelRow>
					{imageLoading && (
						<p>
							Creating image. This will take several moments ...
						</p>
					)}
					{svgLoading && <p>Preparing SVG ...</p>}
				</PanelRow>
				{pngUrl && 0 < pngUrl.length && (
					<>
						<PanelRow>
							<TextControl label={__('PNG URL')} value={pngUrl} />
						</PanelRow>
						<PanelRow>
							<ExternalLink href={pngUrl}>
								Preview Image
							</ExternalLink>
						</PanelRow>
					</>
				)}
			</PanelBody>
		</InspectorControls>
	);
}

export default ChartControls;
