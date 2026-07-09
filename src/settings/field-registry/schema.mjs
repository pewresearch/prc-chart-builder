/**
 * Editor attribute schema — the source of truth for the Chart Theme settings
 * panel and the README Configuration Reference.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Three different shapes describe a chart attribute, and they intentionally
 * differ:
 *
 *   1. `block.json` group defaults — what gets persisted/authored. WordPress
 *      block attributes can only type a nested group as `object`, so per-leaf
 *      types/enums/help-text cannot live here once attributes are nested.
 *   2. `charting-utilities/types/*.ts` — the *runtime* config the frontend
 *      renders. Strict on purpose, and legitimately looser than the editor
 *      (e.g. `legend.fontWeight` is just `string` at runtime).
 *   3. This schema — how each editable field behaves *in the editor*: its
 *      control type, allowed values, themeability, and description.
 *
 * `get-config.js` is the seam that merges the authored shape into the runtime
 * shape, so this schema is free to be stricter than runtime (an editor enum
 * that compiles down to a runtime string is the canonical example).
 *
 * SHAPE
 * -----
 * Keyed by curated config group → dot-path → field definition. Nested leaves
 * use dotted keys (`'margin.top'`). Each definition:
 *   - `type`: 'boolean' | 'number' | 'string' | 'color' | 'enum' | 'numberPair' | 'font' | 'font'
 *   - `enum`: required when `type === 'enum'`; the allowed editor values.
 *   - `themeable`: whether the Chart Theme grid lets you edit it (false renders
 *     a read-only value).
 *   - `description`: editor help text + README Notes column (source of truth).
 *
 * Default *values* are NOT duplicated here — they live in `block.json` and are
 * validated against this schema by `bin/sync-field-registry.mjs` (paths must
 * match both ways; enum defaults must be members; scalar defaults must match
 * the declared kind). The build fails loudly when the two drift.
 *
 * MIGRATION
 * ---------
 * This schema is the SOLE source for the settings panel. Groups present here
 * are schema-owned: their `generated.json` fields and README Configuration
 * Reference table are generated from this file. Curated groups not yet present
 * render as empty sections in the panel until migrated — there is no README
 * backstop filling them in.
 *
 * @typedef {Object} SchemaField
 * @property {'boolean' | 'number' | 'string' | 'color' | 'enum' | 'numberPair' | 'font'} type
 * @property {string[]=}                                                         enum        Required when `type === 'enum'`.
 * @property {boolean}                                                           themeable
 * @property {string}                                                            description
 *
 * @type {Record<string, Record<string, SchemaField>>}
 */
