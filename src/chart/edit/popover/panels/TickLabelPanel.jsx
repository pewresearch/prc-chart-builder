/**
 * TickLabelPanel Component
 *
 * Panel for customizing axis tick label text and style.
 * Shown in a popover when clicking a tick label in the chart editor.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	TextControl,
	SelectControl,
	Button,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

import { useTickLabelCustomizations } from '../hooks';
import { FONT_WEIGHT_OPTIONS, FONT_STYLE_OPTIONS } from '../utils';

/**
 * TickLabelPanel Component
 *
 * @param {Object}   props
 * @param {string}   props.axisKey              - 'independent' or 'dependent'
 * @param {unknown}  props.tickValue            - The raw tick value
 * @param {string}   props.defaultLabel         - The default formatted label
 * @param {Object}   props.currentCustomizations - Current customTickLabels block attr
 * @param {Function} props.onUpdate             - Callback to update
 */
export function TickLabelPanel( {
	axisKey,
	tickValue,
	defaultLabel,
	currentCustomizations = {},
	onUpdate,
} ) {
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
			? __( 'Independent axis', 'prc-chart-builder' )
			: __( 'Dependent axis', 'prc-chart-builder' );

	return (
		<VStack spacing={ 4 }>
			<Text size="12px" color="#757575">
				{ axisLabel }: { defaultLabel }
			</Text>

			<TextControl
				label={ __( 'Custom label text', 'prc-chart-builder' ) }
				value={ text }
				onChange={ ( value ) => handleChange( 'text', value ) }
				placeholder={ defaultLabel || '' }
				help={ __(
					'Leave empty to use the default formatted value',
					'prc-chart-builder'
				) }
			/>

			<SelectControl
				label={ __( 'Font Weight', 'prc-chart-builder' ) }
				value={ fontWeight }
				options={ [
					{ label: __( 'Default', 'prc-chart-builder' ), value: '' },
					...FONT_WEIGHT_OPTIONS,
				] }
				onChange={ ( value ) => handleChange( 'fontWeight', value ) }
			/>

			<SelectControl
				label={ __( 'Font Style', 'prc-chart-builder' ) }
				value={ fontStyle }
				options={ [
					{ label: __( 'Default', 'prc-chart-builder' ), value: '' },
					...FONT_STYLE_OPTIONS,
				] }
				onChange={ ( value ) => handleChange( 'fontStyle', value ) }
			/>

			<VStack spacing={ 2 }>
				<Text size="11px" weight={ 500 }>
					{ __( 'Font Size', 'prc-chart-builder' ) }
				</Text>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={ fontSize ? String( fontSize ) : '' }
					onChange={ ( value ) =>
						handleChange(
							'fontSize',
							value ? parseInt( value, 10 ) : null
						)
					}
				>
					<ToggleGroupControlOption label="10px" value="10" />
					<ToggleGroupControlOption label="12px" value="12" />
					<ToggleGroupControlOption label="14px" value="14" />
					<ToggleGroupControlOption label="16px" value="16" />
					<ToggleGroupControlOption label="18px" value="18" />
					<ToggleGroupControlOption label="20px" value="20" />
				</ToggleGroupControl>
			</VStack>

			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={ __( 'Text Color', 'prc-chart-builder' ) }
				colorSettings={ [
					{
						value: fill,
						onChange: ( value ) =>
							handleChange( 'fill', value ?? '' ),
						label: __( 'Color', 'prc-chart-builder' ),
					},
				] }
			/>

			{ hasCustomizations && (
				<Button
					variant="secondary"
					onClick={ handleReset }
					style={ { marginTop: '8px' } }
				>
					{ __( 'Reset to defaults', 'prc-chart-builder' ) }
				</Button>
			) }
		</VStack>
	);
}

export default TickLabelPanel;
