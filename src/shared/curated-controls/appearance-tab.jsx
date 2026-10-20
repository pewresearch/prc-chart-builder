/**
 * Appearance tab — layout, color palette/sorter, and axis controls.
 */
import {
	BoxControl,
	Flex,
	FlexItem,
	__experimentalNumberControl as NumberControl,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

import FocusedPanelBody from '../../chart/edit/focused-panel-body';
import WizardControlTip from '../wizard-ui/wizard-control-tip';
import { useViewportAttributes } from '../../chart/edit/hooks/use-viewport-attributes';
import { MAP_CHART_TYPES } from '../../chart/utils/chart-types';
import {
	buildEditedAxisDomain,
	formatNum,
	getInferredAxisDomainFromData,
	isAutoAxisDomain,
	isAutoAxisDomainForScale,
	timeDomainBoundToYear,
} from '../../chart/utils/helpers';
import CuratedColorControls from './curated-color-controls';
import {
	CUSTOM_WIDTH,
	WIDTH_PRESETS,
	getWidthPresetValue,
} from './width-presets';

const TICK_UNIT_POSITION_OPTIONS = [
	{ value: 'start', label: __('Start', 'prc-chart-builder') },
	{ value: 'end', label: __('End', 'prc-chart-builder') },
];

/**
 * @param {Object}   props
 * @param {string}   props.axisKey
 * @param {Object}   props.axis
 * @param {Function} props.updateAttributeForDevice
 */
function TickLabelMaxWidthControl({ axisKey, axis, updateAttributeForDevice }) {
	return (
		<VStack spacing={1}>
			<div className="prc-chart-modal__control-label-with-tip">
				<span className="components-base-control__label">
					{__('Tick label max width', 'prc-chart-builder')}
				</span>
				<WizardControlTip
					label={__(
						'Help: tick label max width',
						'prc-chart-builder'
					)}
					text={__(
						'Max width is the longest a tick label can be before it wraps to multiple lines.',
						'prc-chart-builder'
					)}
				/>
			</div>
			<NumberControl
				hideLabelFromVision
				label={__('Tick label max width', 'prc-chart-builder')}
				value={axis.tickLabels?.maxWidth}
				disableUnits
				disabledUnits
				min={0}
				onChange={(value) =>
					updateAttributeForDevice(axisKey, {
						tickLabels: {
							...(axis.tickLabels ?? {}),
							maxWidth: formatNum(value, 'integer'),
						},
					})
				}
			/>
		</VStack>
	);
}

const AXIS_LESS_TYPES = new Set([
	...MAP_CHART_TYPES,
	'pie',
	'treemap',
	'sankey',
	'waffle',
	'heat-map-table',
]);

/**
 * @param {*} value Candidate width/height/padding value.
 * @return {number} A finite integer, or 0.
 */
function toInt(value) {
	const parsed = parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * @param {Object} sides BoxControl side map.
 * @return {{ top: number, right: number, bottom: number, left: number }} Integer padding.
 */
function paddingToInts(sides = {}) {
	return {
		top: toInt(sides.top),
		right: toInt(sides.right),
		bottom: toInt(sides.bottom),
		left: toInt(sides.left),
	};
}

/**
 * Grid lines are considered "on" when stroke is set and opacity > 0.
 *
 * @param {Object} grid Axis grid style object.
 * @return {boolean} Whether grid lines should render as visible.
 */
function isGridVisible(grid = {}) {
	const opacity = grid.strokeOpacity;
	if (opacity === 0 || opacity === '0') {
		return false;
	}
	return Boolean(grid.stroke);
}

/**
 * @param {[number, number]|null} inferredDomain
 * @return {string|null} Help copy for auto domain controls.
 */
function getAutoDomainHelpText(inferredDomain) {
	if (!inferredDomain) {
		return __(
			'Leave min and max empty to use the data range.',
			'prc-chart-builder'
		);
	}

	return sprintf(
		/* translators: %1$s: minimum value, %2$s: maximum value */
		__(
			'Leave min and max empty to use the data range (currently %1$s–%2$s).',
			'prc-chart-builder'
		),
		inferredDomain[0],
		inferredDomain[1]
	);
}

/**
 * @param {Object}   props
 * @param {Object}   props.chartAttributes
 * @param {Function} props.setAttributes
 */
export default function AppearanceTab({ chartAttributes, setAttributes }) {
	const { deviceType, getCurrentValue, updateAttributeForDevice } =
		useViewportAttributes(chartAttributes, setAttributes);
	const layout = getCurrentValue('layout');
	const padding = layout.padding ?? {};
	const chartType = layout.type ?? 'bar';
	const independentAxis = getCurrentValue('independentAxis');
	const dependentAxis = getCurrentValue('dependentAxis');
	const independentDomain = Array.isArray(independentAxis.domain)
		? independentAxis.domain
		: [];
	const dependentDomain = Array.isArray(dependentAxis.domain)
		? dependentAxis.domain
		: [];
	// The Data tab writes dataRender.xScale; get-config gives it precedence.
	const independentScale =
		chartAttributes.dataRender?.xScale ?? independentAxis.scale ?? 'linear';
	const independentIsTime = 'time' === independentScale;
	const independentDomainIsAuto = isAutoAxisDomainForScale(
		independentAxis.domain,
		independentScale
	);
	const dependentDomainIsAuto = isAutoAxisDomain(dependentAxis.domain);

	// Time domains persist as ISO strings (author intent marker — legacy
	// numeric pairs stay auto); editor controls still show plain years.
	const independentBoundValue = (index) =>
		independentIsTime
			? timeDomainBoundToYear(independentDomain[index])
			: independentDomain[index];
	const inferredIndependentDomain = getInferredAxisDomainFromData(
		chartAttributes,
		'independent'
	);
	const inferredDependentDomain = getInferredAxisDomainFromData(
		chartAttributes,
		'dependent'
	);
	const editIndependentBound = (index, value) =>
		buildEditedAxisDomain({
			editedIndex: index,
			editedValue: value,
			currentDomain: independentAxis.domain,
			inferredDomain: inferredIndependentDomain,
			scale: independentScale,
		});
	const editDependentBound = (index, value) =>
		buildEditedAxisDomain({
			editedIndex: index,
			editedValue: value,
			currentDomain: dependentAxis.domain,
			inferredDomain: inferredDependentDomain,
			scale: 'linear',
		});

	// Every path here is `<group>.<key>`; the group is what carries
	// per-viewport overrides.
	const setPath = (path, value) => {
		const [group, key] = path.split('.');
		updateAttributeForDevice(group, { [key]: value });
	};

	const widthValue = toInt(layout.width);
	// A custom width can coincide with a preset value, so the mode is tracked
	// separately instead of inferred from the current width.
	const [isCustomWidth, setIsCustomWidth] = useState(
		() => getWidthPresetValue(widthValue) === CUSTOM_WIDTH
	);
	useEffect(() => {
		setIsCustomWidth(getWidthPresetValue(widthValue) === CUSTOM_WIDTH);
		// Re-derive only when switching viewports, not on every width edit.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [deviceType]);
	const widthPreset = isCustomWidth
		? CUSTOM_WIDTH
		: getWidthPresetValue(widthValue);

	const showAxes = !AXIS_LESS_TYPES.has(chartType);

	const setAxisGridVisible = (axisKey, visible) => {
		const current = getCurrentValue(axisKey);
		const grid = current.grid ?? {};
		let nextOpacity = 0;
		if (visible) {
			nextOpacity = grid.strokeOpacity > 0 ? grid.strokeOpacity : 0.2;
		}
		setPath(`${axisKey}.grid`, {
			...grid,
			stroke: visible ? grid.stroke || '#dadbdb' : '',
			strokeOpacity: nextOpacity,
		});
	};

	return (
		<VStack spacing={2} className="prc-chart-modal__configure-tab-panel">
			<FocusedPanelBody
				panelId="wizardLayout"
				title={__('Chart layout', 'prc-chart-builder')}
			>
				<VStack spacing={4}>
					<VStack spacing={1}>
						<div className="prc-chart-modal__control-label-with-tip">
							<span className="components-base-control__label">
								{__('Width', 'prc-chart-builder')}
							</span>
							<WizardControlTip
								label={__(
									'Help: chart width',
									'prc-chart-builder'
								)}
								text={__(
									'Common publication widths. Choose Custom to set your own.',
									'prc-chart-builder'
								)}
							/>
						</div>
						<SelectControl
							__next40pxDefaultSize
							hideLabelFromVision
							label={__('Width', 'prc-chart-builder')}
							value={widthPreset}
							options={WIDTH_PRESETS}
							onChange={(value) => {
								if (value === CUSTOM_WIDTH) {
									setIsCustomWidth(true);
									return;
								}
								setIsCustomWidth(false);
								setPath('layout.width', toInt(value));
							}}
							__nextHasNoMarginBottom
						/>
					</VStack>
					{isCustomWidth && (
						<RangeControl
							__next40pxDefaultSize
							label={__('Custom width', 'prc-chart-builder')}
							withInputField
							min={0}
							max={1152}
							value={widthValue}
							onChange={(value) =>
								setPath('layout.width', toInt(value))
							}
							__nextHasNoMarginBottom
						/>
					)}
					<RangeControl
						__next40pxDefaultSize
						label={__('Height', 'prc-chart-builder')}
						withInputField
						min={0}
						max={1200}
						value={toInt(layout.height)}
						onChange={(value) =>
							setPath('layout.height', toInt(value))
						}
						disabled={chartType === 'small-multiples'}
						help={
							chartType === 'small-multiples'
								? __(
										'Small multiples set height per panel. Use Panel Height in Small Multiples settings.',
										'prc-chart-builder'
									)
								: undefined
						}
						__nextHasNoMarginBottom
					/>
					<BoxControl
						__next40pxDefaultSize
						label={__('Padding', 'prc-chart-builder')}
						values={{
							top: `${toInt(padding.top)}px`,
							right: `${toInt(padding.right)}px`,
							bottom: `${toInt(padding.bottom)}px`,
							left: `${toInt(padding.left)}px`,
						}}
						onChange={(value) =>
							setPath('layout.padding', {
								...padding,
								...paddingToInts(value),
							})
						}
					/>
				</VStack>
			</FocusedPanelBody>

			<FocusedPanelBody
				panelId="wizardColor"
				title={__('Chart color', 'prc-chart-builder')}
			>
				<CuratedColorControls
					attributes={chartAttributes}
					setAttributes={setAttributes}
				/>
			</FocusedPanelBody>

			{showAxes && (
				<>
					<FocusedPanelBody
						panelId="wizardIndependentAxis"
						title={__('Independent axis', 'prc-chart-builder')}
					>
						<VStack spacing={3}>
							<p className="prc-chart-modal__control-help">
								{__(
									'The independent axis shows the values used to organize the chart, such as categories, dates, or x-values. It is usually horizontal, but vertical on horizontal bar charts.',
									'prc-chart-builder'
								)}
							</p>
							<div className="prc-chart-modal__control-label-with-tip">
								<span className="prc-chart-modal__control-group-label">
									{__('Domain', 'prc-chart-builder')}
								</span>
								<WizardControlTip
									label={__(
										'Help: independent axis domain',
										'prc-chart-builder'
									)}
									text={__(
										'The domain is the range of values shown on the axis, from minimum to maximum. Leave both fields empty to use the data range.',
										'prc-chart-builder'
									)}
								/>
							</div>
							{independentDomainIsAuto && (
								<p className="prc-chart-modal__control-help">
									{getAutoDomainHelpText(
										inferredIndependentDomain
									)}
								</p>
							)}
							<Flex gap={4}>
								<FlexItem>
									<NumberControl
										label={__(
											'Minimum',
											'prc-chart-builder'
										)}
										value={
											independentDomainIsAuto
												? ''
												: (independentBoundValue(0) ??
													'')
										}
										placeholder={
											independentDomainIsAuto &&
											inferredIndependentDomain
												? String(
														inferredIndependentDomain[0]
													)
												: undefined
										}
										disableUnits
										disabledUnits
										onChange={(value) => {
											if (
												value === '' ||
												value === undefined
											) {
												setPath(
													'independentAxis.domain',
													null
												);
												return;
											}
											setPath(
												'independentAxis.domain',
												editIndependentBound(0, value)
											);
										}}
									/>
								</FlexItem>
								<FlexItem>
									<NumberControl
										label={__(
											'Maximum',
											'prc-chart-builder'
										)}
										value={
											independentDomainIsAuto
												? ''
												: (independentBoundValue(1) ??
													'')
										}
										placeholder={
											independentDomainIsAuto &&
											inferredIndependentDomain
												? String(
														inferredIndependentDomain[1]
													)
												: undefined
										}
										disableUnits
										disabledUnits
										onChange={(value) => {
											if (
												value === '' ||
												value === undefined
											) {
												setPath(
													'independentAxis.domain',
													null
												);
												return;
											}
											setPath(
												'independentAxis.domain',
												editIndependentBound(1, value)
											);
										}}
									/>
								</FlexItem>
							</Flex>
							<ToggleControl
								label={__('Show axis', 'prc-chart-builder')}
								checked={Boolean(independentAxis.active)}
								onChange={(value) =>
									setPath('independentAxis.active', value)
								}
								__nextHasNoMarginBottom
							/>
							{Boolean(independentAxis.active) && (
								<>
									<NumberControl
										label={__(
											'Number of ticks',
											'prc-chart-builder'
										)}
										value={independentAxis.tickCount}
										disableUnits
										disabledUnits
										min={1}
										onChange={(value) =>
											setPath(
												'independentAxis.tickCount',
												formatNum(value, 'integer')
											)
										}
										help={__(
											'Approximate tick count; the chart may adjust for even spacing.',
											'prc-chart-builder'
										)}
									/>
									<ToggleControl
										label={__(
											'Show min domain label',
											'prc-chart-builder'
										)}
										help={__(
											"Forces the minimum domain value's label to appear on the axis. May overlap with the dependent axis.",
											'prc-chart-builder'
										)}
										checked={Boolean(
											independentAxis.showZero
										)}
										onChange={(value) =>
											setPath(
												'independentAxis.showZero',
												value
											)
										}
										__nextHasNoMarginBottom
									/>
									<TextControl
										label={__(
											'Specific ticks',
											'prc-chart-builder'
										)}
										value={independentAxis.tickValues ?? ''}
										onChange={(value) =>
											setPath(
												'independentAxis.tickValues',
												value
											)
										}
										help={__(
											'Comma-separated values (e.g. 0, 50, 100). Overrides number of ticks when set.',
											'prc-chart-builder'
										)}
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<TextControl
										label={__(
											'Tick units',
											'prc-chart-builder'
										)}
										value={independentAxis.tickUnit ?? ''}
										onChange={(value) =>
											setPath(
												'independentAxis.tickUnit',
												value
											)
										}
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<SelectControl
										label={__(
											'Tick unit position',
											'prc-chart-builder'
										)}
										value={independentAxis.tickUnitPosition}
										options={TICK_UNIT_POSITION_OPTIONS}
										onChange={(value) =>
											setPath(
												'independentAxis.tickUnitPosition',
												value
											)
										}
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<TickLabelMaxWidthControl
										axisKey="independentAxis"
										axis={independentAxis}
										updateAttributeForDevice={
											updateAttributeForDevice
										}
									/>
									<ToggleControl
										label={__(
											'Show tick marks',
											'prc-chart-builder'
										)}
										checked={Boolean(
											independentAxis.tickMarksActive
										)}
										onChange={(value) =>
											setPath(
												'independentAxis.tickMarksActive',
												value
											)
										}
										help={__(
											'Toggle display of tick markers on the independent axis.',
											'prc-chart-builder'
										)}
										__nextHasNoMarginBottom
									/>
								</>
							)}
							<ToggleControl
								label={__(
									'Show grid lines',
									'prc-chart-builder'
								)}
								checked={isGridVisible(independentAxis.grid)}
								onChange={(value) =>
									setAxisGridVisible('independentAxis', value)
								}
								__nextHasNoMarginBottom
							/>
						</VStack>
					</FocusedPanelBody>

					<FocusedPanelBody
						panelId="wizardDependentAxis"
						title={__('Dependent axis', 'prc-chart-builder')}
					>
						<VStack spacing={3}>
							<p className="prc-chart-modal__control-help">
								{__(
									'The dependent axis shows the measured values. It is usually vertical, but horizontal on horizontal bar charts.',
									'prc-chart-builder'
								)}
							</p>
							<div className="prc-chart-modal__control-label-with-tip">
								<span className="prc-chart-modal__control-group-label">
									{__('Domain', 'prc-chart-builder')}
								</span>
								<WizardControlTip
									label={__(
										'Help: dependent axis domain',
										'prc-chart-builder'
									)}
									text={__(
										'The domain is the range of values shown on the axis, from minimum to maximum. Leave both fields empty to use the data range.',
										'prc-chart-builder'
									)}
								/>
							</div>
							{dependentDomainIsAuto && (
								<p className="prc-chart-modal__control-help">
									{getAutoDomainHelpText(
										inferredDependentDomain
									)}
								</p>
							)}
							<Flex gap={4}>
								<FlexItem>
									<NumberControl
										label={__(
											'Minimum',
											'prc-chart-builder'
										)}
										value={
											dependentDomainIsAuto
												? ''
												: dependentDomain[0]
										}
										placeholder={
											dependentDomainIsAuto &&
											inferredDependentDomain
												? String(
														inferredDependentDomain[0]
													)
												: undefined
										}
										disableUnits
										disabledUnits
										onChange={(value) => {
											if (
												value === '' ||
												value === undefined
											) {
												setPath(
													'dependentAxis.domain',
													null
												);
												return;
											}
											setPath(
												'dependentAxis.domain',
												editDependentBound(0, value)
											);
										}}
									/>
								</FlexItem>
								<FlexItem>
									<NumberControl
										label={__(
											'Maximum',
											'prc-chart-builder'
										)}
										value={
											dependentDomainIsAuto
												? ''
												: dependentDomain[1]
										}
										placeholder={
											dependentDomainIsAuto &&
											inferredDependentDomain
												? String(
														inferredDependentDomain[1]
													)
												: undefined
										}
										disableUnits
										disabledUnits
										onChange={(value) => {
											if (
												value === '' ||
												value === undefined
											) {
												setPath(
													'dependentAxis.domain',
													null
												);
												return;
											}
											setPath(
												'dependentAxis.domain',
												editDependentBound(1, value)
											);
										}}
									/>
								</FlexItem>
							</Flex>
							<ToggleControl
								label={__('Show axis', 'prc-chart-builder')}
								checked={Boolean(dependentAxis.active)}
								onChange={(value) =>
									setPath('dependentAxis.active', value)
								}
								__nextHasNoMarginBottom
							/>
							{Boolean(dependentAxis.active) && (
								<>
									<NumberControl
										label={__(
											'Number of ticks',
											'prc-chart-builder'
										)}
										value={dependentAxis.tickCount}
										disableUnits
										disabledUnits
										min={1}
										onChange={(value) =>
											setPath(
												'dependentAxis.tickCount',
												formatNum(value, 'integer')
											)
										}
										help={__(
											'Approximate tick count; the chart may adjust for even spacing.',
											'prc-chart-builder'
										)}
									/>
									<ToggleControl
										label={__(
											'Show min domain label',
											'prc-chart-builder'
										)}
										help={__(
											"Forces the minimum domain value's label to appear on the axis. May overlap with the independent axis.",
											'prc-chart-builder'
										)}
										checked={Boolean(
											dependentAxis.showZero
										)}
										onChange={(value) =>
											setPath(
												'dependentAxis.showZero',
												value
											)
										}
										__nextHasNoMarginBottom
									/>
									<TextControl
										label={__(
											'Specific ticks',
											'prc-chart-builder'
										)}
										value={dependentAxis.tickValues ?? ''}
										onChange={(value) =>
											setPath(
												'dependentAxis.tickValues',
												value
											)
										}
										help={__(
											'Comma-separated values (e.g. 0, 50, 100). Overrides number of ticks when set.',
											'prc-chart-builder'
										)}
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<TextControl
										label={__(
											'Tick units',
											'prc-chart-builder'
										)}
										value={dependentAxis.tickUnit ?? ''}
										onChange={(value) =>
											setPath(
												'dependentAxis.tickUnit',
												value
											)
										}
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<SelectControl
										label={__(
											'Tick unit position',
											'prc-chart-builder'
										)}
										value={dependentAxis.tickUnitPosition}
										options={TICK_UNIT_POSITION_OPTIONS}
										onChange={(value) =>
											setPath(
												'dependentAxis.tickUnitPosition',
												value
											)
										}
										__nextHasNoMarginBottom
										__next40pxDefaultSize
									/>
									<TickLabelMaxWidthControl
										axisKey="dependentAxis"
										axis={dependentAxis}
										updateAttributeForDevice={
											updateAttributeForDevice
										}
									/>
									<ToggleControl
										label={__(
											'Abbreviate ticks',
											'prc-chart-builder'
										)}
										help={
											dependentAxis.abbreviateTicks
												? __(
														'Tick values will be abbreviated when possible (eg. 100,000 -> 100K)',
														'prc-chart-builder'
													)
												: __(
														'Tick values will be displayed as-is',
														'prc-chart-builder'
													)
										}
										checked={Boolean(
											dependentAxis.abbreviateTicks
										)}
										onChange={(value) =>
											setPath(
												'dependentAxis.abbreviateTicks',
												value
											)
										}
										__nextHasNoMarginBottom
									/>
									<NumberControl
										label={__(
											'Abbreviated tick to set decimal place (when applicable)',
											'prc-chart-builder'
										)}
										value={
											dependentAxis.abbreviateTicksDecimals
										}
										disabled={
											!dependentAxis.abbreviateTicks
										}
										disableUnits
										disabledUnits
										min={0}
										onChange={(value) =>
											setPath(
												'dependentAxis.abbreviateTicksDecimals',
												formatNum(value, 'integer')
											)
										}
									/>
									<ToggleControl
										label={__(
											'Format ticks to locale string',
											'prc-chart-builder'
										)}
										disabled={Boolean(
											dependentAxis.abbreviateTicks
										)}
										help={
											dependentAxis.ticksToLocaleString
												? __(
														'Tick values will be formatted to locale string (eg. 100000 -> 100,000)',
														'prc-chart-builder'
													)
												: __(
														'Tick values will be displayed as-is',
														'prc-chart-builder'
													)
										}
										checked={Boolean(
											dependentAxis.ticksToLocaleString
										)}
										onChange={(value) =>
											setPath(
												'dependentAxis.ticksToLocaleString',
												value
											)
										}
										__nextHasNoMarginBottom
									/>
									<ToggleControl
										label={__(
											'Show tick marks',
											'prc-chart-builder'
										)}
										checked={Boolean(
											dependentAxis.tickMarksActive
										)}
										onChange={(value) =>
											setPath(
												'dependentAxis.tickMarksActive',
												value
											)
										}
										help={__(
											'Toggle display of tick markers on the dependent axis.',
											'prc-chart-builder'
										)}
										__nextHasNoMarginBottom
									/>
								</>
							)}
							<ToggleControl
								label={__(
									'Show grid lines',
									'prc-chart-builder'
								)}
								checked={isGridVisible(dependentAxis.grid)}
								onChange={(value) =>
									setAxisGridVisible('dependentAxis', value)
								}
								__nextHasNoMarginBottom
							/>
						</VStack>
					</FocusedPanelBody>
				</>
			)}
		</VStack>
	);
}
