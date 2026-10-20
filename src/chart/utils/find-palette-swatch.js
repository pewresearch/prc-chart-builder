/**
 * The slugged swatch a picker value came from. Pickers pass its slug to
 * ColorPalette so core names and checks the swatch by slug. Without a slug,
 * core matches by `colord(...).toHex()`, which reads every `light-dark()` value
 * as #000000 and names it after the first `light-dark()` swatch.
 *
 * Matches the exact color string, the same rule core uses for the checkmark.
 *
 * @param {string} value       Current picker value.
 * @param {Array}  colorGroups ColorPalette groups (`{ colors: [{ name, slug, color }] }`).
 * @return {Object|undefined} Matching swatch, or undefined when no slugged swatch matches.
 */
export function findPaletteSwatch(value, colorGroups = []) {
	if (!value) {
		return undefined;
	}
	for (const group of colorGroups) {
		const match = group.colors?.find(
			(swatch) => swatch.slug && swatch.color === value
		);
		if (match) {
			return match;
		}
	}
	return undefined;
}
