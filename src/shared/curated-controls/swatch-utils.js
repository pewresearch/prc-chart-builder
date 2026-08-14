/**
 * Pure helpers for the curated multi-palette swatch picker POC.
 */

/**
 * @typedef {{ label: string, value: string }} PaletteName
 * @typedef {{ colorNames?: PaletteName[], colors?: Record<string, string[]> }} Palettes
 * @typedef {{ label: string, slug: string, colors: string[] }} SwatchGroup
 */

/**
 * Build ordered swatch groups for selected palette sources.
 * Preserves source order, skips unknown sources, and dedupes hexes so the
 * first palette group that owns a color wins.
 *
 * @param {string[]} sources Selected palette slugs.
 * @param {Palettes} palettes Resolved palettes ({ colorNames, colors }).
 * @return {SwatchGroup[]}
 */
export function buildSwatchGroups(sources, palettes) {
	const colorNames = Array.isArray(palettes?.colorNames)
		? palettes.colorNames
		: [];
	const colors =
		palettes?.colors && typeof palettes.colors === 'object'
			? palettes.colors
			: {};

	const labelBySlug = new Map(
		colorNames
			.filter(
				(entry) =>
					entry && typeof entry === 'object' && 'value' in entry
			)
			.map((entry) => [entry.value, entry.label])
	);

	const seen = new Set();
	const groups = [];

	for (const slug of Array.isArray(sources) ? sources : []) {
		if (!(slug in colors) || !Array.isArray(colors[slug])) {
			continue;
		}

		const nextColors = [];
		for (const hex of colors[slug]) {
			if (seen.has(hex)) {
				continue;
			}
			seen.add(hex);
			nextColors.push(hex);
		}

		groups.push({
			label: labelBySlug.get(slug) ?? slug,
			slug,
			colors: nextColors,
		});
	}

	return groups;
}

/**
 * Toggle a hex in the picked customColors list (append or remove).
 * Does not mutate the input array.
 *
 * @param {string[]} customColors
 * @param {string}   hex
 * @return {string[]}
 */
export function toggleSwatchColor(customColors, hex) {
	const current = Array.isArray(customColors) ? customColors : [];
	return current.includes(hex)
		? current.filter((color) => color !== hex)
		: [...current, hex];
}

/**
 * Keep picked colors that still exist in the active pool, preserving order.
 * Does not mutate the input array.
 *
 * @param {string[]} customColors
 * @param {string[]} poolHexes
 * @return {string[]}
 */
export function pruneCustomColors(customColors, poolHexes) {
	const pool = new Set(Array.isArray(poolHexes) ? poolHexes : []);
	const current = Array.isArray(customColors) ? customColors : [];
	return current.filter((hex) => pool.has(hex));
}
