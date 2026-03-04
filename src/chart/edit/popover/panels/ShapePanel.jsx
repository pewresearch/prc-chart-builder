/**
 * Shape Panel Component
 *
 * Panel for customizing shape properties: fill, stroke, opacity, strokeWidth, and pattern.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	// SelectControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Button,
	RangeControl,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

import { useShapeCustomizations } from '../hooks';
import { generateElementKey } from '../utils';

/**
 * ShapePanel Component
 *
 * @param {Object}      props
 * @param {Object}      props.dataPoint             - The data point object
 * @param {string}      props.category              - The category key
 * @param {string}      props.defaultColor          - The default fill color
 * @param {string|null} props.groupValue            - The group value (when groupBreaksActive), or null
 * @param {Object}      props.currentCustomizations - Current customizations
 * @param {Function}    props.onUpdate              - Callback to update
 */
export function ShapePanel({
	dataPoint,
	category,
	defaultColor,
	groupValue = null,
	currentCustomizations = {},
	onUpdate,
}) {
	const shapeKey = generateElementKey(dataPoint.x, category, groupValue);

	const {
		fill,
		stroke,
		opacity,
		strokeWidth,
		// pattern,
		hasCustomizations,
		handleStyleChange,
		handleReset,
	} = useShapeCustomizations(shapeKey, currentCustomizations, onUpdate);

	// Format the x value for display - handle Date objects
	const displayX =
		dataPoint.x instanceof Date
			? dataPoint.x.toLocaleDateString()
			: String(dataPoint.x);

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{category}: {displayX}
			</Text>

			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={__('Fill Color', 'prc-chart-builder')}
				colorSettings={[
					{
						value: fill || defaultColor,
						onChange: (val) => handleStyleChange('fill', val ?? ''),
						label: __('Fill', 'prc-chart-builder'),
					},
				]}
			/>

			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={__('Stroke Color', 'prc-chart-builder')}
				colorSettings={[
					{
						value: stroke,
						onChange: (val) =>
							handleStyleChange('stroke', val ?? ''),
						label: __('Stroke', 'prc-chart-builder'),
					},
				]}
			/>

			<RangeControl
				label={__('Opacity', 'prc-chart-builder')}
				value={opacity}
				onChange={(val) => handleStyleChange('opacity', val)}
				min={0}
				max={1}
				step={0.1}
			/>

			<NumberControl
				label={__('Stroke Width', 'prc-chart-builder')}
				value={strokeWidth}
				onChange={(val) =>
					handleStyleChange('strokeWidth', parseFloat(val) || 0)
				}
				min={0}
				step={0.5}
			/>
			{/* TODO: I don't think we're ready for patterns yet, but we can look at utilizing this: https://visx.airbnb.tech/patterns */}
			{/* <SelectControl
				label={__('Pattern', 'prc-chart-builder')}
				value={pattern}
				options={PATTERN_OPTIONS}
				onChange={(val) => handleStyleChange('pattern', val)}
				help={__(
					'Visual pattern for the shape fill',
					'prc-chart-builder'
				)}
			/> */}

			{hasCustomizations && (
				<Button
					variant="secondary"
					isDestructive
					onClick={handleReset}
					style={{ marginTop: '8px' }}
				>
					{__('Reset to defaults', 'prc-chart-builder')}
				</Button>
			)}
		</VStack>
	);
}

export default ShapePanel;
