/**
 * WordPress Dependencies
 */
import { FormTokenField, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { PanelDescription, WidePanelItem } from './control-ui';

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
 * @param {string}   props.clientId      Block client id, for the tools panel.
 */
export default function ValueScaleControls({
	dataRender,
	setAttributes,
	clientId,
}) {
	const setDataRender = (updates) =>
		setAttributes({ dataRender: { ...dataRender, ...updates } });

	return (
		<>
			<WidePanelItem
				hasValue={() => true}
				label={__('Color Scale')}
				isShownByDefault
				panelId={clientId}
			>
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
			</WidePanelItem>
			{dataRender.mapScale !== 'ordinal' && (
				<WidePanelItem
					hasValue={() => true}
					label={__('Color Scale Domain')}
					isShownByDefault
					panelId={clientId}
				>
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
				</WidePanelItem>
			)}
		</>
	);
}
