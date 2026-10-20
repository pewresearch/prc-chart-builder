// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	__experimentalNumberControl as NumberControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import {
	BAR_CHART_TYPES,
	effectiveChartTypeForControls,
} from '../utils/chart-types';
import { formatNum } from '../utils/helpers';
import { resolveColor } from '../utils/resolve-color';
import ChartPanelColorSettings from './chart-panel-color-settings';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';

function BarControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { deviceType, getCurrentValue, updateAttributeForDevice } =
		useViewportAttributes(attributes, setAttributes);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('bar');

	const layout = getCurrentValue('layout') || {};
	const { type: chartType } = layout;
	const effectiveType = effectiveChartTypeForControls(attributes);
	const offersRectStroke =
		BAR_CHART_TYPES.includes(chartType) ||
		(chartType === 'small-multiples' && effectiveType === 'bar');
	const legacyHasStroke = Boolean(attributes.io?.elementHasStroke);
	const hasRectStroke = Boolean(
		getCurrentValue('bar', 'hasRectStroke') || legacyHasStroke
	);
	const rectStrokeColor = hasRectStroke
		? resolveColor(getCurrentValue('bar', 'rectStrokeColor') ?? 'white')
		: undefined;

	const applyBarStrokeUpdate = (strokeUpdate) => {
		if (!legacyHasStroke) {
			updateAttributeForDevice('bar', strokeUpdate);
			return;
		}

		// `io.elementHasStroke` turns the stroke on for every viewport and
		// cannot be cleared per viewport, so the first edit moves it into the
		// desktop `bar.hasRectStroke` before applying this viewport's change.
		const isDesktop = !deviceType || deviceType === 'desktop';
		setAttributes({
			io: { ...attributes.io, elementHasStroke: false },
			bar: {
				...attributes.bar,
				...(isDesktop ? strokeUpdate : { hasRectStroke: true }),
			},
			...(isDesktop
				? {}
				: {
						[deviceType]: {
							...attributes[deviceType],
							bar: {
								...attributes[deviceType]?.bar,
								...strokeUpdate,
							},
						},
					}),
		});
	};

	const onRectStrokeToggle = (enabled) => {
		applyBarStrokeUpdate({
			hasRectStroke: enabled,
			...(enabled && !getCurrentValue('bar', 'rectStrokeColor')
				? { rectStrokeColor: 'white' }
				: {}),
		});
	};

	const onRectStrokeColorChange = (value) => {
		if (!value) {
			applyBarStrokeUpdate({
				hasRectStroke: false,
				rectStrokeColor: undefined,
			});
			return;
		}

		applyBarStrokeUpdate({
			hasRectStroke: true,
			rectStrokeColor: value,
		});
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Bar Configuration')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<VStack spacing={4}>
					{effectiveType === 'bar' && (
						<VStack spacing={2}>
							<NumberControl
								label={__('Bar Group Padding')}
								withInputField
								min={0}
								max={10}
								step={0.05}
								value={parseFloat(
									getCurrentValue('bar', 'barGroupPadding') ||
										0,
									10
								)}
								onChange={(value) => {
									updateAttributeForDevice('bar', {
										barGroupPadding: formatNum(
											value,
											'float'
										),
									});
								}}
							/>
						</VStack>
					)}
					<VStack spacing={2}>
						<NumberControl
							label={__('Individual Bar Padding')}
							withInputField
							min={0}
							max={10}
							step={0.05}
							value={parseFloat(
								getCurrentValue('bar', 'barPadding') || 0,
								10
							)}
							onChange={(value) => {
								updateAttributeForDevice('bar', {
									barPadding: formatNum(value, 'float'),
								});
							}}
						/>
					</VStack>
					{offersRectStroke && (
						<>
							<ToggleControl
								label={__(
									'Show bar stroke',
									'prc-chart-builder'
								)}
								help={__(
									'Adds a border around each bar. Turn this off to remove the stroke, or set per-series stroke under Colors when it is on.',
									'prc-chart-builder'
								)}
								checked={hasRectStroke}
								onChange={onRectStrokeToggle}
								__nextHasNoMarginBottom
							/>
							{hasRectStroke && (
								<>
									<ChartPanelColorSettings
										__experimentalIsRenderedInSidebar
										title={__('Bar stroke')}
										colorSettings={[
											{
												label: __('Bar stroke'),
												contrast: false,
												value: rectStrokeColor,
												onChange:
													onRectStrokeColorChange,
											},
										]}
									/>
									<NumberControl
										__next40pxDefaultSize
										label={__(
											'Bar stroke width',
											'prc-chart-builder'
										)}
										min={0}
										step={0.5}
										value={
											getCurrentValue(
												'bar',
												'rectStrokeWidth'
											) ?? 1
										}
										onChange={(value) =>
											updateAttributeForDevice('bar', {
												rectStrokeWidth: formatNum(
													value,
													'float'
												),
											})
										}
									/>
								</>
							)}
						</>
					)}
					{chartType === 'exploded-bar' && (
						<VStack spacing={2}>
							<NumberControl
								label={__('Exploded Bar Column Gap')}
								withInputField
								step={1}
								value={parseInt(
									getCurrentValue(
										'explodedBar',
										'columnGap'
									) || 0,
									10
								)}
								onChange={(value) => {
									updateAttributeForDevice('explodedBar', {
										columnGap: formatNum(value, 'integer'),
									});
								}}
							/>
						</VStack>
					)}
				</VStack>
			</PanelBody>
		</div>
	);
}

export default BarControls;
