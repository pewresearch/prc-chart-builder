/**
 * LegendItemPanel Component
 *
 * Panel for customizing a legend item — mirrors LabelPanel with an extra
 * Marker control and X/Y offset controls (detached mode only).
 *
 * Style controls, marker controls, and the text annotation layout
 * (text anchor, vertical anchor, rotation, max width, opacity) are available
 * for grouped, detached, and direct legends. Position offset controls are
 * shown for detached and direct legends.
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
import { resolveLegendTextAnchor } from '@prc/charting-utilities';

import { useLegendItemCustomizations } from '../hooks';
import { TextAnnotationLayoutControls } from './TextAnnotationLayoutControls';
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
 * @param {string}   props.legendVariation       - 'grouped' | 'detached' | 'direct'
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
		lineHeight,
		textAnchor,
		verticalAnchor,
		rotation,
		opacity,
		textAlign,
		letterSpacing,
		textOutline,
		markerStyle,
		markerFill,
		positioningContext,
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
	const isDirect = legendVariation === 'direct';
	const showPositionOffsets = isDetached || isDirect;

	const displayedTextAnchor =
		resolveLegendTextAnchor({ textAnchor, textAlign }) ?? '';

	const handleLayoutChange = (field, value) => {
		if (field === 'textAnchor') {
			handleChange('textAnchor', value, { textAlign: '' });
			return;
		}
		if (field === 'rotation' || field === 'opacity') {
			handleChange(
				field,
				value !== '' && value !== undefined && value !== null
					? Number(value)
					: ''
			);
			return;
		}
		if (field === 'maxWidth') {
			handleChange(field, parseInt(value, 10) || 0);
			return;
		}
		handleChange(field, value);
	};

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

			{/* ── Position offsets (detached / direct) ─────────────────── */}
			{showPositionOffsets && (
				<>
					<Heading level={6}>
						{__('Position', 'prc-chart-builder')}
					</Heading>
					{isDetached && (
						<SelectControl
							__next40pxDefaultSize
							label={__(
								'Positioning Context',
								'prc-chart-builder'
							)}
							value={positioningContext}
							options={[
								{
									label: __(
										'Full Chart Area',
										'prc-chart-builder'
									),
									value: 'chart',
								},
								{
									label: __(
										'Data Area (Inner)',
										'prc-chart-builder'
									),
									value: 'inner',
								},
							]}
							onChange={(value) =>
								handleChange('positioningContext', value)
							}
							help={__(
								'Use Data Area when placing labels directly above or beside plotted data.',
								'prc-chart-builder'
							)}
						/>
					)}
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
				__next40pxDefaultSize
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

			<TextAnnotationLayoutControls
				allowDefault
				textAnchor={displayedTextAnchor}
				verticalAnchor={verticalAnchor}
				rotation={rotation}
				maxWidth={maxWidth}
				opacity={opacity}
				maxWidthHelp={__(
					'Maximum width for text wrapping (0 = no limit)',
					'prc-chart-builder'
				)}
				help={__(
					'Same text anchor, vertical anchor, rotation, max width, and opacity as chart annotations.',
					'prc-chart-builder'
				)}
				onChange={handleLayoutChange}
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
					__next40pxDefaultSize
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
