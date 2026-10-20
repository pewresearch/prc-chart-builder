/* eslint-disable max-lines-per-function */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	__experimentalNumberControl as NumberControl,
	ExternalLink,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { effectiveChartTypeForControls } from '../utils/chart-types';
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { PanelDescription, StyledLabel } from './control-ui';

function LineControls({ attributes, setAttributes, curated = false }) {
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
	const showPoints = Boolean(getCurrentValue('line', 'showPoints'));
	const areaShown =
		'area' === chartType ||
		'stacked-area' === chartType ||
		Boolean(getCurrentValue('line', 'showArea'));

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Line/Area Chart Configuration')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<VStack spacing={4}>
					{!curated && (
						<>
							<VStack spacing={2}>
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
							</VStack>
							<VStack spacing={2}>
								<SelectControl
									__next40pxDefaultSize
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
							</VStack>
						</>
					)}
					<VStack spacing={2}>
						<NumberControl
							min={1}
							label={__('Line width')}
							value={getCurrentValue('line', 'strokeWidth')}
							onChange={(value) =>
								updateAttributeForDevice('line', {
									strokeWidth: formatNum(value, 'integer'),
								})
							}
						/>
						{!curated && (
							<TextControl
								__next40pxDefaultSize
								label={__('Dash pattern')}
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
						)}
					</VStack>
					<VStack spacing={2}>
						<StyledLabel>Point markers</StyledLabel>
						<ToggleControl
							label="Point markers"
							help={
								showPoints
									? 'Shows point markers on chart.'
									: 'No point markers.'
							}
							checked={showPoints}
							onChange={(newValue) =>
								updateAttributeForDevice('line', {
									showPoints: newValue,
								})
							}
						/>
						{showPoints && (
							<ToggleControl
								label={__(
									'Display only first and last markers'
								)}
								checked={getCurrentValue(
									'line',
									'showFirstLastPointsOnly'
								)}
								onChange={(newValue) =>
									updateAttributeForDevice('line', {
										showFirstLastPointsOnly: newValue,
									})
								}
							/>
						)}
					</VStack>
					<VStack spacing={2}>
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
						{areaShown && (
							<NumberControl
								label={__('Fill Opacity')}
								step={0.1}
								value={getCurrentValue(
									'line',
									'areaFillOpacity'
								)}
								onChange={(value) =>
									updateAttributeForDevice('line', {
										areaFillOpacity: formatNum(
											value,
											'float'
										),
									})
								}
							/>
						)}
					</VStack>
				</VStack>
			</PanelBody>
		</div>
	);
}

export default LineControls;
