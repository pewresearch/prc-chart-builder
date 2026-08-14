/**
 * Pure helpers for the palette designer (PRC-528 slice 14).
 *
 * The active theme stores palettes as two parallel structures:
 *   - `palettes.colorNames`: ordered `[{ label, value }]` (value === slug)
 *   - `palettes.colors`: `{ [slug]: string[] }` (ordered hex swatches)
 *
 * Every helper preserves that invariant: each colorNames entry has a matching
 * colors[slug] array, and the two stay in sync through add / rename / delete.
 */

/**
 * @typedef {{ label: string, value: string }} PaletteName
 * @typedef {import('./store').ChartTheme} ChartTheme
 */

/**
 * Kebab-case slug from a human palette name.
 *
 * @param {string} name
 * @return {string}
 */
export function slugifyPaletteName(name) {
	return String(name ?? '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Ordered list of palettes (safe accessor).
 *
 * @param {ChartTheme} theme
 * @return {PaletteName[]}
 */
export function getPalettes(theme) {
	const names = theme?.palettes?.colorNames;
	return Array.isArray(names)
		? names.filter(
				(entry) =>
					entry && typeof entry === 'object' && 'value' in entry
			)
		: [];
}

/**
 * Ordered hex swatches for one palette (safe accessor).
 *
 * @param {ChartTheme} theme
 * @param {string} slug
 * @return {string[]}
 */
export function getPaletteColors(theme, slug) {
	const colors = theme?.palettes?.colors;
	const swatches =
		colors && typeof colors === 'object' ? colors[slug] : undefined;
	return Array.isArray(swatches) ? swatches : [];
}

/**
 * Return `base`, or `base-2`, `base-3`, … until it does not collide with `taken`.
 *
 * @param {string}   base
 * @param {string[]} taken
 * @return {string}
 */
export function ensureUniqueSlug(base, taken) {
	const seed = base || 'palette';
	if (!taken.includes(seed)) {
		return seed;
	}
	let suffix = 2;
	while (taken.includes(`${seed}-${suffix}`)) {
		suffix += 1;
	}
	return `${seed}-${suffix}`;
}

/**
 * Normalize a theme's palettes block into `{ colorNames, colors }`.
 *
 * @param {ChartTheme} theme
 * @return {{ colorNames: PaletteName[], colors: Record<string, string[]> }}
 */
function readPalettes(theme) {
	const colorNames = getPalettes(theme);
	const rawColors = theme?.palettes?.colors;
	const colors =
		rawColors && typeof rawColors === 'object' && !Array.isArray(rawColors)
			? rawColors
			: {};
	return { colorNames, colors };
}

/**
 * @param {ChartTheme}                                                   theme
 * @param {{ colorNames: PaletteName[], colors: Record<string, string[]> }} palettes
 * @return {ChartTheme}
 */
function writePalettes(theme, palettes) {
	return {
		...theme,
		palettes: {
			...theme?.palettes,
			colorNames: palettes.colorNames,
			colors: palettes.colors,
		},
	};
}

/**
 * Create a new empty palette from a name. Returns the updated theme plus the
 * generated slug (so callers can select the new palette).
 *
 * @param {ChartTheme} theme
 * @param {string}     name
 * @return {{ theme: ChartTheme, slug: string }}
 */
export function addPalette(theme, name) {
	const { colorNames, colors } = readPalettes(theme);
	const raw = String(name ?? '');
	const label = raw.trim() || 'New palette';
	const slug = ensureUniqueSlug(
		slugifyPaletteName(label),
		colorNames.map((entry) => entry.value)
	);

	return {
		theme: writePalettes(theme, {
			colorNames: [...colorNames, { label, value: slug }],
			colors: { ...colors, [slug]: [] },
		}),
		slug,
	};
}

/**
 * Rename a palette. The slug is re-derived from the new name (kept unique
 * against the other palettes) and the colors map is rekeyed to match.
 *
 * @param {ChartTheme} theme
 * @param {string}     slug
 * @param {string}     name
 * @return {{ theme: ChartTheme, slug: string }}
 */
export function renamePalette(theme, slug, name) {
	const { colorNames, colors } = readPalettes(theme);
	if (!colorNames.some((entry) => entry.value === slug)) {
		return { theme, slug };
	}

	const label = String(name ?? '');
	const otherSlugs = colorNames
		.filter((entry) => entry.value !== slug)
		.map((entry) => entry.value);
	const nextSlug = ensureUniqueSlug(
		slugifyPaletteName(label.trim()),
		otherSlugs
	);

	const nextColorNames = colorNames.map((entry) =>
		entry.value === slug ? { label, value: nextSlug } : entry
	);

	const nextColors = { ...colors };
	if (nextSlug !== slug) {
		nextColors[nextSlug] = getPaletteColors(theme, slug);
		delete nextColors[slug];
	}

	return {
		theme: writePalettes(theme, {
			colorNames: nextColorNames,
			colors: nextColors,
		}),
		slug: nextSlug,
	};
}

/**
 * Delete a palette (both its name entry and its swatch list).
 *
 * @param {ChartTheme} theme
 * @param {string}     slug
 * @return {ChartTheme}
 */
export function deletePalette(theme, slug) {
	const { colorNames, colors } = readPalettes(theme);
	const nextColors = { ...colors };
	delete nextColors[slug];

	return writePalettes(theme, {
		colorNames: colorNames.filter((entry) => entry.value !== slug),
		colors: nextColors,
	});
}

/**
 * Replace the ordered swatch list for one palette.
 *
 * @param {ChartTheme} theme
 * @param {string}     slug
 * @param {string[]}   nextSwatches
 * @return {ChartTheme}
 */
export function setPaletteColors(theme, slug, nextSwatches) {
	const { colorNames, colors } = readPalettes(theme);
	if (!colorNames.some((entry) => entry.value === slug)) {
		return theme;
	}

	return writePalettes(theme, {
		colorNames,
		colors: {
			...colors,
			[slug]: Array.isArray(nextSwatches) ? [...nextSwatches] : [],
		},
	});
}

/**
 * Toggle a hex swatch in a palette: append if absent, remove if present.
 *
 * @param {ChartTheme} theme
 * @param {string}     slug
 * @param {string}     hex
 * @return {ChartTheme}
 */
export function togglePaletteColor(theme, slug, hex) {
	const swatches = getPaletteColors(theme, slug);
	const next = swatches.includes(hex)
		? swatches.filter((color) => color !== hex)
		: [...swatches, hex];
	return setPaletteColors(theme, slug, next);
}

/**
 * Move a swatch within a palette from one index to another.
 *
 * @param {ChartTheme} theme
 * @param {string}     slug
 * @param {number}     fromIndex
 * @param {number}     toIndex
 * @return {ChartTheme}
 */
export function reorderPaletteColors(theme, slug, fromIndex, toIndex) {
	const swatches = getPaletteColors(theme, slug);
	if (
		fromIndex < 0 ||
		toIndex < 0 ||
		fromIndex >= swatches.length ||
		toIndex >= swatches.length ||
		fromIndex === toIndex
	) {
		return theme;
	}

	const next = [...swatches];
	const [moved] = next.splice(fromIndex, 1);
	next.splice(toIndex, 0, moved);
	return setPaletteColors(theme, slug, next);
}
