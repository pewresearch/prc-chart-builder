/* eslint-disable max-lines-per-function */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalNumberControl as NumberControl,
	ExternalLink,
	TextControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { effectiveChartTypeForControls } from '../utils/chart-types';
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { PanelDescription, WidePanelItem, StyledLabel } from './control-ui';

function LineControls({
	attributes,
	setAttributes,
	clientId,
	curated = false,
}) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('line');

	const layout = getCurrentValue('layout') || {};
	const chartType = effectiveChartTypeForControls(attributes) || layout.type;

	// segmentsActive is the explicit opt-in for segment-by-segment rendering.
	// When active, the curve interpolation setting has no effect because each
	// segment is a straight path. Clearing styles alone doesn't exit segment mode.
	const segmentsActive = getCurrentValue('shapes', 'segmentsActive') ?? false;

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Line/Area Chart Configuration')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<ToolsPanel
					label={__('Attributes')}
					panelId={clientId}
					style={{
						paddingLeft: '0',
						paddingRight: '0',
					}}
				>
					{!curated && (
						<>
							<WidePanelItem
								hasValue={() => true}
								label={__('Segment Mode')}
								isShownByDefault
								panelId={clientId}
							>
								<ToggleControl
									label={__('Enable segment mode')}
									help={
										segmentsActive
											? __(
													'Each line segment can be styled individually. Curve interpolation is disabled in this mode.'
												)
											: __(
													'Segments off — line renders as a single curved path.'
												)
									}
									checked={segmentsActive}
									onChange={(newValue) => {
										const currentShapes =
											getCurrentValue('shapes') || {};
										updateAttributeForDevice('shapes', {
											...currentShapes,
											segmentsActive: newValue,
											// Clear segment styles when opting out so the
											// curve mode starts clean
											...(!newValue
												? { segmentStyles: {} }
												: {}),
										});
									}}
								/>
							</WidePanelItem>
							<WidePanelItem
								hasValue={() => true}
								label={__('Line Curve')}
								isShownByDefault
								panelId={clientId}
							>
								<SelectControl
									label={__('Curve')}
									disabled={segmentsActive}
									help={
										segmentsActive
											? __(
													'Curve is unavailable in segment mode. Disable segment mode to re-enable.'
												)
											: undefined
									}
									options={[
										{
											label: 'Basis',
											value: 'curveBasis',
										},
										{
											label: 'Basis Closed',
											value: 'curveBasisClosed',
										},
										{
											label: 'Basis Open',
											value: 'curveBasisOpen',
										},
										{ label: 'Step', value: 'curveStep' },
										{
											label: 'Step After',
											value: 'curveStepAfter',
										},
										{
											label: 'Step Before',
											value: 'curveStepBefore',
										},
										{
											label: 'Linear',
											value: 'curveLinear',
										},
										{
											label: 'Linear Closed',
											value: 'curveLinearClosed',
										},
										{
											label: 'Cardinal',
											value: 'curveCardinal',
										},
										{
											label: 'Cardinal Closed',
											value: 'curveCardinalClosed',
										},
										{
											label: 'Cardinal Open',
											value: 'curveCardinalOpen',
										},
										{
											label: 'Catmull-Rom',
											value: 'curveCatmullRom',
										},
										{
											label: 'Catmull-Rom Closed',
											value: 'curveCatmullRomClosed',
										},
										{
											label: 'Catmull-Rom Open',
											value: 'curveCatmullRomOpen',
										},
										{
											label: 'Monotone X',
											value: 'curvemonotoneX',
										},
										{
											label: 'Monotone Y',
											value: 'curvemonotoneY',
										},
										{
											label: 'Natural',
											value: 'curvenatural',
										},
									]}
									value={getCurrentValue(
										'line',
										'interpolation'
									)}
									onChange={(value) =>
										updateAttributeForDevice('line', {
											interpolation: value,
										})
									}
								/>
								{!segmentsActive && (
									<PanelDescription>
										<ExternalLink href="http://using-d3js.com/05_04_curves.html">
											Examples of different curve types
										</ExternalLink>
									</PanelDescription>
								)}
							</WidePanelItem>
							<WidePanelItem
								hasValue={() => true}
								label={__('Line Stroke Width')}
								panelId={clientId}
							>
								<NumberControl
									min={1}
									label={__('Line Stroke Width')}
									value={getCurrentValue(
										'line',
										'strokeWidth'
									)}
									onChange={(value) =>
										updateAttributeForDevice('line', {
											strokeWidth: formatNum(
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
									value={getCurrentValue(
										'line',
										'strokeDasharray'
									)}
									placeholder=""
									onChange={(val) =>
										updateAttributeForDevice('line', {
											strokeDasharray: val,
										})
									}
								/>
							</WidePanelItem>
						</>
					)}
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
						<ToggleControl
							label={__('Display only first and last nodes')}
							checked={getCurrentValue(
								'line',
								'showFirstLastPointsOnly'
							)}
							disabled={!getCurrentValue('line', 'showPoints')}
							onChange={(newValue) =>
								updateAttributeForDevice('line', {
									showFirstLastPointsOnly: newValue,
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
									pointStrokeWidth: formatNum(
										value,
										'integer'
									),
								})
							}
						/>
						<NumberControl
							disabled={!getCurrentValue('line', 'showPoints')}
							min={0}
							max={1}
							step={0.1}
							label={__('Line Node Fill Opacity')}
							value={
								getCurrentValue('nodes', 'pointFillOpacity') ??
								1
							}
							onChange={(value) =>
								updateAttributeForDevice('nodes', {
									pointFillOpacity:
										formatNum(value, 'float') ?? 1,
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
								'area' !== chartType &&
								'stacked-area' !== chartType &&
								!getCurrentValue('line', 'showArea')
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
		</div>
	);
}

export default LineControls;
