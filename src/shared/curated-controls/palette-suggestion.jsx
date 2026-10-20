const PREVIEW_COUNT = 10;

/**
 * One palette row in the palette drop-down: name, first swatches, "+N" count.
 *
 * @param {Object}   props
 * @param {string}   props.label  Palette name.
 * @param {string[]} props.colors Palette colors in order.
 */
export default function PaletteSuggestion({ label, colors = [] }) {
	const preview = colors.slice(0, PREVIEW_COUNT);
	const more = colors.length - preview.length;

	return (
		<span className="prc-chart-palette-suggestion">
			<span className="prc-chart-palette-suggestion__label">{label}</span>
			<span
				className="prc-chart-palette-suggestion__swatches"
				aria-hidden
			>
				{preview.map((hex, index) => (
					<span
						key={`${hex}-${index}`}
						className="prc-chart-palette-suggestion__swatch"
						style={{ backgroundColor: hex }}
					/>
				))}
				{more > 0 && (
					<span className="prc-chart-palette-suggestion__more">
						+{more}
					</span>
				)}
			</span>
		</span>
	);
}
