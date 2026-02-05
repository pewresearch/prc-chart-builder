/**
 * Label Panel Component
 *
 * Panel for customizing label properties: text, visibility, position, and styling.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	TextControl,
	ToggleControl,
	SelectControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Button,
} from '@wordpress/components';
import {
	PanelColorSettings,
	useSettings,
	__experimentalFontFamilyControl as FontFamilyControl,
} from '@wordpress/block-editor';

import { useLabelCustomizations } from '../hooks';
import { generateElementKey, FONT_WEIGHT_OPTIONS, FONT_STYLE_OPTIONS } from '../utils';

/**
 * LabelPanel Component
 *
 * @param {Object}   props
 * @param {Object}   props.dataPoint             - The data point object
 * @param {string}   props.category              - The category key
 * @param {string}   props.defaultLabel          - The default label value
 * @param {Object}   props.currentCustomizations - Current customizations
 * @param {Function} props.onUpdate              - Callback to update
 */
export function LabelPanel({
	dataPoint,
	category,
	defaultLabel,
	currentCustomizations = {},
	onUpdate,
}) {
	const labelKey = generateElementKey(dataPoint.x, category);

	const [blockLevelFontFamilies] = useSettings('typography.fontFamilies');
	const fontFamilyOptions = useMemo(() => {
		if (!blockLevelFontFamilies?.theme) return [];
		return blockLevelFontFamilies.theme.map(({ fontFamily, name }) => ({
			fontFamily,
			name,
		}));
	}, [blockLevelFontFamilies]);

	const {
		customText,
		isVisible,
		positionDx,
		positionDy,
		customColor,
		fontWeight,
		fontStyle,
		fontFamily,
		maxWidth,
		hasCustomizations,
		handleTextChange,
		handleVisibilityChange,
		handlePositionChange,
		handleStyleChange,
		handleReset,
	} = useLabelCustomizations(labelKey, currentCustomizations, onUpdate);

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{category}: {defaultLabel}
			</Text>

			<ToggleControl
				label={__('Show label', 'prc-chart-builder')}
				checked={isVisible}
				onChange={handleVisibilityChange}
			/>

			{isVisible && (
				<>
					<TextControl
						label={__('Custom label text', 'prc-chart-builder')}
						value={customText}
						onChange={handleTextChange}
						placeholder={defaultLabel}
						help={__(
							'Leave empty to use the default value',
							'prc-chart-builder'
						)}
					/>

					<HStack spacing={2}>
						<NumberControl
							label={__('Offset X', 'prc-chart-builder')}
							value={positionDx}
							onChange={(v) => handlePositionChange('dx', v)}
							step={1}
						/>
						<NumberControl
							label={__('Offset Y', 'prc-chart-builder')}
							value={positionDy}
							onChange={(v) => handlePositionChange('dy', v)}
							step={1}
						/>
					</HStack>

					<SelectControl
						label={__('Font Weight', 'prc-chart-builder')}
						value={fontWeight}
						options={FONT_WEIGHT_OPTIONS}
						onChange={(v) => handleStyleChange('fontWeight', v)}
					/>

					<SelectControl
						label={__('Font Style', 'prc-chart-builder')}
						value={fontStyle}
						options={FONT_STYLE_OPTIONS}
						onChange={(v) => handleStyleChange('fontStyle', v)}
					/>

					{fontFamilyOptions.length > 0 && (
						<FontFamilyControl
							label={__('Font Family', 'prc-chart-builder')}
							value={fontFamily}
							fontFamilies={fontFamilyOptions}
							onChange={(v) => handleStyleChange('fontFamily', v)}
						/>
					)}

					<NumberControl
						label={__('Max Width', 'prc-chart-builder')}
						value={maxWidth}
						onChange={(v) =>
							handleStyleChange('maxWidth', parseInt(v, 10) || 0)
						}
						min={0}
						help={__(
							'Maximum width for text wrapping (0 = no limit)',
							'prc-chart-builder'
						)}
					/>

					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Label Color', 'prc-chart-builder')}
						colorSettings={[
							{
								value: customColor,
								onChange: (val) =>
									handleStyleChange('color', val ?? ''),
								label: __('Color', 'prc-chart-builder'),
							},
						]}
					/>
				</>
			)}

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

export default LabelPanel;
