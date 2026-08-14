/* eslint-disable @wordpress/i18n-no-variables */
/* eslint-disable @wordpress/i18n-no-flanking-whitespace */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	PanelRow,
	TextControl,
	ToggleControl,
	SelectControl,
	Flex,
	FlexItem,
	__experimentalNumberControl as NumberControl,
	AnglePickerControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { effectiveChartTypeForControls } from '../utils/chart-types';
import {
	buildEditedAxisDomain,
	formatNum,
	getInferredAxisDomainFromData,
	isAutoAxisDomainForScale,
	timeDomainBoundToYear,
} from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';

function IndependentAxisControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('independentAxis');

	const layout = getCurrentValue('layout') || {};
	const chartType = effectiveChartTypeForControls(attributes) || layout.type;
	// Content attribute - NOT viewport-aware
	const dataRender = attributes.dataRender || {};
	const { xFormat } = dataRender;
	// The Data tab writes dataRender.xScale; get-config gives it precedence.
	const independentScale =
		dataRender.xScale ??
		getCurrentValue('independentAxis', 'scale') ??
		'linear';
	const independentIsTime = 'time' === independentScale;
	// Legacy numeric time domains render as auto, so show them as unset
	// (with the inferred data domain as placeholder) instead of as years
	// the chart ignores.
	const independentDomainIsAuto = isAutoAxisDomainForScale(
		getCurrentValue('independentAxis', 'domain'),
		independentScale
	);
	const inferredIndependentDomain = getInferredAxisDomainFromData(
		attributes,
		'independent'
	);
	// Time domains persist as ISO strings (author intent marker — legacy
	// numeric pairs stay auto); the controls still show plain years.
	const domainBoundValue = (index) => {
		if (independentDomainIsAuto) {
			return '';
		}
		const bound = getCurrentValue('independentAxis', 'domain')?.[index];
		return (independentIsTime ? timeDomainBoundToYear(bound) : bound) ?? '';
	};
	const domainBoundPlaceholder = (index) =>
		independentDomainIsAuto && inferredIndependentDomain
			? String(inferredIndependentDomain[index])
			: undefined;
	const onDomainBoundChange = (index) => (val) => {
		if (val === '' || val === undefined) {
			updateAttributeForDevice('independentAxis', { domain: null });
			return;
		}
		updateAttributeForDevice('independentAxis', {
			domain: buildEditedAxisDomain({
				editedIndex: index,
				editedValue: val,
				currentDomain: getCurrentValue('independentAxis', 'domain'),
				inferredDomain: inferredIndependentDomain,
				scale: independentScale,
			}),
		});
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Independent Axis Configuration')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<PanelRow>
					The independent axis is almost always the x-axis, except in
					cases of horizontal bar charts or stack bar charts, where
					the independent values are plotted on the y-axis.
				</PanelRow>
				<ToggleControl
					label="Axis active"
					help={
						getCurrentValue('independentAxis', 'active')
							? 'Shows axis.'
							: 'No axis.'
					}
					checked={getCurrentValue('independentAxis', 'active')}
					onChange={(newValue) =>
						updateAttributeForDevice('independentAxis', {
							active: newValue,
						})
					}
				/>
				<TextControl
					label={__('Label')}
					value={getCurrentValue('independentAxis', 'label')}
					onChange={(val) =>
						updateAttributeForDevice('independentAxis', {
							label: val,
						})
					}
				/>
				<NumberControl
					label={__('Label Padding')}
					help={__(
						'Determines the space between the label and the axis'
					)}
					value={
						getCurrentValue('independentAxis', 'axisLabel')?.padding
					}
					disableUnits
					disabledUnits
					onChange={(val) => {
						const currentAxisLabel =
							getCurrentValue('independentAxis', 'axisLabel') ||
							{};
						updateAttributeForDevice('independentAxis', {
							axisLabel: {
								...currentAxisLabel,
								padding: formatNum(val, 'integer'),
							},
						});
					}}
				/>
				<NumberControl
					label={__('Label Width')}
					help={__(
						'Determines the width of the label. Shorten to break label to multiple lines.'
					)}
					value={
						getCurrentValue('independentAxis', 'axisLabel')
							?.maxWidth
					}
					disableUnits
					disabledUnits
					onChange={(val) => {
						const currentAxisLabel =
							getCurrentValue('independentAxis', 'axisLabel') ||
							{};
						updateAttributeForDevice('independentAxis', {
							axisLabel: {
								...currentAxisLabel,
								maxWidth: formatNum(val, 'integer'),
							},
						});
					}}
				/>
				<SelectControl
					label={__('Independent axis scale')}
					value={getCurrentValue('independentAxis', 'scale')}
					options={[
						{
							value: 'linear',
							label: 'Linear',
						},
						{
							value: 'time',
							label: 'Time',
						},
					]}
					onChange={(val) => {
						updateAttributeForDevice('independentAxis', {
							scale: val,
						});
					}}
				/>
				{'time' === getCurrentValue('independentAxis', 'scale') && (
					<SelectControl
						label={__('Time scale format')}
						value={getCurrentValue('independentAxis', 'dateFormat')}
						options={[
							{ value: '%Y', label: '2023' },
							{ value: '’%y', label: '’23' },
							{ value: '%-m/%Y', label: '4/2023' },
							{ value: '%-m/%y', label: '4/23' },
							{ value: '%m/%Y', label: '04/2023' },
							{ value: '%m/%y', label: '04/23' },
							{ value: '%B %Y', label: 'April 2023' },
							{ value: '%b %Y', label: 'Apr 2023' },
							{ value: '%B ’%y', label: 'April ’23' },
							{ value: '%b ’%y', label: 'Apr ’23' },
							{ value: '%-m/%-d/%Y', label: '4/15/2023' },
							{ value: '%-d/%-m/%Y', label: '15/4/2023' },
							{ value: '%-m/%-d/%y', label: '4/15/23' },
							{ value: '%-d/%-m/%y', label: '15/4/23' },
							{ value: '%-m/%-d', label: '4/15' },
							{ value: '%-d/%-m', label: '15/4' },
							{ value: '%m/%d/%Y', label: '04/15/2023' },
							{ value: '%d/%m/%Y', label: '15/04/2023' },
							{ value: '%m/%d/%y', label: '04/15/23' },
							{ value: '%d/%m/%y', label: '15/04/23' },
							{ value: '%m/%-d', label: '04/15' },
							{ value: '%-d/%m', label: '15/04' },
							{ value: '%B %-d, %Y', label: 'April 15, 2023' },
							{ value: '%B %-d %Y', label: 'April 15 2023' },
							{ value: '%b %-d, %Y', label: 'Apr 15, 2023' },
							{ value: '%b %-d %Y', label: 'Apr 15 2023' },
							{ value: '%-d %B, %Y', label: '15 April, 2023' },
							{ value: '%-d %B %Y', label: '15 April 2023' },
							{ value: '%-d %b, %Y', label: '15 Apr, 2023' },
							{ value: '%-d %b %Y', label: '15 Apr 2023' },
							{ value: '%B %-d ’%y', label: 'April 15 ’23' },
							{ value: '%-d %B ’%y', label: '15 April ’23' },
							{ value: '%b %-d ’%y', label: 'Apr 15 ’23' },
							{ value: '%-d %b ’%y', label: '15 Apr ’23' },
							{ value: '%B %-d', label: 'April 15' },
							{ value: '%-d %B', label: '15 April' },
							{ value: '%b %-d', label: 'Apr 15' },
							{ value: '%-d %b', label: '15 Apr' },
							{ value: '%B', label: 'April' },
							{ value: '%b', label: 'Apr' },
						]}
						onChange={(val) => {
							updateAttributeForDevice('independentAxis', {
								dateFormat: val,
							});
						}}
					/>
				)}
				<PanelRow>Domain</PanelRow>
				{'time' === getCurrentValue('independentAxis', 'scale') && (
					<p className="components-base-control__help">
						{__(
							'Default uses the data range. Set min/max years here to extend or crop the axis (e.g. start at 2000 even if data begins later).'
						)}
					</p>
				)}
				<Flex>
					<FlexItem>
						<NumberControl
							label={__('Minimum')}
							value={domainBoundValue(0)}
							placeholder={domainBoundPlaceholder(0)}
							disabled={
								'stacked-bar' === chartType ||
								'bar' === chartType ||
								'pie' === chartType
							}
							disableUnits
							disabledUnits
							onChange={onDomainBoundChange(0)}
						/>
					</FlexItem>
					<FlexItem>
						<NumberControl
							label={__('Maximum')}
							value={domainBoundValue(1)}
							placeholder={domainBoundPlaceholder(1)}
							disabled={
								'stacked-bar' === chartType ||
								'bar' === chartType ||
								'pie' === chartType
							}
							disableUnits
							disabledUnits
							onChange={onDomainBoundChange(1)}
						/>
					</FlexItem>
				</Flex>

				<PanelRow>Axis Ticks and Tick Labels</PanelRow>
				<ToggleControl
					label={__('Show tick marks')}
					help={
						getCurrentValue('independentAxis', 'tickMarksActive')
							? 'Shows tick marks.'
							: 'No tick marks.'
					}
					checked={getCurrentValue(
						'independentAxis',
						'tickMarksActive'
					)}
					onChange={(newValue) =>
						updateAttributeForDevice('independentAxis', {
							tickMarksActive: newValue,
						})
					}
				/>
				<NumberControl
					label={__('Number of ticks')}
					value={getCurrentValue('independentAxis', 'tickCount')}
					disableUnits
					disabledUnits
					onChange={(val) =>
						updateAttributeForDevice('independentAxis', {
							tickCount: formatNum(val, 'integer'),
						})
					}
					help={__(
						'Note: This is return approximately the number of ticks requested, deferring to number that will evenly space ticks on the bar.'
					)}
				/>
				<ToggleControl
					label="Show min domain label"
					help={__(
						"Forces the minimum domain value's lable to appear on axis. May overlap with dependent axis."
					)}
					checked={getCurrentValue('independentAxis', 'showZero')}
					onChange={(newValue) =>
						updateAttributeForDevice('independentAxis', {
							showZero: newValue,
						})
					}
				/>
				<TextControl
					label={__('Specific Ticks')}
					value={getCurrentValue('independentAxis', 'tickValues')}
					onChange={(val) =>
						updateAttributeForDevice('independentAxis', {
							tickValues: val,
						})
					}
					help={__(
						`List of numbers seperated by commas (eg. 0, 50, 100). Setting this value will override the "Number of Ticks" parameter. ${'time' === getCurrentValue('independentAxis', 'scale') ? `If independent axis is time scale, ticks must match the date input format (${xFormat}).` : ''}`
					)}
				/>
				{'time' !== getCurrentValue('independentAxis', 'scale') && (
					<>
						<ToggleControl
							label={__('Abbreviate ticks')}
							help={
								getCurrentValue(
									'independentAxis',
									'abbreviateTicks'
								)
									? __(
											'Tick values will be abbreviated when possible (eg. 100,000 -> 100K)'
										)
									: __('Tick values will be displayed as-is')
							}
							checked={getCurrentValue(
								'independentAxis',
								'abbreviateTicks'
							)}
							onChange={(newValue) =>
								updateAttributeForDevice('independentAxis', {
									abbreviateTicks: newValue,
								})
							}
						/>
						<NumberControl
							label={__(
								'Abbreviated tick to set decimal place (when applicable)'
							)}
							value={getCurrentValue(
								'independentAxis',
								'abbreviateTicksDecimals'
							)}
							disabled={
								!getCurrentValue(
									'independentAxis',
									'abbreviateTicks'
								)
							}
							disableUnits
							disabledUnits
							min={0}
							onChange={(val) =>
								updateAttributeForDevice('independentAxis', {
									abbreviateTicksDecimals: formatNum(
										val,
										'integer'
									),
								})
							}
						/>
						<ToggleControl
							label={__('Format ticks to locale string')}
							disabled={getCurrentValue(
								'independentAxis',
								'abbreviateTicks'
							)}
							help={
								getCurrentValue(
									'independentAxis',
									'ticksToLocaleString'
								)
									? __(
											'Tick values will be formatted to locale string (eg. 100000 -> 100,000)'
										)
									: __('Tick values will be displayed as-is')
							}
							checked={getCurrentValue(
								'independentAxis',
								'ticksToLocaleString'
							)}
							onChange={(newValue) =>
								updateAttributeForDevice('independentAxis', {
									ticksToLocaleString: newValue,
								})
							}
						/>
					</>
				)}
				<TextControl
					label={__('Tick Units')}
					value={getCurrentValue('independentAxis', 'tickUnit')}
					onChange={(val) =>
						updateAttributeForDevice('independentAxis', {
							tickUnit: val,
						})
					}
				/>
				<SelectControl
					label={__('Tick Unit Position')}
					value={getCurrentValue(
						'independentAxis',
						'tickUnitPosition'
					)}
					options={[
						{
							value: 'start',
							label: 'Start',
						},
						{
							value: 'end',
							label: 'End',
						},
					]}
					onChange={(type) => {
						updateAttributeForDevice('independentAxis', {
							tickUnitPosition: type,
						});
					}}
				/>
				<PanelRow className="components-base-control__label">
					Label Size and Positioning
				</PanelRow>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={
						getCurrentValue('independentAxis', 'tickLabels')
							?.fontSize
					}
					label={__('Tick Label Font Size')}
					onChange={(value) => {
						const currentTickLabels =
							getCurrentValue('independentAxis', 'tickLabels') ||
							{};
						updateAttributeForDevice('independentAxis', {
							tickLabels: {
								...currentTickLabels,
								fontSize: formatNum(value, 'integer'),
							},
						});
					}}
				>
					<ToggleGroupControlOption label="10px" value={10} />
					<ToggleGroupControlOption label="12px" value={12} />
					<ToggleGroupControlOption label="14px" value={14} />
					<ToggleGroupControlOption label="16px" value={16} />
				</ToggleGroupControl>
				<PanelRow>
					Determines the position of tick label relative to it’s
					parent node
				</PanelRow>
				<Flex>
					<FlexItem>
						<NumberControl
							label={__('DX')}
							value={
								getCurrentValue('independentAxis', 'tickLabels')
									?.dx
							}
							onChange={(value) => {
								const currentTickLabels =
									getCurrentValue(
										'independentAxis',
										'tickLabels'
									) || {};
								updateAttributeForDevice('independentAxis', {
									tickLabels: {
										...currentTickLabels,
										dx: formatNum(value, 'integer'),
									},
								});
							}}
						/>
					</FlexItem>
					<FlexItem>
						<NumberControl
							label={__('DY')}
							value={
								getCurrentValue('independentAxis', 'tickLabels')
									?.dy
							}
							onChange={(value) => {
								const currentTickLabels =
									getCurrentValue(
										'independentAxis',
										'tickLabels'
									) || {};
								updateAttributeForDevice('independentAxis', {
									tickLabels: {
										...currentTickLabels,
										dy: formatNum(value, 'integer'),
									},
								});
							}}
						/>
					</FlexItem>
				</Flex>
				<AnglePickerControl
					label={__('Tick Label Angle')}
					__nextHasNoMarginBottom
					value={
						getCurrentValue('independentAxis', 'tickLabels')?.angle
					}
					onChange={(val) => {
						const currentTickLabels =
							getCurrentValue('independentAxis', 'tickLabels') ||
							{};
						updateAttributeForDevice('independentAxis', {
							tickLabels: {
								...currentTickLabels,
								angle: formatNum(val, 'integer'),
							},
						});
					}}
				/>
				<NumberControl
					label={__('Tick Label Max Width')}
					value={
						getCurrentValue('independentAxis', 'tickLabels')
							?.maxWidth
					}
					disableUnits
					disabledUnits
					onChange={(val) => {
						const currentTickLabels =
							getCurrentValue('independentAxis', 'tickLabels') ||
							{};
						updateAttributeForDevice('independentAxis', {
							tickLabels: {
								...currentTickLabels,
								maxWidth: formatNum(val, 'integer'),
							},
						});
					}}
					help={__(
						'Determines the width of the tick label. Shorten to break label to multiple lines.'
					)}
				/>

				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={
						getCurrentValue('independentAxis', 'tickLabels')
							?.verticalAnchor
					}
					label="Tick Label Vertical Anchor"
					onChange={(type) => {
						const currentTickLabels =
							getCurrentValue('independentAxis', 'tickLabels') ||
							{};
						updateAttributeForDevice('independentAxis', {
							tickLabels: {
								...currentTickLabels,
								verticalAnchor: type,
							},
						});
					}}
				>
					<ToggleGroupControlOption label="Start" value="start" />
					<ToggleGroupControlOption label="Middle" value="middle" />
					<ToggleGroupControlOption label="End" value="end" />
				</ToggleGroupControl>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={
						getCurrentValue('independentAxis', 'tickLabels')
							?.textAnchor
					}
					label="Tick Label Text Anchor"
					onChange={(type) => {
						const currentTickLabels =
							getCurrentValue('independentAxis', 'tickLabels') ||
							{};
						updateAttributeForDevice('independentAxis', {
							tickLabels: {
								...currentTickLabels,
								textAnchor: type,
							},
						});
					}}
				>
					<ToggleGroupControlOption label="Start" value="start" />
					<ToggleGroupControlOption label="Middle" value="middle" />
					<ToggleGroupControlOption label="End" value="end" />
				</ToggleGroupControl>
				<PanelColorSettings
					__experimentalHasMultipleOrigins
					__experimentalIsRenderedInSidebar
					title={__('Axis Styles')}
					initialOpen
					colorSettings={[
						{
							value: getCurrentValue('independentAxis', 'axis')
								?.stroke,
							onChange: (value) => {
								const currentAxis =
									getCurrentValue(
										'independentAxis',
										'axis'
									) || {};
								updateAttributeForDevice('independentAxis', {
									axis: {
										...currentAxis,
										stroke: value ?? '',
									},
								});
							},
							label: __('Axis Stroke'),
						},
						{
							value: getCurrentValue('independentAxis', 'grid')
								?.stroke,
							onChange: (value) => {
								const currentGrid =
									getCurrentValue(
										'independentAxis',
										'grid'
									) || {};
								updateAttributeForDevice('independentAxis', {
									grid: {
										...currentGrid,
										stroke: value ?? '',
									},
								});
							},
							label: __('Grid Stroke'),
						},
						{
							value: getCurrentValue(
								'independentAxis',
								'tickLabels'
							)?.fill,
							onChange: (value) => {
								const currentTickLabels =
									getCurrentValue(
										'independentAxis',
										'tickLabels'
									) || {};
								updateAttributeForDevice('independentAxis', {
									tickLabels: {
										...currentTickLabels,
										fill: value ?? '',
									},
								});
							},
							label: __('Text Fill'),
						},
					]}
				/>
				<NumberControl
					label={__('Grid Opacity')}
					value={
						getCurrentValue('independentAxis', 'grid')
							?.strokeOpacity
					}
					disableUnits
					disabledUnits
					step={0.1}
					min={0}
					max={1}
					onChange={(val) => {
						const currentGrid =
							getCurrentValue('independentAxis', 'grid') || {};
						updateAttributeForDevice('independentAxis', {
							grid: {
								...currentGrid,
								strokeOpacity: formatNum(val, 'float'),
							},
						});
					}}
				/>
				<TextControl
					label={__('Grid Stroke Dasharray')}
					value={
						getCurrentValue('independentAxis', 'grid')
							?.strokeDasharray
					}
					onChange={(val) => {
						const currentGrid =
							getCurrentValue('independentAxis', 'grid') || {};
						updateAttributeForDevice('independentAxis', {
							grid: { ...currentGrid, strokeDasharray: val },
						});
					}}
				/>
			</PanelBody>
		</div>
	);
}

export default IndependentAxisControls;
