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
import {
	Button,
	Flex,
	FlexItem,
	FormTokenField,
	__experimentalNumberControl as NumberControl,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	PanelColorSettings,
	__experimentalSpacingSizesControl as SpacingSizesControl,
} from '@wordpress/block-editor';
import {
	getAvailableLegendCategories,
	isBubbleMapLegendMode,
} from '../utils/get-available-legend-categories';
import { LINE_CHART_TYPES } from '../utils/chart-types';
import { formatNum } from '../utils/helpers';
import {
	isLegendCategoryOrderStale,
	mergeLegendCategoryOrder,
} from '../utils/merge-legend-category-order';
import { useFocusedPanel } from './inspector-focus-context';
import { FONT_WEIGHT_OPTIONS } from './popover/utils';
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
	const { isOpen, panelRef, onToggle } = useFocusedPanel('legend');

	const legend = getCurrentValue('legend') || {};
	// Content attributes - NOT viewport-aware
	const io = attributes.io || {};
	const dataRender = attributes.dataRender || {};
	const sankey = attributes.sankey || {};

	// Presentation attributes - viewport-aware
	const layout = getCurrentValue('layout') || {};
	const divergingBar = attributes.divergingBar || {};

	const { type: chartType } = layout;
	const { chartFamily } = io;
	const { mapScale, mapStyle } = dataRender;
	const isBubbleMode = isBubbleMapLegendMode(chartType, mapStyle);
	const isLineFamilyChart = LINE_CHART_TYPES.includes(chartType);

	const availableLegendCategories = useMemo(
		() =>
			getAvailableLegendCategories({
				chartType,
				chartFamily,
				io,
				dataRender,
				divergingBar,
				sankey,
			}),
		[chartType, chartFamily, io, dataRender, divergingBar, sankey]
	);

	const legendCategories = getCurrentValue('legend', 'categories');

	const legendOrderOptions = useMemo(() => {
		const merged = mergeLegendCategoryOrder(
			legendCategories,
			availableLegendCategories
		);
		return merged.map((c) => ({
			label: c,
			disabled: false,
		}));
	}, [legendCategories, availableLegendCategories]);

	// Keep persisted legend.categories in sync when available categories change
	// (e.g. neutral column or secondary overlay toggled on/off).
	useEffect(() => {
		if (
			!isLegendCategoryOrderStale(
				legendCategories,
				availableLegendCategories
			)
		) {
			return;
		}

		updateAttributeForDevice('legend', {
			categories: mergeLegendCategoryOrder(
				legendCategories,
				availableLegendCategories
			),
		});
	}, [legendCategories, availableLegendCategories, updateAttributeForDevice]);

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
		<div ref={panelRef}>
			<PanelBody title={__('Legend')} opened={isOpen} onToggle={onToggle}>
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
							<ToggleGroupControlOption
								label="None"
								value="none"
							/>
						</ToggleGroupControl>
						<Flex>
							<FlexItem>
								<NumberControl
									label={__('DX')}
									value={getCurrentValue('legend', 'offsetX')}
									onChange={(value) =>
										updateAttributeForDevice('legend', {
											offsetX: formatNum(
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
									value={getCurrentValue('legend', 'offsetY')}
									onChange={(value) =>
										updateAttributeForDevice('legend', {
											offsetY: formatNum(
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
								Determines the position of legend relative to
								the chart container
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
								updateAttributeForDevice('legend', {
									title: value,
								})
							}
						/>
					</WidePanelItem>
					{isBubbleMode && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Bubble Legend')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleGroupControl
								__nextHasNoMarginBottom
								isBlock
								label={__('Layout')}
								value={
									getCurrentValue('legend', 'bubbleLegend')
										?.layout ?? 'stacked'
								}
								onChange={(value) => {
									const legendAttr =
										getCurrentValue('legend') || {};
									updateAttributeForDevice('legend', {
										bubbleLegend: {
											...(legendAttr.bubbleLegend || {}),
											layout: value,
										},
									});
								}}
							>
								<ToggleGroupControlOption
									label={__('Stacked')}
									value="stacked"
								/>
								<ToggleGroupControlOption
									label={__('Spread')}
									value="spread"
								/>
							</ToggleGroupControl>
							<PanelDescription>
								<Help>
									{__(
										'Stacked: nested concentric circles sharing a baseline. Spread: side-by-side circles with labels below.'
									)}
								</Help>
							</PanelDescription>
							<ToggleGroupControl
								__nextHasNoMarginBottom
								isBlock
								label={__('Label Position')}
								value={
									getCurrentValue('legend', 'bubbleLegend')
										?.labelPosition ?? 'outside'
								}
								onChange={(value) => {
									const legendAttr =
										getCurrentValue('legend') || {};
									updateAttributeForDevice('legend', {
										bubbleLegend: {
											...(legendAttr.bubbleLegend || {}),
											labelPosition: value,
										},
									});
								}}
							>
								<ToggleGroupControlOption
									label={__('Outside')}
									value="outside"
								/>
								<ToggleGroupControlOption
									label={__('Inside')}
									value="inside"
								/>
							</ToggleGroupControl>
							<PanelDescription>
								<Help>
									{__(
										'Outside (default): labels render above each ring (stacked) or below the circles (spread). Inside: labels sit just inside the top edge of each circle.'
									)}
								</Help>
							</PanelDescription>
							<SelectControl
								label={__('Circle Fill')}
								value={
									getCurrentValue('legend', 'bubbleLegend')
										?.fill ?? 'category'
								}
								onChange={(value) => {
									const legendAttr =
										getCurrentValue('legend') || {};
									updateAttributeForDevice('legend', {
										bubbleLegend: {
											...(legendAttr.bubbleLegend || {}),
											fill: value,
										},
									});
								}}
								options={[
									{
										value: 'category',
										label: __('Category color'),
									},
									{
										value: 'none',
										label: __('Outline only'),
									},
								]}
							/>
							<FormTokenField
								label={__('Reference values')}
								value={
									getCurrentValue('legend', 'bubbleLegend')
										?.refValues || []
								}
								onChange={(values) => {
									const cleaned = values
										.map((v) => parseFloat(v))
										.filter((v) => !isNaN(v))
										.sort((a, b) => a - b);
									const legendAttr =
										getCurrentValue('legend') || {};
									updateAttributeForDevice('legend', {
										bubbleLegend: {
											...(legendAttr.bubbleLegend || {}),
											refValues: cleaned,
										},
									});
								}}
							/>
							<PanelDescription>
								<Help>
									{__(
										'Leave empty to auto-compute three reference values (25%, 50%, 100% of max).'
									)}
								</Help>
							</PanelDescription>
						</WidePanelItem>
					)}
					{!isBubbleMode &&
						shouldShowLegendOrder &&
						legendOrderOptions.length > 0 && (
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
												categories:
													updates.legend.categories,
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
					{!isBubbleMode && isLineFamilyChart && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Layout')}
							panelId={clientId}
						>
							<ToggleGroupControl
								isBlock
								label={__('Legend Layout')}
								value={
									getCurrentValue('legend', 'variation') ||
									'grouped'
								}
								onChange={(value) =>
									updateAttributeForDevice('legend', {
										variation: value,
									})
								}
							>
								<ToggleGroupControlOption
									label={__('Grouped')}
									value="grouped"
								/>
								<ToggleGroupControlOption
									label={__('Detached')}
									value="detached"
								/>
								<ToggleGroupControlOption
									label={__('Direct')}
									value="direct"
								/>
							</ToggleGroupControl>
							<PanelDescription>
								<Help>
									{__(
										'Grouped: all items in one legend block. Detached: each item floats independently. Direct: series names render on their lines (line, area, and stacked area charts) with automatic overlap prevention.'
									)}
								</Help>
							</PanelDescription>
						</WidePanelItem>
					)}
					{!isBubbleMode && !isLineFamilyChart && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Layout')}
							panelId={clientId}
						>
							<ToggleGroupControl
								isBlock
								label={__('Legend Layout')}
								value={
									getCurrentValue('legend', 'variation') ===
									'direct'
										? 'grouped'
										: getCurrentValue(
												'legend',
												'variation'
											) || 'grouped'
								}
								onChange={(value) =>
									updateAttributeForDevice('legend', {
										variation: value,
									})
								}
							>
								<ToggleGroupControlOption
									label={__('Grouped')}
									value="grouped"
								/>
								<ToggleGroupControlOption
									label={__('Detached')}
									value="detached"
								/>
							</ToggleGroupControl>
							<PanelDescription>
								<Help>
									{__(
										'Grouped: all items render together in one legend block. Detached: each item floats independently on the chart — position by dragging or via the per-item popover.'
									)}
								</Help>
							</PanelDescription>
						</WidePanelItem>
					)}
					{!isBubbleMode && (
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
					)}
					{!isBubbleMode && (
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
									{
										value: 'none',
										label: 'None',
									},
									{
										value: 'label',
										label: 'Category Color',
									},
								]}
								onChange={(type) => {
									updateAttributeForDevice('legend', {
										markerStyle: type,
									});
								}}
							/>
						</WidePanelItem>
					)}
					{!isBubbleMode &&
						getCurrentValue('legend', 'markerStyle') !== 'none' &&
						getCurrentValue('legend', 'markerStyle') !==
							'label' && (
							<WidePanelItem
								hasValue={() => true}
								label={__('Marker Fill')}
								panelId={clientId}
							>
								<ToggleGroupControl
									__nextHasNoMarginBottom
									isBlock
									label={__('Marker Fill')}
									value={
										getCurrentValue(
											'legend',
											'markerFill'
										) || 'solid'
									}
									onChange={(value) => {
										updateAttributeForDevice('legend', {
											markerFill: value,
										});
									}}
								>
									<ToggleGroupControlOption
										label={__('Solid')}
										value="solid"
									/>
									<ToggleGroupControlOption
										label={__('Outline')}
										value="outline"
									/>
								</ToggleGroupControl>
								<PanelDescription>
									<Help>
										{__(
											'Render markers as solid fills or stroked outlines (3px stroke).'
										)}
									</Help>
								</PanelDescription>
							</WidePanelItem>
						)}
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
						label={__('Font Weight')}
						panelId={clientId}
					>
						<SelectControl
							label={__('Font Weight')}
							value={
								getCurrentValue('legend', 'fontWeight') ||
								'normal'
							}
							options={[...FONT_WEIGHT_OPTIONS]}
							onChange={(value) =>
								updateAttributeForDevice('legend', {
									fontWeight: value,
								})
							}
						/>
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
								right: getCurrentValue('legend', 'margin')
									?.right
									? `${getCurrentValue('legend', 'margin').right}px`
									: '0px',
								bottom: getCurrentValue('legend', 'margin')
									?.bottom
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
					{!isBubbleMode &&
						'map' === chartFamily &&
						'threshold' === mapScale && (
							<WidePanelItem
								hasValue={() => true}
								label={__('Threshold language')}
								isShownByDefault
								panelId={clientId}
							>
								<PanelDescription>
									<StyledLabel>
										{__('Threshold language')}
									</StyledLabel>
								</PanelDescription>
								<TextControl
									label={__('Lower label')}
									value={getCurrentValue(
										'legend',
										'labelLower'
									)}
									onChange={(value) => {
										updateAttributeForDevice('legend', {
											labelLower: value,
										});
									}}
								/>
								<TextControl
									label={__('Label delimiter')}
									value={getCurrentValue(
										'legend',
										'labelDelimiter'
									)}
									onChange={(value) =>
										updateAttributeForDevice('legend', {
											labelDelimiter: value,
										})
									}
								/>
								<TextControl
									label={__('Upper label')}
									value={getCurrentValue(
										'legend',
										'labelUpper'
									)}
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
		</div>
	);
}

export default LegendControls;
