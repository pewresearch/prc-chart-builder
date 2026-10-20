/**
 * TickLabelPanel Component
 *
 * Panel for customizing axis tick label text and style.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

import { useTickLabelCustomizations } from '../hooks';
import { TextStyleControls } from './TextStyleControls';

/**
 * @param {Object}      props
 * @param {string}      props.axisKey
 * @param {unknown}     props.tickValue
 * @param {string}      props.defaultLabel
 * @param {Object}      props.currentCustomizations
 * @param {Function}    props.onUpdate
 * @param {string|null} props.panelKey
 */
export function TickLabelPanel({
	axisKey,
	tickValue,
	defaultLabel,
	currentCustomizations = {},
	onUpdate,
	panelKey = null,
}) {
	const {
		text,
		fill,
		fontSize,
		fontWeight,
		fontStyle,
		offsetX,
		offsetY,
		hasCustomizations,
		handleChange,
		handleReset,
	} = useTickLabelCustomizations(
		axisKey,
		tickValue,
		defaultLabel,
		currentCustomizations,
		onUpdate,
		panelKey
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
			{panelKey && (
				<Text size="12px" color="#757575">
					{__('Applies to', 'prc-chart-builder')}: {panelKey}
				</Text>
			)}

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
