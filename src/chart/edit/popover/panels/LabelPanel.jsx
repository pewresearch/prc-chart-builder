/**
 * Label Panel Component
 *
 * Panel for customizing label properties: text, visibility, position, and styling.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	ToggleControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Button,
} from '@wordpress/components';

import { useLabelCustomizations } from '../hooks';
import { generateElementKey, POSITION_DISABLED_CHART_TYPES } from '../utils';
import { TooltipPanelSection } from './TooltipPanelSection';
import { TextStyleControls } from './TextStyleControls';

/**
 * LabelPanel Component
 *
 * @param {Object}      props
 * @param {Object}      props.dataPoint                    - The data point object
 * @param {string}      props.category                     - The category key
 * @param {string}      props.defaultLabel                 - The default label value
 * @param {string|null} props.groupValue                   - The group value (when groupBreaksActive), or null
 * @param {string}      props.chartType                    - The chart layout type (e.g., 'bar', 'treemap', 'pie')
 * @param {Object}      props.currentCustomizations        - Current customizations
 * @param {Function}    props.onUpdate                     - Callback to update
 * @param {Object}      props.currentTooltipCustomizations - { customTooltips }
 * @param {Function}    props.onTooltipUpdate              - Callback to update customTooltips
 */
export function LabelPanel({
	dataPoint,
	category,
	defaultLabel,
	groupValue = null,
	chartType,
	currentCustomizations = {},
	onUpdate,
	currentTooltipCustomizations = {},
	onTooltipUpdate,
}) {
	const positionDisabled = POSITION_DISABLED_CHART_TYPES.includes(chartType);
	const labelKey = generateElementKey(dataPoint.x, category, groupValue);
	const defaultTooltipHeader = '';

	const {
		customText,
		isVisible,
		positionDx,
		positionDy,
		customColor,
		fontWeight,
		fontStyle,
		fontFamily,
		fontSize,
		maxWidth,
		textOutline,
		hasCustomizations,
		handleTextChange,
		handleVisibilityChange,
		handlePositionChange,
		handleStyleChange,
		handleReset,
	} = useLabelCustomizations(labelKey, currentCustomizations, onUpdate);

	const handleTextStyleChange = (field, value) => {
		if (field === 'text') {
			handleTextChange(value);
			return;
		}
		const styleField = field === 'fill' ? 'color' : field;
		handleStyleChange(styleField, value);
	};

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
					{positionDisabled ? (
						<Text
							size="12px"
							color="#757575"
							style={{
								fontStyle: 'italic',
								padding: '8px 0',
							}}
						>
							{__(
								'Label positions are algorithmically determined for this chart type and cannot be manually adjusted.',
								'prc-chart-builder'
							)}
						</Text>
					) : (
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
					)}

					<TextStyleControls
						values={{
							text: customText,
							fill: customColor,
							fontWeight,
							fontStyle,
							fontFamily,
							fontSize,
							textOutline,
						}}
						onChange={handleTextStyleChange}
						textLabel={__('Custom label text', 'prc-chart-builder')}
						textPlaceholder={defaultLabel}
						textHelp={__(
							'Leave empty to use the default value',
							'prc-chart-builder'
						)}
						colorField="fill"
						colorPanelTitle={__('Label Color', 'prc-chart-builder')}
						fontSizeOptions={['10', '12', '14', '16']}
						fontSizeHelp={__(
							'Leave unselected to use chart default',
							'prc-chart-builder'
						)}
						showTextOutline
					/>

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

			{onTooltipUpdate && (
				<TooltipPanelSection
					tooltipKey={labelKey}
					currentCustomizations={currentTooltipCustomizations}
					onUpdate={onTooltipUpdate}
					defaultHeader={defaultTooltipHeader}
				/>
			)}
		</VStack>
	);
}

export default LabelPanel;
