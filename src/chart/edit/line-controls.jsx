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
	ToggleControl,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalNumberControl as NumberControl,
	ExternalLink,
	TextControl,
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

function LineControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } =
		useViewportAttributes(attributes, setAttributes);

	const layout = getCurrentValue('layout') || {};
	const { type: chartType } = layout;

	return (
		<PanelBody title={__('Line/Area Chart Configuration')}>
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
					label={__('Line Curve')}
					isShownByDefault
					panelId={clientId}
				>
					<SelectControl
						label={__('Curve')}
						options={[
							{ label: 'Basis', value: 'curveBasis' },
							{
								label: 'Basis Closed',
								value: 'curveBasisClosed',
							},
							{ label: 'Basis Open', value: 'curveBasisOpen' },
							{ label: 'Step', value: 'curveStep' },
							{ label: 'Step After', value: 'curveStepAfter' },
							{ label: 'Step Before', value: 'curveStepBefore' },
							{ label: 'Linear', value: 'curveLinear' },
							{
								label: 'Linear Closed',
								value: 'curveLinearClosed',
							},
							{ label: 'Cardinal', value: 'curveCardinal' },
							{
								label: 'Cardinal Closed',
								value: 'curveCardinalClosed',
							},
							{
								label: 'Cardinal Open',
								value: 'curveCardinalOpen',
							},
							{ label: 'Catmull-Rom', value: 'curveCatmullRom' },
							{
								label: 'Catmull-Rom Closed',
								value: 'curveCatmullRomClosed',
							},
							{
								label: 'Catmull-Rom Open',
								value: 'curveCatmullRomOpen',
							},
							{ label: 'Monotone X', value: 'curvemonotoneX' },
							{ label: 'Monotone Y', value: 'curvemonotoneY' },
							{ label: 'Natural', value: 'curvenatural' },
						]}
						value={getCurrentValue('line', 'interpolation')}
						onChange={(value) =>
							updateAttributeForDevice('line', {
								interpolation: value,
							})
						}
					/>
					<PanelDescription>
						<ExternalLink href="http://using-d3js.com/05_04_curves.html">
							Examples of different curve types
						</ExternalLink>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Line Stroke Width')}
					panelId={clientId}
				>
					<NumberControl
						min={1}
						label={__('Line Stroke Width')}
						value={getCurrentValue('line', 'strokeWidth')}
						onChange={(value) =>
							updateAttributeForDevice('line', {
								strokeWidth: formatNum(value, 'integer'),
							})
						}
					/>
					<TextControl
						label={__('Line Stroke Dash Array')}
						help={__(
							'A list of comma and/or white space separated <length>s and <percentage>s that specify the lengths of alternating dashes and gaps. If an odd number of values is provided, then the list of values is repeated to yield an even number of values. Thus, 5,3,2 is equivalent to 5,3,2,5,3,2.'
						)}
						value={getCurrentValue('line', 'strokeDasharray')}
						placeholder=""
						onChange={(val) =>
							updateAttributeForDevice('line', {
								strokeDasharray: val,
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Line Nodes')}
					panelId={clientId}
				>
					<StyledLabel>Line Nodes</StyledLabel>
					<ToggleControl
						label="Line nodes"
						help={
							getCurrentValue('line', 'showPoints')
								? 'Shows data point nodes on chart.'
								: 'No data point nodes.'
						}
						checked={getCurrentValue('line', 'showPoints')}
						onChange={(newValue) =>
							updateAttributeForDevice('line', {
								showPoints: newValue,
							})
						}
					/>
					<NumberControl
						disabled={!getCurrentValue('line', 'showPoints')}
						min={1}
						label={__('Line Node Size')}
						value={getCurrentValue('nodes', 'pointSize')}
						onChange={(value) =>
							updateAttributeForDevice('nodes', {
								pointSize: formatNum(value, 'integer'),
							})
						}
					/>
					<NumberControl
						disabled={!getCurrentValue('line', 'showPoints')}
						min={1}
						label={__('Line Node Stroke Width')}
						value={getCurrentValue('nodes', 'pointStrokeWidth')}
						onChange={(value) =>
							updateAttributeForDevice('nodes', {
								pointStrokeWidth: formatNum(value, 'integer'),
							})
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Area')}
					panelId={clientId}
				>
					<StyledLabel>Area</StyledLabel>
					{chartType !== 'stacked-area' && (
						<ToggleControl
							label="Show area"
							help={
								'area' === chartType
									? 'Shows area under line.'
									: 'No area.'
							}
							checked={getCurrentValue('line', 'showArea')}
							onChange={(newValue) =>
								updateAttributeForDevice('line', {
									showArea: newValue,
								})
							}
						/>
					)}
					<NumberControl
						disabled={
							'area' !== chartType && 'stacked-area' !== chartType
						}
						label={__('Fill Opacity')}
						step={0.1}
						value={getCurrentValue('line', 'areaFillOpacity')}
						onChange={(value) =>
							updateAttributeForDevice('line', {
								areaFillOpacity: formatNum(value, 'float'),
							})
						}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default LineControls;
