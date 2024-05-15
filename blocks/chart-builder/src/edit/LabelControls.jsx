/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * External dependencies
 */
import styled from 'styled-components';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	ToggleControl,
	SelectControl,
	TextControl,
	Flex,
	FlexItem,
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

function LabelControls({ attributes, setAttributes, chartType, clientId }) {
	const {
		chartOrientation,
		labelsActive,
		labelColor,
		labelFontSize,
		labelPositionDY,
		labelPositionDX,
		labelToFixedDecimal,
		labelUnit,
		labelUnitPosition,
		barLabelPosition,
		barLabelCutoff,
		barLabelCutoffMobile,
		labelAbsoluteValue,
		labelFormatValue,
		pieCategoryLabelsActive,
		showFirstLastPointsOnly,
	} = attributes;
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
						checked={labelsActive}
						onChange={() =>
							setAttributes({ labelsActive: !labelsActive })
						}
					/>
					{'line' === chartType && (
						<ToolsPanelItem
							hasValue={() => true}
							label={__('Show First and Last Points Only')}
							isShownByDefault
							panelId={clientId}
						>
							<ToggleControl
								label={__('Display only first and last labels')}
								checked={showFirstLastPointsOnly}
								disabled={!labelsActive}
								onChange={() =>
									setAttributes({
										showFirstLastPointsOnly:
											!showFirstLastPointsOnly,
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
								checked={pieCategoryLabelsActive}
								onChange={() =>
									setAttributes({
										pieCategoryLabelsActive:
											!pieCategoryLabelsActive,
									})
								}
							/>
						</ToolsPanelItem>
					)}
				</ToolsPanelItem>
				<WidePanelItem
					hasValue={() => labelFontSize}
					label={__('Label Font Size')}
					panelId={clientId}
				>
					<NumberControl
						label={__('Label Font Size')}
						value={labelFontSize}
						disabled={!labelsActive}
						onChange={(value) =>
							setAttributes({
								labelFontSize: formatNum(value, 'integer'),
							})
						}
					/>
					<PanelDescription>
						<Help>
							{__(
								'Select the font size of the label. Default is 10px.'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => labelPositionDX}
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
								value={labelPositionDX}
								disabled={!labelsActive}
								onChange={(value) =>
									setAttributes({
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
								value={labelPositionDY}
								disabled={!labelsActive}
								onChange={(value) =>
									setAttributes({
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
							{__(
								'Select the position of the label relative to it’s parent node, as well as any label units number formatting.'
							)}
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => labelAbsoluteValue}
					label={__('Absolute Value')}
					panelId={clientId}
				>
					<ToggleControl
						label={__('Absolute Value')}
						checked={labelAbsoluteValue}
						disabled={!labelsActive}
						onChange={() =>
							setAttributes({
								labelAbsoluteValue: !labelAbsoluteValue,
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
					hasValue={() => labelFormatValue}
					label={__('Format Value')}
					panelId={clientId}
					isShownByDefault
				>
					<ToggleControl
						label={__('Format Value')}
						checked={labelFormatValue}
						disabled={!labelsActive}
						onChange={() =>
							setAttributes({
								labelFormatValue: !labelFormatValue,
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
					hasValue={() => labelToFixedDecimal}
					label={__('Decimal Places')}
					panelId={clientId}
				>
					<NumberControl
						label={__('Decimal Places')}
						value={labelToFixedDecimal}
						disabled={!labelsActive}
						onChange={(value) =>
							setAttributes({
								labelToFixedDecimal: formatNum(
									value,
									'integer'
								),
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => labelUnit}
					label={__('Label Unit')}
					panelId={clientId}
					isShownByDefault
				>
					<TextControl
						label={__('Label Unit')}
						value={labelUnit}
						disabled={!labelsActive}
						onChange={(value) =>
							setAttributes({ labelUnit: value })
						}
					/>
					<PanelDescription>
						<Help>{__('Add a unit to the label. eg. % or $')}</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => labelUnitPosition}
					label={__('Label Unit Position')}
					panelId={clientId}
				>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						value={labelUnitPosition}
						label="Label Unit Position"
						onChange={(type) => {
							setAttributes({
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
					<Fragment>
						<WidePanelItem
							hasValue={() => barLabelPosition}
							label={__('Label Position')}
							panelId={clientId}
						>
							<ToggleGroupControl
								__nextHasNoMarginBottom
								isBlock
								value={barLabelPosition}
								disabled={!labelsActive}
								label="Tick Label Vertical Anchor"
								onChange={(type) => {
									setAttributes({
										barLabelPosition: type,
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
							hasValue={() => barLabelCutoff}
							label={__('Label Cutoff')}
							panelId={clientId}
						>
							<NumberControl
								label={__('🖥️ Label Cutoff')}
								value={barLabelCutoff}
								disabled={
									!labelsActive ||
									'outside' === barLabelPosition
								}
								onChange={(value) =>
									setAttributes({
										barLabelCutoff: formatNum(
											value,
											'integer'
										),
									})
								}
							/>
							<PanelDescription>
								<Help>
									{__(
										'Hide labels that are smaller than this value. '
									)}
								</Help>
							</PanelDescription>
						</SingleColumnItem>
						<SingleColumnItem
							hasValue={() => barLabelCutoffMobile}
							label={__('Label Cutoff Mobile')}
							panelId={clientId}
						>
							<NumberControl
								label={__('📱 Label Cutoff')}
								value={barLabelCutoffMobile}
								disabled={
									!labelsActive ||
									'outside' === barLabelPosition ||
									'vertical' === chartOrientation
								}
								onChange={(value) =>
									setAttributes({
										barLabelCutoffMobile: formatNum(
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
					</Fragment>
				)}
				{('line' === chartType ||
					'area' === chartType ||
					'stacked-area' === chartType ||
					'scatter' === chartType) && (
					<WidePanelItem
						hasValue={() => labelColor}
						label={__('Label Color')}
						panelId={clientId}
					>
						<SelectControl
							label={__('Label Color')}
							value={labelColor}
							disabled={!labelsActive}
							onChange={(value) =>
								setAttributes({ labelColor: value })
							}
							options={[
								{ label: __('Inherit'), value: 'inherit' },
								{ label: __('Black'), value: 'black' },
								{ label: __('White'), value: 'white' },
								// { label: __('Contrast'), value: 'contrast' },
							]}
						/>
						<PanelDescription>
							<Help>{__('Select the color of the label.')}</Help>
						</PanelDescription>
					</WidePanelItem>
				)}
			</ToolsPanel>
		</PanelBody>
	);
}

export default LabelControls;
