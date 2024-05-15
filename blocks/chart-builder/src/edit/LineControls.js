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

function LineControls({ attributes, setAttributes, chartType, clientId }) {
	const {
		lineInterpolation,
		lineStrokeWidth,
		lineNodes,
		nodeSize,
		nodeStroke,
		areaFillOpacity,
		lineStrokeDashArray,
	} = attributes;
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
						value={lineInterpolation}
						onChange={(value) =>
							setAttributes({ lineInterpolation: value })
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
						value={lineStrokeWidth}
						onChange={(value) =>
							setAttributes({
								lineStrokeWidth: formatNum(value, 'integer'),
							})
						}
					/>
					<TextControl
						label={__('Line Stroke Dash Array')}
						help={__(
							'A list of comma and/or white space separated <length>s and <percentage>s that specify the lengths of alternating dashes and gaps. If an odd number of values is provided, then the list of values is repeated to yield an even number of values. Thus, 5,3,2 is equivalent to 5,3,2,5,3,2.'
						)}
						value={lineStrokeDashArray}
						placeholder=""
						onChange={(val) =>
							setAttributes({ lineStrokeDashArray: val })
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
							lineNodes
								? 'Shows data point nodes on chart.'
								: 'No data point nodes.'
						}
						checked={lineNodes}
						onChange={() =>
							setAttributes({ lineNodes: !lineNodes })
						}
					/>
					<NumberControl
						disabled={!lineNodes}
						min={1}
						label={__('Line Node Size')}
						value={nodeSize}
						onChange={(value) =>
							setAttributes({
								nodeSize: formatNum(value, 'integer'),
							})
						}
					/>
					<NumberControl
						disabled={!lineNodes}
						min={1}
						label={__('Line Node Stroke')}
						value={nodeStroke}
						onChange={(value) =>
							setAttributes({
								nodeStroke: formatNum(value, 'integer'),
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
					{!chartType === 'stacked-area' && (
						<ToggleControl
							label="Show area"
							help={
								'area' === chartType
									? 'Shows area under line.'
									: 'No area.'
							}
							checked={'area' === chartType}
							onChange={() =>
								setAttributes({
									chartType:
										'area' === chartType ? 'line' : 'area',
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
						value={areaFillOpacity}
						onChange={(value) =>
							setAttributes({
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
