import { __ } from '@wordpress/i18n';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

import { store } from '../store';
import { TEXT_DOMAIN } from '../constants';
import PaletteList from './palette-list';
import PaletteEditor from './palette-editor';

/**
 * Color Settings tab: the dedicated palette designer (PRC-528 slice 14).
 *
 * Palette list + editor, driven by the unified theme draft so any change flips
 * the global "unsaved changes" bar and persists through the standard full-theme
 * POST.
 */
export default function PaletteDesigner() {
	const { selectedSlug, colorPreviewMode } = useSelect(
		(select) => ({
			selectedSlug: select(store).getSelectedPaletteSlug(),
			colorPreviewMode: select(store).getColorPreviewMode(),
		}),
		[]
	);
	const { setColorPreviewMode } = useDispatch(store);

	return (
		<div className="prc-palette-designer">
			<p className="prc-palette-designer__intro">
				{__(
					'Create named color palettes from your site’s registered theme colors. Each palette is an ordered list of swatches that charts can reference by slug in their color settings. Pick colors, drag to reorder, then save the theme to apply changes site-wide.',
					TEXT_DOMAIN
				)}
			</p>
			<div className="prc-palette-designer__preview-mode">
				<ToggleGroupControl
					label={__('Preview mode', TEXT_DOMAIN)}
					value={colorPreviewMode}
					isBlock
					onChange={(value) => setColorPreviewMode(value)}
					__nextHasNoMarginBottom
				>
					<ToggleGroupControlOption
						label={__('Light', TEXT_DOMAIN)}
						value="light"
					/>
					<ToggleGroupControlOption
						label={__('Dark', TEXT_DOMAIN)}
						value="dark"
					/>
				</ToggleGroupControl>
			</div>
			<div
				className={`prc-palette-designer__body${
					colorPreviewMode === 'dark' ? ' is-dark-preview' : ''
				}`}
			>
				<PaletteList />
				<div className="prc-palette-designer__main">
					{selectedSlug ? (
						<PaletteEditor slug={selectedSlug} />
					) : (
						<p className="prc-chart-theme-settings__empty">
							{__(
								'No palettes yet. Use “Add palette” to create one.',
								TEXT_DOMAIN
							)}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
