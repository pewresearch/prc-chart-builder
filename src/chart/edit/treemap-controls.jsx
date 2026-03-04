// V2
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
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalNumberControl as NumberControl,
	ToggleControl,
	SelectControl,
	RangeControl,
} from '@wordpress/components';
import { ColorPalette } from '@wordpress/block-editor';

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

function TreemapControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const treemap = getCurrentValue('treemap') || {};

	return (
		<PanelBody title={__('Treemap Configuration')} initialOpen={false}>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				{/* Tiling Algorithm */}
				<WidePanelItem
					hasValue={() => true}
					label={__('Tiling Algorithm')}
					isShownByDefault
					panelId={clientId}
				>
					<SelectControl
						label={__('Tiling Algorithm')}
						help={__(
							'Controls how the treemap rectangles are arranged.'
						)}
						value={treemap.tile ?? 'squarify'}
						options={[
							{
								value: 'squarify',
								label: 'Squarify (Recommended)',
							},
							{ value: 'binary', label: 'Binary' },
							{ value: 'dice', label: 'Dice (Horizontal)' },
							{ value: 'slice', label: 'Slice (Vertical)' },
							{
								value: 'sliceDice',
								label: 'Slice & Dice (Alternating)',
							},
							{ value: 'resquarify', label: 'Resquarify' },
						]}
						onChange={(value) => {
							updateAttributeForDevice('treemap', {
								tile: value,
							});
						}}
					/>
				</WidePanelItem>

				{/* Spacing Section */}
				<PanelDescription>
					<StyledLabel>Spacing</StyledLabel>
				</PanelDescription>

				<WidePanelItem
					hasValue={() => true}
					label={__('Inner Padding')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Inner Padding (px)')}
						help={__(
							'Spacing between sibling rectangles within a group.'
						)}
						withInputField
						min={0}
						max={20}
						step={1}
						value={treemap.paddingInner ?? 2}
						onChange={(value) => {
							updateAttributeForDevice('treemap', {
								paddingInner: formatNum(value, 'integer'),
							});
						}}
					/>
				</WidePanelItem>

				<WidePanelItem
					hasValue={() => true}
					label={__('Outer Padding')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Outer Padding (px)')}
						help={__(
							'Spacing between parent and child nodes.'
						)}
						withInputField
						min={0}
						max={20}
						step={1}
						value={treemap.paddingOuter ?? 4}
						onChange={(value) => {
							updateAttributeForDevice('treemap', {
								paddingOuter: formatNum(value, 'integer'),
							});
						}}
					/>
				</WidePanelItem>

				{/* Stroke Section */}
				<PanelDescription>
					<StyledLabel>Stroke</StyledLabel>
				</PanelDescription>

				<WidePanelItem
					hasValue={() => true}
					label={__('Stroke Width')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Stroke Width (px)')}
						help={__(
							'Width of the border around each rectangle.'
						)}
						withInputField
						min={0}
						max={10}
						step={0.5}
						value={treemap.rectStrokeWidth ?? 2}
						onChange={(value) => {
							updateAttributeForDevice('treemap', {
								rectStrokeWidth: formatNum(value, 'float'),
							});
						}}
					/>
				</WidePanelItem>

				<WidePanelItem
					hasValue={() => true}
					label={__('Border Radius')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Border Radius (px)')}
						help={__(
							'Corner rounding for treemap rectangles.'
						)}
						withInputField
						min={0}
						max={20}
						step={1}
						value={treemap.borderRadius ?? 0}
						onChange={(value) => {
							updateAttributeForDevice('treemap', {
								borderRadius: formatNum(value, 'integer'),
							});
						}}
					/>
				</WidePanelItem>

				{/* Opacity Section */}
				<PanelDescription>
					<StyledLabel>Opacity</StyledLabel>
				</PanelDescription>

				<WidePanelItem
					hasValue={() => true}
					label={__('Scale Opacity')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label={__('Scale Opacity by Value')}
						help={__(
							'When enabled, rectangles within each group will have varying opacity based on their value — larger values appear more opaque.'
						)}
						checked={treemap.scaleOpacity ?? false}
						onChange={() => {
							updateAttributeForDevice('treemap', {
								scaleOpacity: !treemap.scaleOpacity,
							});
						}}
					/>
				</WidePanelItem>

				{treemap.scaleOpacity && (
					<>
						<WidePanelItem
							hasValue={() => true}
							label={__('Min Opacity')}
							isShownByDefault
							panelId={clientId}
						>
							<RangeControl
								label={__('Min Opacity')}
								min={0}
								max={1}
								step={0.05}
								value={treemap.opacityRange?.[0] ?? 0.4}
								onChange={(value) => {
									updateAttributeForDevice('treemap', {
										opacityRange: [
											value,
											treemap.opacityRange?.[1] ?? 1,
										],
									});
								}}
							/>
						</WidePanelItem>

						<WidePanelItem
							hasValue={() => true}
							label={__('Max Opacity')}
							isShownByDefault
							panelId={clientId}
						>
							<RangeControl
								label={__('Max Opacity')}
								min={0}
								max={1}
								step={0.05}
								value={treemap.opacityRange?.[1] ?? 1}
								onChange={(value) => {
									updateAttributeForDevice('treemap', {
										opacityRange: [
											treemap.opacityRange?.[0] ?? 0.4,
											value,
										],
									});
								}}
							/>
						</WidePanelItem>
					</>
				)}
			</ToolsPanel>
		</PanelBody>
	);
}

export default TreemapControls;
