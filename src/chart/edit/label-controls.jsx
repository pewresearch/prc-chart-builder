/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	SelectControl,
	TextControl,
	Flex,
	FlexItem,
	Button,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	PanelBody,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';
import { POSITION_DISABLED_CHART_TYPES } from './popover/utils';

const PanelDescription = styled.div`
	grid-column: span 2;
`;
const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;
const SingleColumnItem = styled(ToolsPanelItem)`
	grid-column: span 1;
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

function LabelControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const layoutObj = getCurrentValue('layout') || {};
	const { type: chartType, orientation } = layoutObj;
	const positionDisabled = POSITION_DISABLED_CHART_TYPES.includes(chartType);
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
	return (
		<PanelBody title={__('Labels')} initialOpen={false}>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<ToolsPanelItem
					hasValue={() => true}
					label={__('Labels Active')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label={__('Labels Active')}
						checked={getCurrentValue('labels', 'active')}
						onChange={(newValue) =>
							updateAttributeForDevice('labels', {
								active: newValue,
							})
						}
					/>
					{'map-usa' === chartType && (
						<ToggleControl
							label={__('Ignore Small State Labels')}
							checked={
								getCurrentValue(
									'map',
									'ignoreSmallStateLabels'
								) || false
							}
							disabled={!getCurrentValue('labels', 'active')}
							onChange={(newValue) => {
								const map = getCurrentValue('map') || {};
								updateAttributeForDevice('map', {
									...map,
									ignoreSmallStateLabels: newValue,
								});
							}}
						/>
					)}

					{'line' === chartType && (
						<ToolsPanelItem
							hasValue={() => true}
							label={__('Show First and Last Points Only')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleControl
								label={__('Display only first and last labels')}
								checked={getCurrentValue(
									'labels',
									'showFirstLastPointsOnly'
								)}
								disabled={!getCurrentValue('labels', 'active')}
								onChange={(newValue) =>
									updateAttributeForDevice('labels', {
										showFirstLastPointsOnly: newValue,
									})
								}
							/>
						</ToolsPanelItem>
					)}
				{chartType === 'pie' && (
					<ToolsPanelItem
						hasValue={() => true}
						label={__('Category Labels Active')}
						isShownByDefault
						panelId={clientId}
					>
						<ToggleControl
							label={__('Category Labels Active')}
							checked={
								getCurrentValue(
									'pie',
									'showCategoryLabels'
								) || false
							}
							onChange={(newValue) => {
								const pie = getCurrentValue('pie') || {};
								updateAttributeForDevice('pie', {
									...pie,
									showCategoryLabels: newValue,
								});
							}}
						/>
					</ToolsPanelItem>
				)}
				{chartType === 'treemap' && (
					<>
						<ToolsPanelItem
							hasValue={() => true}
							label={__('Show Values in Rectangles')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleControl
								label={__('Show Values in Rectangles')}
								help={__(
									'Display the numeric data value inside each rectangle below the name.'
								)}
								checked={
									getCurrentValue(
										'treemap',
										'showValues'
									) || false
								}
								disabled={
									!getCurrentValue('labels', 'active')
								}
								onChange={(newValue) => {
									const treemap =
										getCurrentValue('treemap') || {};
									updateAttributeForDevice('treemap', {
										...treemap,
										showValues: newValue,
									});
								}}
							/>
						</ToolsPanelItem>
						<ToolsPanelItem
							hasValue={() => true}
							label={__('Show Group Labels')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleControl
								label={__('Show Group Labels')}
								help={__(
									'Display group header labels at the top of each group section.'
								)}
								checked={
									getCurrentValue(
										'treemap',
										'showGroupLabels'
									) ?? true
								}
								disabled={
									!getCurrentValue('labels', 'active')
								}
								onChange={(newValue) => {
									const treemap =
										getCurrentValue('treemap') || {};
									updateAttributeForDevice('treemap', {
										...treemap,
										showGroupLabels: newValue,
									});
								}}
							/>
						</ToolsPanelItem>
						<ToolsPanelItem
							hasValue={() => true}
							label={__('Label Min Area')}
							isShownByDefault
							panelId={clientId}
						>
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
								disabled={
									!getCurrentValue('labels', 'active')
								}
								onChange={(value) => {
									const treemap =
										getCurrentValue('treemap') || {};
									updateAttributeForDevice('treemap', {
										...treemap,
										labelMinArea: formatNum(
											value,
											'integer'
										),
									});
								}}
							/>
						</ToolsPanelItem>
					</>
				)}
			</ToolsPanelItem>
				<WidePanelItem
					hasValue={() => getCurrentValue('labels', 'fontSize')}
					label={__('Label Font Size')}
					panelId={clientId}
				>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						value={getCurrentValue('labels', 'fontSize')}
						label={__('Label Font Size')}
						disabled={!getCurrentValue('labels', 'active')}
						onChange={(value) => {
							updateAttributeForDevice('labels', {
								fontSize: formatNum(value, 'integer'),
							});
						}}
					>
						<ToggleGroupControlOption label="10px" value={10} />
						<ToggleGroupControlOption label="12px" value={12} />
						<ToggleGroupControlOption label="14px" value={14} />
						<ToggleGroupControlOption label="16px" value={16} />
					</ToggleGroupControl>
					<PanelDescription>
						<Help>
							{__(
								'Select the font size of the label. Default is 10px.'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
			<WidePanelItem
				hasValue={() =>
					getCurrentValue('labels', 'labelPositionDX')
				}
				label={__('Label Positioning')}
				panelId={clientId}
				isShownByDefault
			>
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
							disabled={
								!getCurrentValue('labels', 'active') ||
								positionDisabled
							}
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
							disabled={
								!getCurrentValue('labels', 'active') ||
								positionDisabled
							}
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
			</WidePanelItem>
				{hasCustomPositions && (
					<WidePanelItem
						hasValue={() => hasCustomPositions}
						label={__('Reset Custom Positions')}
						panelId={clientId}
					>
						<Button
							variant="secondary"
							isDestructive
							onClick={handleResetLabelPositions}
							disabled={!getCurrentValue('labels', 'active')}
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
					</WidePanelItem>
				)}
				<WidePanelItem
					hasValue={() => getCurrentValue('labels', 'absoluteValue')}
					label={__('Absolute Value')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Absolute Value')}
						checked={
							getCurrentValue('labels', 'absoluteValue') || false
						}
						disabled={!getCurrentValue('labels', 'active')}
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
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => getCurrentValue('labels', 'toLocaleString')}
					label={__('Format Value')}
					panelId={clientId}
					isShownByDefault
				>
					<ToggleControl
						label={__('Format Value to Locale String')}
						checked={
							getCurrentValue('labels', 'toLocaleString') || false
						}
						disabled={!getCurrentValue('labels', 'active')}
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
				</WidePanelItem>
				{/* HERE */}
				<WidePanelItem
					hasValue={() =>
						getCurrentValue('labels', 'truncateDecimal')
					}
					label={__('Truncate Trailing Decimals')}
					panelId={clientId}
					isShownByDefault
				>
					<ToggleControl
						label={__('Truncate Trailing Decimals')}
						checked={
							getCurrentValue('labels', 'truncateDecimal') ||
							false
						}
						disabled={!getCurrentValue('labels', 'active')}
						onChange={(newValue) =>
							updateAttributeForDevice('labels', {
								truncateDecimal: newValue,
							})
						}
					/>
					<PanelDescription>
						<Help>
							{__(
								'If checked and number has fewer decimal places than the configuration requests, will remove all extraneous decimals from numbers. Eg. 1.6000 -> 1.6.'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => getCurrentValue('labels', 'toFixedDecimal')}
					label={__('Decimal Places')}
					panelId={clientId}
					isShownByDefault
				>
					<NumberControl
						label={__('Decimal Places')}
						value={getCurrentValue('labels', 'toFixedDecimal')}
						disabled={!getCurrentValue('labels', 'active')}
						min={0}
						max={100}
						onChange={(value) =>
							updateAttributeForDevice('labels', {
								toFixedDecimal: formatNum(value, 'integer'),
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => getCurrentValue('labels', 'labelUnit')}
					label={__('Label Unit')}
					panelId={clientId}
					isShownByDefault
				>
					<TextControl
						label={__('Label Unit')}
						value={getCurrentValue('labels', 'labelUnit')}
						disabled={!getCurrentValue('labels', 'active')}
						onChange={(value) =>
							updateAttributeForDevice('labels', {
								labelUnit: value,
							})
						}
					/>
					<PanelDescription>
						<Help>{__('Add a unit to the label. eg. % or $')}</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() =>
						getCurrentValue('labels', 'labelUnitPosition')
					}
					label={__('Label Unit Position')}
					panelId={clientId}
				>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						value={getCurrentValue('labels', 'labelUnitPosition')}
						label="Label Unit Position"
						onChange={(type) => {
							updateAttributeForDevice('labels', {
								labelUnitPosition: type,
							});
						}}
					>
						<ToggleGroupControlOption label="Start" value="start" />
						<ToggleGroupControlOption label="End" value="end" />
					</ToggleGroupControl>
					<PanelDescription>
						<Help>
							{__(
								'Select the position of the label unit relative to the label.'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
				{('bar' === chartType ||
					'diverging-bar' === chartType ||
					'stacked-bar' === chartType ||
					'exploded-bar' === chartType) && (
					<>
						<WidePanelItem
							hasValue={() =>
								getCurrentValue('labels', 'labelPositionBar')
							}
							label={__('Label Position')}
							panelId={clientId}
						>
							<ToggleGroupControl
								__nextHasNoMarginBottom
								isBlock
								value={getCurrentValue(
									'labels',
									'labelPositionBar'
								)}
								disabled={!getCurrentValue('labels', 'active')}
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
						</WidePanelItem>
						<SingleColumnItem
							hasValue={() =>
								getCurrentValue('labels', 'labelCutoff')
							}
							label={__('Label Cutoff')}
							panelId={clientId}
						>
							<NumberControl
								label={__('🖥️ Label Cutoff')}
								value={getCurrentValue('labels', 'labelCutoff')}
								disabled={
									!getCurrentValue('labels', 'active') ||
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
										'Hide labels that are smaller than this value.'
									)}
								</Help>
							</PanelDescription>
						</SingleColumnItem>
						<SingleColumnItem
							hasValue={() =>
								getCurrentValue('labels', 'labelCutoffMobile')
							}
							label={__('Label Cutoff Mobile')}
							panelId={clientId}
						>
							<NumberControl
								label={__('📱 Label Cutoff')}
								value={getCurrentValue(
									'labels',
									'labelCutoffMobile'
								)}
								disabled={
									!getCurrentValue('labels', 'active') ||
									'outside' ===
										getCurrentValue(
											'labels',
											'labelPositionBar'
										) ||
									'vertical' === orientation
								}
								onChange={(value) =>
									updateAttributeForDevice('labels', {
										labelCutoffMobile: formatNum(
											value,
											'integer'
										),
									})
								}
							/>
							<PanelDescription>
								<Help>
									{__(
										'Hide labels that are smaller than this value on mobile.'
									)}
								</Help>
							</PanelDescription>
						</SingleColumnItem>
					</>
				)}
				<WidePanelItem
					hasValue={() => getCurrentValue('labels', 'color')}
					label={__('Label Color')}
					panelId={clientId}
				>
					<SelectControl
						label={__('Label Color')}
						value={getCurrentValue('labels', 'color')}
						disabled={!getCurrentValue('labels', 'active')}
						onChange={(value) =>
							updateAttributeForDevice('labels', { color: value })
						}
						options={[
							{ label: __('Contrast'), value: 'contrast' },
							{ label: __('Inherit'), value: 'inherit' },
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
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default LabelControls;
