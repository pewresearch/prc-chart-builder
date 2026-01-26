/* eslint-disable @wordpress/no-unsafe-wp-apis */
/* eslint-disable @wordpress/i18n-text-domain */
/* eslint-disable @wordpress/i18n-translator-comments */
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
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	RangeControl,
	ExternalLink,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

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
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	// Content attributes - NOT viewport-aware
	const io = attributes.io || {};
	const dataRender = attributes.dataRender || {};

	const style = getCurrentValue('tooltip', 'style') || {};
	const { maxWidth, maxHeight, minWidth, minHeight, fontSize } = style;
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
						checked={getCurrentValue('tooltip', 'active')}
						onChange={(newValue) =>
							updateAttributeForDevice('tooltip', {
								active: newValue,
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Show Header')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Show Header')}
						help={__('Show a header in the tooltip')}
						checked={getCurrentValue('tooltip', 'headerActive')}
						onChange={(newValue) =>
							updateAttributeForDevice('tooltip', {
								headerActive: newValue,
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
						value={getCurrentValue('tooltip', 'headerValue')}
						disabled={!getCurrentValue('tooltip', 'headerActive')}
						help={__('Select the value to display in the header')}
						options={[
							{ label: __('Column'), value: 'categoryValue' },
							{ label: __('Row'), value: 'independentValue' },
						]}
						onChange={(value) =>
							updateAttributeForDevice('tooltip', {
								headerValue: value,
							})
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
								value={getCurrentValue('tooltip', 'offsetX')}
								disabled={!getCurrentValue('tooltip', 'active')}
								onChange={(value) =>
									updateAttributeForDevice('tooltip', {
										offsetX: formatNum(value, 'integer'),
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('DY')}
								value={getCurrentValue('tooltip', 'offsetY')}
								disabled={!getCurrentValue('tooltip', 'active')}
								onChange={(value) =>
									updateAttributeForDevice('tooltip', {
										offsetY: formatNum(value, 'integer'),
									})
								}
							/>
						</FlexItem>
					</Flex>
					<PanelDescription>
						<Help>
							Determines the position of tooltip relative to the
							cursor
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
								value={minWidth}
								disabled={!getCurrentValue('tooltip', 'active')}
								onChange={(value) =>
									updateAttributeForDevice('tooltip', {
										style: {
											...style,
											minWidth: formatNum(
												value,
												'integer'
											),
										},
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('Max Width')}
								value={maxWidth}
								disabled={!getCurrentValue('tooltip', 'active')}
								onChange={(value) =>
									updateAttributeForDevice('tooltip', {
										style: {
											...style,
											maxWidth: formatNum(
												value,
												'integer'
											),
										},
									})
								}
							/>
						</FlexItem>
					</Flex>
					<Flex>
						<FlexItem>
							<NumberControl
								label={__('Min Height')}
								value={minHeight}
								disabled={!getCurrentValue('tooltip', 'active')}
								onChange={(value) =>
									updateAttributeForDevice('tooltip', {
										style: {
											...style,
											minHeight: formatNum(
												value,
												'integer'
											),
										},
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('Max Height')}
								value={maxHeight}
								disabled={!getCurrentValue('tooltip', 'active')}
								onChange={(value) =>
									updateAttributeForDevice('tooltip', {
										style: {
											...style,
											maxHeight: formatNum(
												value,
												'integer'
											),
										},
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
						disabled={!getCurrentValue('tooltip', 'active')}
						value={getCurrentValue('tooltip', 'format')}
						placeholder="{{row}}: {{value}}"
						onChange={(val) =>
							updateAttributeForDevice('tooltip', { format: val })
						}
					/>
					<ExternalLink href="https://platform.pewresearch.org/wiki/2024/06/25/chart-builder-documentation/#tooltip">
						For more information on tooltip formatting, see the dev
						docs.
					</ExternalLink>
				</WidePanelItem>
				{'time' === dataRender.xScale && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Tooltip Date Format')}
						panelId={clientId}
					>
						<SelectControl
							label={__('Time scale format')}
							value={getCurrentValue('tooltip', 'dateFormat')}
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
								updateAttributeForDevice('tooltip', {
									dateFormat: type,
								});
							}}
						/>
					</WidePanelItem>
				)}
				<WidePanelItem
					hasValue={() => true}
					label={__('Absolute Value')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Absolute Value')}
						checked={getCurrentValue('tooltip', 'absoluteValue')}
						disabled={!getCurrentValue('tooltip', 'active')}
						onChange={(newValue) =>
							updateAttributeForDevice('tooltip', {
								absoluteValue: newValue,
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
					hasValue={() => true}
					label={__('Abbreviate Value')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Abbreviate Value')}
						checked={getCurrentValue('tooltip', 'abbreviateValue')}
						disabled={!getCurrentValue('tooltip', 'active')}
						onChange={(newValue) =>
							updateAttributeForDevice('tooltip', {
								abbreviateValue: newValue,
							})
						}
					/>
					<PanelDescription>
						<Help>
							{__(
								'If checked, abbreviates the value displayed in the tooltip.'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Decimal Places')}
					panelId={clientId}
					isShownByDefault
				>
					<NumberControl
						label={__('Decimal Places')}
						value={getCurrentValue('tooltip', 'toFixedDecimal')}
						disabled={!getCurrentValue('tooltip', 'active')}
						min={0}
						max={100}
						onChange={(value) =>
							updateAttributeForDevice('tooltip', {
								toFixedDecimal: formatNum(value, 'integer'),
							})
						}
					/>
				</WidePanelItem>

				<WidePanelItem
					hasValue={() => true}
					label={__('Format Value')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Format Value')}
						checked={getCurrentValue('tooltip', 'toLocaleString')}
						disabled={!getCurrentValue('tooltip', 'active')}
						onChange={(newValue) =>
							updateAttributeForDevice('tooltip', {
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
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Font Size')}
					panelId={clientId}
				>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						value={fontSize}
						label={__('Tooltip Font Size')}
						disabled={!getCurrentValue('tooltip', 'active')}
						onChange={(value) => {
							updateAttributeForDevice('tooltip', {
								style: {
									...style,
									fontSize: formatNum(value, 'integer'),
								},
							});
						}}
					>
						<ToggleGroupControlOption label="10px" value={10} />
						<ToggleGroupControlOption label="12px" value={12} />
						<ToggleGroupControlOption label="13px" value={13} />
						<ToggleGroupControlOption label="14px" value={14} />
						<ToggleGroupControlOption label="16px" value={16} />
					</ToggleGroupControl>
					<PanelDescription>
						<Help>
							{__(
								'Select the font size for tooltip text. Default is 13px.'
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
						checked={getCurrentValue(
							'tooltip',
							'deemphasizeSiblings'
						)}
						onChange={(newValue) =>
							updateAttributeForDevice('tooltip', {
								deemphasizeSiblings: newValue,
							})
						}
					/>
					<NumberControl
						label={__('Opacity')}
						value={getCurrentValue('tooltip', 'deemphasizeOpacity')}
						min={0}
						max={1}
						step={0.1}
						disabled={
							!getCurrentValue('tooltip', 'deemphasizeSiblings')
						}
						onChange={(value) =>
							updateAttributeForDevice('tooltip', {
								deemphasizeOpacity: formatNum(value, 'float'),
							})
						}
					/>
				</WidePanelItem>
				{'map' === io.chartFamily && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Emphasize Stroke')}
						panelId={clientId}
					>
						<ToggleControl
							label={__('Emphasize Stroke')}
							checked={getCurrentValue(
								'tooltip',
								'emphasizeStrokeActive'
							)}
							onChange={(newValue) =>
								updateAttributeForDevice('tooltip', {
									emphasizeStrokeActive: newValue,
								})
							}
							help={__(
								'If selected, the stroke(outline) of the data point will be emphasized when hovering over it.'
							)}
						/>
						<PanelColorSettings
							__experimentalHasMultipleOrigins
							__experimentalIsRenderedInSidebar
							title={__('Emphasize Stroke Color')}
							style={{
								paddingLeft: '0',
								paddingRight: '0',
								marginTop: '10px',
							}}
							disabled={
								!getCurrentValue(
									'tooltip',
									'emphasizeStrokeActive'
								)
							}
							colorSettings={[
								{
									value: getCurrentValue(
										'tooltip',
										'emphasizeStrokeColor'
									),
									onChange: (value) =>
										updateAttributeForDevice('tooltip', {
											emphasizeStrokeColor: value,
										}),
									label: __('Stroke Color'),
								},
							]}
						/>
						<NumberControl
							label={__('Stroke Width')}
							value={getCurrentValue(
								'tooltip',
								'emphasizeStrokeWidth'
							)}
							min={0}
							max={10}
							step={0.1}
							disabled={
								!getCurrentValue(
									'tooltip',
									'emphasizeStrokeActive'
								)
							}
							onChange={(value) =>
								updateAttributeForDevice('tooltip', {
									emphasizeStrokeWidth: formatNum(
										value,
										'integer'
									),
								})
							}
						/>
					</WidePanelItem>
				)}
			</ToolsPanel>
		</PanelBody>
	);
}

export default TooltipControls;
