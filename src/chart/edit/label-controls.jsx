/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * WordPress dependencies
 */
import {
	Button,
	Flex,
	FlexItem,
	__experimentalNumberControl as NumberControl,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	BAR_CHART_TYPES,
	LINE_CHART_TYPES,
	effectiveChartTypeForControls,
} from '../utils/chart-types';
import { formatNum, formatOptionalNum } from '../utils/helpers';
import { Help, PanelDescription, StyledLabel } from './control-ui';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { POSITION_DISABLED_CHART_TYPES } from './popover/utils';

function LabelControls({ attributes, setAttributes, curated = false }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('labels');

	const layoutObj = getCurrentValue('layout') || {};
	const { type: layoutType } = layoutObj;
	const chartType = effectiveChartTypeForControls({
		layout: layoutObj,
		smallMultiples: attributes.smallMultiples,
	});
	const positionDisabled = POSITION_DISABLED_CHART_TYPES.includes(layoutType);
	// Content attribute - NOT viewport-aware
	const currentIo = attributes.io || {};
	const chartData = currentIo.chartData || [];

	// Get viewport-aware custom positions
	const customPositions = getCurrentValue('labels', 'customPositions') || {};

	// Check if any custom label positions exist
	// Check both: new customPositions attribute AND legacy __labelPositions in chartData
	const hasCustomPositions =
		Object.keys(customPositions).length > 0 ||
		chartData?.some(
			(d) =>
				d.__labelPositions && Object.keys(d.__labelPositions).length > 0
		);

	// Reset all custom label positions for current viewport
	const handleResetLabelPositions = () => {
		// Clear the viewport-aware customPositions
		updateAttributeForDevice('labels', {
			customPositions: {},
		});
	};
	const labelsActive = Boolean(getCurrentValue('labels', 'active'));
	return (
		<div ref={panelRef}>
			<PanelBody title={__('Labels')} opened={isOpen} onToggle={onToggle}>
				<VStack spacing={2}>
					<ToggleControl
						label={__('Labels Active')}
						checked={labelsActive}
						onChange={(newValue) =>
							updateAttributeForDevice('labels', {
								active: newValue,
							})
						}
					/>
				</VStack>
				{labelsActive && (
					<VStack spacing={4}>
						<VStack spacing={2}>
							{'map-usa' === layoutType && (
								<ToggleControl
									label={__('Ignore Small State Labels')}
									checked={
										getCurrentValue(
											'map',
											'ignoreSmallStateLabels'
										) || false
									}
									onChange={(newValue) => {
										const map =
											getCurrentValue('map') || {};
										updateAttributeForDevice('map', {
											...map,
											ignoreSmallStateLabels: newValue,
										});
									}}
								/>
							)}

							{LINE_CHART_TYPES.includes(chartType) && (
								<VStack spacing={2}>
									<ToggleControl
										label={__(
											'Display only first and last labels'
										)}
										checked={getCurrentValue(
											'labels',
											'showFirstLastPointsOnly'
										)}
										onChange={(newValue) =>
											updateAttributeForDevice('labels', {
												showFirstLastPointsOnly:
													newValue,
											})
										}
									/>
								</VStack>
							)}
							{LINE_CHART_TYPES.includes(chartType) &&
								getCurrentValue(
									'labels',
									'showFirstLastPointsOnly'
								) && (
									<VStack spacing={2}>
										<ToggleGroupControl
											__nextHasNoMarginBottom
											isBlock
											value={
												getCurrentValue(
													'labels',
													'firstLastLabelLayout'
												) || 'default'
											}
											label={__(
												'First / Last Label Layout'
											)}
											onChange={(type) => {
												updateAttributeForDevice(
													'labels',
													{
														firstLastLabelLayout:
															type,
													}
												);
											}}
										>
											<ToggleGroupControlOption
												label={__('Default')}
												value="default"
											/>
											<ToggleGroupControlOption
												label={__('Outside')}
												value="outside"
											/>
										</ToggleGroupControl>
										<PanelDescription>
											<Help>
												{__(
													'Outside places the first label to the left of its point and the last label to the right. DX/DY offsets still apply on top.'
												)}
											</Help>
										</PanelDescription>
									</VStack>
								)}
							<ToggleControl
								label={__('Prevent label overlap (auto)')}
								help={__(
									'Automatically nudge labels to reduce overlap. Manual label positions always take priority.'
								)}
								checked={
									getCurrentValue(
										'labels',
										'autoDeclutter'
									) || false
								}
								onChange={(newValue) =>
									updateAttributeForDevice('labels', {
										autoDeclutter: newValue,
										...(newValue
											? {}
											: {
													declutterLeaderLines: false,
												}),
									})
								}
							/>
							{(LINE_CHART_TYPES.includes(chartType) ||
								chartType === 'scatter' ||
								chartType === 'dot-plot') && (
								<ToggleControl
									label={__('Show leader lines')}
									help={__(
										'Draw a line from each data point to its label when auto overlap prevention moves the label.'
									)}
									checked={
										getCurrentValue(
											'labels',
											'declutterLeaderLines'
										) || false
									}
									disabled={
										!getCurrentValue(
											'labels',
											'autoDeclutter'
										)
									}
									onChange={(newValue) =>
										updateAttributeForDevice('labels', {
											declutterLeaderLines: newValue,
										})
									}
								/>
							)}
							<ToggleControl
								label={__('Text outline for legibility')}
								help={__(
									'Draw a halo behind each label so it stays readable when it overlaps a line, bar, or shape.'
								)}
								checked={
									getCurrentValue('labels', 'textOutline') ||
									false
								}
								onChange={(newValue) =>
									updateAttributeForDevice('labels', {
										textOutline: newValue,
									})
								}
							/>
							{getCurrentValue('labels', 'textOutline') && (
								<SelectControl
									__next40pxDefaultSize
									label={__('Outline color')}
									help={
										BAR_CHART_TYPES.includes(chartType) ||
										chartType === 'pie' ||
										chartType === 'treemap'
											? __(
													'Contrast with text is recommended for labels inside bars or colored shapes. Chart background works well when labels float over empty space.'
												)
											: __(
													'Chart background works well when labels float over lines or empty space. Contrast with text is better inside colored shapes.'
												)
									}
									value={
										getCurrentValue(
											'labels',
											'textOutlineMode'
										) ||
										(BAR_CHART_TYPES.includes(chartType) ||
										chartType === 'pie' ||
										chartType === 'treemap'
											? 'contrast'
											: 'background')
									}
									options={[
										{
											label: __('Chart background'),
											value: 'background',
										},
										{
											label: __('Contrast with text'),
											value: 'contrast',
										},
									]}
									onChange={(newValue) =>
										updateAttributeForDevice('labels', {
											textOutlineMode: newValue,
										})
									}
								/>
							)}
							{chartType === 'pie' && (
								<VStack spacing={2}>
									<ToggleControl
										label={__('Category Labels Active')}
										checked={
											getCurrentValue(
												'pie',
												'showCategoryLabels'
											) || false
										}
										onChange={(newValue) => {
											const pie =
												getCurrentValue('pie') || {};
											updateAttributeForDevice('pie', {
												...pie,
												showCategoryLabels: newValue,
											});
										}}
									/>
								</VStack>
							)}
							{chartType === 'treemap' && (
								<>
									<VStack spacing={2}>
										<ToggleControl
											label={__(
												'Show Values in Rectangles'
											)}
											help={__(
												'Display the numeric data value inside each rectangle below the name.'
											)}
											checked={
												getCurrentValue(
													'treemap',
													'showValues'
												) || false
											}
											onChange={(newValue) => {
												const treemap =
													getCurrentValue(
														'treemap'
													) || {};
												updateAttributeForDevice(
													'treemap',
													{
														...treemap,
														showValues: newValue,
													}
												);
											}}
										/>
									</VStack>
									<VStack spacing={2}>
										<NumberControl
											label={__('Label Min Area (px²)')}
											help={__(
												'Minimum rectangle area (in square pixels) required to show a label. Increase to hide labels on small rectangles.'
											)}
											min={0}
											max={10000}
											step={100}
											value={
												getCurrentValue(
													'treemap',
													'labelMinArea'
												) ?? 1600
											}
											onChange={(value) => {
												const treemap =
													getCurrentValue(
														'treemap'
													) || {};
												updateAttributeForDevice(
													'treemap',
													{
														...treemap,
														labelMinArea: formatNum(
															value,
															'integer'
														),
													}
												);
											}}
										/>
									</VStack>
								</>
							)}
						</VStack>
						{!curated && (
							<VStack spacing={2}>
								<ToggleGroupControl
									__nextHasNoMarginBottom
									isBlock
									value={getCurrentValue(
										'labels',
										'fontSize'
									)}
									label={__('Label Font Size')}
									onChange={(value) => {
										updateAttributeForDevice('labels', {
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
											'Select the font size of the label. Default is 10px.'
										)}
									</Help>
								</PanelDescription>
							</VStack>
						)}
						<VStack spacing={2}>
							<PanelDescription>
								<StyledLabel>Label Positioning</StyledLabel>
							</PanelDescription>
							<Flex>
								<FlexItem>
									<NumberControl
										label={__('DX')}
										value={getCurrentValue(
											'labels',
											'labelPositionDX'
										)}
										disabled={positionDisabled}
										onChange={(value) =>
											updateAttributeForDevice('labels', {
												labelPositionDX: formatNum(
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
											'labels',
											'labelPositionDY'
										)}
										disabled={positionDisabled}
										onChange={(value) =>
											updateAttributeForDevice('labels', {
												labelPositionDY: formatNum(
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
									{positionDisabled
										? __(
												'Label positions are algorithmically determined for this chart type. DX/DY offsets are disabled.',
												'prc-chart-builder'
											)
										: __(
												"Select the position of the label relative to it's parent node, as well as any label units number formatting.",
												'prc-chart-builder'
											)}
								</Help>
							</PanelDescription>
						</VStack>
						{hasCustomPositions && (
							<VStack spacing={2}>
								<Button
									__next40pxDefaultSize
									variant="secondary"
									isDestructive
									onClick={handleResetLabelPositions}
								>
									{__('Reset All Label Positions')}
								</Button>
								<PanelDescription>
									<Help>
										{__(
											'Remove all custom label positions and return to default positioning.'
										)}
									</Help>
								</PanelDescription>
							</VStack>
						)}
						<VStack spacing={2}>
							<ToggleControl
								label={__('Absolute Value')}
								checked={
									getCurrentValue(
										'labels',
										'absoluteValue'
									) || false
								}
								onChange={(newValue) =>
									updateAttributeForDevice('labels', {
										absoluteValue: newValue,
									})
								}
							/>
							<PanelDescription>
								<Help>
									{__(
										'If the chart is displaying negative values, this will ensure the label is always positive. Often used on bar charts with a diverging axis.'
									)}
								</Help>
							</PanelDescription>
						</VStack>
						{!curated && (
							<>
								<VStack spacing={2}>
									<ToggleControl
										label={__(
											'Format Value to Locale String'
										)}
										checked={
											getCurrentValue(
												'labels',
												'toLocaleString'
											) || false
										}
										onChange={(newValue) =>
											updateAttributeForDevice('labels', {
												toLocaleString: newValue,
											})
										}
									/>
									<PanelDescription>
										<Help>
											{__(
												'If checked, formats number into locale string (eg. 100000 -> 100,000).'
											)}
										</Help>
									</PanelDescription>
								</VStack>
								<VStack spacing={2}>
									<NumberControl
										label={__('Decimal Places')}
										value={getCurrentValue(
											'labels',
											'toFixedDecimal'
										)}
										min={0}
										max={100}
										onChange={(value) =>
											updateAttributeForDevice('labels', {
												toFixedDecimal: formatNum(
													value,
													'integer'
												),
												truncateDecimal: false,
											})
										}
									/>
									<PanelDescription>
										<Help>
											{__(
												'Values render with exactly this many decimal places, so 20 at 3 places reads 20.000. Zero keeps each number as it is.'
											)}
										</Help>
									</PanelDescription>
								</VStack>
								<VStack spacing={2}>
									<NumberControl
										label={__('Minimum Display Value')}
										value={
											getCurrentValue(
												'labels',
												'minDisplayValue'
											) ?? ''
										}
										min={0}
										step="any"
										onChange={(value) =>
											updateAttributeForDevice('labels', {
												minDisplayValue:
													formatOptionalNum(value),
											})
										}
									/>
									<PanelDescription>
										<Help>
											{__(
												'Values below this read as "<value" instead of rounding to zero. Eg. with 0.1 and one decimal place, 0.04 reads "<0.1" rather than "0.0". Leave empty to format every value normally.'
											)}
										</Help>
									</PanelDescription>
								</VStack>
							</>
						)}
						<VStack spacing={2}>
							<TextControl
								__next40pxDefaultSize
								label={__('Label Unit')}
								value={getCurrentValue('labels', 'labelUnit')}
								onChange={(value) =>
									updateAttributeForDevice('labels', {
										labelUnit: value,
									})
								}
							/>
							<PanelDescription>
								<Help>
									{__('Add a unit to the label. eg. % or $')}
								</Help>
							</PanelDescription>
						</VStack>
						<VStack spacing={2}>
							<ToggleGroupControl
								__nextHasNoMarginBottom
								isBlock
								value={getCurrentValue(
									'labels',
									'labelUnitPosition'
								)}
								label="Label Unit Position"
								onChange={(type) => {
									updateAttributeForDevice('labels', {
										labelUnitPosition: type,
									});
								}}
							>
								<ToggleGroupControlOption
									label="Start"
									value="start"
								/>
								<ToggleGroupControlOption
									label="End"
									value="end"
								/>
							</ToggleGroupControl>
							<PanelDescription>
								<Help>
									{__(
										'Select the position of the label unit relative to the label.'
									)}
								</Help>
							</PanelDescription>
						</VStack>
						{('bar' === chartType ||
							'diverging-bar' === chartType ||
							'stacked-bar' === chartType ||
							'exploded-bar' === chartType) && (
							<>
								<VStack spacing={2}>
									<ToggleGroupControl
										__nextHasNoMarginBottom
										isBlock
										value={getCurrentValue(
											'labels',
											'labelPositionBar'
										)}
										label="Bar Label Position"
										onChange={(type) => {
											updateAttributeForDevice('labels', {
												labelPositionBar: type,
											});
										}}
									>
										<ToggleGroupControlOption
											label="Inside"
											value="inside"
										/>
										<ToggleGroupControlOption
											label="Center"
											value="center"
										/>
										<ToggleGroupControlOption
											label="Outside"
											value="outside"
										/>
									</ToggleGroupControl>
									<PanelDescription>
										<Help>
											{__(
												'Select the position of the label relative to the bar.'
											)}
										</Help>
									</PanelDescription>
								</VStack>
								<VStack spacing={2}>
									<NumberControl
										label={__('Label Cutoff')}
										value={getCurrentValue(
											'labels',
											'labelCutoff'
										)}
										disabled={
											'outside' ===
											getCurrentValue(
												'labels',
												'labelPositionBar'
											)
										}
										onChange={(value) =>
											updateAttributeForDevice('labels', {
												labelCutoff: formatNum(
													value,
													'integer'
												),
											})
										}
									/>
									<PanelDescription>
										<Help>
											{__(
												'Hide labels that are smaller than this value. Use the device preview to set a different cutoff for mobile or tablet.'
											)}
										</Help>
									</PanelDescription>
								</VStack>
							</>
						)}
						<VStack spacing={2}>
							<SelectControl
								__next40pxDefaultSize
								label={__('Label Color')}
								value={getCurrentValue('labels', 'color')}
								onChange={(value) =>
									updateAttributeForDevice('labels', {
										color: value,
									})
								}
								options={[
									{
										label: __('Contrast'),
										value: 'contrast',
									},
									{
										label: __('Inherit'),
										value: 'inherit',
									},
									{ label: __('Black'), value: 'black' },
									{ label: __('White'), value: 'white' },
								]}
							/>
							<PanelDescription>
								<Help>
									{__(
										'Select the color of the label. Contrast will determine color based on bar background for optimal contrast.'
									)}
								</Help>
							</PanelDescription>
						</VStack>
					</VStack>
				)}
			</PanelBody>
		</div>
	);
}

export default LabelControls;
