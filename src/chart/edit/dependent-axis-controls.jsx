// V2
/* eslint-disable max-lines */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable max-lines-per-function */
/* eslint-disable indent */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	PanelRow,
	TextControl,
	ToggleControl,
	Flex,
	FlexItem,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	AnglePickerControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

function DependentAxisControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	return (
		<PanelBody
			title={__('Dependent Axis Configuration')}
			initialOpen={false}
		>
			<PanelRow>
				Dependent variables are properties that change in response to a
				change in another property. As such, the dependent axis is
				usually the y-axis.
			</PanelRow>
			<ToggleControl
				label="Axis active"
				help={
					getCurrentValue('dependentAxis', 'active')
						? 'Shows axis.'
						: 'No y-axis.'
				}
				checked={getCurrentValue('dependentAxis', 'active')}
				onChange={(newValue) =>
					updateAttributeForDevice('dependentAxis', {
						active: newValue,
					})
				}
			/>
			<TextControl
				label={__('Label')}
				value={getCurrentValue('dependentAxis', 'label')}
				onChange={(val) =>
					updateAttributeForDevice('dependentAxis', { label: val })
				}
			/>
			<NumberControl
				label={__('Label Padding')}
				help={__('Determines the space between the label and the axis')}
				value={getCurrentValue('dependentAxis', 'axisLabel')?.padding}
				disableUnits
				disabledUnits
				onChange={(val) => {
					const currentAxisLabel =
						getCurrentValue('dependentAxis', 'axisLabel') || {};
					updateAttributeForDevice('dependentAxis', {
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
				value={getCurrentValue('dependentAxis', 'axisLabel')?.maxWidth}
				disableUnits
				disabledUnits
				onChange={(val) => {
					const currentAxisLabel =
						getCurrentValue('dependentAxis', 'axisLabel') || {};
					updateAttributeForDevice('dependentAxis', {
						axisLabel: {
							...currentAxisLabel,
							maxWidth: formatNum(val, 'integer'),
						},
					});
				}}
			/>
			<PanelRow>Y Domain</PanelRow>
			<Flex>
				<FlexItem>
					<NumberControl
						label={__('Minimum')}
						value={getCurrentValue('dependentAxis', 'domain')?.[0]}
						disableUnits
						disabledUnits
						onChange={(val) => {
							const currentDomain =
								getCurrentValue('dependentAxis', 'domain') ||
								[];
							updateAttributeForDevice('dependentAxis', {
								domain: [
									formatNum(val, 'integer'),
									currentDomain[1] ?? 0,
								],
							});
						}}
					/>
				</FlexItem>
				<FlexItem>
					<NumberControl
						label={__('Maximum')}
						value={getCurrentValue('dependentAxis', 'domain')?.[1]}
						disableUnits
						disabledUnits
						onChange={(val) => {
							const currentDomain =
								getCurrentValue('dependentAxis', 'domain') ||
								[];
							updateAttributeForDevice('dependentAxis', {
								domain: [
									currentDomain[0] ?? 0,
									formatNum(val, 'integer'),
								],
							});
						}}
					/>
				</FlexItem>
			</Flex>
			<PanelRow>Axis Ticks and Tick Labels</PanelRow>
			<ToggleControl
				label={__('Show tick marks')}
				help={
					getCurrentValue('dependentAxis', 'tickMarksActive')
						? 'Shows tick marks.'
						: 'No tick marks.'
				}
				checked={getCurrentValue('dependentAxis', 'tickMarksActive')}
				onChange={(newValue) =>
					updateAttributeForDevice('dependentAxis', {
						tickMarksActive: newValue,
					})
				}
			/>
			<NumberControl
				label={__('Number of ticks')}
				value={getCurrentValue('dependentAxis', 'tickCount')}
				disableUnits
				disabledUnits
				min={1}
				onChange={(val) =>
					updateAttributeForDevice('dependentAxis', {
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
					"Forces the minimum domain value's lable to appear on axis. May overlap with independent axis."
				)}
				checked={getCurrentValue('dependentAxis', 'showZero')}
				onChange={(newValue) =>
					updateAttributeForDevice('dependentAxis', {
						showZero: newValue,
					})
				}
			/>
			<TextControl
				label={__('Specific Ticks')}
				value={getCurrentValue('dependentAxis', 'tickValues')}
				onChange={(val) =>
					updateAttributeForDevice('dependentAxis', {
						tickValues: val,
					})
				}
				help={__(
					'List of numbers seperated by commas (eg. 0, 50, 100). Setting this value will override the "Number of ticks" parameter'
				)}
			/>
			<ToggleControl
				label={__('Abbreviate ticks')}
				help={
					getCurrentValue('dependentAxis', 'abbreviateTicks')
						? __(
								'Tick values will be abbreviated when possible (eg. 100,000 -> 100K)'
							)
						: __('Tick values will be displayed as-is')
				}
				checked={getCurrentValue('dependentAxis', 'abbreviateTicks')}
				onChange={(newValue) =>
					updateAttributeForDevice('dependentAxis', {
						abbreviateTicks: newValue,
					})
				}
			/>
			<NumberControl
				label={__(
					'Abbreviated tick to set decimal place (when applicable)'
				)}
				value={getCurrentValue(
					'dependentAxis',
					'abbreviateTicksDecimals'
				)}
				disabled={!getCurrentValue('dependentAxis', 'abbreviateTicks')}
				disableUnits
				disabledUnits
				min={0}
				onChange={(val) =>
					updateAttributeForDevice('dependentAxis', {
						abbreviateTicksDecimals: formatNum(val, 'integer'),
					})
				}
			/>
			<ToggleControl
				label={__('Format ticks to locale string')}
				disabled={getCurrentValue('dependentAxis', 'abbreviateTicks')}
				help={
					getCurrentValue('dependentAxis', 'ticksToLocaleString')
						? __(
								'Tick values will be formatted to locale string (eg. 100000 -> 100,000)'
							)
						: __('Tick values will be displayed as-is')
				}
				checked={getCurrentValue(
					'dependentAxis',
					'ticksToLocaleString'
				)}
				onChange={(newValue) =>
					updateAttributeForDevice('dependentAxis', {
						ticksToLocaleString: newValue,
					})
				}
			/>
			<TextControl
				label={__('Tick Units')}
				value={getCurrentValue('dependentAxis', 'tickUnit')}
				onChange={(val) =>
					updateAttributeForDevice('dependentAxis', { tickUnit: val })
				}
			/>
			<SelectControl
				label={__('Tick Unit Position')}
				value={getCurrentValue('dependentAxis', 'tickUnitPosition')}
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
					updateAttributeForDevice('dependentAxis', {
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
				value={getCurrentValue('dependentAxis', 'tickLabels')?.fontSize}
				label={__('Tick Label Font Size')}
				onChange={(value) => {
					const currentTickLabels =
						getCurrentValue('dependentAxis', 'tickLabels') || {};
					updateAttributeForDevice('dependentAxis', {
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
			<Flex>
				<FlexItem>
					<NumberControl
						label={__('DX')}
						value={
							getCurrentValue('dependentAxis', 'tickLabels')?.dx
						}
						onChange={(value) => {
							const currentTickLabels =
								getCurrentValue(
									'dependentAxis',
									'tickLabels'
								) || {};
							updateAttributeForDevice('dependentAxis', {
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
							getCurrentValue('dependentAxis', 'tickLabels')?.dy
						}
						onChange={(value) => {
							const currentTickLabels =
								getCurrentValue(
									'dependentAxis',
									'tickLabels'
								) || {};
							updateAttributeForDevice('dependentAxis', {
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
				value={getCurrentValue('dependentAxis', 'tickLabels')?.angle}
				onChange={(val) => {
					const currentTickLabels =
						getCurrentValue('dependentAxis', 'tickLabels') || {};
					updateAttributeForDevice('dependentAxis', {
						tickLabels: {
							...currentTickLabels,
							angle: formatNum(val, 'integer'),
						},
					});
				}}
			/>
			<NumberControl
				label={__('Tick Label Max Width')}
				value={getCurrentValue('dependentAxis', 'tickLabels')?.maxWidth}
				disableUnits
				disabledUnits
				onChange={(val) => {
					const currentTickLabels =
						getCurrentValue('dependentAxis', 'tickLabels') || {};
					updateAttributeForDevice('dependentAxis', {
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
				label="Tick Label Vertical Anchor"
				value={
					getCurrentValue('dependentAxis', 'tickLabels')
						?.verticalAnchor
				}
				onChange={(type) => {
					const currentTickLabels =
						getCurrentValue('dependentAxis', 'tickLabels') || {};
					updateAttributeForDevice('dependentAxis', {
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
				label="Tick Label Text Anchor"
				value={
					getCurrentValue('dependentAxis', 'tickLabels')?.textAnchor
				}
				onChange={(type) => {
					const currentTickLabels =
						getCurrentValue('dependentAxis', 'tickLabels') || {};
					updateAttributeForDevice('dependentAxis', {
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
						value: getCurrentValue('dependentAxis', 'axis')?.stroke,
						onChange: (value) => {
							const currentAxis =
								getCurrentValue('dependentAxis', 'axis') || {};
							updateAttributeForDevice('dependentAxis', {
								axis: { ...currentAxis, stroke: value ?? '' },
							});
						},
						label: __('Axis Stroke'),
					},
					{
						value: getCurrentValue('dependentAxis', 'grid')?.stroke,
						onChange: (value) => {
							const currentGrid =
								getCurrentValue('dependentAxis', 'grid') || {};
							updateAttributeForDevice('dependentAxis', {
								grid: { ...currentGrid, stroke: value ?? '' },
							});
						},
						label: __('Grid Stroke'),
					},
					{
						value: getCurrentValue('dependentAxis', 'tickLabels')
							?.fill,
						onChange: (value) => {
							const currentTickLabels =
								getCurrentValue(
									'dependentAxis',
									'tickLabels'
								) || {};
							updateAttributeForDevice('dependentAxis', {
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
				value={getCurrentValue('dependentAxis', 'grid')?.strokeOpacity}
				step={0.1}
				min={0}
				max={1}
				disableUnits
				disabledUnits
				onChange={(val) => {
					const currentGrid =
						getCurrentValue('dependentAxis', 'grid') || {};
					updateAttributeForDevice('dependentAxis', {
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
					getCurrentValue('dependentAxis', 'grid')?.strokeDasharray
				}
				onChange={(val) => {
					const currentGrid =
						getCurrentValue('dependentAxis', 'grid') || {};
					updateAttributeForDevice('dependentAxis', {
						grid: { ...currentGrid, strokeDasharray: val },
					});
				}}
			/>
		</PanelBody>
	);
}

export default DependentAxisControls;
