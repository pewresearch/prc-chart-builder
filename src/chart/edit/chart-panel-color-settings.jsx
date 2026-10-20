/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { PanelColorSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useChartColorGroups from './hooks/use-chart-color-groups';

/**
 * PanelColorSettings that offers the theme UI colors plus the chart settings
 * palettes, one heading per group. Every color setting is clearable unless it
 * sets `clearable: false`; clearing calls its `onChange` with `undefined`.
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
	const colorGroups = useChartColorGroups();
	const clearableSettings = useMemo(
		() => colorSettings.map((setting) => ({ clearable: true, ...setting })),
		[colorSettings]
	);

	return (
		<PanelColorSettings
			{...colorGroups}
			{...props}
			colorSettings={clearableSettings}
		/>
	);
}
