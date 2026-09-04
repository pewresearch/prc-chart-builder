/**
 * Legend-block popover. Edits chart-level legend attributes, not per-item
 * customLegendLabels. Opened by clicking the grouped legend chrome.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import {
	SelectControl,
	TextControl,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import { formatNum } from '../../../utils/helpers';
import { FONT_WEIGHT_OPTIONS } from '../utils';

const FONT_SIZE_OPTIONS = ['10', '12', '14', '16'];

/**
 * @param {Object}   props
 * @param {Object}   props.legend            - Current legend attribute
 * @param {Function} props.onUpdate          - Partial legend updates
 * @param {boolean}  props.showDirectLayout  - Show Direct when the chart is a line family
 */
export function LegendPanel({
	legend = {},
	onUpdate,
	showDirectLayout = false,
}) {
	const handleChange = (field, value) => {
		onUpdate({ [field]: value });
	};

	const variation = legend.variation || 'grouped';
	const layoutValue =
		!showDirectLayout && variation === 'direct' ? 'grouped' : variation;
	const markerStyle = legend.markerStyle || 'rect';
	const showMarkerFill = markerStyle !== 'none' && markerStyle !== 'label';

	return (
		<VStack spacing={4}>
			<Heading level={6}>{__('Position', 'prc-chart-builder')}</Heading>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				isBlock
				label={__('Alignment', 'prc-chart-builder')}
				value={legend.alignment || 'flex-start'}
				onChange={(value) => handleChange('alignment', value)}
			>
				<ToggleGroupControlOption
					label={__('Start', 'prc-chart-builder')}
					value="flex-start"
				/>
				<ToggleGroupControlOption
					label={__('Center', 'prc-chart-builder')}
					value="center"
				/>
				<ToggleGroupControlOption
					label={__('End', 'prc-chart-builder')}
					value="flex-end"
				/>
				<ToggleGroupControlOption
					label={__('None', 'prc-chart-builder')}
					value="none"
				/>
			</ToggleGroupControl>
			<HStack spacing={2}>
				<NumberControl
					label={__('DX', 'prc-chart-builder')}
					value={legend.offsetX}
					onChange={(value) =>
						handleChange('offsetX', formatNum(value, 'integer'))
					}
				/>
				<NumberControl
					label={__('DY', 'prc-chart-builder')}
					value={legend.offsetY}
					onChange={(value) =>
						handleChange('offsetY', formatNum(value, 'integer'))
					}
				/>
			</HStack>

			<Heading level={6}>{__('Layout', 'prc-chart-builder')}</Heading>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				isBlock
				label={__('Legend Layout', 'prc-chart-builder')}
				value={layoutValue}
				onChange={(value) => handleChange('variation', value)}
			>
				<ToggleGroupControlOption
					label={__('Grouped', 'prc-chart-builder')}
					value="grouped"
				/>
				<ToggleGroupControlOption
					label={__('Detached', 'prc-chart-builder')}
					value="detached"
				/>
				{showDirectLayout && (
					<ToggleGroupControlOption
						label={__('Direct', 'prc-chart-builder')}
						value="direct"
					/>
				)}
			</ToggleGroupControl>
			<SelectControl
				label={__('Orientation', 'prc-chart-builder')}
				value={legend.orientation || 'row'}
				options={[
					{ value: 'row', label: __('Row', 'prc-chart-builder') },
					{
						value: 'column',
						label: __('Column', 'prc-chart-builder'),
					},
					{
						value: 'row-reverse',
						label: __('Row reverse', 'prc-chart-builder'),
					},
					{
						value: 'column-reverse',
						label: __('Column reverse', 'prc-chart-builder'),
					},
				]}
				onChange={(value) => handleChange('orientation', value)}
			/>

			<SelectControl
				label={__('Marker Style', 'prc-chart-builder')}
				value={markerStyle}
				options={[
					{
						value: 'rect',
						label: __('Square', 'prc-chart-builder'),
					},
					{
						value: 'circle',
						label: __('Circle', 'prc-chart-builder'),
					},
					{ value: 'line', label: __('Line', 'prc-chart-builder') },
					{ value: 'none', label: __('None', 'prc-chart-builder') },
					{
						value: 'label',
						label: __('Category Color', 'prc-chart-builder'),
					},
				]}
				onChange={(value) => handleChange('markerStyle', value)}
			/>
			{showMarkerFill && (
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					label={__('Marker Fill', 'prc-chart-builder')}
					value={legend.markerFill || 'solid'}
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
			)}

			<TextControl
				label={__('Legend Title', 'prc-chart-builder')}
				value={legend.title || ''}
				onChange={(value) => handleChange('title', value)}
			/>

			<VStack spacing={2}>
				<Heading level={6}>
					{__('Font Size', 'prc-chart-builder')}
				</Heading>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={
						legend.fontSize != null ? String(legend.fontSize) : ''
					}
					onChange={(value) =>
						handleChange(
							'fontSize',
							value ? parseInt(value, 10) : undefined
						)
					}
				>
					{FONT_SIZE_OPTIONS.map((size) => (
						<ToggleGroupControlOption
							key={size}
							label={`${size}px`}
							value={size}
						/>
					))}
				</ToggleGroupControl>
			</VStack>
			<SelectControl
				label={__('Font Weight', 'prc-chart-builder')}
				value={legend.fontWeight || 'normal'}
				options={FONT_WEIGHT_OPTIONS}
				onChange={(value) => handleChange('fontWeight', value)}
			/>

			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={__('Fill and Stroke', 'prc-chart-builder')}
				colorSettings={[
					{
						value: legend.fill || '',
						onChange: (value) => handleChange('fill', value ?? ''),
						label: __('Fill', 'prc-chart-builder'),
					},
					{
						value: legend.borderStroke || '',
						onChange: (value) =>
							handleChange('borderStroke', value ?? ''),
						label: __('Stroke', 'prc-chart-builder'),
					},
				]}
			/>
		</VStack>
	);
}

export default LegendPanel;
