/**
 * Appearance tab — layout, color palette/sorter, and axis controls.
 */
import {
	BoxControl,
	Button,
	Flex,
	FlexItem,
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	Tooltip,
	__experimentalNumberControl as NumberControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { info } from '@wordpress/icons';

import { MAP_CHART_TYPES } from '../../chart/utils/chart-types';
import {
	buildEditedAxisDomain,
	formatNum,
	getInferredAxisDomainFromData,
	isAutoAxisDomain,
	isAutoAxisDomainForScale,
	timeDomainBoundToYear,
} from '../../chart/utils/helpers';
import { applyCuratedControl } from './apply-curated-control';
import CuratedColorControls from './curated-color-controls';
import {
	CUSTOM_WIDTH,
	WIDTH_PRESETS,
	getWidthPresetValue,
} from './width-presets';

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
 * @param {Function} props.onChange
 * @param {Function} props.setAttributes
 */
export default function AppearanceTab({
	chartAttributes,
	onChange,
	setAttributes,
}) {
	const layout = chartAttributes.layout ?? {};
	const padding = layout.padding ?? {};
	const chartType = layout.type ?? 'bar';
	const independentAxis = chartAttributes.independentAxis ?? {};
	const dependentAxis = chartAttributes.dependentAxis ?? {};
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

	const setPath = (path, value) =>
		onChange(applyCuratedControl(chartAttributes, path, value));

	const widthValue = toInt(layout.width);
	// A custom width can coincide with a preset value, so the mode is tracked
	// separately instead of inferred from the current width.
	const [isCustomWidth, setIsCustomWidth] = useState(
		() => getWidthPresetValue(widthValue) === CUSTOM_WIDTH
	);
	const widthPreset = isCustomWidth
		? CUSTOM_WIDTH
		: getWidthPresetValue(widthValue);

	const showAxes = !AXIS_LESS_TYPES.has(chartType);

	const setAxisGridVisible = (axisKey, visible) => {
		const current = chartAttributes[axisKey] ?? {};
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
			<PanelBody
				title={__('Layout', 'prc-chart-builder')}
				initialOpen={false}
			>
				<VStack spacing={4}>
					<VStack spacing={1}>
						<div className="prc-chart-modal__control-label-with-tip">
							<span className="components-base-control__label">
								{__('Chart width', 'prc-chart-builder')}
							</span>
							<Tooltip
								delay={300}
								hideOnClick={false}
								text={__(
									'Common publication widths. Choose Custom to set your own.',
									'prc-chart-builder'
								)}
							>
								<Button
									className="prc-chart-modal__control-tip"
									icon={info}
									iconSize={16}
									label={__(
										'About chart width',
										'prc-chart-builder'
									)}
									// `label` alone makes Button render its own
									// tooltip, which races the wrapper below it.
									showTooltip={false}
									size="small"
									variant="tertiary"
								/>
							</Tooltip>
						</div>
						<SelectControl
							hideLabelFromVision
							label={__('Chart width', 'prc-chart-builder')}
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
							label={__('Width', 'prc-chart-builder')}
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
						label={__('Height', 'prc-chart-builder')}
						withInputField
						min={0}
						max={1200}
						value={toInt(layout.height)}
						onChange={(value) =>
							setPath('layout.height', toInt(value))
						}
						__nextHasNoMarginBottom
					/>
					<BoxControl
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
			</PanelBody>

			<PanelBody
				title={__('Chart color', 'prc-chart-builder')}
				initialOpen={false}
			>
				<CuratedColorControls
					attributes={chartAttributes}
					setAttributes={setAttributes}
				/>
			</PanelBody>

			{showAxes && (
				<>
					<PanelBody
						title={__('Independent axis', 'prc-chart-builder')}
						initialOpen={false}
					>
						<VStack spacing={3}>
							<ToggleControl
								label={__('Show axis', 'prc-chart-builder')}
								checked={Boolean(independentAxis.active)}
								onChange={(value) =>
									setPath('independentAxis.active', value)
								}
								__nextHasNoMarginBottom
							/>
							<p className="prc-chart-modal__control-group-label">
								{__('Domain', 'prc-chart-builder')}
							</p>
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
								__nextHasNoMarginBottom
							/>
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
							<TextControl
								label={__(
									'Specific ticks',
									'prc-chart-builder'
								)}
								value={independentAxis.tickValues ?? ''}
								onChange={(value) =>
									setPath('independentAxis.tickValues', value)
								}
								help={__(
									'Comma-separated values (e.g. 0, 50, 100). Overrides number of ticks when set.',
									'prc-chart-builder'
								)}
								__nextHasNoMarginBottom
							/>
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
					</PanelBody>

					<PanelBody
						title={__('Dependent axis', 'prc-chart-builder')}
						initialOpen={false}
					>
						<VStack spacing={3}>
							<ToggleControl
								label={__('Show axis', 'prc-chart-builder')}
								checked={Boolean(dependentAxis.active)}
								onChange={(value) =>
									setPath('dependentAxis.active', value)
								}
								__nextHasNoMarginBottom
							/>
							<p className="prc-chart-modal__control-group-label">
								{__('Domain', 'prc-chart-builder')}
							</p>
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
								label={__(
									'Show tick marks',
									'prc-chart-builder'
								)}
								checked={Boolean(dependentAxis.tickMarksActive)}
								onChange={(value) =>
									setPath(
										'dependentAxis.tickMarksActive',
										value
									)
								}
								__nextHasNoMarginBottom
							/>
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
							<TextControl
								label={__(
									'Specific ticks',
									'prc-chart-builder'
								)}
								value={dependentAxis.tickValues ?? ''}
								onChange={(value) =>
									setPath('dependentAxis.tickValues', value)
								}
								help={__(
									'Comma-separated values (e.g. 0, 50, 100). Overrides number of ticks when set.',
									'prc-chart-builder'
								)}
								__nextHasNoMarginBottom
							/>
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
					</PanelBody>
				</>
			)}
		</VStack>
	);
}
