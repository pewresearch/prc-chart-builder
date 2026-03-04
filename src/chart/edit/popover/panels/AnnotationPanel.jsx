/**
 * Annotation Panel Component
 *
 * Panel for customizing annotation properties: text, styling, and positioning.
 * Shown in a popover when clicking an annotation in the chart editor.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	TextControl,
	SelectControl,
	ToggleControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	Button,
} from '@wordpress/components';
import {
	PanelColorSettings,
	useSettings,
	__experimentalFontFamilyControl as FontFamilyControl,
} from '@wordpress/block-editor';

import { useAnnotationCustomizations } from '../hooks';
import { FONT_WEIGHT_OPTIONS, FONT_STYLE_OPTIONS } from '../utils';
import { formatNum } from '../../../utils/helpers';

/**
 * AnnotationPanel Component
 *
 * @param {Object}   props
 * @param {string}   props.annotationId   - The annotation index as string
 * @param {Object}   props.annotation     - The annotation object
 * @param {Function} props.onUpdate       - Callback to update annotation (receives partial updates)
 * @param {Function} props.onDelete       - Callback to delete the annotation
 */
export function AnnotationPanel({
	annotationId,
	annotation,
	onUpdate,
	onDelete,
}) {
	const [blockLevelFontFamilies] = useSettings('typography.fontFamilies');
	const fontFamilyOptions = useMemo(() => {
		if (!blockLevelFontFamilies?.theme) return [];
		return blockLevelFontFamilies.theme.map(({ fontFamily, name }) => ({
			fontFamily,
			name,
		}));
	}, [blockLevelFontFamilies]);

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
				{__('Annotation', 'prc-chart-builder')} #{parseInt(annotationId, 10) + 1}
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
					{ label: __('Full Chart Area', 'prc-chart-builder'), value: 'chart' },
					{ label: __('Data Area (Inner)', 'prc-chart-builder'), value: 'inner' },
				]}
				onChange={(value) => handleChange('positioningContext', value)}
			/>

			<SelectControl
				label={__('Font Weight', 'prc-chart-builder')}
				value={fontWeight}
				options={FONT_WEIGHT_OPTIONS}
				onChange={(value) => handleChange('fontWeight', value)}
			/>

			<SelectControl
				label={__('Font Style', 'prc-chart-builder')}
				value={fontStyle}
				options={FONT_STYLE_OPTIONS}
				onChange={(value) => handleChange('fontStyle', value)}
			/>

			{fontFamilyOptions.length > 0 && (
				<FontFamilyControl
					label={__('Font Family', 'prc-chart-builder')}
					value={fontFamily}
					fontFamilies={fontFamilyOptions}
					onChange={(value) => handleChange('fontFamily', value ?? '')}
				/>
			)}

			<VStack spacing={2}>
				<Text size="11px" weight={500}>
					{__('Font Size', 'prc-chart-builder')}
				</Text>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={fontSize ? String(fontSize) : ''}
					onChange={(value) =>
						handleChange('fontSize', value ? parseInt(value, 10) : 14)
					}
				>
					<ToggleGroupControlOption label="10px" value="10" />
					<ToggleGroupControlOption label="12px" value="12" />
					<ToggleGroupControlOption label="14px" value="14" />
					<ToggleGroupControlOption label="16px" value="16" />
					<ToggleGroupControlOption label="18px" value="18" />
					<ToggleGroupControlOption label="20px" value="20" />
				</ToggleGroupControl>
			</VStack>

			<SelectControl
				label={__('Text Anchor', 'prc-chart-builder')}
				value={textAnchor}
				options={[
					{ label: __('Start', 'prc-chart-builder'), value: 'start' },
					{ label: __('Middle', 'prc-chart-builder'), value: 'middle' },
					{ label: __('End', 'prc-chart-builder'), value: 'end' },
				]}
				onChange={(value) => handleChange('textAnchor', value)}
			/>

			<SelectControl
				label={__('Vertical Anchor', 'prc-chart-builder')}
				value={verticalAnchor}
				options={[
					{ label: __('Start', 'prc-chart-builder'), value: 'start' },
					{ label: __('Middle', 'prc-chart-builder'), value: 'middle' },
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
				help={__('Maximum width for text wrapping', 'prc-chart-builder')}
			/>

			<NumberControl
				label={__('Opacity', 'prc-chart-builder')}
				value={opacity}
				onChange={(value) => handleChange('opacity', value)}
				min={0}
				max={1}
				step={0.1}
			/>

		<PanelColorSettings
			__experimentalHasMultipleOrigins
			__experimentalIsRenderedInSidebar
			title={__('Text Color', 'prc-chart-builder')}
			colorSettings={[
				{
					value: fill,
					onChange: (val) => handleChange('fill', val ?? '#231F20'),
					label: __('Color', 'prc-chart-builder'),
				},
			]}
		/>

		<ToggleControl
			label={__('Text Outline', 'prc-chart-builder')}
			help={__(
				'Adds a contrasting outline behind the text to improve readability on complex backgrounds.',
				'prc-chart-builder'
			)}
			checked={textOutline}
			onChange={(value) => handleChange('textOutline', value)}
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
