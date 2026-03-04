/**
 * LegendItemPanel Component
 *
 * Panel for customizing legend item label text.
 * Shown in a popover when clicking a legend item in the chart editor.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	TextControl,
	Button,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

import { useLegendItemCustomizations } from '../hooks';

/**
 * LegendItemPanel Component
 *
 * @param {Object}   props
 * @param {string}   props.categoryValue          - The category/domain value of the legend item
 * @param {string}   props.defaultLabel           - The default rendered label text
 * @param {Object}   props.currentCustomizations  - Current customLegendLabels block attr
 * @param {Function} props.onUpdate               - Callback to update
 */
export function LegendItemPanel( {
	categoryValue,
	defaultLabel,
	currentCustomizations = {},
	onUpdate,
} ) {
	const { text, hasCustomizations, handleChange, handleReset } =
		useLegendItemCustomizations(
			categoryValue,
			defaultLabel,
			currentCustomizations,
			onUpdate
		);

	return (
		<VStack spacing={ 4 }>
			<Text size="12px" color="#757575">
				{ __( 'Legend item', 'prc-chart-builder' ) }:{ ' ' }
				{ defaultLabel }
			</Text>

			<TextControl
				label={ __( 'Custom label text', 'prc-chart-builder' ) }
				value={ text }
				onChange={ ( value ) => handleChange( 'text', value ) }
				placeholder={ defaultLabel || '' }
				help={ __(
					'Leave empty to use the default label',
					'prc-chart-builder'
				) }
			/>

			{ hasCustomizations && (
				<Button
					variant="secondary"
					onClick={ handleReset }
					style={ { marginTop: '8px' } }
				>
					{ __( 'Reset to default', 'prc-chart-builder' ) }
				</Button>
			) }
		</VStack>
	);
}

export default LegendItemPanel;
