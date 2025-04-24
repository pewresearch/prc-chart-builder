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
	PanelBody,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
	RangeControl,
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
const StyledLabel = styled.div`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
	display: inline-block;
	margin-bottom: calc(8px) !important;
	padding: 0px;
`;
function DivergingBarControls({ attributes, setAttributes, clientId }) {
	const {
		barPadding,
		neutralBarActive,
		neutralBarOffsetX,
		neutralBarSeparator,
		divergingBarPercentOfInnerWidth,
		neutralBarSeparatorOffsetX,
	} = attributes;
	return (
		<PanelBody title={__('Diverging Bar')} initialOpen>
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
					label={__('Bar Padding')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Bar Padding')}
						withInputField
						min={0}
						max={10}
						step={0.05}
						value={parseFloat(barPadding, 10)}
						onChange={(value) => {
							setAttributes({
								barPadding: formatNum(value, 'float'),
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Neutral Bar')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label={__('Neutral Bar Active')}
						checked={neutralBarActive}
						onChange={() =>
							setAttributes({
								neutralBarActive: !neutralBarActive,
							})
						}
						help={__(
							'If active, a neutral bar will be added to the chart. This bar will be positioned to the right of the main graphic.'
						)}
					/>
					<ToggleControl
						label={__('Neutral Bar Separator')}
						checked={neutralBarSeparator}
						onChange={() =>
							setAttributes({
								neutralBarSeparator: !neutralBarSeparator,
							})
						}
						help={__(
							'If active, a separator will be added to the neutral bar.'
						)}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => neutralBarOffsetX}
					label={__('Neutral Bar Positioning')}
					panelId={clientId}
				>
					<PanelDescription>
						<StyledLabel>Neutral Bar Positioning</StyledLabel>
					</PanelDescription>
					<NumberControl
						label={__('DX')}
						value={neutralBarOffsetX}
						disabled={!neutralBarActive}
						onChange={(value) =>
							setAttributes({
								neutralBarOffsetX: formatNum(value, 'integer'),
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => neutralBarSeparatorOffsetX}
					label={__('Neutral Bar Positioning')}
					panelId={clientId}
				>
					<PanelDescription>
						<StyledLabel>Separator Positioning</StyledLabel>
					</PanelDescription>
					<NumberControl
						label={__('DX')}
						value={neutralBarSeparatorOffsetX}
						disabled={!neutralBarSeparator}
						onChange={(value) =>
							setAttributes({
								neutralBarSeparatorOffsetX: formatNum(
									value,
									'integer'
								),
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => divergingBarPercentOfInnerWidth}
					label={__('Diverging Bar Width')}
					panelId={clientId}
				>
					<RangeControl
						label={__('Percent of Inner Width')}
						withInputField
						disabled={!neutralBarActive}
						min={0}
						max={100}
						value={divergingBarPercentOfInnerWidth}
						onChange={(w) =>
							setAttributes({
								divergingBarPercentOfInnerWidth: formatNum(
									w,
									'integer'
								),
							})
						}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default DivergingBarControls;
