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

function YAxisControls({ attributes, setAttributes }) {
	const {
		yAxisActive,
		yLabel,
		yLabelPadding,
		yLabelMaxWidth,
		yMinDomain,
		yMaxDomain,
		yTickMarksActive,
		yTickNum,
		yTickExact,
		yTickUnit,
		yTickUnitPosition,
		yTickLabelAngle,
		yTickLabelMaxWidth,
		yTickLabelDX,
		yTickLabelDY,
		yAbbreviateTicks,
		yAbbreviateTicksDecimals,
		yTicksToLocaleString,
		yTickLabelVerticalAnchor,
		yTickLabelTextAnchor,
		showYMinDomainLabel,
		yAxisStroke,
		yGridStroke,
		yGridOpacity,
		yGridStrokeDasharray,
	} = attributes;
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
				help={yAxisActive ? 'Shows axis.' : 'No y-axis.'}
				checked={yAxisActive}
				onChange={() => setAttributes({ yAxisActive: !yAxisActive })}
			/>
			<TextControl
				label={__('Label')}
				value={yLabel}
				onChange={(val) => setAttributes({ yLabel: val })}
			/>
			<NumberControl
				label={__('Label Padding')}
				help={__('Determines the space between the label and the axis')}
				value={yLabelPadding}
				disableUnits
				disabledUnits
				onChange={(val) =>
					setAttributes({ yLabelPadding: formatNum(val, 'integer') })
				}
			/>
			<NumberControl
				label={__('Label Width')}
				help={__(
					'Determines the width of the label. Shorten to break label to multiple lines.'
				)}
				value={yLabelMaxWidth}
				disableUnits
				disabledUnits
				onChange={(val) =>
					setAttributes({ yLabelMaxWidth: formatNum(val, 'integer') })
				}
			/>
			<PanelRow>Y Domain</PanelRow>
			<Flex>
				<FlexItem>
					<NumberControl
						label={__('Minimum')}
						value={yMinDomain}
						disableUnits
						disabledUnits
						onChange={(val) =>
							setAttributes({
								yMinDomain: formatNum(val, 'integer'),
							})
						}
					/>
				</FlexItem>
				<FlexItem>
					<NumberControl
						label={__('Maximum')}
						value={yMaxDomain}
						disableUnits
						disabledUnits
						onChange={(val) =>
							setAttributes({
								yMaxDomain: formatNum(val, 'integer'),
							})
						}
					/>
				</FlexItem>
			</Flex>
			<PanelRow>Axis Ticks and Tick Labels</PanelRow>
			<ToggleControl
				label={__('Show tick marks')}
				help={yTickMarksActive ? 'Shows tick marks.' : 'No tick marks.'}
				checked={yTickMarksActive}
				onChange={() =>
					setAttributes({ yTickMarksActive: !yTickMarksActive })
				}
			/>
			<NumberControl
				label={__('Number of ticks')}
				value={yTickNum}
				disableUnits
				disabledUnits
				min={1}
				onChange={(val) =>
					setAttributes({ yTickNum: formatNum(val, 'integer') })
				}
				help={__(
					'Note: This is return approximately the number of ticks requested, deferring to number that will evenly space ticks on the bar.'
				)}
			/>
			<ToggleControl
				label="Show min domain label"
				help={__(
					"Forces the minimum domain value's lable to appear on axis. May overlap with x axis."
				)}
				checked={showYMinDomainLabel}
				onChange={() =>
					setAttributes({ showYMinDomainLabel: !showYMinDomainLabel })
				}
			/>
			<TextControl
				label={__('Specific Ticks')}
				value={yTickExact}
				onChange={(val) => setAttributes({ yTickExact: val })}
				help={__(
					'List of numbers seperated by commas (eg. 0, 50, 100). Setting this value will override the "Number of ticks" parameter'
				)}
			/>
			<ToggleControl
				label={__('Abbreviate ticks')}
				help={
					yAbbreviateTicks
						? __(
								'Tick values will be abbreviated when possible (eg. 100,000 -> 100K)'
						  )
						: __('Tick values will be displayed as-is')
				}
				checked={yAbbreviateTicks}
				onChange={() =>
					setAttributes({ yAbbreviateTicks: !yAbbreviateTicks })
				}
			/>
			<NumberControl
				label={__(
					'Abbreviated tick to set decimal place (when applicable)'
				)}
				value={yAbbreviateTicksDecimals}
				disabled={!yAbbreviateTicks}
				disableUnits
				disabledUnits
				min={0}
				onChange={(val) =>
					setAttributes({
						yAbbreviateTicksDecimals: formatNum(val, 'integer'),
					})
				}
			/>
			<ToggleControl
				label={__('Format ticks to locale string')}
				disabled={yAbbreviateTicks}
				help={
					yTicksToLocaleString
						? __(
								'Tick values will be formatted to locale string (eg. 100000 -> 100,000)'
						  )
						: __('Tick values will be displayed as-is')
				}
				checked={yTicksToLocaleString}
				onChange={() =>
					setAttributes({
						yTicksToLocaleString: !yTicksToLocaleString,
					})
				}
			/>
			<TextControl
				label={__('Tick Units')}
				value={yTickUnit}
				onChange={(val) => setAttributes({ yTickUnit: val })}
			/>
			<SelectControl
				label={__('Tick Unit Position')}
				value={yTickUnitPosition}
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
					setAttributes({
						yTickUnitPosition: type,
					});
				}}
			/>
			<Flex>
				<FlexItem>
					<NumberControl
						label={__('DX')}
						value={yTickLabelDX}
						onChange={(value) =>
							setAttributes({
								yTickLabelDX: formatNum(value, 'integer'),
							})
						}
					/>
				</FlexItem>
				<FlexItem>
					<NumberControl
						label={__('DY')}
						value={yTickLabelDY}
						onChange={(value) =>
							setAttributes({
								yTickLabelDY: formatNum(value, 'integer'),
							})
						}
					/>
				</FlexItem>
			</Flex>

			<AnglePickerControl
				label={__('Tick Label Angle')}
				__nextHasNoMarginBottom
				value={yTickLabelAngle}
				onChange={(val) =>
					setAttributes({
						yTickLabelAngle: formatNum(val, 'integer'),
					})
				}
			/>
			<NumberControl
				label={__('Tick Label Max Width')}
				value={yTickLabelMaxWidth}
				disableUnits
				disabledUnits
				onChange={(val) =>
					setAttributes({
						yTickLabelMaxWidth: formatNum(val, 'integer'),
					})
				}
				help={__(
					'Determines the width of the tick label. Shorten to break label to multiple lines.'
				)}
			/>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				isBlock
				label="Tick Label Vertical Anchor"
				value={yTickLabelVerticalAnchor}
				onChange={(type) => {
					setAttributes({
						yTickLabelVerticalAnchor: type,
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
				value={yTickLabelTextAnchor}
				onChange={(type) => {
					setAttributes({
						yTickLabelTextAnchor: type,
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
						value: yAxisStroke,
						onChange: (value) =>
							setAttributes({ yAxisStroke: value }),
						label: __('Axis Stroke'),
					},
					{
						value: yGridStroke,
						onChange: (value) =>
							setAttributes({ yGridStroke: value }),
						label: __('Grid Stroke'),
					},
				]}
			/>
			<NumberControl
				label={__('Grid Opacity')}
				value={yGridOpacity}
				step={0.1}
				min={0}
				max={1}
				disableUnits
				disabledUnits
				onChange={(val) =>
					setAttributes({ yGridOpacity: formatNum(val, 'integer') })
				}
			/>
			<TextControl
				label={__('Grid Stroke Dasharray')}
				value={yGridStrokeDasharray}
				onChange={(val) => setAttributes({ yGridStrokeDasharray: val })}
			/>
		</PanelBody>
	);
}

export default YAxisControls;
