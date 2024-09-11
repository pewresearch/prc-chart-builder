/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Flex,
	FlexItem,
	PanelBody,
	TextControl,
	ToggleControl,
	SelectControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	RangeControl,
	ExternalLink,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';

const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
	display: block;
`;
const PanelDescription = styled.div`
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

function TooltipControls({ attributes, setAttributes, clientId }) {
	const {
		tooltipFormat,
		tooltipActive,
		tooltipActiveOnMobile,
		mobileBreakpoint,
		tooltipOffsetX,
		tooltipHeaderActive,
		tooltipHeaderValue,
		tooltipOffsetY,
		deemphasizeSiblings,
		deemphasizeOpacity,
		tooltipAbsoluteValue,
		xScale,
		tooltipDateFormat,
		tooltipFormatValue,
		tooltipMinWidth,
		tooltipMaxWidth,
		toltipMinHeight,
		tooltipMaxHeight,
	} = attributes;
	return (
		<PanelBody title={__('Tooltip')} initialOpen={false}>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<WidePanelItem
					hasValue={() => true}
					label={__('Show Tooltip')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label={__('Show Tooltip')}
						checked={tooltipActive}
						onChange={() =>
							setAttributes({ tooltipActive: !tooltipActive })
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Show Tooltip on Mobile')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label={__('Show Tooltip on Mobile')}
						help={__(
							'Show a tooltip on mobile devices. If deselected, the tooltip will only on screens wider than a specified mobile breakpoint.'
						)}
						checked={tooltipActiveOnMobile}
						onChange={() =>
							setAttributes({
								tooltipActiveOnMobile: !tooltipActiveOnMobile,
							})
						}
					/>
					{!tooltipActiveOnMobile && (
						<RangeControl
							label={__('Mobile Breakpoint')}
							help={__(
								'If the screen width is less than this value, the tooltip will not be displayed on mobile devices.'
							)}
							withInputField
							min={0}
							max={1152}
							value={parseInt(mobileBreakpoint, 10)}
							onChange={(bp) =>
								setAttributes({
									mobileBreakpoint: formatNum(bp, 'integer'),
								})
							}
						/>
					)}
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Show Header')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Show Header')}
						help={__('Show a header in the tooltip')}
						checked={tooltipHeaderActive}
						onChange={() =>
							setAttributes({
								tooltipHeaderActive: !tooltipHeaderActive,
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Header Value')}
					panelId={clientId}
				>
					<SelectControl
						label={__('Header Value')}
						value={tooltipHeaderValue}
						disabled={!tooltipHeaderActive}
						help={__('Select the value to display in the header')}
						options={[
							{ label: __('Column'), value: 'categoryValue' },
							{ label: __('Row'), value: 'independentValue' },
						]}
						onChange={(value) =>
							setAttributes({ tooltipHeaderValue: value })
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Tooltip Positioning')}
					panelId={clientId}
				>
					<StyledLabel>Tooltip Positioning</StyledLabel>
					<Flex>
						<FlexItem>
							<NumberControl
								label={__('DX')}
								value={tooltipOffsetX}
								disabled={!tooltipActive}
								onChange={(value) =>
									setAttributes({
										tooltipOffsetX: formatNum(
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
								value={tooltipOffsetY}
								disabled={!tooltipActive}
								onChange={(value) =>
									setAttributes({
										tooltipOffsetY: formatNum(
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
							Determines the position of tooltip relative to it’s
							data point
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Tooltip Size')}
					panelId={clientId}
				>
					<StyledLabel>Tooltip Size</StyledLabel>
					<Flex>
						<FlexItem>
							<NumberControl
								label={__('Min Width')}
								value={tooltipMinWidth}
								disabled={!tooltipActive}
								onChange={(value) =>
									setAttributes({
										tooltipMinWidth: formatNum(
											value,
											'integer'
										),
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('Max Width')}
								value={tooltipMaxWidth}
								disabled={!tooltipActive}
								onChange={(value) =>
									setAttributes({
										tooltipMaxWidth: formatNum(
											value,
											'integer'
										),
									})
								}
							/>
						</FlexItem>
					</Flex>
					<Flex>
						<FlexItem>
							<NumberControl
								label={__('Min Height')}
								value={toltipMinHeight}
								disabled={!tooltipActive}
								onChange={(value) =>
									setAttributes({
										toltipMinHeight: formatNum(
											value,
											'integer'
										),
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('Max Height')}
								value={tooltipMaxHeight}
								disabled={!tooltipActive}
								onChange={(value) =>
									setAttributes({
										tooltipMaxHeight: formatNum(
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
							Define the minimum and maximum size of the tooltip
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Tooltip Format')}
					panelId={clientId}
				>
					<TextControl
						label={__('Tooltip Format')}
						// translators: %1$s: x value, %2$s: y value
						help={__(
							"Tooltip formatter is a string that takes up to three variables. The first variable {{column}} corresponds with the category/column header of a data point, the second {{value}}, the numerical value, and the third {{row}} is the row of the value. (eg. '{{column}}: {{value}} people in {{row}}' would return something like '2010: 500 people in France'). Adding `.toLowerCase()` to the end of any of these variables will lowercase the entire string."
						)}
						disabled={!tooltipActive}
						value={tooltipFormat}
						placeholder="{{row}}: {{value}}"
						onChange={(val) =>
							setAttributes({ tooltipFormat: val })
						}
					/>
					<ExternalLink href="https://www.pewresearch.org/devdocs/documentation/chart-builder/#tooltip">
						For more information on tooltip formatting, see the dev
						docs.
					</ExternalLink>
				</WidePanelItem>
				{'time' === xScale && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Tooltip Date Format')}
						panelId={clientId}
					>
						<SelectControl
							label={__('Time scale format')}
							value={tooltipDateFormat}
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
								{
									value: '%B %-d, %Y',
									label: 'April 15, 2023',
								},
								{ value: '%B %-d %Y', label: 'April 15 2023' },
								{ value: '%b %-d, %Y', label: 'Apr 15, 2023' },
								{ value: '%b %-d %Y', label: 'Apr 15 2023' },
								{
									value: '%-d %B, %Y',
									label: '15 April, 2023',
								},
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
								setAttributes({ tooltipDateFormat: type });
							}}
						/>
					</WidePanelItem>
				)}
				<WidePanelItem
					hasValue={() => tooltipAbsoluteValue}
					label={__('Absolute Value')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Absolute Value')}
						checked={tooltipAbsoluteValue}
						disabled={!tooltipActive}
						onChange={() =>
							setAttributes({
								tooltipAbsoluteValue: !tooltipAbsoluteValue,
							})
						}
					/>
					<PanelDescription>
						<Help>
							{__(
								'If the chart is displaying negative values, this will ensure the value displayed in the tooltip is always positive. Often used on bar charts with a diverging axis.'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => tooltipFormatValue}
					label={__('Format Value')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Format Value')}
						checked={tooltipFormatValue}
						disabled={!tooltipActive}
						onChange={() =>
							setAttributes({
								tooltipFormatValue: !tooltipFormatValue,
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
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Deemphasize Siblings')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Deemphasize Siblings')}
						help={__(
							'When hovering over a data point, deemphasize all other data points visually'
						)}
						checked={deemphasizeSiblings}
						onChange={() =>
							setAttributes({
								deemphasizeSiblings: !deemphasizeSiblings,
							})
						}
					/>
					<NumberControl
						label={__('Opacity')}
						value={deemphasizeOpacity}
						min={0}
						max={1}
						step={0.1}
						disabled={!deemphasizeSiblings}
						onChange={(value) =>
							setAttributes({
								deemphasizeOpacity: formatNum(value, 'float'),
							})
						}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default TooltipControls;
