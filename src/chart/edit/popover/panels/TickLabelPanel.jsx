/**
 * TickLabelPanel Component
 *
 * Panel for customizing axis tick label text and style.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

import { useTickLabelCustomizations } from '../hooks';
import { TextStyleControls } from './TextStyleControls';

/**
 * @param {Object}   props
 * @param {string}   props.axisKey
 * @param {unknown}  props.tickValue
 * @param {string}   props.defaultLabel
 * @param {Object}   props.currentCustomizations
 * @param {Function} props.onUpdate
 */
export function TickLabelPanel({
	axisKey,
	tickValue,
	defaultLabel,
	currentCustomizations = {},
	onUpdate,
}) {
	const {
		text,
		fill,
		fontSize,
		fontWeight,
		fontStyle,
		hasCustomizations,
		handleChange,
		handleReset,
	} = useTickLabelCustomizations(
		axisKey,
		tickValue,
		defaultLabel,
		currentCustomizations,
		onUpdate
	);

	const axisLabel =
		axisKey === 'independent'
			? __('Independent axis', 'prc-chart-builder')
			: __('Dependent axis', 'prc-chart-builder');

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{axisLabel}: {defaultLabel}
			</Text>

			<TextStyleControls
				values={{ text, fill, fontSize, fontWeight, fontStyle }}
				onChange={handleChange}
				textLabel={__('Custom label text', 'prc-chart-builder')}
				textPlaceholder={defaultLabel || ''}
				textHelp={__(
					'Leave empty to use the default formatted value',
					'prc-chart-builder'
				)}
				showFontWeightDefault
				showFontStyleDefault
				showFontFamily={false}
				hasCustomizations={hasCustomizations}
				onReset={handleReset}
			/>
		</VStack>
	);
}

export default TickLabelPanel;
