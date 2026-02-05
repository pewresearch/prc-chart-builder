/**
 * Extract style-only attributes from chart for copy/paste functionality.
 * This intentionally excludes data-related attributes to allow copying
 * visual styling between charts without affecting their data.
 *
 * Attributes are persisted to localStorage for cross-window support.
 */

/**
 * Keys within independentAxis/dependentAxis that are style-related
 */
const AXIS_STYLE_KEYS = [
	'active',
	'tickLabels', // fontSize, fill, fontFamily, padding, angle, textAnchor, etc.
	'axisLabel', // fontSize, fill, fontFamily, padding, angle, etc.
	'axis', // stroke, strokeWidth
	'ticks', // stroke, size, strokeWidth
	'grid', // stroke, strokeOpacity, strokeWidth, strokeDasharray
	'tickUnit',
	'tickUnitPosition',
	'abbreviateTicks',
	'abbreviateTicksDecimals',
	'tickMarksActive',
	'ticksToLocaleString',
];

/**
 * Keys within legend that are style-related (excluding content like title, categories)
 */
const LEGEND_STYLE_KEYS = [
	'active',
	'orientation',
	'alignment',
	'markerStyle',
	'fontSize',
	'margin',
	'offsetX',
	'offsetY',
	'borderStroke',
	'fill',
	'labelDelimiter',
	'labelLower',
	'labelUpper',
];

/**
 * Keys within tooltip that are style-related (excluding format-related)
 */
const TOOLTIP_STYLE_KEYS = [
	'style', // Full style object
	'caretPosition',
	'deemphasizeSiblings',
	'deemphasizeOpacity',
	'emphasizeStrokeActive',
	'emphasizeStrokeColor',
	'emphasizeStrokeWidth',
	'offsetX',
	'offsetY',
];

/**
 * Keys within labels that are style-related (excluding per-data-point customizations)
 */
const LABELS_STYLE_KEYS = [
	'active',
	'showFirstLastPointsOnly',
	'color',
	'fontWeight',
	'fontSize',
	'fontFamily',
	'labelPositionBar',
	'labelCutoff',
	'labelCutoffMobile',
	'labelPositionDX',
	'labelPositionDY',
	'pieLabelRadius',
	'textAnchor',
	'labelUnit',
	'labelUnitPosition',
	'abbreviateValue',
	'absoluteValue',
	'toLocaleString',
	'truncateDecimal',
	'toFixedDecimal',
];

/**
 * Keys within layout that are style-related (excluding type/orientation)
 */
const LAYOUT_STYLE_KEYS = [
	'width',
	'height',
	'padding',
	'horizontalRules',
	'overflowX',
	'mobileBreakpoint',
];

/**
 * Keys within map that are style-related (excluding projection/topology)
 */
const MAP_STYLE_KEYS = [
	'pathBackgroundFill',
	'pathStroke',
	'pathStrokeWidth',
	'blockRectSize',
	'abbreviateLabels',
	'ignoreSmallStateLabels',
];

/**
 * Keys within diffColumn that are style-related
 */
const DIFF_COLUMN_STYLE_KEYS = ['style'];

/**
 * Extract only specified keys from an object
 * @param obj
 * @param keys
 */
const pickKeys = (obj, keys) => {
	if (!obj || typeof obj !== 'object') return undefined;
	const result = {};
	let hasKeys = false;
	keys.forEach((key) => {
		if (key in obj) {
			result[key] = obj[key];
			hasKeys = true;
		}
	});
	return hasKeys ? result : undefined;
};

/**
 * Deep clone an object (simple JSON-based clone)
 * @param obj
 */
const deepClone = (obj) => {
	if (obj === undefined || obj === null) return obj;
	return JSON.parse(JSON.stringify(obj));
};

