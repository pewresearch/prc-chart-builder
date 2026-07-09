/**
 * Chart theme resolution (PRC-528 Phase 0).
 *
 * Reads the per-site active chart theme from `window.prcChartBuilderTheme`
 * and merges it with shipped static defaults. The theme is modeled on WordPress
 * Global Styles: palette + typography are global tokens; `theme.config` supplies
 * the default layer that block attributes override in get-config.js.
 */
import {
	colors as staticColors,
	colorNames as staticColorNames,
} from './colors';

/**
 * @param {*} value Candidate value.
 * @return {boolean} True for a non-null, non-array object literal.
 */
function isPlainObject(value) {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Immutable deep-merge: `override` wins; object branches recurse; arrays replace.
 *
 * @param {Object} base     Base object.
 * @param {Object} override Overrides.
 * @return {Object} Merged result (does not mutate inputs).
 */
export function deepMergeDefaults(base, override) {
	if (!isPlainObject(base) || !isPlainObject(override)) {
		return override !== undefined ? override : base;
	}

	const output = { ...base };

	for (const key of Object.keys(override)) {
		const overrideValue = override[key];
		const baseValue = base[key];

		if (isPlainObject(overrideValue) && isPlainObject(baseValue)) {
			output[key] = deepMergeDefaults(baseValue, overrideValue);
		} else {
			output[key] = overrideValue;
		}
	}

	return output;
}

/**
 * Shipped baseConfig from the charting library global.
 *
 * @return {Object} Static baseConfig object.
 */
export function getStaticBaseConfig() {
	if (typeof window === 'undefined') {
		return {};
	}

	const library = window.prcCustomCharts || window.prcChartingLibrary;
	return library?.baseConfig ?? {};
}

/**
 * Active chart theme payload emitted by PHP (empty until Phase 1).
 *
 * @return {{ config?: Object, palettes?: Object, typography?: Object }}
 */
export function getRuntimeTheme() {
	if (typeof window === 'undefined') {
		return {};
	}

	return window.prcChartBuilderTheme ?? {};
}

/**
 * Humanize a palette slug for inspector labels when theme colorNames is absent.
 *
 * @param {string} slug Palette key (e.g. politics-main).
 * @return {string} Display label.
 */
function paletteSlugToLabel(slug) {
	return slug
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

/**
 * Shipped palettes merged with theme palette overrides.
 *
 * @return {{ colors: Object, colorNames: Array<{ label: string, value: string }> }}
 */
export function getResolvedPalettes() {
	const { palettes: themePalettes } = getRuntimeTheme();

	if (!themePalettes || Object.keys(themePalettes).length === 0) {
		return {
			colors: staticColors,
			colorNames: staticColorNames,
		};
	}

	const mergedColors = {
		...staticColors,
		...(isPlainObject(themePalettes.colors) ? themePalettes.colors : {}),
	};

	let colorNames = themePalettes.colorNames ?? staticColorNames;

	if (!themePalettes.colorNames && themePalettes.colors) {
		colorNames = Object.keys(themePalettes.colors).map((value) => ({
			label: paletteSlugToLabel(value),
			value,
		}));
	}

	return {
		colors: mergedColors,
		colorNames,
	};
}

/**
 * Resolve the active series color array for render or editor controls.
 *
 * Saved charts often reference named palettes (e.g. politics-main) that exist
 * only in the per-site theme. When the theme is unset, partial, or unseeded,
 * fall back to the shipped `general` palette instead of throwing on `.map()`.
 *
 * @param {Array|undefined} customColors     Explicit per-series colors (opt-out).
 * @param {string}          colorValue       Named palette key from io.colorValue.
 * @param {Object}          resolvedPalettes colors map from getResolvedPalettes().
 * @return {Array<string>} Color hex strings.
 */
export function resolveChartSeriesColors(
	customColors,
	colorValue,
	resolvedPalettes
) {
	if (customColors && customColors.length > 0) {
		return customColors;
	}

	const named = resolvedPalettes[colorValue];
	if (Array.isArray(named) && named.length > 0) {
		return named;
	}

	const fallback = resolvedPalettes.general;
	return Array.isArray(fallback) ? fallback : [];
}

/**
 * Legacy hook retained for get-config.js call sites.
 *
 * Per-role fontFamily lives in theme.config (Bucket 3), which is a "new charts
 * only" default: it is frozen into a chart's attributes at insert
 * (apply-theme-block-defaults) and is NOT merged at render, so existing charts
 * are never retroactively restyled. theme.json webfonts (Bucket 1) apply via
 * CSS. This is intentionally a no-op so saved chart attributes are never
 * overridden by a removed single-global typography token.
 *
 * @param {Object} config Rendered chart config from get-config.js.
 * @return {Object} Unchanged config.
 */
export function applyGlobalTokens(config) {
	return config;
}
