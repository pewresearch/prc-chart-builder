/**
 * Annotation Panel Component
 *
 * Panel for customizing annotation properties: text, styling, and positioning.
 * Shown in a popover when clicking an annotation in the chart editor.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	TextControl,
	SelectControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Button,
} from '@wordpress/components';

import { useAnnotationCustomizations } from '../hooks';
import { formatNum } from '../../../utils/helpers';
import { TextStyleControls } from './TextStyleControls';

/**
 * AnnotationPanel Component
 *
 * @param {Object}   props
 * @param {string}   props.annotationId   - The annotation index as string
 * @param {Object}   props.annotation     - The annotation object
 * @param {Function} props.onUpdate       - Callback to update annotation (receives partial updates)
 * @param {Function} props.onDelete       - Callback to delete the annotation
 * @param {string}   props.variant         - 'full' (default) or 'compact' (text styling only)
 * @param {string}   props.subtitle        - Replaces "Annotation #N" when variant is compact
 * @param {Object}   props.defaults        - Custom reset defaults (compact variant)
 */
export function AnnotationPanel({
	annotationId,
	annotation,
	onUpdate,
	onDelete,
	variant = 'full',
	subtitle = '',
	defaults: customDefaults = null,
}) {
	const isCompact = variant === 'compact';
	const {
		text,
		fontSize,
		fontWeight,
		fontStyle,
		fontFamily,
		fill,
		textAnchor,
		verticalAnchor,
		rotation,
		maxWidth,
		opacity,
		positioningContext,
		textOutline,
		hasCustomizations,
		handleChange,
		handleReset,
	} = useAnnotationCustomizations(annotation, annotationId, onUpdate);

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{__('Annotation', 'prc-chart-builder')} #
				{parseInt(annotationId, 10) + 1}
			</Text>

			<TextControl
				label={__('Text', 'prc-chart-builder')}
				value={text}
				onChange={(value) => handleChange('text', value)}
				placeholder={__('Enter annotation text', 'prc-chart-builder')}
			/>

			<SelectControl
				label={__('Positioning Context', 'prc-chart-builder')}
				value={positioningContext}
				options={[
					{
						label: __('Full Chart Area', 'prc-chart-builder'),
						value: 'chart',
					},
					{
						label: __('Data Area (Inner)', 'prc-chart-builder'),
						value: 'inner',
					},
				]}
				onChange={(value) => handleChange('positioningContext', value)}
			/>

			<TextStyleControls
				showText={false}
				values={{
					fontWeight,
					fontStyle,
					fontFamily,
					fontSize,
					fill,
					textOutline,
				}}
				onChange={handleChange}
				showTextOutline
			/>

			<SelectControl
				label={__('Text Anchor', 'prc-chart-builder')}
				value={textAnchor}
				options={[
					{ label: __('Start', 'prc-chart-builder'), value: 'start' },
					{
						label: __('Middle', 'prc-chart-builder'),
						value: 'middle',
					},
					{ label: __('End', 'prc-chart-builder'), value: 'end' },
				]}
				onChange={(value) => handleChange('textAnchor', value)}
			/>

			<SelectControl
				label={__('Vertical Anchor', 'prc-chart-builder')}
				value={verticalAnchor}
				options={[
					{ label: __('Start', 'prc-chart-builder'), value: 'start' },
					{
						label: __('Middle', 'prc-chart-builder'),
						value: 'middle',
					},
					{ label: __('End', 'prc-chart-builder'), value: 'end' },
				]}
				onChange={(value) => handleChange('verticalAnchor', value)}
			/>

			<NumberControl
				label={__('Rotation (degrees)', 'prc-chart-builder')}
				value={rotation}
				onChange={(value) =>
					handleChange('rotation', formatNum(value, 'integer') ?? 0)
				}
				min={-360}
				max={360}
			/>

			<NumberControl
				label={__('Max Width', 'prc-chart-builder')}
				value={maxWidth}
				onChange={(value) =>
					handleChange('maxWidth', formatNum(value, 'integer') ?? 200)
				}
				min={0}
				help={__(
					'Maximum width for text wrapping',
					'prc-chart-builder'
				)}
			/>

			<NumberControl
				label={__('Opacity', 'prc-chart-builder')}
				value={opacity}
				onChange={(value) => handleChange('opacity', value)}
				min={0}
				max={1}
				step={0.1}
			/>

			{hasCustomizations && (
				<Button
					variant="secondary"
					onClick={handleReset}
					style={{ marginTop: '8px' }}
				>
					{__('Reset to defaults', 'prc-chart-builder')}
				</Button>
			)}

			{onDelete && (
				<Button
					variant="secondary"
					isDestructive
					onClick={onDelete}
					style={{ marginTop: '8px' }}
				>
					{__('Delete annotation', 'prc-chart-builder')}
				</Button>
			)}
		</VStack>
	);
}

export default AnnotationPanel;
