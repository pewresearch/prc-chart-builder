/**
 * Shared typography controls for click-to-edit popovers (labels, ticks, legend, diff column, etc.).
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	TextControl,
	SelectControl,
	ToggleControl,
	Button,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import {
	PanelColorSettings,
	useSettings,
	__experimentalFontFamilyControl as FontFamilyControl,
} from '@wordpress/block-editor';

import { FONT_WEIGHT_OPTIONS, FONT_STYLE_OPTIONS } from '../utils';

const DEFAULT_FONT_SIZE_OPTIONS = ['10', '12', '14', '16', '18', '20'];

const TEXT_OUTLINE_HELP = __(
	'Adds a contrasting outline behind the text to improve readability on complex backgrounds.',
	'prc-chart-builder'
);

/**
 * @param {Object}        props
 * @param {Object}        props.values
 * @param {string}        [props.values.text]
 * @param {string}        [props.values.fontWeight]
 * @param {string}        [props.values.fontStyle]
 * @param {string}        [props.values.fontFamily]
 * @param {number|null}   [props.values.fontSize]
 * @param {string}        [props.values.fill]
 * @param {boolean}       [props.values.textOutline]
 * @param {Function}      props.onChange - (field, value) => void
 * @param {boolean}       [props.showText]
 * @param {string}        [props.textLabel]
 * @param {string}        [props.textPlaceholder]
 * @param {string}        [props.textHelp]
 * @param {boolean}       [props.showFontWeightDefault]
 * @param {boolean}       [props.showFontStyleDefault]
 * @param {boolean}       [props.showFontFamily]
 * @param {string[]}      [props.fontSizeOptions]
 * @param {string}        [props.fontSizeHelp]
 * @param {string}        [props.colorField] - values key for color (fill or color)
 * @param {string}        [props.colorPanelTitle]
 * @param {string}        [props.colorLabel]
 * @param {boolean}       [props.showTextOutline]
 * @param {string}        [props.textOutlineHelp]
 * @param {boolean}       [props.hasCustomizations]
 * @param {Function}      [props.onReset]
 * @param {boolean}       [props.resetDestructive]
 */
export function TextStyleControls({
	values = {},
	onChange,
	showText = true,
	textLabel = __('Text', 'prc-chart-builder'),
	textPlaceholder = '',
	textHelp,
	showFontWeightDefault = false,
	showFontStyleDefault = false,
	showFontFamily = true,
	fontSizeOptions = DEFAULT_FONT_SIZE_OPTIONS,
	fontSizeHelp,
	colorField = 'fill',
	colorPanelTitle = __('Text Color', 'prc-chart-builder'),
	colorLabel = __('Color', 'prc-chart-builder'),
	showTextOutline = false,
	textOutlineHelp = TEXT_OUTLINE_HELP,
	hasCustomizations = false,
	onReset,
	resetDestructive = false,
}) {
	const [blockLevelFontFamilies] = useSettings('typography.fontFamilies');
	const fontFamilyOptions = useMemo(() => {
		if (!blockLevelFontFamilies?.theme) {
			return [];
		}
		return blockLevelFontFamilies.theme.map(({ fontFamily, name }) => ({
			fontFamily,
			name,
		}));
	}, [blockLevelFontFamilies]);

	const fontWeightOptions = showFontWeightDefault
		? [
				{ label: __('Default', 'prc-chart-builder'), value: '' },
				...FONT_WEIGHT_OPTIONS,
			]
		: FONT_WEIGHT_OPTIONS;

	const fontStyleOptions = showFontStyleDefault
		? [
				{ label: __('Default', 'prc-chart-builder'), value: '' },
				...FONT_STYLE_OPTIONS,
			]
		: FONT_STYLE_OPTIONS;

	const colorValue = values[colorField] ?? '';

	return (
		<VStack spacing={4}>
			{showText && (
				<TextControl
					label={textLabel}
					value={values.text ?? ''}
					onChange={(value) => onChange('text', value)}
					placeholder={textPlaceholder}
					help={textHelp}
				/>
			)}

			<SelectControl
				label={__('Font Weight', 'prc-chart-builder')}
				value={values.fontWeight ?? ''}
				options={fontWeightOptions}
				onChange={(value) => onChange('fontWeight', value)}
			/>

			<SelectControl
				label={__('Font Style', 'prc-chart-builder')}
				value={values.fontStyle ?? ''}
				options={fontStyleOptions}
				onChange={(value) => onChange('fontStyle', value)}
			/>

			{showFontFamily && fontFamilyOptions.length > 0 && (
				<FontFamilyControl
					label={__('Font Family', 'prc-chart-builder')}
					value={values.fontFamily ?? ''}
					fontFamilies={fontFamilyOptions}
					onChange={(value) => onChange('fontFamily', value ?? '')}
				/>
			)}

			<VStack spacing={2}>
				<Text size="11px" weight={500}>
					{__('Font Size', 'prc-chart-builder')}
				</Text>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={
						values.fontSize != null && values.fontSize !== ''
							? String(values.fontSize)
							: ''
					}
					onChange={(value) =>
						onChange('fontSize', value ? parseInt(value, 10) : null)
					}
				>
					{fontSizeOptions.map((size) => (
						<ToggleGroupControlOption
							key={size}
							label={`${size}px`}
							value={size}
						/>
					))}
				</ToggleGroupControl>
				{fontSizeHelp && (
					<Text size="12px" color="#757575">
						{fontSizeHelp}
					</Text>
				)}
			</VStack>

			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={colorPanelTitle}
				colorSettings={[
					{
						value: colorValue,
						onChange: (value) => onChange(colorField, value ?? ''),
						label: colorLabel,
					},
				]}
			/>

			{showTextOutline && (
				<ToggleControl
					label={__('Text Outline', 'prc-chart-builder')}
					help={textOutlineHelp}
					checked={!!values.textOutline}
					onChange={(value) => onChange('textOutline', value)}
				/>
			)}

			{hasCustomizations && onReset && (
				<Button
					variant="secondary"
					isDestructive={resetDestructive}
					onClick={onReset}
					style={{ marginTop: '8px' }}
				>
					{__('Reset to defaults', 'prc-chart-builder')}
				</Button>
			)}
		</VStack>
	);
}

export default TextStyleControls;
