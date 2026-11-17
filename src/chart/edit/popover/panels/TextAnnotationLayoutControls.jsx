/**
 * Text annotation layout controls.
 *
 * Text anchor, vertical anchor, rotation, max width, and opacity.
 * Chart annotations, plot-band labels, and legend items share this set.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import {
	__experimentalNumberControl as NumberControl,
	SelectControl,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const TEXT_ANCHOR_OPTIONS = [
	{ label: __('Start', 'prc-chart-builder'), value: 'start' },
	{ label: __('Middle', 'prc-chart-builder'), value: 'middle' },
	{ label: __('End', 'prc-chart-builder'), value: 'end' },
];

const VERTICAL_ANCHOR_OPTIONS = [
	{ label: __('Start', 'prc-chart-builder'), value: 'start' },
	{ label: __('Middle', 'prc-chart-builder'), value: 'middle' },
	{ label: __('End', 'prc-chart-builder'), value: 'end' },
];

/**
 * @param {Object}        props
 * @param {string}        props.textAnchor
 * @param {string}        props.verticalAnchor
 * @param {number|string} props.rotation
 * @param {number|string} props.maxWidth
 * @param {number|string} props.opacity
 * @param {Function}      props.onChange       (field, value) => void
 * @param {boolean}       [props.allowDefault] Empty option clears a per-item override.
 * @param {string}        [props.maxWidthHelp]
 * @param {string}        [props.help]
 */
export function TextAnnotationLayoutControls({
	textAnchor,
	verticalAnchor,
	rotation,
	maxWidth,
	opacity,
	onChange,
	allowDefault = false,
	maxWidthHelp = __('Maximum width for text wrapping', 'prc-chart-builder'),
	help,
}) {
	const defaultOption = {
		label: __('Default', 'prc-chart-builder'),
		value: '',
	};
	const textAnchorOptions = allowDefault
		? [defaultOption, ...TEXT_ANCHOR_OPTIONS]
		: TEXT_ANCHOR_OPTIONS;
	const verticalAnchorOptions = allowDefault
		? [defaultOption, ...VERTICAL_ANCHOR_OPTIONS]
		: VERTICAL_ANCHOR_OPTIONS;

	return (
		<VStack spacing={4}>
			<SelectControl
				label={__('Text Anchor', 'prc-chart-builder')}
				value={textAnchor ?? (allowDefault ? '' : 'start')}
				__next40pxDefaultSize
				options={textAnchorOptions}
				onChange={(value) => onChange('textAnchor', value)}
			/>
			<SelectControl
				label={__('Vertical Anchor', 'prc-chart-builder')}
				value={verticalAnchor ?? (allowDefault ? '' : 'start')}
				__next40pxDefaultSize
				options={verticalAnchorOptions}
				onChange={(value) => onChange('verticalAnchor', value)}
			/>
			<NumberControl
				label={__('Rotation (degrees)', 'prc-chart-builder')}
				value={rotation}
				onChange={(value) => onChange('rotation', value)}
				min={-360}
				max={360}
			/>
			<NumberControl
				label={__('Max Width', 'prc-chart-builder')}
				value={maxWidth}
				onChange={(value) => onChange('maxWidth', value)}
				min={0}
				help={maxWidthHelp}
			/>
			<NumberControl
				label={__('Opacity', 'prc-chart-builder')}
				value={opacity}
				onChange={(value) => onChange('opacity', value)}
				min={0}
				max={1}
				step={0.1}
			/>
			{help && (
				<Text size="12px" color="#757575">
					{help}
				</Text>
			)}
		</VStack>
	);
}

export default TextAnnotationLayoutControls;
