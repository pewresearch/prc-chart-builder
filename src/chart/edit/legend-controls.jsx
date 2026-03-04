// V2
/* eslint-disable max-lines */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable max-lines-per-function */
/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	SelectControl,
	Flex,
	FlexItem,
	Button,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import {
	PanelColorSettings,
	__experimentalSpacingSizesControl as SpacingSizesControl,
} from '@wordpress/block-editor';
import { formatNum } from '../utils/helpers';
import { POINT_CHART_TYPES } from '../utils/chart-types';
import Sorter from './sorter';
import { useViewportAttributes } from './use-viewport-attributes';

const PanelDescription = styled.div`
	grid-column: span 2;
`;
const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

const StyledLabel = styled.div`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
	display: inline-block;
	margin-bottom: calc(8px) !important;
	padding: 0px;
`;
const Help = styled.div`
	margin-top: calc(8px);
	font-size: 12px;
	font-style: normal;
	color: rgb(117, 117, 117);
	margin-bottom: 0px;
`;

function LegendControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const legend = getCurrentValue('legend') || {};
	// Content attributes - NOT viewport-aware
	const io = attributes.io || {};
	const dataRender = attributes.dataRender || {};

	// Presentation attributes - viewport-aware
	const layout = getCurrentValue('layout') || {};
	const divergingBar = attributes.divergingBar || {};

	const { type: chartType } = layout;
	const { chartFamily, availableCategories } = io;
	const { mapScale, mapScaleDomain, categories: dataCategories } = dataRender;
	const { neutralBar } = divergingBar;
	const isPointBasedChart = POINT_CHART_TYPES.includes(chartType);

	// Determine available legend categories based on chart type.
	// Point-based charts (scatter, bee-swarm, bubble) with a groupBreaksCategory set
	// derive their legend items from the unique values of that column.
	const availableLegendCategories = useMemo(() => {
		const cat =
			dataCategories?.length > 0 ? dataCategories : availableCategories;
		if (chartType === 'diverging-bar') {
			const divergingCategories = neutralBar.active
				? [
						...divergingBar.negativeCategories,
						...divergingBar.positiveCategories,
						neutralBar.category,
					]
				: [
						...divergingBar.negativeCategories,
						...divergingBar.positiveCategories,
					];
			return divergingCategories;
		}
		if (chartFamily === 'map' && mapScale === 'ordinal') {
			return mapScaleDomain;
		}
		if (isPointBasedChart && dataRender.groupBreaksCategory) {
			const chartData = io.chartData || [];
			const groupValues = [
				...new Set(
					chartData
						.map((d) => d[dataRender.groupBreaksCategory])
						.filter(
							(v) => v !== null && v !== undefined && v !== ''
						)
				),
			];
			return groupValues;
		}
		return cat;
	}, [
		chartType,
		chartFamily,
		mapScale,
		dataCategories,
		availableCategories,
		divergingBar,
		mapScaleDomain,
		dataRender.groupBreaksCategory,
		io.chartData,
		isPointBasedChart,
	]);

	// Create options for the Sorter
	// Use categories if it exists and matches available categories, otherwise use available categories
	const legendCategories = getCurrentValue('legend', 'categories');
	const legendOrderOptions = useMemo(() => {
		// If legendCategories exists and contains the same items as available categories, use it
		// (respects custom drag order the user has set, including for point-based charts)
		if (
			legendCategories &&
			legendCategories.length > 0 &&
			legendCategories.length === availableLegendCategories.length
		) {
			const sortedLegend = [...legendCategories].sort();
			const sortedAvailable = [...availableLegendCategories].sort();
			if (
				JSON.stringify(sortedLegend) === JSON.stringify(sortedAvailable)
			) {
				// Same items, use custom order
				return legendCategories.map((c) => ({
					label: c,
					disabled: false,
				}));
			}
		}
		// Otherwise use available categories in their default order
		return availableLegendCategories.map((c) => ({
			label: c,
			disabled: false,
		}));
	}, [legendCategories, availableLegendCategories]);

	// Check if legend has custom position (non-default offsets)
	const hasCustomLegendPosition =
		getCurrentValue('legend', 'offsetX') !== 0 ||
		getCurrentValue('legend', 'offsetY') !== 0 ||
		getCurrentValue('legend', 'alignment') === 'none';

	// Reset legend to default position
	const handleResetLegendPosition = () => {
		updateAttributeForDevice('legend', {
			offsetX: 0,
			offsetY: 0,
			alignment: 'flex-start',
		});
	};

	// Determine if Legend Order control should be visible
	// Hide for maps with threshold or linear scale (they don't use ordinal legends)
	const shouldShowLegendOrder =
		chartFamily !== 'map' ||
		(chartFamily === 'map' && mapScale === 'ordinal');

	return (
		<PanelBody title={__('Legend')} initialOpen={false}>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<ToolsPanelItem
					hasValue={() => true}
					label={__('Legend Active')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label="Legend Active"
						checked={getCurrentValue('legend', 'active')}
						onChange={(newValue) =>
							updateAttributeForDevice('legend', {
								active: newValue,
							})
						}
					/>
				</ToolsPanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Positioning')}
					panelId={clientId}
				>
					<PanelDescription>
						<StyledLabel>Legend Positioning</StyledLabel>
					</PanelDescription>
					<ToggleGroupControl
						isBlock
						label="Legend Alignment"
						value={getCurrentValue('legend', 'alignment')}
						onChange={(type) => {
							updateAttributeForDevice('legend', {
								alignment: type,
							});
						}}
					>
						<ToggleGroupControlOption
							label="Start"
							value="flex-start"
						/>
						<ToggleGroupControlOption
							label="Center"
							value="center"
						/>
						<ToggleGroupControlOption
							label="End"
							value="flex-end"
						/>
						<ToggleGroupControlOption label="None" value="none" />
					</ToggleGroupControl>
					<Flex>
						<FlexItem>
							<NumberControl
								label={__('DX')}
								value={getCurrentValue('legend', 'offsetX')}
								onChange={(value) =>
									updateAttributeForDevice('legend', {
										offsetX: formatNum(value, 'integer'),
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('DY')}
								value={getCurrentValue('legend', 'offsetY')}
								onChange={(value) =>
									updateAttributeForDevice('legend', {
										offsetY: formatNum(value, 'integer'),
									})
								}
							/>
						</FlexItem>
					</Flex>
					<PanelDescription>
						<Help>
							Determines the position of legend relative to the
							chart container
						</Help>
					</PanelDescription>
				</WidePanelItem>
				{hasCustomLegendPosition && (
					<WidePanelItem
						hasValue={() => hasCustomLegendPosition}
						label={__('Reset Position')}
						panelId={clientId}
					>
						<Button
							variant="secondary"
							isDestructive
							onClick={handleResetLegendPosition}
						>
							{__('Reset Legend Position')}
						</Button>
						<PanelDescription>
							<Help>
								{__(
									'Reset legend to default position and alignment.'
								)}
							</Help>
						</PanelDescription>
					</WidePanelItem>
				)}
				<WidePanelItem
					hasValue={() => true}
					label={__('Title')}
					panelId={clientId}
				>
					<TextControl
						label={__('Legend Title')}
						value={getCurrentValue('legend', 'title')}
						onChange={(value) =>
							updateAttributeForDevice('legend', { title: value })
						}
					/>
				</WidePanelItem>
				{shouldShowLegendOrder && legendOrderOptions.length > 0 && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Legend Order')}
						panelId={clientId}
					>
						<PanelDescription>
							<StyledLabel>Legend Order</StyledLabel>
						</PanelDescription>
						<Sorter
							options={legendOrderOptions}
							setAttributes={(updates) => {
								// Sorter calls setAttributes with { legend: { ...legend, categories: [...] } }
								// Extract categories and use updateAttributeForDevice
								if (
									updates.legend &&
									updates.legend.categories
								) {
									updateAttributeForDevice('legend', {
										categories: updates.legend.categories,
									});
								}
							}}
							attribute="categories"
							parentObject="legend"
							parentObjectValue={legend}
							allowDisabled={false}
						/>
						<PanelDescription>
							<Help>
								{__(
									'Drag to rearrange the order in which legend items appear. This order is independent of the data order set in Data Controls.'
								)}
							</Help>
						</PanelDescription>
					</WidePanelItem>
				)}
				<WidePanelItem
					hasValue={() => true}
					label={__('Orientation')}
					panelId={clientId}
				>
					<SelectControl
						label={__('Orientation')}
						value={getCurrentValue('legend', 'orientation')}
						options={[
							{
								value: 'row',
								label: 'Row',
							},
							{
								value: 'column',
								label: 'Column',
							},
							{
								value: 'row-reverse',
								label: 'Row reverse',
							},
							{
								value: 'column-reverse',
								label: 'Column reverse',
							},
						]}
						onChange={(type) => {
							updateAttributeForDevice('legend', {
								orientation: type,
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Marker Style')}
					panelId={clientId}
				>
					<SelectControl
						label={__('Marker Style')}
						value={getCurrentValue('legend', 'markerStyle')}
						options={[
							{
								value: 'rect',
								label: 'Square',
							},
							{
								value: 'circle',
								label: 'Circle',
							},
							{
								value: 'line',
								label: 'Line',
							},
						]}
						onChange={(type) => {
							updateAttributeForDevice('legend', {
								markerStyle: type,
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => getCurrentValue('legend', 'fontSize')}
					label={__('Font Size')}
					panelId={clientId}
				>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						value={getCurrentValue('legend', 'fontSize')}
						label={__('Legend Font Size')}
						onChange={(value) => {
							updateAttributeForDevice('legend', {
								fontSize: formatNum(value, 'integer'),
							});
						}}
					>
						<ToggleGroupControlOption label="10px" value={10} />
						<ToggleGroupControlOption label="12px" value={12} />
						<ToggleGroupControlOption label="14px" value={14} />
						<ToggleGroupControlOption label="16px" value={16} />
					</ToggleGroupControl>
					<PanelDescription>
						<Help>
							{__(
								'Select the font size for legend text. Default is 12px.'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Margin')}
					panelId={clientId}
				>
					<SpacingSizesControl
						label={__('Legend Margin')}
						values={{
							top: getCurrentValue('legend', 'margin')?.top
								? `${getCurrentValue('legend', 'margin').top}px`
								: '0px',
							right: getCurrentValue('legend', 'margin')?.right
								? `${getCurrentValue('legend', 'margin').right}px`
								: '0px',
							bottom: getCurrentValue('legend', 'margin')?.bottom
								? `${getCurrentValue('legend', 'margin').bottom}px`
								: '0px',
							left: getCurrentValue('legend', 'margin')?.left
								? `${getCurrentValue('legend', 'margin').left}px`
								: '0px',
						}}
						onChange={(value) => {
							// Parse string values like '12px' to numbers like 12
							const parsedValue = {
								top: parseInt(value?.top || '0', 10),
								right: parseInt(value?.right || '0', 10),
								bottom: parseInt(value?.bottom || '0', 10),
								left: parseInt(value?.left || '0', 10),
							};
							updateAttributeForDevice('legend', {
								margin: parsedValue,
							});
						}}
						sides={['top', 'right', 'bottom', 'left']}
						units={[{ label: 'px' }]}
						allowReset={true}
					/>
					<PanelDescription>
						<Help>
							{__(
								'Spacing in pixels between legend items. Default: 0px 5px 0px 0px'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Fill and Stroke')}
					panelId={clientId}
				>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Fill and Stroke')}
						style={{
							paddingLeft: '0',
							paddingRight: '0',
						}}
						colorSettings={[
							{
								value: getCurrentValue(
									'legend',
									'borderStroke'
								),
								onChange: (value) =>
									updateAttributeForDevice('legend', {
										borderStroke: value ?? '',
									}),
								label: __('Stroke'),
							},
							{
								value: getCurrentValue('legend', 'fill'),
								onChange: (value) =>
									updateAttributeForDevice('legend', {
										fill: value ?? '',
									}),
								label: __('Fill'),
							},
						]}
					/>
				</WidePanelItem>
				{'map' === chartFamily && 'threshold' === mapScale && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Threshold language')}
						panelId={clientId}
					>
						<PanelDescription>
							<StyledLabel>Threshold langauge</StyledLabel>
						</PanelDescription>
						<TextControl
							label={__('Lower label')}
							value={getCurrentValue('legend', 'labelLower')}
							onChange={(value) => {
								updateAttributeForDevice('legend', {
									labelLower: value,
								});
							}}
						/>
						<TextControl
							label={__('Label delimiter')}
							value={getCurrentValue('legend', 'labelDelimiter')}
							onChange={(value) =>
								updateAttributeForDevice('legend', {
									labelDelimiter: value,
								})
							}
						/>
						<TextControl
							label={__('Upper label')}
							value={getCurrentValue('legend', 'labelUpper')}
							onChange={(value) =>
								updateAttributeForDevice('legend', {
									labelUpper: value,
								})
							}
						/>
					</WidePanelItem>
				)}
			</ToolsPanel>
		</PanelBody>
	);
}

export default LegendControls;
