/**
 * WordPress Dependencies
 */
import {
	FormTokenField,
	SelectControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { PanelDescription } from './control-ui';

const SCALE_OPTIONS = [
	{ value: 'threshold', label: __('Threshold') },
	{ value: 'ordinal', label: __('Ordinal') },
	{ value: 'linear', label: __('Linear') },
];

/**
 * Scale mode and domain for value-colored charts (maps and heat maps).
 * Ordinal categories come from the data, so ordinal shows no domain field.
 *
 * @param {Object}   props
 * @param {Object}   props.dataRender    Block dataRender attribute.
 * @param {Function} props.setAttributes Block attribute setter.
 */
export default function ValueScaleControls({ dataRender, setAttributes }) {
	const setDataRender = (updates) =>
		setAttributes({ dataRender: { ...dataRender, ...updates } });

	return (
		<>
			<VStack spacing={2}>
				<SelectControl
					__next40pxDefaultSize
					label={__('Scale')}
					value={dataRender.mapScale}
					onChange={(value) => setDataRender({ mapScale: value })}
					options={SCALE_OPTIONS}
				/>
				{dataRender.mapScale === 'ordinal' && (
					<PanelDescription>
						{__(
							'Each unique value in the data gets a color. Reorder those colors in the legend.'
						)}
					</PanelDescription>
				)}
			</VStack>
			{dataRender.mapScale !== 'ordinal' && (
				<VStack spacing={2}>
					<PanelDescription>
						{dataRender.mapScale === 'threshold'
							? __('Enter the thresholds for each color.')
							: __('Enter the min and max values for the scale.')}
					</PanelDescription>
					<FormTokenField
						__next40pxDefaultSize
						label={__('Color Scale Domain')}
						value={dataRender.mapScaleDomain || []}
						onChange={(tokens) =>
							setDataRender({
								mapScaleDomain: tokens
									.map((value) => parseFloat(value))
									.filter((value) => !isNaN(value))
									.sort((a, b) => a - b),
							})
						}
						help={__('Separate with commas or the Enter key.')}
					/>
				</VStack>
			)}
		</>
	);
}
