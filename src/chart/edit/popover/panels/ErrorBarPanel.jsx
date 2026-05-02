/**
 * Error Bar Panel Component
 *
 * Panel for customizing per-element error bar properties: stroke, strokeWidth,
 * strokeOpacity, and strokeDasharray.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Button,
	RangeControl,
	TextControl,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

import { useErrorBarCustomizations } from '../hooks/useErrorBarCustomizations';
import { generateElementKey } from '../utils';

/**
 * ErrorBarPanel Component
 *
 * @param {Object}      props
 * @param {Object}      props.dataPoint             - The data point object
 * @param {string}      props.category              - The category key
 * @param {string}      props.defaultColor          - The default stroke color
 * @param {string|null} props.groupValue            - The group value (when groupBreaksActive), or null
 * @param {Object}      props.currentCustomizations - Current customizations
 * @param {Function}    props.onUpdate              - Callback to update
 */
export function ErrorBarPanel({
	dataPoint,
	category,
	defaultColor,
	groupValue = null,
	currentCustomizations = {},
	onUpdate,
}) {
	const elementKey = generateElementKey(dataPoint.x, category, groupValue);

	const {
		stroke,
		strokeWidth,
		strokeOpacity,
		strokeDasharray,
		hasCustomizations,
		handleStyleChange,
		handleReset,
	} = useErrorBarCustomizations(elementKey, currentCustomizations, onUpdate);

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
				title={__('Stroke Color', 'prc-chart-builder')}
				colorSettings={[
					{
						value: stroke || defaultColor,
						onChange: (val) =>
							handleStyleChange('stroke', val ?? ''),
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
				label={__('Stroke Opacity', 'prc-chart-builder')}
				value={strokeOpacity}
				onChange={(val) => handleStyleChange('strokeOpacity', val)}
				min={0}
				max={1}
				step={0.05}
			/>

			<TextControl
				label={__('Stroke Dash Array', 'prc-chart-builder')}
				value={strokeDasharray}
				onChange={(val) => handleStyleChange('strokeDasharray', val)}
				placeholder=""
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

export default ErrorBarPanel;
