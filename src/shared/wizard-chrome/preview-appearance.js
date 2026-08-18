/**
 * Preview-pane appearance: color scheme plus optional color-vision simulation.
 * Viewport width stays a separate layout concern.
 *
 * @typedef {'light'|'dark'} PreviewColorScheme
 * @typedef {'protanopia'|'deuteranopia'|'tritanopia'} CvdDeficiency
 * @typedef {{ kind: 'typical' } | { kind: 'cvd', deficiency: CvdDeficiency }} PreviewVision
 * @typedef {{ colorScheme: PreviewColorScheme, vision: PreviewVision }} PreviewAppearance
 */

/** @type {PreviewColorScheme[]} */
const COLOR_SCHEMES = ['light', 'dark'];

/** @type {CvdDeficiency[]} */
const CVD_DEFICIENCIES = ['protanopia', 'deuteranopia', 'tritanopia'];

/**
 * Linear-RGB Viénot-style matrices (20 feColorMatrix values each).
 *
 * @type {Record<CvdDeficiency, string>}
 */
const CVD_MATRICES = {
	protanopia:
		'0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
	deuteranopia: '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',
	tritanopia:
		'0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
};

/** @type {PreviewAppearance} */
export const DEFAULT_PREVIEW_APPEARANCE = {
	colorScheme: 'light',
	vision: { kind: 'typical' },
};

/**
 * @param {unknown} value
 * @return {value is PreviewColorScheme} Whether the value is a color scheme.
 */
function isColorScheme(value) {
	return COLOR_SCHEMES.includes(/** @type {PreviewColorScheme} */ (value));
}

/**
 * @param {unknown} value
 * @return {value is CvdDeficiency} Whether the value is a CVD deficiency.
 */
function isCvdDeficiency(value) {
	return CVD_DEFICIENCIES.includes(/** @type {CvdDeficiency} */ (value));
}

/**
 * @param {unknown} vision
 * @return {PreviewVision} A valid vision value.
 */
function parseVision(vision) {
	if (!vision || typeof vision !== 'object') {
		return { kind: 'typical' };
	}
	const { kind, deficiency } =
		/** @type {{ kind?: unknown, deficiency?: unknown }} */ (vision);
	if (kind === 'cvd' && isCvdDeficiency(deficiency)) {
		return { kind: 'cvd', deficiency };
	}
	return { kind: 'typical' };
}

/**
 * Parse an untrusted draft into a PreviewAppearance.
 *
 * @param {unknown} draft
 * @return {PreviewAppearance} A valid appearance. Invalid fields fall back.
 */
export function parseAppearance(draft) {
	if (!draft || typeof draft !== 'object') {
		return DEFAULT_PREVIEW_APPEARANCE;
	}
	const { colorScheme, vision } =
		/** @type {{ colorScheme?: unknown, vision?: unknown }} */ (draft);
	return {
		colorScheme: isColorScheme(colorScheme) ? colorScheme : 'light',
		vision: parseVision(vision),
	};
}

/**
 * @param {PreviewAppearance} appearance
 * @param {unknown}           scheme
 * @return {PreviewAppearance} Appearance with the given color scheme.
 */
export function withColorScheme(appearance, scheme) {
	const current = parseAppearance(appearance);
	if (!isColorScheme(scheme)) {
		return current;
	}
	return {
		...current,
		colorScheme: scheme,
	};
}

/**
 * @param {PreviewAppearance} appearance
 * @param {unknown}           token      `'typical'` or a CVD deficiency slug.
 * @return {PreviewAppearance} Appearance with the given vision.
 */
export function withVision(appearance, token) {
	const current = parseAppearance(appearance);
	if (token === 'typical') {
		return {
			...current,
			vision: { kind: 'typical' },
		};
	}
	if (isCvdDeficiency(token)) {
		return {
			...current,
			vision: { kind: 'cvd', deficiency: token },
		};
	}
	return {
		...current,
		vision: { kind: 'typical' },
	};
}

/**
 * @param {CvdDeficiency} deficiency
 * @return {string} SVG filter id for the deficiency.
 */
export function visionFilterId(deficiency) {
	return `prc-chart-preview-cvd-${deficiency}`;
}

/**
 * SVG filter definitions for the three CVD simulations.
 *
 * @return {{ deficiency: CvdDeficiency, id: string, values: string }[]} Filter defs.
 */
export function visionFilterDefs() {
	return CVD_DEFICIENCIES.map((deficiency) => ({
		deficiency,
		id: visionFilterId(deficiency),
		values: CVD_MATRICES[deficiency],
	}));
}

/**
 * Class name and inline style for the live preview pane.
 *
 * @param {unknown} appearance
 * @return {{ className: string, style: { filter?: string } }} Pane props.
 */
export function previewPaneProps(appearance) {
	const parsed = parseAppearance(appearance);
	const className = parsed.colorScheme === 'dark' ? ' is-dark-preview' : '';
	if (parsed.vision.kind === 'cvd') {
		return {
			className,
			style: {
				filter: `url(#${visionFilterId(parsed.vision.deficiency)})`,
			},
		};
	}
	return {
		className,
		style: {},
	};
}