/**
 * Extract copyable style attributes from a chart's attributes.
 * This is used for both the main attributes and viewport overrides (mobile/tablet).
 *
 * @param {Object}  attributes         - The chart block attributes
 * @param {boolean} isViewportOverride - Whether this is for mobile/tablet viewport
 * @return {Object} - Style-only attributes suitable for copying
 */
const extractStyleAttributes = (attributes, isViewportOverride = false) => {
	const {
		layout,
		metadata,
		independentAxis,
		dependentAxis,
		labels,
		legend,
		tooltip,
		bar,
		line,
		dotPlot,
		pie,
		nodes,
		map,
		diffColumn,
		explodedBar,
		divergingBar,
		io,
		colors,
	} = attributes;

	const result = {};

	// Layout - dimensions and styling (not type/orientation)
	if (layout) {
		result.layout = pickKeys(layout, LAYOUT_STYLE_KEYS);
	}

	// Metadata - only the active toggle (not content like title, subtitle, etc.)
	if (metadata && metadata?.active !== undefined) {
		result.metadata = { active: metadata.active };
	}

	// Colors
	if (colors && Array.isArray(colors)) {
		result.colors = deepClone(colors);
	}

	// Axis styling
	if (independentAxis) {
		result.independentAxis = pickKeys(independentAxis, AXIS_STYLE_KEYS);
	}
	if (dependentAxis) {
		result.dependentAxis = pickKeys(dependentAxis, AXIS_STYLE_KEYS);
	}

	// Legend styling
	if (legend) {
		result.legend = pickKeys(legend, LEGEND_STYLE_KEYS);
	}

	// Tooltip styling
	if (tooltip) {
		result.tooltip = pickKeys(tooltip, TOOLTIP_STYLE_KEYS);
	}

	// Labels styling (not per-data-point customizations)
	if (labels) {
		result.labels = pickKeys(labels, LABELS_STYLE_KEYS);
	}

	// Chart-type specific styling - copy full objects as they're all style-related
	if (bar) {
		result.bar = deepClone(bar);
	}
	if (line) {
		result.line = deepClone(line);
	}
	if (dotPlot) {
		result.dotPlot = deepClone(dotPlot);
	}
	if (pie) {
		result.pie = deepClone(pie);
	}
	if (nodes) {
		result.nodes = deepClone(nodes);
	}
	if (explodedBar) {
		result.explodedBar = deepClone(explodedBar);
	}

	// Map styling (not projection/topology)
	if (map) {
		result.map = pickKeys(map, MAP_STYLE_KEYS);
	}

	// Diverging bar - only style aspects
	if (divergingBar) {
		result.divergingBar = pickKeys(divergingBar, [
			'percentOfInnerWidth',
			'neutralBar',
		]);
	}

	// Diff column styling
	if (diffColumn) {
		result.diffColumn = pickKeys(diffColumn, DIFF_COLUMN_STYLE_KEYS);
	}

	// IO - only color-related settings
	if (io) {
		const ioStyles = pickKeys(io, ['colorValue', 'customColors']);
		if (ioStyles) {
			result.io = ioStyles;
		}
	}

	return result;
};

/**
 * Extract copyable style attributes including viewport overrides (mobile/tablet).
 *
 * @param {Object} attributes - The full chart block attributes
 * @return {Object} - Style-only attributes with viewport overrides
 */
const getCopyableStyleAttributes = (attributes) => {
	// Extract main styles
	const styles = extractStyleAttributes(attributes, false);

	// Extract mobile viewport overrides if they exist
	if (attributes.mobile && Object.keys(attributes.mobile).length > 0) {
		styles.mobile = extractStyleAttributes(attributes.mobile, true);
	}

	// Extract tablet viewport overrides if they exist
	if (attributes.tablet && Object.keys(attributes.tablet).length > 0) {
		styles.tablet = extractStyleAttributes(attributes.tablet, true);
	}

	return styles;
};

export default getCopyableStyleAttributes;
export { extractStyleAttributes, LAYOUT_STYLE_KEYS, AXIS_STYLE_KEYS };
