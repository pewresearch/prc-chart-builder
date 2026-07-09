import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';

import { store } from '../store';
import { getPalettes, getPaletteColors } from '../palette-utils';
import { colorForPreviewMode } from '../theme-colors';
import { TEXT_DOMAIN } from '../constants';

/**
 * Left column: create + choose the palette being edited.
 */
export default function PaletteList() {
	const { settings, selectedSlug, colorPreviewMode } = useSelect(
		(select) => ({
			settings: select(store).getSettings(),
			selectedSlug: select(store).getSelectedPaletteSlug(),
			colorPreviewMode: select(store).getColorPreviewMode(),
		}),
		[]
	);
	const { addPalette, selectPalette } = useDispatch(store);

	const palettes = getPalettes(settings);

	return (
		<div className="prc-palette-designer__list">
			<div className="prc-palette-designer__list-label">
				{__('Palettes', TEXT_DOMAIN)}
			</div>
			<Button
				variant="primary"
				icon={plus}
				className="prc-palette-designer__add"
				onClick={() => addPalette(__('New palette', TEXT_DOMAIN))}
			>
				{__('Add palette', TEXT_DOMAIN)}
			</Button>
			<ul className="prc-palette-designer__palettes">
				{palettes.map((palette) => {
					const swatches = getPaletteColors(settings, palette.value);
					const isActive = palette.value === selectedSlug;

					return (
						<li key={palette.value}>
							<button
								type="button"
								className={`prc-palette-designer__palette-card${
									isActive ? ' is-active' : ''
								}`}
								aria-pressed={isActive}
								onClick={() => selectPalette(palette.value)}
							>
								<span className="prc-palette-designer__palette-name">
									{palette.label ||
										__('(untitled)', TEXT_DOMAIN)}
								</span>
								<span className="prc-palette-designer__palette-slug">
									{palette.value}
								</span>
								<span
									className="prc-palette-designer__palette-strip"
									aria-hidden="true"
								>
									{swatches.map((hex, index) => (
										<span
											// eslint-disable-next-line react/no-array-index-key
											key={`${hex}-${index}`}
											style={{
												backgroundColor:
													colorForPreviewMode(
														hex,
														colorPreviewMode
													),
											}}
										/>
									))}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
