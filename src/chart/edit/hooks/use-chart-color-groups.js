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
	getUiColorGroup,
} from '../../utils/get-palette-groups';

/**
 * The theme UI colors plus the chart settings palettes, one group each, along
 * with the editor's gradient and custom color settings.
 *
 * @return {{ colors: Array, gradients: Array, disableCustomColors: boolean, disableCustomGradients: boolean }} Color settings.
 */
export default function useChartColorGroups() {
	const settings = useMultipleOriginColorsAndGradients();
	const paletteGroups = useMemo(
		() => getPaletteGroups(getResolvedPalettes()),
		[]
	);
	const colors = useMemo(() => {
		const uiGroup = getUiColorGroup(settings.colors);
		return uiGroup ? [uiGroup, ...paletteGroups] : paletteGroups;
	}, [settings.colors, paletteGroups]);

	return {
		colors,
		gradients: settings.gradients,
		disableCustomColors: settings.disableCustomColors,
		disableCustomGradients: settings.disableCustomGradients,
	};
}
