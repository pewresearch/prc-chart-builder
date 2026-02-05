/**
 * Line Segment Panel Component
 *
 * Panel for customizing line segment properties: stroke color, strokeWidth, opacity, and strokeDasharray.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	SelectControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Button,
	RangeControl,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

import { useSegmentCustomizations } from '../hooks';
import { generateSegmentKey, formatDisplayValue, STROKE_DASHARRAY_OPTIONS } from '../utils';

/**
 * LineSegmentPanel Component
 *
 * @param {Object}   props
 * @param {Object}   props.startPoint            - The start data point of the segment
 * @param {Object}   props.endPoint              - The end data point of the segment
 * @param {string}   props.category              - The category key
 * @param {string}   props.defaultColor          - The default stroke color
 * @param {Object}   props.currentCustomizations - Current customizations
 * @param {Function} props.onUpdate              - Callback to update
 */
export function LineSegmentPanel({
	startPoint,
	endPoint,
	category,
	defaultColor,
	currentCustomizations = {},
	onUpdate,
}) {
	const segmentKey = generateSegmentKey(startPoint.x, endPoint.x, category);

	const {
		stroke,
		strokeWidth,
		opacity,
		strokeDasharray,
		hasCustomizations,
		handleStyleChange,
		handleReset,
	} = useSegmentCustomizations(segmentKey, currentCustomizations, onUpdate);

	// Format display values for the segment endpoints
	const startDisplay = formatDisplayValue(startPoint.x);
	const endDisplay = formatDisplayValue(endPoint.x);

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{category}: {startDisplay} → {endDisplay}
			</Text>

			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={__('Stroke Color', 'prc-chart-builder')}
				colorSettings={[
					{
						value: stroke || defaultColor,
						onChange: (val) => handleStyleChange('stroke', val ?? ''),
						label: __('Stroke', 'prc-chart-builder'),
					},
				]}
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

			<RangeControl
				label={__('Opacity', 'prc-chart-builder')}
				value={opacity}
				onChange={(val) => handleStyleChange('opacity', val)}
				min={0}
				max={1}
				step={0.1}
			/>

			<SelectControl
				label={__('Line Style', 'prc-chart-builder')}
				value={strokeDasharray}
				options={STROKE_DASHARRAY_OPTIONS}
				onChange={(val) => handleStyleChange('strokeDasharray', val)}
				help={__(
					'Dash pattern for the line segment',
					'prc-chart-builder'
				)}
			/>

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

export default LineSegmentPanel;
