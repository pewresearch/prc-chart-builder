import { __ } from '@wordpress/i18n';

import { TEXT_DOMAIN } from '../constants';
import {
	colorForPreviewMode,
	extractHex,
	getThemeColors,
	groupThemeColors,
} from '../site-theme';

/**
 * Theme.json swatch picker with inferred spectrum/UI group breaks.
 *
 * @param {{
 *   selectedHexes: Set<string>,
 *   colorPreviewMode: 'light' | 'dark',
 *   onToggle: (hex: string) => void,
 * }} props
 */
export default function ThemeColorPicker({
	selectedHexes,
	colorPreviewMode,
	onToggle,
}) {
	const themeColors = getThemeColors();
	const groups = groupThemeColors(themeColors);
	const showGroupLabels = groups.length > 1;

	if (themeColors.length === 0) {
		return (
			<p className="prc-chart-theme-settings__empty">
				{__('No theme colors registered for this site.', TEXT_DOMAIN)}
			</p>
		);
	}

	return (
		<div className="prc-palette-designer__picker-groups">
			{groups.map((group) => (
				<section
					key={group.label}
					className="prc-palette-designer__picker-group"
					aria-label={group.label}
				>
					{showGroupLabels && (
						<h4 className="prc-palette-designer__picker-group-label">
							{group.label}
						</h4>
					)}
					<ul className="prc-palette-designer__swatch-grid">
						{group.colors.map((themeColor) => {
							const hex = extractHex(themeColor.color);
							const isSelected = selectedHexes.has(hex);
							return (
								<li key={themeColor.slug || hex}>
									<button
										type="button"
										className={`prc-palette-designer__swatch-button${
											isSelected ? ' is-selected' : ''
										}`}
										style={{
											backgroundColor:
												colorForPreviewMode(
													themeColor.color,
													colorPreviewMode
												),
										}}
										aria-pressed={isSelected}
										title={`${themeColor.name} (${themeColor.color})`}
										onClick={() => onToggle(hex)}
									/>
								</li>
							);
						})}
					</ul>
				</section>
			))}
		</div>
	);
}
