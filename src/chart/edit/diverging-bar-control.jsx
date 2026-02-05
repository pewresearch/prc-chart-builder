// V2
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
import { useViewportAttributes } from './use-viewport-attributes';

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
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	// Get viewport-aware divergingBar configuration
	const divergingBar = getCurrentValue('divergingBar') || {};
	const neutralBar = divergingBar.neutralBar || {};

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
						value={parseFloat(
							getCurrentValue('bar', 'barPadding'),
							10
						)}
						onChange={(value) => {
							const currentBar = getCurrentValue('bar') || {};
							updateAttributeForDevice('bar', {
								...currentBar,
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
						checked={neutralBar.active || false}
						onChange={(newValue) => {
							const currentNeutralBar =
								getCurrentValue('divergingBar', 'neutralBar') ||
								{};
							updateAttributeForDevice('divergingBar', {
								neutralBar: {
									...currentNeutralBar,
									active: newValue,
								},
							});
						}}
						help={__(
							'If active, a neutral bar will be added to the chart. This bar will be positioned to the right of the main graphic.'
						)}
					/>
					<ToggleControl
						label={__('Neutral Bar Separator')}
						checked={neutralBar.separator || false}
						onChange={(newValue) => {
							const currentNeutralBar =
								getCurrentValue('divergingBar', 'neutralBar') ||
								{};
							updateAttributeForDevice('divergingBar', {
								neutralBar: {
									...currentNeutralBar,
									separator: newValue,
								},
							});
						}}
						help={__(
							'If active, a separator will be added to the neutral bar.'
						)}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => neutralBar.offsetX}
					label={__('Neutral Bar Positioning')}
					panelId={clientId}
				>
					<PanelDescription>
						<StyledLabel>Neutral Bar Positioning</StyledLabel>
					</PanelDescription>
					<NumberControl
						label={__('DX')}
						value={neutralBar.offsetX}
						disabled={!neutralBar.active}
						onChange={(value) => {
							const currentNeutralBar =
								getCurrentValue('divergingBar', 'neutralBar') ||
								{};
							updateAttributeForDevice('divergingBar', {
								neutralBar: {
									...currentNeutralBar,
									offsetX: formatNum(value, 'integer'),
								},
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => neutralBar.separatorOffsetX}
					label={__('Neutral Bar Positioning')}
					panelId={clientId}
				>
					<PanelDescription>
						<StyledLabel>Separator Positioning</StyledLabel>
					</PanelDescription>
					<NumberControl
						label={__('DX')}
						value={neutralBar.separatorOffsetX}
						disabled={!neutralBar.separator}
						onChange={(value) => {
							const currentNeutralBar =
								getCurrentValue('divergingBar', 'neutralBar') ||
								{};
							updateAttributeForDevice('divergingBar', {
								neutralBar: {
									...currentNeutralBar,
									separatorOffsetX: formatNum(
										value,
										'integer'
									),
								},
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => divergingBar.percentOfInnerWidth}
					label={__('Diverging Bar Width')}
					panelId={clientId}
				>
					<RangeControl
						label={__('Percent of Inner Width')}
						help={__(
							'This calculates the percentage of the total chart area that the main bars (positive and negative) will occupy. This is useful for adjusting the width of the bars to ensure they fit within the chart area without overlapping.'
						)}
						withInputField
						disabled={!neutralBar.active}
						min={0}
						max={1}
						step={0.01}
						value={divergingBar.percentOfInnerWidth}
						onChange={(w) => {
							updateAttributeForDevice('divergingBar', {
								percentOfInnerWidth: formatNum(w, 'integer'),
							});
						}}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default DivergingBarControls;
