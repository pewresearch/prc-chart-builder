/**
 * Tooltip Panel Section
 *
 * Shared section component mounted inside both ShapePanel and LabelPanel so
 * editors can override the tooltip for a specific data point, regardless of
 * whether they clicked a shape or a label.
 *
 * - Body: rich text (bold / italic / line breaks) — HTML string consumed by
 *         the chart's existing tooltip render path. Enter or Shift+Enter
 *         inserts a <br> for multi-line tooltips.
 * - Header override: optional plain-text input (collapsed by default) that
 *         replaces the computed tooltip header for this point only.
 *
 * Backed by `customTooltips` block attribute via `useTooltipCustomizations`.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { RichText } from '@wordpress/block-editor';
import {
	Button,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { useTooltipCustomizations } from '../hooks';

/**
 * TooltipPanelSection Component
 *
 * @param {Object}   props
 * @param {string}   props.tooltipKey            - Element key from generateElementKey
 * @param {Object}   props.currentCustomizations - { customTooltips } from wpEditorFunctions
 * @param {Function} props.onUpdate              - ({ customTooltips }) => void
 * @param {string}   [props.defaultHeader]       - The computed default tooltip header for this point; shown as placeholder in the Header Override field.
 */
export function TooltipPanelSection({
	tooltipKey,
	currentCustomizations = {},
	onUpdate,
	defaultHeader = '',
}) {
	const { body, header, hasCustomizations, handleChange, handleReset } =
		useTooltipCustomizations(tooltipKey, currentCustomizations, onUpdate);

	return (
		<VStack
			spacing={3}
			style={{
				marginTop: '8px',
				paddingTop: '12px',
				borderTop: '1px solid #e0e0e0',
			}}
		>
			<Text weight="600" size="12px">
				{__('Custom Tooltip', 'prc-chart-builder')}
			</Text>

			<TextControl
				label={__('Header Override', 'prc-chart-builder')}
				value={header}
				onChange={(value) => handleChange('header', value)}
				placeholder={defaultHeader}
				help={__(
					'Replaces the computed tooltip header for this point. Plain text only. Leave empty to use the default.',
					'prc-chart-builder'
				)}
			/>

			<div>
				<Text
					as="label"
					weight={500}
					size="11px"
					style={{
						display: 'block',
						marginBottom: '4px',
						textTransform: 'uppercase',
					}}
				>
					{__('Tooltip Body', 'prc-chart-builder')}
				</Text>
				<div
					className="cb__tooltip-richtext-wrapper"
					style={{
						marginTop: '4px',
						padding: '8px',
						minHeight: '48px',
						border: '1px solid #d3d3d3',
						borderRadius: '2px',
						background: '#fff',
					}}
				>
					<RichText
						tagName="div"
						value={body}
						onChange={(value) => handleChange('body', value)}
						allowedFormats={['core/bold', 'core/italic']}
						placeholder={__(
							'Write a custom tooltip…',
							'prc-chart-builder'
						)}
					/>
				</div>
				<Text
					size="11px"
					color="#757575"
					style={{ display: 'block', marginTop: '4px' }}
				>
					{__(
						'Overrides the default tooltip body for this point. Supports bold, italics, and line breaks (press Enter for a new line).',
						'prc-chart-builder'
					)}
				</Text>
			</div>

			{hasCustomizations && (
				<HStack justify="flex-start">
					<Button
						variant="secondary"
						isDestructive
						size="small"
						onClick={() => {
							handleReset();
						}}
					>
						{__('Reset tooltip', 'prc-chart-builder')}
					</Button>
				</HStack>
			)}
		</VStack>
	);
}

export default TooltipPanelSection;