export const EDITOR_SCHEMA = {
	layout: {
		height: {
			type: 'number',
			themeable: true,
			description: 'Rendered chart height in pixels.',
		},
		horizontalRules: {
			type: 'boolean',
			themeable: true,
			description: 'Show horizontal grid rules behind the chart.',
		},
		mobileBreakpoint: {
			type: 'number',
			themeable: false,
			description:
				'(DEPRECATED) Viewport width (px) at which mobile layout rules activate.',
		},
		name: {
			type: 'string',
			themeable: false,
			description: 'Internal block name identifier; not user-editable.',
		},
		orientation: {
			type: 'enum',
			enum: ['vertical', 'horizontal'],
			themeable: true,
			description: '`"horizontal"`.',
		},
		overflowX: {
			type: 'enum',
			enum: ['responsive', 'scroll', 'preserve-aspect-ratio'],
			themeable: true,
			description: "'scroll' \\.",
		},
		'padding.bottom': {
			type: 'number',
			themeable: true,
			description: 'Bottom inner padding of the SVG canvas (px).',
		},
		'padding.left': {
			type: 'number',
			themeable: true,
			description: 'Left inner padding of the SVG canvas (px).',
		},
		'padding.right': {
			type: 'number',
			themeable: true,
			description: 'Right inner padding of the SVG canvas (px).',
		},
		'padding.top': {
			type: 'number',
			themeable: true,
			description: 'Top inner padding of the SVG canvas (px).',
		},
		parentClass: {
			type: 'string',
			themeable: true,
			description: 'CSS class applied to the outermost wrapper element.',
		},
		type: {
			type: 'enum',
			enum: [
				'bar',
				'diverging-bar',
				'line',
				'area',
				'scatter',
				'pie',
				'dot-plot',
				'stacked-bar',
				'single-stacked-bar',
				'grouped-bar',
				'exploded-bar',
				'stacked-area',
				'map-usa',
				'map-usa-counties',
				'map-usa-cbsa',
				'map-usa-block',
				'map-usa-hex',
				'map-world',
				'map-world-orthographic',
				'map-europe',
				'treemap',
				'sankey',
				'radar',
			],
			themeable: true,
			description: "'line' \\.",
		},
		width: {
			type: 'number',
			themeable: true,
			description: 'Rendered chart width in pixels.',
		},
	},
	metadata: {
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Show/hide the metadata block entirely.',
		},
		alt: {
			type: 'string',
			themeable: false,
			description: 'Accessible alt-text for static image exports.',
		},
		note: {
			type: 'string',
			themeable: true,
			description: 'Footnote displayed at the bottom.',
		},
		source: {
			type: 'string',
			themeable: true,
			description: 'Source attribution line.',
		},
		subtitle: {
			type: 'string',
			themeable: true,
			description: 'Secondary line below the title.',
		},
		tag: {
			type: 'string',
			themeable: true,
			description: 'Institutional tag or brand label.',
		},
		title: {
			type: 'string',
			themeable: true,
			description: 'Primary chart headline.',
		},
	},
	plotBands: {
		active: {
			type: 'boolean',
			themeable: false,
			description: 'Enable/disable all plot bands.',
		},
		allowDrag: {
			type: 'boolean',
			themeable: false,
			description: 'Allow user to drag band positions (editor only).',
		},
		allowResize: {
			type: 'boolean',
			themeable: false,
			description: 'Allow user to resize bands (editor only).',
		},
		bands: {
			type: 'string',
			themeable: false,
			description:
				'Array of band objects ({ from, to, color, … }); managed per-chart, not a theme default.',
		},
		dimension: {
			type: 'enum',
			enum: ['x', 'y'],
			themeable: false,
			description: '`"x"`.',
		},
	},
	independentAxis: {
		abbreviateTicks: {
			type: 'boolean',
			themeable: true,
			description: 'Abbreviate large numbers (e.g. 1K, 1M).',
		},
		abbreviateTicksDecimals: {
			type: 'number',
			themeable: true,
			description: 'Decimal places when abbreviating tick labels.',
		},
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Show/hide the axis.',
		},
		'axis.stroke': {
			type: 'color',
			themeable: true,
			description: 'Color of the axis line.',
		},
		'axis.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of the axis line (px).',
		},
		'axisLabel.angle': {
			type: 'number',
			themeable: true,
			description: 'Rotation of the axis title (degrees).',
		},
		'axisLabel.dx': {
			type: 'number',
			themeable: true,
			description: 'Horizontal nudge for the axis title.',
		},
		'axisLabel.dy': {
			type: 'number',
			themeable: true,
			description: 'Vertical nudge for the axis title.',
		},
		'axisLabel.fill': {
			type: 'color',
			themeable: true,
			description: 'Axis title color.',
		},
		'axisLabel.fontFamily': {
			type: 'font',
			themeable: true,
			description:
				'Axis title font stack (theme.json family picker; new charts only).',
		},
		'axisLabel.fontSize': {
			type: 'number',
			themeable: true,
			description: 'Axis title font size (px).',
		},
		'axisLabel.maxWidth': {
			type: 'number',
			themeable: true,
			description: 'Max axis title width before wrapping (px).',
		},
		'axisLabel.padding': {
			type: 'number',
			themeable: true,
			description: 'Gap between axis line and title (px).',
		},
		'axisLabel.textAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "'end'`.",
		},
		'axisLabel.verticalAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "'end'`.",
		},
		dateFormat: {
			type: 'enum',
			enum: [
				'%Y',
				"'%y",
				'%-m/%Y',
				'%-m/%y',
				'%m/%Y',
				'%m/%y',
				'%B %Y',
				'%b %Y',
				"%B '%y",
				"%b '%y",
				'%-m/%-d/%Y',
				'%-d/%-m/%Y',
				'%-m/%-d/%y',
				'%-d/%-m/%y',
				'%-m/%-d',
				'%-d/%-m',
				'%m/%d/%Y',
				'%d/%m/%Y',
				'%m/%d/%y',
				'%d/%m/%y',
				'%m/%-d',
				'%-d/%m',
				'%B %-d, %Y',
				'%B %-d %Y',
				'%b %-d, %Y',
				'%b %-d %Y',
				'%-d %B, %Y',
				'%-d %B %Y',
				'%-d %b, %Y',
				'%-d %b %Y',
				"%B %-d '%y",
				"%-d %B '%y",
				"%b %-d '%y",
				"%-d %b '%y",
				'%B %-d',
				'%-d %B',
				'%b %-d',
				'%-d %b',
				'%B',
				'%b',
			],
			themeable: true,
			description:
				'Format applied when scale is "time" (strftime, e.g. "%-m/%Y").',
		},
		domain: {
			type: 'numberPair',
			themeable: true,
			description: 'Explicit axis extent [min, max].',
		},
		domainPadding: {
			type: 'number',
			themeable: true,
			description: 'Extra padding added beyond the domain edges.',
		},
		'grid.stroke': {
			type: 'color',
			themeable: true,
			description: 'Color of grid lines (empty = inherit / none).',
		},
		'grid.strokeDasharray': {
			type: 'string',
			themeable: true,
			description: 'SVG dash pattern for grid lines.',
		},
		'grid.strokeOpacity': {
			type: 'number',
			themeable: true,
			description: 'Opacity of grid lines.',
		},
		'grid.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of grid lines (px).',
		},
		label: {
			type: 'string',
			themeable: true,
			description: 'Axis title label.',
		},
		padding: {
			type: 'number',
			themeable: true,
			description: 'Space between axis line and chart edge (px).',
		},
		scale: {
			type: 'enum',
			enum: ['linear', 'time', 'log', 'sqrt'],
			themeable: true,
			description: "'log' \\.",
		},
		showZero: {
			type: 'boolean',
			themeable: true,
			description: 'Force zero to appear in the domain.',
		},
		tickCount: {
			type: 'number',
			themeable: true,
			description: 'Suggested number of tick marks.',
		},
		tickFormat: {
			type: 'string',
			themeable: false,
			description: 'Reserved for runtime format function.',
		},
		'tickLabels.angle': {
			type: 'number',
			themeable: true,
			description: 'Rotation of tick labels (degrees).',
		},
		'tickLabels.dx': {
			type: 'number',
			themeable: true,
			description: 'Horizontal nudge for tick labels.',
		},
		'tickLabels.dy': {
			type: 'number',
			themeable: true,
			description: 'Vertical nudge for tick labels.',
		},
		'tickLabels.fill': {
			type: 'color',
			themeable: true,
			description: 'Tick label color.',
		},
		'tickLabels.fontFamily': {
			type: 'font',
			themeable: true,
			description:
				'Tick label font stack (theme.json family picker; new charts only).',
		},
		'tickLabels.fontSize': {
			type: 'number',
			themeable: true,
			description: 'Tick label font size (px).',
		},
		'tickLabels.maxWidth': {
			type: 'number',
			themeable: true,
			description: 'Max label width before wrapping (px).',
		},
		'tickLabels.padding': {
			type: 'number',
			themeable: true,
			description: 'Gap between tick mark and label (px).',
		},
		'tickLabels.textAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "'end'`.",
		},
		'tickLabels.verticalAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "'end'`.",
		},
		tickMarksActive: {
			type: 'boolean',
			themeable: true,
			description: 'Show tick mark lines on the axis.',
		},
		'ticks.size': {
			type: 'number',
			themeable: true,
			description: 'Length of tick marks (px).',
		},
		'ticks.stroke': {
			type: 'color',
			themeable: true,
			description: 'Color of tick marks.',
		},
		'ticks.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of tick mark lines (px).',
		},
		ticksToLocaleString: {
			type: 'boolean',
			themeable: true,
			description: 'Format tick values with toLocaleString().',
		},
		tickUnit: {
			type: 'string',
			themeable: true,
			description:
				'Unit suffix/prefix appended to tick labels (e.g. "%", "$").',
		},
		tickUnitPosition: {
			type: 'enum',
			enum: ['start', 'end'],
			themeable: true,
			description: '`"end"`.',
		},
		tickValues: {
			type: 'string',
			themeable: false,
			description:
				'Explicit tick values array; managed per-chart, not a theme default.',
		},
	},
	dependentAxis: {
		abbreviateTicks: {
			type: 'boolean',
			themeable: true,
			description: 'Abbreviate large numbers (e.g. 1K, 1M).',
		},
		abbreviateTicksDecimals: {
			type: 'number',
			themeable: true,
			description: 'Decimal places when abbreviating tick labels.',
		},
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Show/hide the axis.',
		},
		'axis.stroke': {
			type: 'color',
			themeable: true,
			description: 'Color of the axis line.',
		},
		'axis.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of the axis line (px).',
		},
		'axisLabel.angle': {
			type: 'number',
			themeable: true,
			description:
				'Rotation of the axis title (typically 270° for Y-axis readability).',
		},
		'axisLabel.dx': {
			type: 'number',
			themeable: true,
			description: 'Horizontal nudge for the axis title.',
		},
		'axisLabel.dy': {
			type: 'number',
			themeable: true,
			description: 'Vertical nudge for the axis title.',
		},
		'axisLabel.fill': {
			type: 'color',
			themeable: true,
			description: 'Axis title color.',
		},
		'axisLabel.fontFamily': {
			type: 'font',
			themeable: true,
			description:
				'Axis title font stack (theme.json family picker; new charts only).',
		},
		'axisLabel.fontSize': {
			type: 'number',
			themeable: true,
			description: 'Axis title font size (px).',
		},
		'axisLabel.maxWidth': {
			type: 'number',
			themeable: true,
			description: 'Max axis title width before wrapping (px).',
		},
		'axisLabel.padding': {
			type: 'number',
			themeable: true,
			description: 'Gap between axis line and title (px).',
		},
		'axisLabel.textAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "'end'`.",
		},
		'axisLabel.verticalAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "'end'`.",
		},
		domain: {
			type: 'numberPair',
			themeable: true,
			description: 'Explicit axis extent [min, max].',
		},
		'grid.stroke': {
			type: 'color',
			themeable: true,
			description: 'Color of grid lines (empty = inherit / none).',
		},
		'grid.strokeDasharray': {
			type: 'string',
			themeable: true,
			description: 'SVG dash pattern for grid lines.',
		},
		'grid.strokeOpacity': {
			type: 'number',
			themeable: true,
			description: 'Opacity of grid lines.',
		},
		'grid.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of grid lines (px).',
		},
		label: {
			type: 'string',
			themeable: true,
			description: 'Axis title label.',
		},
		scale: {
			type: 'enum',
			enum: ['linear', 'time', 'log', 'sqrt'],
			themeable: true,
			description: "'log' \\.",
		},
		showZero: {
			type: 'boolean',
			themeable: true,
			description: 'Force zero to appear in the domain.',
		},
		tickAngle: {
			type: 'number',
			themeable: true,
			description: 'Rotation of tick labels (degrees).',
		},
		tickCount: {
			type: 'number',
			themeable: true,
			description: 'Suggested number of tick marks.',
		},
		tickFormat: {
			type: 'string',
			themeable: false,
			description: 'Reserved for runtime format function.',
		},
		'tickLabels.angle': {
			type: 'number',
			themeable: true,
			description: 'Rotation of tick labels (degrees).',
		},
		'tickLabels.dx': {
			type: 'number',
			themeable: true,
			description: 'Horizontal nudge for tick labels.',
		},
		'tickLabels.dy': {
			type: 'number',
			themeable: true,
			description: 'Vertical nudge for tick labels.',
		},
		'tickLabels.fill': {
			type: 'color',
			themeable: true,
			description: 'Tick label color.',
		},
		'tickLabels.fontFamily': {
			type: 'font',
			themeable: true,
			description:
				'Tick label font stack (theme.json family picker; new charts only).',
		},
		'tickLabels.fontSize': {
			type: 'number',
			themeable: true,
			description: 'Tick label font size (px).',
		},
		'tickLabels.maxWidth': {
			type: 'number',
			themeable: true,
			description: 'Max label width before wrapping (px).',
		},
		'tickLabels.padding': {
			type: 'number',
			themeable: true,
			description: 'Gap between tick mark and label (px).',
		},
		'tickLabels.textAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "'end'`.",
		},
		'tickLabels.verticalAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "'end'`.",
		},
		tickMarksActive: {
			type: 'boolean',
			themeable: true,
			description: 'Show tick mark lines on the axis.',
		},
		'ticks.size': {
			type: 'number',
			themeable: true,
			description: 'Length of tick marks (px).',
		},
		'ticks.stroke': {
			type: 'color',
			themeable: true,
			description: 'Color of tick marks.',
		},
		'ticks.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of tick mark lines (px).',
		},
		ticksToLocaleString: {
			type: 'boolean',
			themeable: true,
			description: 'Format tick values with toLocaleString().',
		},
		tickUnit: {
			type: 'string',
			themeable: true,
			description:
				'Unit suffix/prefix appended to tick labels (e.g. "%", "$").',
		},
		tickUnitPosition: {
			type: 'enum',
			enum: ['start', 'end'],
			themeable: true,
			description: '`"end"`.',
		},
		tickValues: {
			type: 'string',
			themeable: false,
			description:
				'Explicit tick values array; managed per-chart, not a theme default.',
		},
	},
	tooltip: {
		abbreviateValue: {
			type: 'boolean',
			themeable: true,
			description: 'Abbreviate the displayed value (e.g. 1K, 1M).',
		},
		absoluteValue: {
			type: 'boolean',
			themeable: true,
			description: 'Show absolute (non-negative) values.',
		},
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Enable/disable tooltips.',
		},
		caretPosition: {
			type: 'enum',
			enum: ['top', 'bottom', 'left', 'right'],
			themeable: true,
			description: "`'left'`.",
		},
		customFormat: {
			type: 'string',
			themeable: false,
			description: 'Reserved for runtime custom format function.',
		},
		dateFormat: {
			type: 'enum',
			enum: [
				'%Y',
				"'%y",
				'%-m/%Y',
				'%-m/%y',
				'%m/%Y',
				'%m/%y',
				'%B %Y',
				'%b %Y',
				"%B '%y",
				"%b '%y",
				'%-m/%-d/%Y',
				'%-d/%-m/%Y',
				'%-m/%-d/%y',
				'%-d/%-m/%y',
				'%-m/%-d',
				'%-d/%-m',
				'%m/%d/%Y',
				'%d/%m/%Y',
				'%m/%d/%y',
				'%d/%m/%y',
				'%m/%-d',
				'%-d/%m',
				'%B %-d, %Y',
				'%B %-d %Y',
				'%b %-d, %Y',
				'%b %-d %Y',
				'%-d %B, %Y',
				'%-d %B %Y',
				'%-d %b, %Y',
				'%-d %b %Y',
				"%B %-d '%y",
				"%-d %B '%y",
				"%b %-d '%y",
				"%-d %b '%y",
				'%B %-d',
				'%-d %B',
				'%b %-d',
				'%-d %b',
				'%B',
				'%b',
			],
			themeable: true,
			description: 'Date format when axis scale is `"time"`.',
		},
		deemphasizeOpacity: {
			type: 'number',
			themeable: true,
			description: 'Opacity applied to de-emphasised elements.',
		},
		deemphasizeSiblings: {
			type: 'boolean',
			themeable: true,
			description: 'Fade non-hovered series when hovering.',
		},
		emphasizeStrokeActive: {
			type: 'boolean',
			themeable: true,
			description: 'Highlight hovered element with a stroke.',
		},
		emphasizeStrokeColor: {
			type: 'string',
			themeable: true,
			description: 'Stroke color for emphasis.',
		},
		emphasizeStrokeWidth: {
			type: 'number',
			themeable: true,
			description: 'Stroke width for emphasis (px).',
		},
		format: {
			type: 'string',
			themeable: true,
			description: 'Mustache-style template for each tooltip row.',
		},
		headerActive: {
			type: 'boolean',
			themeable: true,
			description: 'Show a header row inside the tooltip.',
		},
		headerValue: {
			type: 'enum',
			enum: ['categoryValue', 'independentValue'],
			themeable: true,
			description: '`"categoryValue"`.',
		},
		offsetX: {
			type: 'number',
			themeable: true,
			description: 'Horizontal pixel offset of the tooltip box.',
		},
		offsetY: {
			type: 'number',
			themeable: true,
			description: 'Vertical pixel offset of the tooltip box.',
		},
		rlsFormat: {
			type: 'boolean',
			themeable: true,
			description: 'Use RLS (relative-to-last-series) formatting.',
		},
		'style.background': {
			type: 'color',
			themeable: true,
			description: 'Tooltip background color.',
		},
		'style.border': {
			type: 'string',
			themeable: true,
			description: 'Tooltip border CSS shorthand.',
		},
		'style.borderRadius': {
			type: 'string',
			themeable: true,
			description: 'Tooltip corner radius CSS shorthand.',
		},
		'style.color': {
			type: 'color',
			themeable: true,
			description: 'Tooltip text color.',
		},
		'style.fontFamily': {
			type: 'font',
			themeable: true,
			description:
				'Tooltip font stack (theme.json family picker; new charts only).',
		},
		'style.fontSize': {
			type: 'number',
			themeable: true,
			description: 'Tooltip text size (px).',
		},
		'style.height': {
			type: 'string',
			themeable: true,
			description: 'Tooltip box height CSS value (e.g. `auto`).',
		},
		'style.maxHeight': {
			type: 'number',
			themeable: true,
			description: 'Maximum tooltip box height (px).',
		},
		'style.maxWidth': {
			type: 'number',
			themeable: true,
			description: 'Maximum tooltip box width (px).',
		},
		'style.minHeight': {
			type: 'number',
			themeable: true,
			description: 'Minimum tooltip box height (px).',
		},
		'style.minWidth': {
			type: 'number',
			themeable: true,
			description: 'Minimum tooltip box width (px).',
		},
		'style.padding': {
			type: 'string',
			themeable: true,
			description: 'Tooltip inner padding CSS shorthand.',
		},
		'style.width': {
			type: 'string',
			themeable: true,
			description: 'Tooltip box width CSS value (e.g. `auto`).',
		},
		toFixedDecimal: {
			type: 'number',
			themeable: true,
			description: 'Decimal places for numeric values.',
		},
		toLocaleString: {
			type: 'boolean',
			themeable: true,
			description:
				'Format numbers with locale-aware thousands separators.',
		},
	},
	legend: {
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Show/hide the legend.',
		},
		alignment: {
			type: 'enum',
			enum: ['flex-start', 'center', 'flex-end', 'none'],
			themeable: true,
			description: "'center' \\.",
		},
		borderStroke: {
			type: 'color',
			themeable: true,
			description: 'Border color of the legend box (empty = none).',
		},
		categories: {
			type: 'string',
			themeable: false,
			description:
				'Override legend item order; uses `dataRender.categories` by default.',
		},
		fill: {
			type: 'color',
			themeable: true,
			description:
				'Background fill of the legend box (empty = transparent).',
		},
		fontFamily: {
			type: 'font',
			themeable: true,
			description:
				'Legend label font stack (theme.json family picker; new charts only).',
		},
		fontSize: {
			type: 'number',
			themeable: true,
			description: 'Legend label font size (px).',
		},
		fontWeight: {
			type: 'enum',
			enum: ['normal', 'bold', '600', '700'],
			themeable: true,
			description: '`"normal"`.',
		},
		labelDelimiter: {
			type: 'string',
			themeable: true,
			description:
				'Text between the lower and upper bound labels in map legends.',
		},
		labelLower: {
			type: 'string',
			themeable: true,
			description: 'Prefix label for the bottom range in map legends.',
		},
		labelUpper: {
			type: 'string',
			themeable: true,
			description: 'Prefix label for the top range in map legends.',
		},
		'margin.bottom': {
			type: 'number',
			themeable: true,
			description: 'Bottom margin around the legend (px).',
		},
		'margin.left': {
			type: 'number',
			themeable: true,
			description: 'Left margin around the legend (px).',
		},
		'margin.right': {
			type: 'number',
			themeable: true,
			description: 'Right margin around the legend (px).',
		},
		'margin.top': {
			type: 'number',
			themeable: true,
			description: 'Top margin around the legend (px).',
		},
		markerFill: {
			type: 'enum',
			enum: ['solid', 'outline'],
			themeable: true,
			description: '`"solid"`.',
		},
		markerStyle: {
			type: 'enum',
			enum: ['rect', 'circle', 'line', 'none', 'label'],
			themeable: true,
			description: "'line' \\.",
		},
		offsetX: {
			type: 'number',
			themeable: true,
			description: 'Horizontal position offset (px).',
		},
		offsetY: {
			type: 'number',
			themeable: true,
			description: 'Vertical position offset (px).',
		},
		orientation: {
			type: 'enum',
			enum: ['row', 'column', 'row-reverse', 'column-reverse'],
			themeable: true,
			description: "'row-reverse' \\.",
		},
		title: {
			type: 'string',
			themeable: true,
			description: 'Optional legend heading.',
		},
		variation: {
			type: 'enum',
			enum: ['grouped', 'detached', 'direct'],
			themeable: true,
			description: "'direct'`.",
		},
	},
	labels: {
		abbreviateValue: {
			type: 'boolean',
			themeable: true,
			description: 'Abbreviate displayed values (e.g. 1K, 1M).',
		},
		absoluteValue: {
			type: 'boolean',
			themeable: true,
			description: 'Show absolute (non-negative) values.',
		},
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Show/hide data labels.',
		},
		autoDeclutter: {
			type: 'boolean',
			themeable: true,
			description: 'Automatically resolve overlapping data labels.',
		},
		color: {
			type: 'enum',
			enum: ['contrast', 'inherit', 'black', 'white'],
			themeable: true,
			description:
				'Label color token (`contrast` picks bar-aware fill; `inherit` uses series color).',
		},
		customLabelFormat: {
			type: 'string',
			themeable: false,
			description: 'Reserved for runtime custom format function.',
		},
		customLabels: {
			type: 'string',
			themeable: false,
			description:
				'Per-datum label text overrides keyed by data row index.',
		},
		customPositions: {
			type: 'string',
			themeable: false,
			description:
				'Per-datum position overrides keyed by data row index.',
		},
		customStyles: {
			type: 'string',
			themeable: false,
			description:
				'Per-datum inline style overrides keyed by data row index.',
		},
		customVisibility: {
			type: 'string',
			themeable: false,
			description:
				'Per-datum visibility overrides keyed by data row index.',
		},
		declutterLeaderLines: {
			type: 'boolean',
			themeable: true,
			description:
				'Draw leader lines from decluttered labels to their anchor points.',
		},
		declutterPadding: {
			type: 'number',
			themeable: true,
			description:
				'Minimum padding between labels when auto-decluttering (px).',
		},
		fontFamily: {
			type: 'font',
			themeable: true,
			description:
				'Label font stack (theme.json family picker; new charts only).',
		},
		fontSize: {
			type: 'number',
			themeable: true,
			description: 'Label font size (px).',
		},
		fontWeight: {
			type: 'number',
			themeable: true,
			description: 'CSS font-weight for labels.',
		},
		labelCutoff: {
			type: 'number',
			themeable: true,
			description:
				'Min bar value to display a label (smaller bars are unlabelled).',
		},
		labelPositionBar: {
			type: 'enum',
			enum: ['inside', 'center', 'outside'],
			themeable: true,
			description: "`'center'`.",
		},
		labelPositionDX: {
			type: 'number',
			themeable: true,
			description: 'Horizontal pixel nudge for label placement.',
		},
		labelPositionDY: {
			type: 'number',
			themeable: true,
			description: 'Vertical pixel nudge for label placement.',
		},
		labelUnit: {
			type: 'string',
			themeable: true,
			description: 'Unit string appended to label values (e.g. `"%"`).',
		},
		labelUnitPosition: {
			type: 'enum',
			enum: ['start', 'end'],
			themeable: true,
			description: '`"end"`.',
		},
		pieLabelRadius: {
			type: 'number',
			themeable: true,
			description: 'Distance of pie/donut labels from the center (px).',
		},
		showFirstLastPointsOnly: {
			type: 'boolean',
			themeable: true,
			description:
				'Only label the first and last data point (useful for line charts).',
		},
		textAnchor: {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: "`'end'`.",
		},
		textOutline: {
			type: 'boolean',
			themeable: true,
			description:
				'Draw a contrasting outline around label text for readability.',
		},
		textOutlineMode: {
			type: 'enum',
			enum: ['background', 'contrast'],
			themeable: true,
			description:
				'Outline halo color strategy when textOutline is enabled (`background` = chart moat; `contrast` = opposite of label fill).',
		},
		toFixedDecimal: {
			type: 'number',
			themeable: true,
			description: 'Maximum decimal places shown.',
		},
		toLocaleString: {
			type: 'boolean',
			themeable: true,
			description:
				'Format numbers with locale-aware thousands separators.',
		},
		truncateDecimal: {
			type: 'boolean',
			themeable: true,
			description: 'Drop trailing zeros after the decimal point.',
		},
	},
	shapes: {
		customStyles: {
			type: 'string',
			themeable: false,
			description:
				'Per-series/category style overrides (keyed object; managed per-chart, not a theme default).',
		},
		segmentsActive: {
			type: 'boolean',
			themeable: false,
			description:
				'Whether per-segment styling is active (managed per-chart, not a theme default).',
		},
		segmentStyles: {
			type: 'string',
			themeable: false,
			description:
				'Per-segment style overrides for stacked charts (keyed object; managed per-chart, not a theme default).',
		},
	},
	bar: {
		barGroupPadding: {
			type: 'number',
			themeable: true,
			description:
				'Padding between bar groups in grouped charts (0–1 fraction).',
		},
		barPadding: {
			type: 'number',
			themeable: true,
			description:
				'Inner padding between individual bars (0–1 fraction).',
		},
		hasRectStroke: {
			type: 'boolean',
			themeable: true,
			description: 'Apply a border stroke around each bar rectangle.',
		},
		stackOffset: {
			type: 'enum',
			enum: ['none', 'expand', 'wiggle', 'silhouette'],
			themeable: true,
			description: "`'wiggle'`.",
		},
	},
	line: {
		areaFillOpacity: {
			type: 'number',
			themeable: true,
			description: 'Opacity of the area fill (0–1).',
		},
		interpolation: {
			type: 'enum',
			enum: [
				'curveBasis',
				'curveBasisClosed',
				'curveBasisOpen',
				'curveStep',
				'curveStepAfter',
				'curveStepBefore',
				'curveBundle',
				'curveLinear',
				'curveLinearClosed',
				'curveCardinal',
				'curveCardinalClosed',
				'curveCardinalOpen',
				'curveCatmullRom',
				'curveCatmullRomClosed',
				'curveCatmullRomOpen',
				'curveMonotoneX',
				'curveMonotoneY',
				'curveNatural',
				'curvemonotoneX',
				'curvemonotoneY',
				'curvenatural',
			],
			themeable: true,
			description:
				'D3 curve factory name (e.g. `"curveBasis"`, `"curveMonotoneX"`).',
		},
		showArea: {
			type: 'boolean',
			themeable: true,
			description: 'Fill the area beneath the line.',
		},
		showPoints: {
			type: 'boolean',
			themeable: true,
			description: 'Render data point markers on the line.',
		},
		strokeDasharray: {
			type: 'string',
			themeable: true,
			description: 'SVG dash pattern for the line (e.g. `"4,2"`).',
		},
		strokeWidth: {
			type: 'number',
			themeable: true,
			description: 'Line stroke width (px).',
		},
	},
	dotPlot: {
		'connectingLine.stroke': {
			type: 'color',
			themeable: true,
			description: 'color of the connecting line.',
		},
		'connectingLine.strokeDasharray': {
			type: 'string',
			themeable: true,
			description: 'SVG dash pattern for the connecting line.',
		},
		'connectingLine.strokeOpacity': {
			type: 'number',
			themeable: true,
			description: 'Opacity of the connecting line (0–1).',
		},
		'connectingLine.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of the connecting line (px).',
		},
		connectPoints: {
			type: 'boolean',
			themeable: true,
			description: 'Draw a connecting line between dot pairs.',
		},
	},
	errorBars: {
		categories: {
			type: 'string',
			themeable: false,
			description:
				'Per-category error bar style overrides (managed per-chart, not a theme default).',
		},
		customStyles: {
			type: 'string',
			themeable: false,
			description:
				'Per-datum error bar style overrides (managed per-chart, not a theme default).',
		},
		'defaultStyles.stroke': {
			type: 'color',
			themeable: true,
			description: 'Color of default error bar whiskers.',
		},
		'defaultStyles.strokeDasharray': {
			type: 'string',
			themeable: true,
			description: 'SVG dash pattern for error bars.',
		},
		'defaultStyles.strokeOpacity': {
			type: 'number',
			themeable: true,
			description: 'Opacity of error bars (0–1).',
		},
		'defaultStyles.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of default error bar whiskers (px).',
		},
		enabled: {
			type: 'boolean',
			themeable: true,
			description: 'Enable error bar overlays.',
		},
	},
	explodedBar: {
		columnGap: {
			type: 'number',
			themeable: true,
			description: 'Horizontal gap between exploded bar columns (px).',
		},
	},
	pie: {
		cornerRadius: {
			type: 'number',
			themeable: true,
			description: 'Corner rounding radius for segments (px).',
		},
		'groupArcStyle.stroke': {
			type: 'color',
			themeable: true,
			description: 'color of group arc lines.',
		},
		'groupArcStyle.strokeDasharray': {
			type: 'enum',
			enum: ['none', '4,4', '2,2', '8,4'],
			themeable: true,
			description: 'Dash pattern for group arc lines.',
		},
		'groupArcStyle.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Width of group arc lines (px).',
		},
		groupGapAngle: {
			type: 'number',
			themeable: true,
			description: 'Angular gap between segment groups (degrees).',
		},
		hasPathStroke: {
			type: 'boolean',
			themeable: true,
			description: 'Apply a stroke between pie segments.',
		},
		innerRadius: {
			type: 'number',
			themeable: true,
			description: 'Inner radius for donut charts (0 = solid pie).',
		},
		padAngle: {
			type: 'number',
			themeable: true,
			description: 'Padding angle between segments (radians).',
		},
		pathStrokeColor: {
			type: 'string',
			themeable: true,
			description: 'color of inter-segment strokes.',
		},
		pathStrokeWidth: {
			type: 'number',
			themeable: true,
			description: 'Width of inter-segment strokes (px).',
		},
		showCategoryLabels: {
			type: 'boolean',
			themeable: true,
			description: 'Render category name labels outside segments.',
		},
		showGroupArcs: {
			type: 'boolean',
			themeable: true,
			description: 'Render arc indicators around segment groups.',
		},
		sortByValue: {
			type: 'boolean',
			themeable: true,
			description:
				'Sort segments by value (largest first) instead of data order.',
		},
	},
	nodes: {
		pointFill: {
			type: 'enum',
			enum: ['inherit', 'white'],
			themeable: true,
			description:
				'Fill color of markers (`"inherit"` uses series color).',
		},
		pointSize: {
			type: 'number',
			themeable: true,
			description: 'Radius of scatter/dot plot markers (px).',
		},
		pointStroke: {
			type: 'string',
			themeable: true,
			description: 'Stroke color of markers.',
		},
		pointStrokeWidth: {
			type: 'number',
			themeable: true,
			description: 'Stroke width around markers (px).',
		},
	},
	regression: {
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Overlay a regression line on the chart.',
		},
		groupBreakStyles: {
			type: 'string',
			themeable: false,
			description: 'Per-group style overrides for regression lines.',
		},
		perGroupBreak: {
			type: 'boolean',
			themeable: true,
			description: 'Compute a separate regression for each group break.',
		},
		stroke: {
			type: 'color',
			themeable: true,
			description: 'color of the regression line.',
		},
		strokeDasharray: {
			type: 'string',
			themeable: true,
			description: 'SVG dash pattern for the regression line.',
		},
		strokeWidth: {
			type: 'number',
			themeable: true,
			description: 'Width of the regression line (px).',
		},
		type: {
			type: 'enum',
			enum: [
				'linear',
				'exponential',
				'polynomial',
				'logarithmic',
				'power',
				'quadratic',
				'loess',
			],
			themeable: true,
			description: "`'power'`.",
		},
	},
	map: {
		abbreviateLabels: {
			type: 'boolean',
			themeable: true,
			description: 'Use abbreviated state/country names.',
		},
		blockRectSize: {
			type: 'number',
			themeable: true,
			description: 'Cell size for block-style cartogram maps (px).',
		},
		centerLatitude: {
			type: 'number',
			themeable: true,
			description: 'Projection center latitude (degrees).',
		},
		centerLongitude: {
			type: 'number',
			themeable: true,
			description: 'Projection center longitude (degrees).',
		},
		customScale: {
			type: 'number',
			themeable: true,
			description:
				"Scale multiplier applied on top of the projection's default scale.",
		},
		ignoredLabels: {
			type: 'string',
			themeable: false,
			description:
				'Additional state/country codes whose labels are suppressed.',
		},
		ignoreSmallStateLabels: {
			type: 'boolean',
			themeable: true,
			description:
				'Suppress labels on small states/territories (RI, DC, etc.).',
		},
		pathBackgroundFill: {
			type: 'string',
			themeable: true,
			description: 'Fill for regions with no data.',
		},
		pathStroke: {
			type: 'string',
			themeable: true,
			description: 'Border color between regions.',
		},
		pathStrokeWidth: {
			type: 'number',
			themeable: true,
			description: 'Border width between regions (px).',
		},
		projectionPreset: {
			type: 'enum',
			enum: [
				'default',
				'americas',
				'asia',
				'europe',
				'middle-east-north-africa',
				'sub-saharan-africa',
				'africa',
				'asia-pacific',
				'latin-america-and-the-caribbean',
				'middle-east',
				'north-america',
				'caribbean',
				'central-america',
				'central-asia',
				'east-asia',
				'eastern-europe',
				'north-africa',
				'oceania',
				'south-america',
				'south-asia',
				'western-europe',
				'continent-africa',
				'continent-asia',
				'continent-europe',
				'continent-north-america',
				'continent-south-america',
				'continent-oceania',
				'custom',
			],
			themeable: true,
			description:
				'For world maps, pre-defined areas for render (eg. Europe, South Asia, Africa).',
		},
		rotateGamma: {
			type: 'number',
			themeable: true,
			description: 'Projection γ (roll) rotation.',
		},
		rotateLambda: {
			type: 'number',
			themeable: true,
			description: 'Projection λ (longitude) rotation.',
		},
		rotatePhi: {
			type: 'number',
			themeable: true,
			description: 'Projection φ (latitude) rotation.',
		},
		showCountyBoundaries: {
			type: 'boolean',
			themeable: true,
			description:
				'Overlay county boundary lines (`map-usa-counties` only).',
		},
		showStateBoundaries: {
			type: 'boolean',
			themeable: true,
			description:
				'Overlay state boundary lines on county and world maps.',
		},
		topologyRegion: {
			type: 'enum',
			enum: [
				'default',
				'americas',
				'asia',
				'europe',
				'middle-east-north-africa',
				'sub-saharan-africa',
				'africa',
				'asia-pacific',
				'latin-america-and-the-caribbean',
				'middle-east',
				'north-america',
				'caribbean',
				'central-america',
				'central-asia',
				'east-asia',
				'eastern-europe',
				'north-africa',
				'oceania',
				'south-america',
				'south-asia',
				'western-europe',
				'continent-africa',
				'continent-asia',
				'continent-europe',
				'continent-north-america',
				'continent-south-america',
				'continent-oceania',
				'custom',
			],
			themeable: true,
			description: 'Which regional topology file to load for world maps.',
		},
		zoomActive: {
			type: 'boolean',
			themeable: true,
			description: 'Enable pan/zoom interaction.',
		},
	},
	divergingBar: {
		negativeCategories: {
			type: 'string',
			themeable: false,
			description: 'Column keys plotted on the negative side.',
		},
		netNegativeCategory: {
			type: 'string',
			themeable: true,
			description: 'Column key for the net negative bar.',
		},
		netPositiveCategory: {
			type: 'string',
			themeable: true,
			description:
				'Column key for the net positive bar (optional summary bar).',
		},
		'neutralBar.active': {
			type: 'boolean',
			themeable: true,
			description: 'Show a center neutral bar.',
		},
		'neutralBar.category': {
			type: 'string',
			themeable: true,
			description: 'Column key for the neutral bar.',
		},
		'neutralBar.offsetX': {
			type: 'number',
			themeable: true,
			description: 'Horizontal offset of the neutral bar (px).',
		},
		'neutralBar.separator': {
			type: 'boolean',
			themeable: true,
			description: 'Draw a separator line at the neutral bar.',
		},
		'neutralBar.separatorOffsetX': {
			type: 'number',
			themeable: true,
			description: 'Horizontal offset of the separator line (px).',
		},
		percentOfInnerWidth: {
			type: 'number',
			themeable: true,
			description:
				'Fraction of chart width used for the diverging bars (0–1).',
		},
		positiveCategories: {
			type: 'string',
			themeable: false,
			description: 'Column keys plotted on the positive side.',
		},
		'secondary.active': {
			type: 'boolean',
			themeable: true,
			description: 'Show a secondary diverging bar layer.',
		},
		'secondary.categoryStyles': {
			type: 'string',
			themeable: false,
			description:
				'Per-category style overrides for secondary bars (managed per-chart, not a theme default).',
		},
		'secondary.fill': {
			type: 'color',
			themeable: true,
			description: 'Fill color of secondary bars.',
		},
		'secondary.negativeCategories': {
			type: 'string',
			themeable: false,
			description: 'Column keys plotted on the secondary negative side.',
		},
		'secondary.opacity': {
			type: 'number',
			themeable: true,
			description: 'Opacity of secondary bars (0–1).',
		},
		'secondary.positiveCategories': {
			type: 'string',
			themeable: false,
			description: 'Column keys plotted on the secondary positive side.',
		},
		'secondary.showInLegend': {
			type: 'boolean',
			themeable: true,
			description: 'Include secondary bars in the legend.',
		},
		'secondary.stroke': {
			type: 'color',
			themeable: true,
			description: 'Stroke color of secondary bars.',
		},
		'secondary.strokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Stroke width of secondary bars (px).',
		},
	},
	diffColumn: {
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Show/hide the diff column.',
		},
		category: {
			type: 'string',
			themeable: true,
			description:
				'Column key whose values are displayed in the diff column.',
		},
		columnHeader: {
			type: 'string',
			themeable: true,
			description: 'Header label for the column.',
		},
		customLabels: {
			type: 'string',
			themeable: false,
			description:
				'Per-cell overrides keyed by `x::category` or `x::category::group`.',
		},
		dx: {
			type: 'number',
			themeable: true,
			description: 'Horizontal nudge of the column (px).',
		},
		dy: {
			type: 'number',
			themeable: true,
			description: 'Vertical nudge of the column (px).',
		},
		'style.fill': {
			type: 'color',
			themeable: true,
			description: 'Default cell text color.',
		},
		'style.fontAppearance': {
			type: 'enum',
			enum: ['default', 'bold', 'italic', 'bold-italic'],
			themeable: true,
			description: 'Semantic appearance variant (e.g. colored diffs).',
		},
		'style.fontSize': {
			type: 'string',
			themeable: true,
			description: 'Cell font size.',
		},
		'style.fontStyle': {
			type: 'enum',
			enum: ['normal', 'italic'],
			themeable: true,
			description: 'Font style of cell text.',
		},
		'style.fontWeight': {
			type: 'enum',
			enum: ['normal', 'bold'],
			themeable: true,
			description: 'Font weight of cell text.',
		},
		'style.headerFill': {
			type: 'color',
			themeable: true,
			description: 'Header text color.',
		},
		'style.headerFontFamily': {
			type: 'string',
			themeable: true,
			description: 'Header font family (separate from cell text).',
		},
		'style.headerFontSize': {
			type: 'string',
			themeable: true,
			description: 'Column header font size.',
		},
		'style.headerFontStyle': {
			type: 'enum',
			enum: ['normal', 'italic'],
			themeable: true,
			description: 'Header font style (separate from cell text).',
		},
		'style.headerFontWeight': {
			type: 'enum',
			enum: ['normal', 'bold'],
			themeable: true,
			description: 'Header font weight (separate from cell text).',
		},
		'style.headerTextOutline': {
			type: 'boolean',
			themeable: true,
			description: 'Column-wide header text outline toggle.',
		},
		'style.heightOffset': {
			type: 'number',
			themeable: true,
			description: 'Vertical adjustment to cell height (px).',
		},
		'style.marginLeft': {
			type: 'number',
			themeable: true,
			description: 'Left margin before the column (px).',
		},
		'style.rectFill': {
			type: 'color',
			themeable: true,
			description: 'Background fill of column cells.',
		},
		'style.rectStrokeColor': {
			type: 'string',
			themeable: true,
			description: 'Border color of column cells.',
		},
		'style.rectStrokeWidth': {
			type: 'number',
			themeable: true,
			description: 'Border width of column cells (px).',
		},
		'style.textOutline': {
			type: 'boolean',
			themeable: true,
			description: 'Column-wide cell text outline toggle.',
		},
		'style.width': {
			type: 'number',
			themeable: true,
			description: 'Column width (px).',
		},
	},
	netValues: {
		active: {
			type: 'boolean',
			themeable: true,
			description:
				'Show net positive/negative value labels on stacked charts.',
		},
		'negative.abbreviateValue': {
			type: 'boolean',
			themeable: true,
			description: 'Abbreviate the negative net value (e.g. 1K, 1M).',
		},
		'negative.absoluteValue': {
			type: 'boolean',
			themeable: true,
			description: 'Show absolute (non-negative) negative net values.',
		},
		'negative.active': {
			type: 'boolean',
			themeable: true,
			description: 'Show the negative net value label.',
		},
		'negative.category': {
			type: 'string',
			themeable: true,
			description: 'Column key whose values feed the negative net label.',
		},
		'negative.color': {
			type: 'enum',
			enum: ['black', 'white'],
			themeable: true,
			description: 'Color of the negative net value label.',
		},
		'negative.fontFamily': {
			type: 'font',
			themeable: true,
			description:
				'Font stack for negative net labels (theme.json family picker; new charts only).',
		},
		'negative.fontSize': {
			type: 'number',
			themeable: true,
			description: 'Font size of the negative net value label (px).',
		},
		'negative.fontWeight': {
			type: 'number',
			themeable: true,
			description: 'CSS font-weight of the negative net value label.',
		},
		'negative.labelPositionDX': {
			type: 'number',
			themeable: true,
			description: 'Horizontal nudge for the negative net value label.',
		},
		'negative.labelPositionDY': {
			type: 'number',
			themeable: true,
			description: 'Vertical nudge for the negative net value label.',
		},
		'negative.labelUnit': {
			type: 'string',
			themeable: true,
			description: 'Unit suffix/prefix appended to negative net values.',
		},
		'negative.labelUnitPosition': {
			type: 'enum',
			enum: ['start', 'end'],
			themeable: true,
			description:
				'Whether labelUnit appears before or after negative net values.',
		},
		'negative.margin': {
			type: 'number',
			themeable: true,
			description: 'Margin around the negative net value label (px).',
		},
		'negative.textAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: 'SVG text-anchor for the negative net value label.',
		},
		'negative.toFixedDecimal': {
			type: 'number',
			themeable: true,
			description: 'Decimal places shown on negative net values.',
		},
		'negative.toLocaleString': {
			type: 'boolean',
			themeable: true,
			description:
				'Format negative net values with locale-aware thousands separators.',
		},
		'negative.truncateDecimal': {
			type: 'boolean',
			themeable: true,
			description:
				'Drop trailing zeros after the decimal point on negative net values.',
		},
		'positive.abbreviateValue': {
			type: 'boolean',
			themeable: true,
			description: 'Abbreviate the positive net value (e.g. 1K, 1M).',
		},
		'positive.absoluteValue': {
			type: 'boolean',
			themeable: true,
			description: 'Show absolute (non-negative) positive net values.',
		},
		'positive.active': {
			type: 'boolean',
			themeable: true,
			description: 'Show the positive net value label.',
		},
		'positive.category': {
			type: 'string',
			themeable: true,
			description: 'Column key whose values feed the positive net label.',
		},
		'positive.color': {
			type: 'enum',
			enum: ['black', 'white'],
			themeable: true,
			description: 'Color of the positive net value label.',
		},
		'positive.fontFamily': {
			type: 'font',
			themeable: true,
			description:
				'Font stack for positive net labels (theme.json family picker; new charts only).',
		},
		'positive.fontSize': {
			type: 'number',
			themeable: true,
			description: 'Font size of the positive net value label (px).',
		},
		'positive.fontWeight': {
			type: 'number',
			themeable: true,
			description: 'CSS font-weight of the positive net value label.',
		},
		'positive.labelPositionDX': {
			type: 'number',
			themeable: true,
			description: 'Horizontal nudge for the positive net value label.',
		},
		'positive.labelPositionDY': {
			type: 'number',
			themeable: true,
			description: 'Vertical nudge for the positive net value label.',
		},
		'positive.labelUnit': {
			type: 'string',
			themeable: true,
			description: 'Unit suffix/prefix appended to positive net values.',
		},
		'positive.labelUnitPosition': {
			type: 'enum',
			enum: ['start', 'end'],
			themeable: true,
			description:
				'Whether labelUnit appears before or after positive net values.',
		},
		'positive.margin': {
			type: 'number',
			themeable: true,
			description: 'Margin around the positive net value label (px).',
		},
		'positive.textAnchor': {
			type: 'enum',
			enum: ['start', 'middle', 'end'],
			themeable: true,
			description: 'SVG text-anchor for the positive net value label.',
		},
		'positive.toFixedDecimal': {
			type: 'number',
			themeable: true,
			description: 'Decimal places shown on positive net values.',
		},
		'positive.toLocaleString': {
			type: 'boolean',
			themeable: true,
			description:
				'Format positive net values with locale-aware thousands separators.',
		},
		'positive.truncateDecimal': {
			type: 'boolean',
			themeable: true,
			description:
				'Drop trailing zeros after the decimal point on positive net values.',
		},
	},
	treemap: {
		borderRadius: {
			type: 'number',
			themeable: true,
			description: 'Corner radius for treemap cells (px).',
		},
		labelMinArea: {
			type: 'number',
			themeable: true,
			description: 'Minimum cell area (px²) required to show a label.',
		},
		opacityRange: {
			type: 'numberPair',
			themeable: true,
			description: 'Min/max opacity range when `scaleOpacity` is true.',
		},
		paddingInner: {
			type: 'number',
			themeable: true,
			description: 'Inner padding between leaf cells (px).',
		},
		paddingOuter: {
			type: 'number',
			themeable: true,
			description: 'Outer padding around the treemap boundary (px).',
		},
		rectStroke: {
			type: 'string',
			themeable: true,
			description: 'Border color between treemap cells.',
		},
		rectStrokeWidth: {
			type: 'number',
			themeable: true,
			description: 'Border width between treemap cells (px).',
		},
		scaleOpacity: {
			type: 'boolean',
			themeable: true,
			description: 'Scale cell opacity by value.',
		},
		showValues: {
			type: 'boolean',
			themeable: true,
			description: 'Render the numeric value inside each cell.',
		},
		tile: {
			type: 'enum',
			enum: [
				'squarify',
				'binary',
				'dice',
				'slice',
				'sliceDice',
				'resquarify',
			],
			themeable: true,
			description: "`'binary'`.",
		},
	},
	sankey: {
		linkOpacity: {
			type: 'number',
			themeable: true,
			description: 'Opacity of flow links.',
		},
		nodeAlign: {
			type: 'enum',
			enum: ['justify', 'left', 'right', 'center'],
			themeable: true,
			description: "`'right'`.",
		},
		nodePadding: {
			type: 'number',
			themeable: true,
			description: 'Vertical padding between nodes (px).',
		},
		nodeRadius: {
			type: 'number',
			themeable: true,
			description: 'Corner radius of node rectangles (px).',
		},
		nodeWidth: {
			type: 'number',
			themeable: true,
			description: 'Width of node rectangles (px).',
		},
		sourceKey: {
			type: 'string',
			themeable: true,
			description: 'Data column key for the link source node.',
		},
		targetKey: {
			type: 'string',
			themeable: true,
			description: 'Data column key for the link target node.',
		},
		valueKey: {
			type: 'string',
			themeable: true,
			description: 'Data column key for the link flow value.',
		},
	},
	annotations: {
		active: {
			type: 'boolean',
			themeable: true,
			description: 'Enable/disable annotations.',
		},
		items: {
			type: 'string',
			themeable: false,
			description: 'Array of annotation objects.',
		},
	},
};

export default EDITOR_SCHEMA;
