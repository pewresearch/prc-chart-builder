/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getResolvedPalettes } from '../../utils/resolve-defaults';
import {
	getPaletteGroups,
	getThemeOriginColors,
	getUiColorGroup,
} from '../../utils/get-palette-groups';

/**
 * The theme UI colors plus the chart settings palettes, one group each, along
 * with the editor's gradient and custom color settings. Palette swatches take
 * their theme.json name and slug so pickers can name `light-dark()` values.
 *
 * @return {{ colors: Array, themeColors: Array, gradients: Array, disableCustomColors: boolean, disableCustomGradients: boolean }} Color settings.
 */
export default function useChartColorGroups() {
	const settings = useMultipleOriginColorsAndGradients();
	const themeColors = useMemo(
		() => getThemeOriginColors(settings.colors),
		[settings.colors]
	);
	const colors = useMemo(() => {
		const paletteGroups = getPaletteGroups(
			getResolvedPalettes(),
			themeColors
		);
		const uiGroup = getUiColorGroup(settings.colors);
		return uiGroup ? [uiGroup, ...paletteGroups] : paletteGroups;
	}, [settings.colors, themeColors]);

	return {
		colors,
		themeColors,
		gradients: settings.gradients,
		disableCustomColors: settings.disableCustomColors,
		disableCustomGradients: settings.disableCustomGradients,
	};
}
