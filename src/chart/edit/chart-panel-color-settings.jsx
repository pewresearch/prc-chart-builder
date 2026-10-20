/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { PanelColorSettings } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';

/**
 * Internal dependencies
 */
import useChartColorGroups from './hooks/use-chart-color-groups';
import { findPaletteSwatch } from '../utils/find-palette-swatch';
import { getContrastWarning } from '../utils/contrast-warning';

/**
 * Warning text for a color that misses its contrast minimum.
 *
 * @param {string} label   Color setting label.
 * @param {Object} warning Result of getContrastWarning().
 * @param {string} role    'text' or 'graphic'.
 * @return {string} Warning message.
 */
function contrastMessage(label, warning, role) {
	return role === 'text'
		? sprintf(
				/* translators: 1: color setting label, 2: contrast ratio, 3: minimum ratio. */
				__(
					'%1$s has %2$s:1 contrast with the chart background. Text needs at least %3$s:1.',
					'prc-chart-builder'
				),
				label,
				warning.ratio,
				warning.minimum
			)
		: sprintf(
				/* translators: 1: color setting label, 2: contrast ratio, 3: minimum ratio. */
				__(
					'%1$s has %2$s:1 contrast with the chart background. Lines and shapes need at least %3$s:1.',
					'prc-chart-builder'
				),
				label,
				warning.ratio,
				warning.minimum
			);
}

/**
 * PanelColorSettings that offers the theme UI colors plus the chart settings
 * palettes, one heading per group. Every color setting is clearable unless it
 * sets `clearable: false`; clearing calls its `onChange` with `undefined`.
 * Each setting gets the slug of its current swatch so the picker names
 * `light-dark()` values correctly.
 *
 * Each setting may set `contrast`: `'text'` (needs 4.5:1), `'graphic'` (the
 * default, needs 3:1), or `false` for backgrounds and fills that sit behind
 * other content. A color below its minimum against the light chart background
 * shows a warning under the pickers; it never blocks the change.
 *
 * PanelColorSettings only uses passed palettes when `colors`, `gradients`,
 * `disableCustomColors`, and `disableCustomGradients` are all present.
 *
 * @param {Object} props               PanelColorSettings props.
 * @param {Array}  props.colorSettings Color settings, one per picker.
 */
export default function ChartPanelColorSettings({
	colorSettings = [],
	...props
}) {
	// eslint-disable-next-line no-unused-vars
	const { themeColors, ...colorGroups } = useChartColorGroups();
	const pickerSettings = useMemo(
		() =>
			// eslint-disable-next-line no-unused-vars
			colorSettings.map(({ contrast, ...setting }) => ({
				clearable: true,
				colorSlug: findPaletteSwatch(setting.value, colorGroups.colors)
					?.slug,
				...setting,
			})),
		[colorSettings, colorGroups.colors]
	);
	const contrastWarnings = colorSettings.flatMap(
		({ label, value, contrast = 'graphic' }) => {
			const warning = getContrastWarning(value, contrast);
			return warning
				? [
						{
							label,
							message: contrastMessage(label, warning, contrast),
						},
					]
				: [];
		}
	);

	return (
		<PanelColorSettings
			{...colorGroups}
			{...props}
			colorSettings={pickerSettings}
		>
			{contrastWarnings.map(({ label, message }) => (
				<Notice key={label} status="warning" isDismissible={false}>
					{message}
				</Notice>
			))}
		</PanelColorSettings>
	);
}
