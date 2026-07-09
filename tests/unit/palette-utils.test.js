import {
	slugifyPaletteName,
	getPalettes,
	getPaletteColors,
	ensureUniqueSlug,
	addPalette,
	renamePalette,
	deletePalette,
	setPaletteColors,
	togglePaletteColor,
	reorderPaletteColors,
} from '../../src/settings/palette-utils';

const seedTheme = () => ({
	config: {},
	palettes: {
		colorNames: [
			{ label: 'General', value: 'general' },
			{ label: 'Politics Spectrum', value: 'politics-spectrum' },
		],
		colors: {
			general: ['#456A83', '#BF3B27'],
			'politics-spectrum': ['#9E7F2D'],
		},
	},
});

describe('slugifyPaletteName', () => {
	it('kebab-cases names and strips punctuation', () => {
		expect(slugifyPaletteName('Social Trends Main')).toBe(
			'social-trends-main'
		);
		expect(slugifyPaletteName('  Race & Ethnicity!  ')).toBe(
			'race-ethnicity'
		);
		expect(slugifyPaletteName('')).toBe('');
	});
});

describe('ensureUniqueSlug', () => {
	it('returns the base when free and suffixes on collision', () => {
		expect(ensureUniqueSlug('general', [])).toBe('general');
		expect(ensureUniqueSlug('general', ['general'])).toBe('general-2');
		expect(ensureUniqueSlug('general', ['general', 'general-2'])).toBe(
			'general-3'
		);
	});
});

describe('accessors', () => {
	it('read palettes and colors safely from malformed themes', () => {
		expect(getPalettes({})).toEqual([]);
		expect(getPaletteColors({}, 'general')).toEqual([]);
		expect(getPaletteColors(seedTheme(), 'general')).toEqual([
			'#456A83',
			'#BF3B27',
		]);
	});
});

describe('addPalette', () => {
	it('appends a uniquely-slugged empty palette', () => {
		const { theme, slug } = addPalette(seedTheme(), 'General');
		expect(slug).toBe('general-2');
		expect(getPalettes(theme)).toHaveLength(3);
		expect(getPaletteColors(theme, 'general-2')).toEqual([]);
	});

	it('falls back to a default label for blank names', () => {
		const { theme, slug } = addPalette({ palettes: {} }, '   ');
		expect(slug).toBe('new-palette');
		expect(getPalettes(theme)[0]).toEqual({
			label: 'New palette',
			value: 'new-palette',
		});
	});
});

describe('renamePalette', () => {
	it('re-derives the slug and rekeys the colors map', () => {
		const { theme, slug } = renamePalette(
			seedTheme(),
			'general',
			'Overview'
		);
		expect(slug).toBe('overview');
		expect(getPaletteColors(theme, 'overview')).toEqual([
			'#456A83',
			'#BF3B27',
		]);
		expect(theme.palettes.colors.general).toBeUndefined();
	});

	it('keeps the slug unique against other palettes', () => {
		const { slug } = renamePalette(
			seedTheme(),
			'general',
			'Politics Spectrum'
		);
		expect(slug).toBe('politics-spectrum-2');
	});

	it('preserves spaces in the label while slugifying for the config key', () => {
		const { theme, slug } = renamePalette(
			seedTheme(),
			'general',
			'My Cool Palette'
		);
		expect(slug).toBe('my-cool-palette');
		expect(getPalettes(theme).find((p) => p.value === slug)?.label).toBe(
			'My Cool Palette'
		);
	});
});

describe('deletePalette', () => {
	it('removes both the name entry and its swatches', () => {
		const theme = deletePalette(seedTheme(), 'general');
		expect(getPalettes(theme).map((p) => p.value)).toEqual([
			'politics-spectrum',
		]);
		expect(theme.palettes.colors.general).toBeUndefined();
	});
});

describe('togglePaletteColor', () => {
	it('adds an absent color and removes a present one', () => {
		const added = togglePaletteColor(seedTheme(), 'general', '#EA9E2C');
		expect(getPaletteColors(added, 'general')).toEqual([
			'#456A83',
			'#BF3B27',
			'#EA9E2C',
		]);

		const removed = togglePaletteColor(added, 'general', '#BF3B27');
		expect(getPaletteColors(removed, 'general')).toEqual([
			'#456A83',
			'#EA9E2C',
		]);
	});
});

describe('reorderPaletteColors', () => {
	it('moves a swatch and no-ops on out-of-range indices', () => {
		const moved = reorderPaletteColors(seedTheme(), 'general', 1, 0);
		expect(getPaletteColors(moved, 'general')).toEqual([
			'#BF3B27',
			'#456A83',
		]);

		const unchanged = reorderPaletteColors(seedTheme(), 'general', 0, 9);
		expect(getPaletteColors(unchanged, 'general')).toEqual([
			'#456A83',
			'#BF3B27',
		]);
	});
});

describe('setPaletteColors', () => {
	it('replaces swatches only for an existing palette', () => {
		const theme = setPaletteColors(seedTheme(), 'general', ['#000000']);
		expect(getPaletteColors(theme, 'general')).toEqual(['#000000']);
		expect(setPaletteColors(seedTheme(), 'missing', ['#000000'])).toEqual(
			seedTheme()
		);
	});
});
