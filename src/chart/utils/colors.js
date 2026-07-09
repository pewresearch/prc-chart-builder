/**
 * Shipped color palette catalog for chart-builder resolve layer (PRC-528 slice 10).
 *
 * Pink → purple defaults for unseeded installs (visually distinct from PRC legacy
 * theme swatches). Named palette catalogs come from prc-legacy-theme.json when seeded.
 */

const NEUTRAL_SERIES = [
	'#F687B3',
	'#ED64A6',
	'#D53F8C',
	'#B83280',
	'#9F7AEA',
	'#805AD5',
];

const colors = {
	general: NEUTRAL_SERIES,
};

const colorNames = [{ label: 'General', value: 'general' }];

export { colors, colorNames };
