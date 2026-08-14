/**
 * Panel title popover — mirrors LegendItemPanel text/position controls
 * (shared TextStyleControls) without legend marker chrome.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import {
	Button,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { usePanelTitleCustomizations } from '../hooks';
import { TextStyleControls } from './TextStyleControls';

/**
 * @param {Object}   props
 * @param {string}   props.categoryValue         - Panel key
 * @param {string}   props.defaultLabel          - Default panel title
 * @param {Object}   props.currentCustomizations - customPanelTitles attr
 * @param {Function} props.onUpdate              - Update callback
 */
export function PanelTitlePanel({
	categoryValue,
	defaultLabel,
	currentCustomizations = {},
	onUpdate,
}) {
	const {
		text,
		color,
		fontWeight,
		fontStyle,
		fontFamily,
		fontSize,
		maxWidth,
		lineHeight,
		textAlign,
		letterSpacing,
		textOutline,
		offsetX,
		offsetY,
		hasCustomizations,
		handleChange,
		handleReset,
	} = usePanelTitleCustomizations(
		categoryValue,
		defaultLabel,
		currentCustomizations,
		onUpdate
	);

	const handleTextStyleChange = (field, value) => {
		if (field === 'fill') {
			handleChange('color', value);
			return;
		}
		if (field === 'fontSize' && (value === null || value === undefined)) {
			handleChange('fontSize', '');
			return;
		}
		handleChange(field, value);
	};

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{__('Panel title', 'prc-chart-builder')}: {defaultLabel}
			</Text>

			<Heading level={6}>{__('Position', 'prc-chart-builder')}</Heading>
			<Text size="11px" color="#757575">
				{__(
					'Drag the title on the chart, or set offsets manually.',
					'prc-chart-builder'
				)}
			</Text>
			<HStack spacing={2}>
				<NumberControl
					label={__('Offset X', 'prc-chart-builder')}
					value={offsetX}
					onChange={(v) =>
						handleChange(
							'offsetX',
							v !== '' && v !== undefined ? Number(v) : ''
						)
					}
					step={1}
				/>
				<NumberControl
					label={__('Offset Y', 'prc-chart-builder')}
					value={offsetY}
					onChange={(v) =>
						handleChange(
							'offsetY',
							v !== '' && v !== undefined ? Number(v) : ''
						)
					}
					step={1}
				/>
			</HStack>

			<TextStyleControls
				values={{
					text,
					fill: color,
					fontWeight,
					fontStyle,
					fontFamily,
					fontSize: fontSize === '' ? null : fontSize,
					textOutline,
				}}
				onChange={handleTextStyleChange}
				textLabel={__('Custom title text', 'prc-chart-builder')}
				textPlaceholder={defaultLabel || ''}
				textHelp={__(
					'Leave empty to use the column/group name',
					'prc-chart-builder'
				)}
				colorField="fill"
				colorPanelTitle={__('Title Color', 'prc-chart-builder')}
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
				onChange={(v) => handleChange('maxWidth', parseInt(v, 10) || 0)}
				min={0}
				help={__(
					'Maximum width for text wrapping (0 = no limit)',
					'prc-chart-builder'
				)}
			/>

			<Heading level={6}>{__('Paragraph', 'prc-chart-builder')}</Heading>
			<NumberControl
				label={__('Line Height', 'prc-chart-builder')}
				value={lineHeight}
				onChange={(v) =>
					handleChange(
						'lineHeight',
						v !== '' && v !== undefined ? Number(v) : ''
					)
				}
				min={0.8}
				max={3}
				step={0.1}
				help={__(
					'Unitless multiplier (e.g. 1.4). Leave empty for default.',
					'prc-chart-builder'
				)}
			/>
			<SelectControl
				label={__('Text Align', 'prc-chart-builder')}
				value={textAlign}
				options={[
					{
						label: __('Default', 'prc-chart-builder'),
						value: '',
					},
					{
						label: __('Left', 'prc-chart-builder'),
						value: 'left',
					},
					{
						label: __('Center', 'prc-chart-builder'),
						value: 'center',
					},
					{
						label: __('Right', 'prc-chart-builder'),
						value: 'right',
					},
				]}
				onChange={(value) => handleChange('textAlign', value)}
			/>
			<NumberControl
				label={__('Letter Spacing', 'prc-chart-builder')}
				value={letterSpacing}
				onChange={(v) =>
					handleChange(
						'letterSpacing',
						v !== '' && v !== undefined ? Number(v) : ''
					)
				}
				step={0.5}
				help={__(
					'Extra space between characters in px. Leave empty for default.',
					'prc-chart-builder'
				)}
			/>

			{hasCustomizations && (
				<Button
					variant="secondary"
					isDestructive
					onClick={handleReset}
					style={{ marginTop: '4px' }}
				>
					{__('Reset to defaults', 'prc-chart-builder')}
				</Button>
			)}
		</VStack>
	);
}
