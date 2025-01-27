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
import { formatNum } from '../utils/helpers';

function XAxisControls({ attributes, setAttributes }) {
	const {
		chartType,
		xAxisActive,
		xScale,
		xDateFormat,
		xMinDomain,
		xMaxDomain,
		xTickMarksActive,
		xTickNum,
		xTickExact,
		xTickUnit,
		xTickUnitPosition,
		xTickLabelAngle,
		xTickLabelMaxWidth,
		xTickLabelDX,
		xTickLabelDY,
		xAbbreviateTicks,
		xAbbreviateTicksDecimals,
		xTicksToLocaleString,
		xTickLabelVerticalAnchor,
		xTickLabelTextAnchor,
		xLabel,
		xLabelFontSize,
		xLabelPadding,
		xLabelMaxWidth,
		xLabelTextFill,
		xAxisStroke,
		xGridStroke,
		xGridOpacity,
		xGridStrokeDasharray,
	} = attributes;
	return (
		<PanelBody
			title={__('Independent Axis Configuration')}
			initialOpen={false}
		>
			<PanelRow>
				The independent axis is almost always the x-axis, except in
				cases of horizontal bar charts or stack bar charts, where the
				independent values are plotted on the y-axis.
			</PanelRow>
			<ToggleControl
				label="Axis active"
				help={xAxisActive ? 'Shows axis.' : 'No axis.'}
				checked={xAxisActive}
				onChange={() => setAttributes({ xAxisActive: !xAxisActive })}
			/>
			<TextControl
				label={__('Label')}
				value={xLabel}
				onChange={(val) => setAttributes({ xLabel: val })}
			/>
			<NumberControl
				label={__('Label Padding')}
				help={__(
					'Determines the space between the first tick and the end of the axis'
				)}
				value={xLabelPadding}
				disableUnits
				disabledUnits
				onChange={(val) =>
					setAttributes({ xLabelPadding: formatNum(val, 'integer') })
				}
			/>
			<NumberControl
				label={__('Label Width')}
				help={__(
					'Determines the width of the label. Shorten to break label to multiple lines.'
				)}
				value={xLabelMaxWidth}
				disableUnits
				disabledUnits
				onChange={(val) =>
					setAttributes({ xLabelMaxWidth: formatNum(val, 'integer') })
				}
			/>
			<SelectControl
				label={__('Independent axis scale')}
				value={xScale}
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
				onChange={(type) => {
					setAttributes({
						xScale: type,
					});
				}}
			/>
			{'time' === xScale && (
				<SelectControl
					label={__('Time scale format')}
					value={xDateFormat}
					options={[
						{ value: '%Y', label: '2023' },
						{ value: "'%y", label: "'23" },
						{ value: '%-m/%Y', label: '4/2023' },
						{ value: '%-m/%y', label: '4/23' },
						{ value: '%m/%Y', label: '04/2023' },
						{ value: '%m/%y', label: '04/23' },
						{ value: '%B %Y', label: 'April 2023' },
						{ value: '%b %Y', label: 'Apr 2023' },
						{ value: "%B '%y", label: "April '23" },
						{ value: "%b '%y", label: "Apr '23" },
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
						{ value: "%B %-d '%y", label: "April 15 '23" },
						{ value: "%-d %B '%y", label: "15 April '23" },
						{ value: "%b %-d '%y", label: "Apr 15 '23" },
						{ value: "%-d %b '%y", label: "15 Apr '23" },
						{ value: '%B %-d', label: 'April 15' },
						{ value: '%-d %B', label: '15 April' },
						{ value: '%b %-d', label: 'Apr 15' },
						{ value: '%-d %b', label: '15 Apr' },
						{ value: '%B', label: 'April' },
						{ value: '%b', label: 'Apr' },
					]}
					onChange={(type) => {
						setAttributes({ xDateFormat: type });
					}}
				/>
			)}
			<PanelRow>Domain</PanelRow>
			<Flex>
				<FlexItem>
					<NumberControl
						label={__('Minimum')}
						value={xMinDomain}
						disabled={
							'stacked-bar' === chartType ||
							'bar' === chartType ||
							'pie' === chartType
						}
						disableUnits
						disabledUnits
						onChange={(val) => {
							setAttributes({
								xMinDomain: formatNum(val, 'integer'),
							});
						}}
					/>
				</FlexItem>
				<FlexItem>
					<NumberControl
						label={__('Maximum')}
						value={xMaxDomain}
						disabled={
							'stacked-bar' === chartType ||
							'bar' === chartType ||
							'pie' === chartType
						}
						disableUnits
						disabledUnits
						onChange={(val) => {
							setAttributes({
								xMaxDomain: formatNum(val, 'integer'),
							});
						}}
					/>
				</FlexItem>
			</Flex>

			<PanelRow>Axis Ticks and Tick Labels</PanelRow>
			<ToggleControl
				label={__('Show tick marks')}
				help={xTickMarksActive ? 'Shows tick marks.' : 'No tick marks.'}
				checked={xTickMarksActive}
				onChange={() =>
					setAttributes({ xTickMarksActive: !xTickMarksActive })
				}
			/>
			<NumberControl
				label={__('Number of ticks')}
				value={xTickNum}
				disableUnits
				disabledUnits
				onChange={(val) =>
					setAttributes({ xTickNum: formatNum(val, 'integer') })
				}
				help={__(
					'Note: This is return approximately the number of ticks requested, deferring to number that will evenly space ticks on the bar.'
				)}
			/>
			<TextControl
				label={__('Specific Ticks')}
				value={xTickExact}
				onChange={(val) => setAttributes({ xTickExact: val })}
				help={__(
					'List of numbers seperated by commas (eg. 0, 50, 100). Setting this value will override the "Number of Ticks" parameter'
				)}
			/>
			{'time' !== xScale && (
				<>
					<ToggleControl
						label={__('Abbreviate ticks')}
						help={
							xAbbreviateTicks
								? __(
										'Tick values will be abbreviated when possible (eg. 100,000 -> 100K)'
									)
								: __('Tick values will be displayed as-is')
						}
						checked={xAbbreviateTicks}
						onChange={() =>
							setAttributes({
								xAbbreviateTicks: !xAbbreviateTicks,
							})
						}
					/>
					<NumberControl
						label={__(
							'Abbreviated tick to set decimal place (when applicable)'
						)}
						value={xAbbreviateTicksDecimals}
						disabled={!xAbbreviateTicks}
						disableUnits
						disabledUnits
						min={0}
						onChange={(val) =>
							setAttributes({
								xAbbreviateTicksDecimals: formatNum(
									val,
									'integer'
								),
							})
						}
					/>
					<ToggleControl
						label={__('Format ticks to locale string')}
						disabled={xAbbreviateTicks}
						help={
							xTicksToLocaleString
								? __(
										'Tick values will be formatted to locale string (eg. 100000 -> 100,000)'
									)
								: __('Tick values will be displayed as-is')
						}
						checked={xTicksToLocaleString}
						onChange={() =>
							setAttributes({
								xTicksToLocaleString: !xTicksToLocaleString,
							})
						}
					/>
				</>
			)}
			<TextControl
				label={__('Tick Units')}
				value={xTickUnit}
				onChange={(val) => setAttributes({ xTickUnit: val })}
			/>
			<SelectControl
				label={__('Tick Unit Position')}
				value={xTickUnitPosition}
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
						xTickUnitPosition: type,
					});
				}}
			/>
			<PanelRow className="components-base-control__label">
				Label Size and Positioning
			</PanelRow>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				isBlock
				value={xLabelFontSize}
				label={__('Label Font Size')}
				onChange={(value) => {
					setAttributes({
						xLabelFontSize: formatNum(value, 'integer'),
					});
				}}
			>
				<ToggleGroupControlOption label="10px" value={10} />
				<ToggleGroupControlOption label="12px" value={12} />
				<ToggleGroupControlOption label="14px" value={14} />
				<ToggleGroupControlOption label="16px" value={16} />
			</ToggleGroupControl>
			<PanelRow>
				Determines the position of label relative to it's parent node
			</PanelRow>
			<Flex>
				<FlexItem>
					<NumberControl
						label={__('DX')}
						value={xTickLabelDX}
						onChange={(value) =>
							setAttributes({
								xTickLabelDX: formatNum(value, 'integer'),
							})
						}
					/>
				</FlexItem>
				<FlexItem>
					<NumberControl
						label={__('DY')}
						value={xTickLabelDY}
						onChange={(value) =>
							setAttributes({
								xTickLabelDY: formatNum(value, 'integer'),
							})
						}
					/>
				</FlexItem>
			</Flex>
			<AnglePickerControl
				label={__('Tick Label Angle')}
				__nextHasNoMarginBottom
				value={xTickLabelAngle}
				onChange={(val) =>
					setAttributes({
						xTickLabelAngle: formatNum(val, 'integer'),
					})
				}
			/>
			<NumberControl
				label={__('Tick Label Max Width')}
				value={xTickLabelMaxWidth}
				disableUnits
				disabledUnits
				onChange={(val) =>
					setAttributes({
						xTickLabelMaxWidth: formatNum(val, 'integer'),
					})
				}
				help={__(
					'Determines the width of the tick label. Shorten to break label to multiple lines.'
				)}
			/>

			<ToggleGroupControl
				__nextHasNoMarginBottom
				isBlock
				value={xTickLabelVerticalAnchor}
				label="Tick Label Vertical Anchor"
				onChange={(type) => {
					setAttributes({
						xTickLabelVerticalAnchor: type,
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
				value={xTickLabelTextAnchor}
				label="Tick Label Text Anchor"
				onChange={(type) => {
					setAttributes({
						xTickLabelTextAnchor: type,
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
						value: xAxisStroke,
						onChange: (value) =>
							setAttributes({ xAxisStroke: value }),
						label: __('Axis Stroke'),
					},
					{
						value: xGridStroke,
						onChange: (value) =>
							setAttributes({ xGridStroke: value }),
						label: __('Grid Stroke'),
					},
					{
						value: xLabelTextFill,
						onChange: (value) =>
							setAttributes({ xLabelTextFill: value }),
						label: __('Text Fill'),
					},
				]}
			/>
			<NumberControl
				label={__('Grid Opacity')}
				value={xGridOpacity}
				disableUnits
				disabledUnits
				step={0.1}
				min={0}
				max={1}
				onChange={(val) =>
					setAttributes({ xGridOpacity: formatNum(val, 'integer') })
				}
			/>
			<TextControl
				label={__('Grid Stroke Dasharray')}
				value={xGridStrokeDasharray}
				onChange={(val) => setAttributes({ xGridStrokeDasharray: val })}
			/>
		</PanelBody>
	);
}

export default XAxisControls;
