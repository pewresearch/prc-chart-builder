/* eslint-disable max-lines-per-function */
/**
 * External dependencies
 */
import styled from 'styled-components';
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

const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

function DotPlotControls({ attributes, setAttributes, clientId }) {
	const {
		dotPlotConnectPoints,
		dotPlotConnectPointsStroke,
		dotPlotConnectPointsStrokeWidth,
		dotPlotConnectPointsStrokeDasharray,
	} = attributes;
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
						checked={dotPlotConnectPoints}
						onChange={() =>
							setAttributes({
								dotPlotConnectPoints: !dotPlotConnectPoints,
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
								value: dotPlotConnectPointsStroke,
								onChange: (value) =>
									setAttributes({
										dotPlotConnectPointsStroke: value,
									}),
								label: __('Connecting line stroke'),
							},
						]}
					/>
					<NumberControl
						min={1}
						label={__('Line Stroke Width')}
						value={dotPlotConnectPointsStrokeWidth}
						onChange={(value) =>
							setAttributes({
								dotPlotConnectPointsStrokeWidth: formatNum(
									value,
									'integer'
								),
							})
						}
					/>
					<TextControl
						label={__('Line Stroke Dash Array')}
						help={__(
							'A list of comma and/or white space separated <length>s and <percentage>s that specify the lengths of alternating dashes and gaps. If an odd number of values is provided, then the list of values is repeated to yield an even number of values. Thus, 5,3,2 is equivalent to 5,3,2,5,3,2.'
						)}
						value={dotPlotConnectPointsStrokeDasharray}
						placeholder=""
						onChange={(val) =>
							setAttributes({
								dotPlotConnectPointsStrokeDasharray: val,
							})
						}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default DotPlotControls;
