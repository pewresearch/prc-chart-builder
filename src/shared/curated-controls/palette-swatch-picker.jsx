/**
 * Presentational multi-palette swatch grid for the curated color controls POC.
 */
import { __ } from '@wordpress/i18n';

/**
 * @param {Object}   props
 * @param {{ label: string, slug: string, colors: string[] }[]} props.groups
 * @param {string[]} props.selectedColors
 * @param {(hex: string) => void} props.onToggle
 */
export default function PaletteSwatchPicker({
	groups,
	selectedColors,
	onToggle,
}) {
	const hasUsableColors =
		Array.isArray(groups) &&
		groups.some(
			(group) => Array.isArray(group?.colors) && group.colors.length > 0
		);

	if (!hasUsableColors) {
		return (
			<p className="prc-chart-modal__swatch-empty">
				{__('No palette colors available.', 'prc-chart-builder')}
			</p>
		);
	}

	return (
		<div className="prc-chart-modal__swatch-picker">
			{groups.map((group) => {
				if (
					!Array.isArray(group?.colors) ||
					group.colors.length === 0
				) {
					return null;
				}

				return (
					<section
						key={group.slug}
						className="prc-chart-modal__swatch-group"
						aria-label={group.label}
					>
						<h4 className="prc-chart-modal__swatch-group-label">
							{group.label}
						</h4>
						<ul className="prc-chart-modal__swatch-grid">
							{group.colors.map((hex) => {
								const isSelected = Array.isArray(selectedColors)
									? selectedColors.includes(hex)
									: false;

								return (
									<li key={hex}>
										<button
											type="button"
											className={`prc-chart-modal__swatch-button${
												isSelected ? ' is-selected' : ''
											}`}
											style={{ backgroundColor: hex }}
											aria-label={`${group.label} ${hex}`}
											aria-pressed={isSelected}
											onClick={() => onToggle(hex)}
										/>
									</li>
								);
							})}
						</ul>
					</section>
				);
			})}
		</div>
	);
}
