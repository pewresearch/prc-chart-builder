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
	TextControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

function DotPlotControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	return (
		<PanelBody title={__('Dot Plot')} initialOpen>
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
					label={__('Connecting Line')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label={__('Connect Points')}
						checked={getCurrentValue('dotPlot', 'connectPoints')}
						onChange={(newValue) =>
							updateAttributeForDevice('dotPlot', {
								connectPoints: newValue,
							})
						}
						help={__(
							'If active, a line will be drawn between the dots.'
						)}
					/>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Line Styles')}
						initialOpen
						colorSettings={[
							{
								value: getCurrentValue(
									'dotPlot',
									'connectingLine'
								)?.stroke,
								onChange: (value) => {
									const currentConnectingLine =
										getCurrentValue(
											'dotPlot',
											'connectingLine'
										) || {};
									updateAttributeForDevice('dotPlot', {
										connectingLine: {
											...currentConnectingLine,
											stroke: value,
										},
									});
								},
								label: __('Connecting line stroke'),
							},
						]}
					/>
					<NumberControl
						min={1}
						label={__('Line Stroke Width')}
						value={
							getCurrentValue('dotPlot', 'connectingLine')
								?.strokeWidth
						}
						onChange={(value) => {
							const currentConnectingLine =
								getCurrentValue('dotPlot', 'connectingLine') ||
								{};
							updateAttributeForDevice('dotPlot', {
								connectingLine: {
									...currentConnectingLine,
									strokeWidth: formatNum(value, 'integer'),
								},
							});
						}}
					/>
					<TextControl
						label={__('Line Stroke Dash Array')}
						help={__(
							'A list of comma and/or white space separated <length>s and <percentage>s that specify the lengths of alternating dashes and gaps. If an odd number of values is provided, then the list of values is repeated to yield an even number of values. Thus, 5,3,2 is equivalent to 5,3,2,5,3,2.'
						)}
						value={
							getCurrentValue('dotPlot', 'connectingLine')
								?.strokeDasharray
						}
						placeholder=""
						onChange={(val) => {
							const currentConnectingLine =
								getCurrentValue('dotPlot', 'connectingLine') ||
								{};
							updateAttributeForDevice('dotPlot', {
								connectingLine: {
									...currentConnectingLine,
									strokeDasharray: val,
								},
							});
						}}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default DotPlotControls;
