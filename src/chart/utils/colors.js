/**
 * Shipped color palette catalog for chart-builder resolve layer (PRC-528 slice 10).
 *
 * Muted blue-gray defaults for unseeded installs (visually distinct from PRC
 * theme swatches). Named palette catalogs come from chart-theme.json when seeded.
 */

const NEUTRAL_SERIES = [
	'#405F76',
	'#D8E2EA',
	'#B8C8D4',
	'#97ADBD',
	'#7893A7',
	'#5B798F',
];

const colors = {
	general: NEUTRAL_SERIES,
};

const colorNames = [{ label: 'General', value: 'general' }];

export { colorNames, colors };
