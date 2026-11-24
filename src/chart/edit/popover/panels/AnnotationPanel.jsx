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
import { ImageAnnotationFields } from './ImageAnnotationFields';
import { RichTextField } from './RichTextField';
import { TextAnnotationLayoutControls } from './TextAnnotationLayoutControls';
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

	const isImage = annotation?.kind === 'image';
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
				{isImage
					? __('Image annotation', 'prc-chart-builder')
					: __('Annotation', 'prc-chart-builder')}{' '}
				#{parseInt(annotationId, 10) + 1}
			</Text>

			{isImage ? (
				<ImageAnnotationFields
					annotation={annotation}
					onUpdate={onUpdate}
					panelKeys={panelKeys}
					surface="popover"
				/>
			) : (
				<RichTextField
					label={__('Text', 'prc-chart-builder')}
					value={text}
					onChange={(value) => handleChange('text', value)}
					placeholder={__(
						'Enter annotation text',
						'prc-chart-builder'
					)}
				/>
			)}

			{!isImage && (
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
			)}

			{!isImage && isPanelContext && hasPanelKeys && (
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

			{!isImage && (
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
			)}

			{!isImage && (
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
			)}

			{!isImage && (
				<TextAnnotationLayoutControls
					textAnchor={textAnchor}
					verticalAnchor={verticalAnchor}
					rotation={rotation}
					maxWidth={maxWidth}
					opacity={opacity}
					onChange={(field, value) => {
						if (field === 'rotation') {
							handleChange(
								field,
								formatNum(value, 'integer') ?? 0
							);
							return;
						}
						if (field === 'maxWidth') {
							handleChange(
								field,
								formatNum(value, 'integer') ?? 200
							);
							return;
						}
						handleChange(field, value);
					}}
				/>
			)}

			{!isImage && hasCustomizations && (
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
