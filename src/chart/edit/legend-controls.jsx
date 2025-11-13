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
import Sorter from './sorter';

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
	const {
		legendActive,
		legendOrientation,
		legendTitle,
		legendOffsetX,
		legendOffsetY,
		legendAlignment,
		legendMarkerStyle,
		legendBorderStroke,
		legendFill,
		legendLabelDelimiter,
		legendLabelLower,
		legendLabelUpper,
		legendFontSize,
		legendMargin,
		legendCategories,
		mapScale,
		mapScaleDomain,
		chartType,
		chartFamily,
		neutralBarActive,
		positiveCategories,
		negativeCategories,
		neutralCategory,
		categories,
		availableCategories,
	} = attributes;

	// Determine available legend categories based on chart type
	// This is the source of truth for what categories exist in the data
	const availableLegendCategories = useMemo(() => {
		const cat = categories?.length > 0 ? categories : availableCategories;
		if (chartType === 'diverging-bar') {
			const divergingCategories = neutralBarActive
				? [
						...negativeCategories,
						...positiveCategories,
						neutralCategory,
					]
				: [...negativeCategories, ...positiveCategories];
			return divergingCategories;
		}
		if (chartFamily === 'map' && mapScale === 'ordinal') {
			return mapScaleDomain;
		}
		return cat;
	}, [
		chartType,
		chartFamily,
		mapScale,
		categories,
		availableCategories,
		negativeCategories,
		positiveCategories,
		neutralCategory,
		neutralBarActive,
		mapScaleDomain,
	]);

	// Create options for the Sorter
	// Use legendCategories if it exists and matches available categories, otherwise use available categories
	const legendOrderOptions = useMemo(() => {
		// If legendCategories exists and contains the same items as available categories, use it
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
		legendOffsetX !== 0 ||
		legendOffsetY !== 0 ||
		legendAlignment === 'none';

	// Reset legend to default position
	const handleResetLegendPosition = () => {
		setAttributes({
			legendOffsetX: 0,
			legendOffsetY: 0,
			legendAlignment: 'flex-start',
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
						checked={legendActive}
						onChange={() =>
							setAttributes({ legendActive: !legendActive })
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
						value={legendAlignment}
						onChange={(type) => {
							setAttributes({
								legendAlignment: type,
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
								value={legendOffsetX}
								onChange={(value) =>
									setAttributes({
										legendOffsetX: formatNum(
											value,
											'integer'
										),
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('DY')}
								value={legendOffsetY}
								onChange={(value) =>
									setAttributes({
										legendOffsetY: formatNum(
											value,
											'integer'
										),
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
						value={legendTitle}
						onChange={(value) =>
							setAttributes({ legendTitle: value })
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
							setAttributes={setAttributes}
							attribute="legendCategories"
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
						value={legendOrientation}
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
							setAttributes({
								legendOrientation: type,
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
						value={legendMarkerStyle}
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
							setAttributes({
								legendMarkerStyle: type,
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => legendFontSize}
					label={__('Font Size')}
					panelId={clientId}
				>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						value={legendFontSize}
						label={__('Legend Font Size')}
						onChange={(value) => {
							setAttributes({
								legendFontSize: formatNum(value, 'integer'),
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
							top: legendMargin?.top
								? `${legendMargin.top}px`
								: '0px',
							right: legendMargin?.right
								? `${legendMargin.right}px`
								: '0px',
							bottom: legendMargin?.bottom
								? `${legendMargin.bottom}px`
								: '0px',
							left: legendMargin?.left
								? `${legendMargin.left}px`
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
							setAttributes({ legendMargin: parsedValue });
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
								value: legendBorderStroke,
								onChange: (value) =>
									setAttributes({
										legendBorderStroke: value,
									}),
								label: __('Stroke'),
							},
							{
								value: legendFill,
								onChange: (value) =>
									setAttributes({ legendFill: value }),
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
							value={legendLabelLower}
							onChange={(value) => {
								setAttributes({ legendLabelLower: value });
							}}
						/>
						<TextControl
							label={__('Label delimiter')}
							value={legendLabelDelimiter}
							onChange={(value) =>
								setAttributes({ legendLabelDelimiter: value })
							}
						/>
						<TextControl
							label={__('Upper label')}
							value={legendLabelUpper}
							onChange={(value) =>
								setAttributes({ legendLabelUpper: value })
							}
						/>
					</WidePanelItem>
				)}
			</ToolsPanel>
		</PanelBody>
	);
}

export default LegendControls;
