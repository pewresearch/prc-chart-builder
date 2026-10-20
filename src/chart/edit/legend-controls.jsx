// V2
/* eslint-disable max-lines */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/components-no-missing-40px-size-prop */
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
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { chartTypeSupportsSeriesMask } from '@prc/charting-utilities';
import { __experimentalSpacingSizesControl as SpacingSizesControl } from '@wordpress/block-editor';
import {
	LINE_CHART_TYPES,
	VALUE_SCALE_CHART_TYPES,
	effectiveChartTypeForControls,
} from '../utils/chart-types';
import {
	getAvailableLegendCategories,
	isBubbleMapLegendMode,
} from '../utils/get-available-legend-categories';
import { formatNum } from '../utils/helpers';
import {
	isLegendCategoryOrderStale,
	mergeLegendCategoryOrder,
} from '../utils/merge-legend-category-order';
import ChartPanelColorSettings from './chart-panel-color-settings';
import { Help, PanelDescription, StyledLabel } from './control-ui';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { RichTextField } from './popover/panels/RichTextField';
import { FONT_WEIGHT_OPTIONS } from './popover/utils';
import Sorter from './sorter';

function LegendControls({ attributes, setAttributes, curated = false }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('legend');

	// Content attributes - NOT viewport-aware
	const io = attributes.io || {};
	const dataRender = attributes.dataRender || {};

	// Presentation attributes - viewport-aware
	const layout = getCurrentValue('layout') || {};
	const legend = getCurrentValue('legend') || {};

	const { type: chartType } = layout;
	const effectiveType = effectiveChartTypeForControls(attributes);
	const { chartFamily } = io;
	const { mapScale, mapStyle } = dataRender;
	const isBubbleMode = isBubbleMapLegendMode(chartType, mapStyle);
	const isLineFamilyChart = LINE_CHART_TYPES.includes(effectiveType);

	const availableLegendCategories = useMemo(
		() =>
			getAvailableLegendCategories({
				chartType,
				chartFamily: attributes.io?.chartFamily,
				io: attributes.io || {},
				dataRender: attributes.dataRender || {},
				divergingBar: attributes.divergingBar || {},
				sankey: attributes.sankey || {},
				smallMultiples: attributes.smallMultiples || {},
				legend: getCurrentValue('legend') || {},
			}),
		[
			chartType,
			attributes.io,
			attributes.dataRender,
			attributes.divergingBar,
			attributes.sankey,
			attributes.smallMultiples,
			getCurrentValue,
		]
	);

	const legendCategories = getCurrentValue('legend', 'categories');

	const legendOrderOptions = useMemo(() => {
		const merged = mergeLegendCategoryOrder(
			legendCategories,
			availableLegendCategories
		);
		return merged.map((c) => ({
			label: c,
			isHidden: false,
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

	// Hide legend order for threshold/linear value scales (maps and heat-map-table).
	const usesValueScaleChart =
		chartFamily === 'map' || VALUE_SCALE_CHART_TYPES.includes(chartType);
	const shouldShowLegendOrder =
		!usesValueScaleChart || (usesValueScaleChart && mapScale === 'ordinal');

	const legendActive = Boolean(getCurrentValue('legend', 'active'));
	return (
		<div ref={panelRef}>
			<PanelBody title={__('Legend')} opened={isOpen} onToggle={onToggle}>
				<VStack spacing={2}>
					<ToggleControl
						label="Legend Active"
						checked={legendActive}
						onChange={(newValue) =>
							updateAttributeForDevice('legend', {
								active: newValue,
							})
						}
					/>
				</VStack>
				{legendActive && (
					<VStack spacing={4}>
						{chartTypeSupportsSeriesMask(chartType) && (
							<VStack spacing={2}>
								<ToggleControl
									label="Click to hide series"
									checked={
										getCurrentValue(
											'legend',
											'clickToHide'
										) === true
									}
									onChange={(newValue) =>
										updateAttributeForDevice('legend', {
											clickToHide: newValue,
										})
									}
									help={__(
										'On the published chart, click a legend item to hide that series for this page view. Click again to show it. Editor clicks still customize legend items.'
									)}
								/>
							</VStack>
						)}
						<VStack spacing={2}>
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
							<VStack spacing={2}>
								<PanelDescription>
									<StyledLabel>
										Legend Positioning
									</StyledLabel>
								</PanelDescription>
							</VStack>
							<Flex>
								<FlexItem>
									<NumberControl
										label={__('DX')}
										value={getCurrentValue(
											'legend',
											'offsetX'
										)}
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
										value={getCurrentValue(
											'legend',
											'offsetY'
										)}
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
									Determines the position of legend relative
									to the chart container
								</Help>
							</PanelDescription>
						</VStack>
						{hasCustomLegendPosition && (
							<VStack spacing={2}>
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
							</VStack>
						)}
						{!curated && (
							<VStack spacing={2}>
								<RichTextField
									label={__('Legend Title')}
									value={getCurrentValue('legend', 'title')}
									onChange={(value) =>
										updateAttributeForDevice('legend', {
											title: value,
										})
									}
								/>
							</VStack>
						)}
						{isBubbleMode && (
							<VStack spacing={2}>
								<ToggleGroupControl
									__nextHasNoMarginBottom
									isBlock
									label={__('Layout')}
									value={
										getCurrentValue(
											'legend',
											'bubbleLegend'
										)?.layout ?? 'stacked'
									}
									onChange={(value) => {
										const legendAttr =
											getCurrentValue('legend') || {};
										updateAttributeForDevice('legend', {
											bubbleLegend: {
												...(legendAttr.bubbleLegend ||
													{}),
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
										getCurrentValue(
											'legend',
											'bubbleLegend'
										)?.labelPosition ?? 'outside'
									}
									onChange={(value) => {
										const legendAttr =
											getCurrentValue('legend') || {};
										updateAttributeForDevice('legend', {
											bubbleLegend: {
												...(legendAttr.bubbleLegend ||
													{}),
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
										getCurrentValue(
											'legend',
											'bubbleLegend'
										)?.fill ?? 'none'
									}
									onChange={(value) => {
										const legendAttr =
											getCurrentValue('legend') || {};
										updateAttributeForDevice('legend', {
											bubbleLegend: {
												...(legendAttr.bubbleLegend ||
													{}),
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
										getCurrentValue(
											'legend',
											'bubbleLegend'
										)?.refValues || []
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
												...(legendAttr.bubbleLegend ||
													{}),
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
							</VStack>
						)}
						{!isBubbleMode &&
							shouldShowLegendOrder &&
							legendOrderOptions.length > 0 && (
								<VStack spacing={2}>
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
												updateAttributeForDevice(
													'legend',
													{
														categories:
															updates.legend
																.categories,
													}
												);
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
								</VStack>
							)}
						{!isBubbleMode && isLineFamilyChart && (
							<VStack spacing={2}>
								<ToggleGroupControl
									isBlock
									label={__('Legend Layout')}
									value={
										getCurrentValue(
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
							</VStack>
						)}
						{!isBubbleMode && !isLineFamilyChart && (
							<VStack spacing={2}>
								<ToggleGroupControl
									isBlock
									label={__('Legend Layout')}
									value={
										getCurrentValue(
											'legend',
											'variation'
										) === 'direct'
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
							</VStack>
						)}
						{!isBubbleMode && (
							<VStack spacing={2}>
								<SelectControl
									label={__('Orientation')}
									value={getCurrentValue(
										'legend',
										'orientation'
									)}
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
							</VStack>
						)}
						{!isBubbleMode && (
							<VStack spacing={2}>
								<SelectControl
									label={__('Marker Style')}
									value={getCurrentValue(
										'legend',
										'markerStyle'
									)}
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
							</VStack>
						)}
						{!isBubbleMode &&
							getCurrentValue('legend', 'markerStyle') !==
								'none' &&
							getCurrentValue('legend', 'markerStyle') !==
								'label' && (
								<VStack spacing={2}>
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
								</VStack>
							)}
						{!curated && (
							<>
								<VStack spacing={2}>
									<ToggleGroupControl
										__nextHasNoMarginBottom
										isBlock
										value={getCurrentValue(
											'legend',
											'fontSize'
										)}
										label={__('Legend Font Size')}
										onChange={(value) => {
											updateAttributeForDevice('legend', {
												fontSize: formatNum(
													value,
													'integer'
												),
											});
										}}
									>
										<ToggleGroupControlOption
											label="10px"
											value={10}
										/>
										<ToggleGroupControlOption
											label="12px"
											value={12}
										/>
										<ToggleGroupControlOption
											label="14px"
											value={14}
										/>
										<ToggleGroupControlOption
											label="16px"
											value={16}
										/>
									</ToggleGroupControl>
									<PanelDescription>
										<Help>
											{__(
												'Select the font size for legend text. Default is 12px.'
											)}
										</Help>
									</PanelDescription>
								</VStack>
								<VStack spacing={2}>
									<SelectControl
										label={__('Font Weight')}
										value={
											getCurrentValue(
												'legend',
												'fontWeight'
											) || 'normal'
										}
										options={[...FONT_WEIGHT_OPTIONS]}
										onChange={(value) =>
											updateAttributeForDevice('legend', {
												fontWeight: value,
											})
										}
									/>
								</VStack>
								<VStack spacing={2}>
									<SpacingSizesControl
										label={__('Legend Margin')}
										values={{
											top: getCurrentValue(
												'legend',
												'margin'
											)?.top
												? `${getCurrentValue('legend', 'margin').top}px`
												: '0px',
											right: getCurrentValue(
												'legend',
												'margin'
											)?.right
												? `${getCurrentValue('legend', 'margin').right}px`
												: '0px',
											bottom: getCurrentValue(
												'legend',
												'margin'
											)?.bottom
												? `${getCurrentValue('legend', 'margin').bottom}px`
												: '0px',
											left: getCurrentValue(
												'legend',
												'margin'
											)?.left
												? `${getCurrentValue('legend', 'margin').left}px`
												: '0px',
										}}
										onChange={(value) => {
											// Parse string values like '12px' to numbers like 12
											const parsedValue = {
												top: parseInt(
													value?.top || '0',
													10
												),
												right: parseInt(
													value?.right || '0',
													10
												),
												bottom: parseInt(
													value?.bottom || '0',
													10
												),
												left: parseInt(
													value?.left || '0',
													10
												),
											};
											updateAttributeForDevice('legend', {
												margin: parsedValue,
											});
										}}
										sides={[
											'top',
											'right',
											'bottom',
											'left',
										]}
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
								</VStack>
								<VStack spacing={2}>
									<ChartPanelColorSettings
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
													updateAttributeForDevice(
														'legend',
														{
															borderStroke:
																value ?? '',
														}
													),
												label: __('Stroke'),
												contrast: false,
											},
											{
												value: getCurrentValue(
													'legend',
													'fill'
												),
												onChange: (value) =>
													updateAttributeForDevice(
														'legend',
														{
															fill: value ?? '',
														}
													),
												label: __('Fill'),
												contrast: false,
											},
										]}
									/>
								</VStack>
							</>
						)}
						{!isBubbleMode &&
							'map' === chartFamily &&
							'threshold' === mapScale && (
								<VStack spacing={2}>
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
								</VStack>
							)}
					</VStack>
				)}
			</PanelBody>
		</div>
	);
}

export default LegendControls;
