/**
 * Annotation Panel Component
 *
 * Panel for customizing annotation properties: text, styling, and positioning.
 * Shown in a popover when clicking an annotation in the chart editor.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import {
	Button,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { formatNum } from '../../../utils/helpers';
import { useAnnotationCustomizations } from '../hooks';
import { RichTextField } from './RichTextField';
import { TextStyleControls } from './TextStyleControls';

/**
 * AnnotationPanel Component
 *
 * @param {Object}   props
 * @param {string}   props.annotationId - The annotation index as string
 * @param {Object}   props.annotation   - The annotation object
 * @param {Function} props.onUpdate     - Callback to update annotation (receives partial updates)
 * @param {Function} props.onDelete     - Callback to delete the annotation
 * @param {string[]} props.panelKeys    - Small-multiples panel keys (for annotations)
 */
export function AnnotationPanel({
	annotationId,
	annotation,
	onUpdate,
	onDelete,
	panelKeys = [],
}) {
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
		panelKey,
		textOutline,
		x,
		y,
		hasCustomizations,
		handleChange,
		handleReset,
	} = useAnnotationCustomizations(annotation, annotationId, onUpdate);

	const hasPanelKeys = Array.isArray(panelKeys) && panelKeys.length > 0;
	const isPanelContext =
		positioningContext === 'panel' || positioningContext === 'panel-inner';
	const positioningOptions = [
		{
			label: __('Full Chart Area', 'prc-chart-builder'),
			value: 'chart',
		},
		{
			label: __('Data Area (Inner)', 'prc-chart-builder'),
			value: 'inner',
		},
		...(hasPanelKeys
			? [
					{
						label: __('Panel (full cell)', 'prc-chart-builder'),
						value: 'panel',
					},
					{
						label: __('Panel data area', 'prc-chart-builder'),
						value: 'panel-inner',
					},
				]
			: []),
	];

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{__('Annotation', 'prc-chart-builder')} #
				{parseInt(annotationId, 10) + 1}
			</Text>

			<RichTextField
				label={__('Text', 'prc-chart-builder')}
				value={text}
				onChange={(value) => handleChange('text', value)}
				placeholder={__('Enter annotation text', 'prc-chart-builder')}
			/>

			<SelectControl
				label={__('Positioning Context', 'prc-chart-builder')}
				value={positioningContext}
				options={positioningOptions}
				__next40pxDefaultSize
				onChange={(value) => {
					if (
						(value === 'panel' || value === 'panel-inner') &&
						hasPanelKeys
					) {
						handleChange('positioningContext', value, {
							panelKey: panelKey || String(panelKeys[0]),
						});
						return;
					}
					handleChange('positioningContext', value);
				}}
				help={
					hasPanelKeys
						? __(
								'Chart: full graphic. Inner: data area. Panel: full cell or plot area; travels with the cell on restack.',
								'prc-chart-builder'
							)
						: undefined
				}
			/>

			{isPanelContext && hasPanelKeys && (
				<SelectControl
					label={__('Panel', 'prc-chart-builder')}
					value={panelKey || String(panelKeys[0])}
					__next40pxDefaultSize
					options={panelKeys.map((key) => ({
						label: String(key),
						value: String(key),
					}))}
					onChange={(value) => handleChange('panelKey', value)}
				/>
			)}

			<HStack spacing={2}>
				<NumberControl
					label={__('X Position', 'prc-chart-builder')}
					value={x}
					onChange={(value) =>
						handleChange('x', formatNum(value, 'float'))
					}
				/>
				<NumberControl
					label={__('Y Position', 'prc-chart-builder')}
					value={y}
					onChange={(value) =>
						handleChange('y', formatNum(value, 'float'))
					}
				/>
			</HStack>

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
				__next40pxDefaultSize
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
				__next40pxDefaultSize
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
					__next40pxDefaultSize
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
					__next40pxDefaultSize
				>
					{__('Delete annotation', 'prc-chart-builder')}
				</Button>
			)}
		</VStack>
	);
}

export default AnnotationPanel;
