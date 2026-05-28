/**
 * LegendItemPanel Component
 *
 * Panel for customizing a legend item — mirrors LabelPanel with an extra
 * Marker control and X/Y offset controls (detached mode only).
 *
 * Style controls (color, font, outline, max-width, marker) are available in
 * both grouped and detached modes.  Position offset controls are shown only
 * when legendVariation === 'detached'.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import {
	Button,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	__experimentalText as Text,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { useLegendItemCustomizations } from '../hooks';
import { TextStyleControls } from './TextStyleControls';

const MARKER_STYLE_OPTIONS = [
	{ label: __('Default', 'prc-chart-builder'), value: '' },
	{ label: __('None', 'prc-chart-builder'), value: 'none' },
	{ label: __('Circle', 'prc-chart-builder'), value: 'circle' },
	{ label: __('Square', 'prc-chart-builder'), value: 'rect' },
	{ label: __('Line', 'prc-chart-builder'), value: 'line' },
];

/**
 * LegendItemPanel Component
 *
 * @param {Object}   props
 * @param {string}   props.categoryValue         - The category/domain value of the legend item
 * @param {string}   props.defaultLabel          - The default rendered label text
 * @param {Object}   props.currentCustomizations - Current customLegendLabels block attr
 * @param {Function} props.onUpdate              - Callback to update
 * @param {string}   props.legendVariation       - 'grouped' | 'detached'
 */
export function LegendItemPanel({
	categoryValue,
	defaultLabel,
	currentCustomizations = {},
	onUpdate,
	legendVariation = 'grouped',
}) {
	const {
		text,
		color,
		fontWeight,
		fontStyle,
		fontFamily,
		fontSize,
		maxWidth,
		textOutline,
		markerStyle,
		markerFill,
		offsetX,
		offsetY,
		hasCustomizations,
		handleChange,
		handleReset,
	} = useLegendItemCustomizations(
		categoryValue,
		defaultLabel,
		currentCustomizations,
		onUpdate
	);

	const isDetached = legendVariation === 'detached';

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
				{__('Legend item', 'prc-chart-builder')}: {defaultLabel}
			</Text>

			{/* ── Position offsets (detached only) ─────────────────── */}
			{isDetached && (
				<>
					<Heading level={6}>
						{__('Position', 'prc-chart-builder')}
					</Heading>
					<Text size="11px" color="#757575">
						{__(
							'Drag the item on the chart, or set offsets manually.',
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
				</>
			)}

			{/* ── Marker ────────────────────────────────────────────── */}
			<SelectControl
				label={__('Marker style', 'prc-chart-builder')}
				value={markerStyle}
				options={MARKER_STYLE_OPTIONS}
				onChange={(value) => handleChange('markerStyle', value)}
				help={__(
					'"None" hides the swatch entirely',
					'prc-chart-builder'
				)}
			/>

			{markerStyle !== 'none' && (
				<VStack spacing={2}>
					<Text size="11px" weight={500}>
						{__('Marker Fill', 'prc-chart-builder')}
					</Text>
					<ToggleGroupControl
						__nextHasNoMarginBottom
						isBlock
						value={markerFill || 'solid'}
						onChange={(value) => handleChange('markerFill', value)}
					>
						<ToggleGroupControlOption
							label={__('Solid', 'prc-chart-builder')}
							value="solid"
						/>
						<ToggleGroupControlOption
							label={__('Outline', 'prc-chart-builder')}
							value="outline"
						/>
					</ToggleGroupControl>
					<Text size="12px" color="#757575">
						{__(
							'Override the legend-level marker fill for this item.',
							'prc-chart-builder'
						)}
					</Text>
				</VStack>
			)}

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
				textLabel={__('Custom label text', 'prc-chart-builder')}
				textPlaceholder={defaultLabel || ''}
				textHelp={__(
					'Leave empty to use the default label',
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
				onChange={(v) => handleChange('maxWidth', parseInt(v, 10) || 0)}
				min={0}
				help={__(
					'Maximum width for text wrapping (0 = no limit)',
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

export default LegendItemPanel;
