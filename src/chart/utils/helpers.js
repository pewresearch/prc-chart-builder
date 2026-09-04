import { FORMATTED_DATA_PASSTHROUGH_TYPES } from './chart-types';

/**
 * Whether an axis domain should be inferred from data.
 * Keep this local — helpers.js is pulled into view.js (script module), which
 * cannot import the @prc/charting-utilities barrel (React hooks).
 *
 * @param {unknown} domain
 * @return {boolean} True when the domain should be inferred from data.
 */
export function isAutoAxisDomain(domain) {
	if (domain === null || domain === undefined) {
		return true;
	}
	if (!Array.isArray(domain) || domain.length < 2) {
		return true;
	}
	const [min, max] = domain;
	if (min instanceof Date && max instanceof Date) {
		return Number.isNaN(min.getTime()) || Number.isNaN(max.getTime());
	}
	const minNum =
		min === null || min === undefined || min === '' ? NaN : Number(min);
	const maxNum =
		max === null || max === undefined || max === '' ? NaN : Number(max);
	return !Number.isFinite(minNum) || !Number.isFinite(maxNum);
}

/**
 * @param {unknown} domain
 * @return {boolean} True when the domain carries an explicit min/max pair.
 */
export function hasExplicitAxisDomain(domain) {
	return !isAutoAxisDomain(domain);
}

// Transform data from table block into json useable for chart builder
export const formattedData = (data, scale, chartType) => {
	const { body, tableHeaders } = data;
	const seriesData = [];
	const scaleData = (d, s) => {
		if (FORMATTED_DATA_PASSTHROUGH_TYPES.includes(chartType)) {
			return d;
		}
		if ('time' === s) {
			return new Date(d);
		}
		return parseFloat(d);
	};
	for (let i = 1; i < tableHeaders.length; i++) {
		const series = body
			.filter(
				(row) =>
					!Number.isNaN(
						parseFloat(row.cells[i].content.replace(/[^0-9.]/g, ''))
					)
			)
			.map((row) => ({
				x: scaleData(row.cells[0].content, scale),
				y: parseFloat(row.cells[i].content.replace(/[^0-9.]/g, '')),
				category: tableHeaders[i],
				// yLabel: `${parseFloat(row.cells[i].content)}`,
			}));
		seriesData.push(series);
	}
	return seriesData;
};

export const stringToArrayOfNums = (str) => {
	// Handle null/undefined
	if (!str) {
		return [];
	}

	// If already an array, process it
	if (Array.isArray(str)) {
		return str
			.map((item) => {
				const num =
					typeof item === 'string'
						? Number(item.trim())
						: Number(item);
				return num;
			})
			.filter((num) => !Number.isNaN(num));
	}

	// If it's a string, parse it
	if (typeof str === 'string') {
		const trimmed = str.trim();
		if (trimmed === '') {
			return [];
		}
		return trimmed
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.length > 0)
			.map(Number)
			.filter((num) => !Number.isNaN(num));
	}

	// Unknown type, return empty array
	return [];
};

export const stringToArray = (str) => {
	// Handle null/undefined
	if (!str) {
		return [];
	}

	// If already an array, return it after trimming strings
	if (Array.isArray(str)) {
		return str
			.map((item) =>
				typeof item === 'string' ? item.trim() : String(item)
			)
			.filter((item) => item.length > 0);
	}

	// If it's a string, parse it
	if (typeof str === 'string') {
		const trimmed = str.trim();
		if (trimmed === '') {
			return [];
		}
		return trimmed
			.split(',')
			.map((item) => item.trim())
			.filter((item) => item.length > 0);
	}

	// Unknown type, return empty array
	return [];
};

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Convert an author-set time-domain bound to a Date, or null.
 *
 * Bare numbers (and numeric strings) are legacy data, not intent: renderers
 * before 2026 ignored every stored time domain, so pairs persisted by old
 * charts ([0, 100] defaults, [2000, 2020] template years) must keep
 * inferring from data. The editor persists explicit time domains as ISO
 * `YYYY-MM-DD` strings, parsed as LOCAL time to avoid the UTC-midnight
 * year drift of `new Date('2000-01-01')`.
 *
 * @param {unknown} value Stored domain bound.
 * @return {Date|null} Date when explicitly author-set, otherwise null.
 */
function toExplicitTimeDomainDate(value) {
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		if (Number.isFinite(Number(value))) {
			return null;
		}
		const isoMatch = ISO_DATE_PATTERN.exec(value.trim());
		if (isoMatch) {
			const date = new Date(
				Number(isoMatch[1]),
				Number(isoMatch[2]) - 1,
				Number(isoMatch[3])
			);
			return Number.isNaN(date.getTime()) ? null : date;
		}
		const date = new Date(value);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	return null;
}

/**
 * Scale-aware "is this domain auto?". On time scales, bare numeric pairs are
 * legacy data (old renderers ignored them), so only Date / date-string pairs
 * count as explicit.
 *
 * @param {unknown} domain Stored domain value.
 * @param {string}  scale  Axis scale ('linear', 'time', ...).
 * @return {boolean} True when the domain should be inferred from data.
 */
export function isAutoAxisDomainForScale(domain, scale) {
	if ('time' === scale) {
		if (!Array.isArray(domain) || domain.length < 2) {
			return true;
		}
		return (
			!toExplicitTimeDomainDate(domain[0]) ||
			!toExplicitTimeDomainDate(domain[1])
		);
	}
	return isAutoAxisDomain(domain);
}

/**
 * Year to show in editor number controls for a stored time-domain bound.
 *
 * @param {unknown} value Stored bound (legacy number, ISO string, or Date).
 * @return {number|undefined} Calendar year, or undefined when unreadable.
 */
export function timeDomainBoundToYear(value) {
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.getFullYear();
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const asNumber = Number(value);
		if (Number.isFinite(asNumber)) {
			return asNumber;
		}
		const date = toExplicitTimeDomainDate(value);
		if (date) {
			return date.getFullYear();
		}
	}
	return undefined;
}

/**
 * Persisted representation of a year entered in editor time-domain controls.
 * ISO strings mark the bound as author-set, distinguishing it from legacy
 * numeric pairs that must stay auto.
 *
 * @param {unknown} year Year from a NumberControl.
 * @return {string|null} `YYYY-01-01`, or null when the input is not a year.
 */
export function yearToTimeDomainBound(year) {
	if (year === null || year === undefined || year === '') {
		return null;
	}
	const yearNum = Number(year);
	if (!Number.isFinite(yearNum)) {
		return null;
	}
	return `${String(Math.trunc(yearNum)).padStart(4, '0')}-01-01`;
}

/**
 * Next `domain` attribute after an editor changes one bound in an axis
 * domain control. Carries the sibling bound from the current explicit
 * domain — or from the inferred data domain when the current domain is
 * auto — so a single edit always yields a complete explicit pair. On time
 * scales both bounds persist as ISO strings (the author-intent marker).
 *
 * @param {Object}     args
 * @param {number}     args.editedIndex    Which bound changed (0 = min, 1 = max).
 * @param {unknown}    args.editedValue    Raw control value (a year on time scales).
 * @param {unknown}    args.currentDomain  Stored domain attribute.
 * @param {?unknown[]} args.inferredDomain Domain inferred from data, if available.
 * @param {string}     args.scale          Axis scale ('linear', 'time', ...).
 * @return {Array} Two-element domain ready to persist.
 */
export function buildEditedAxisDomain({
	editedIndex,
	editedValue,
	currentDomain,
	inferredDomain,
	scale,
}) {
	const isTime = 'time' === scale;
	const siblingIndex = 0 === editedIndex ? 1 : 0;
	const siblingSource = isAutoAxisDomainForScale(currentDomain, scale)
		? inferredDomain?.[siblingIndex]
		: currentDomain?.[siblingIndex];
	const sibling = isTime
		? yearToTimeDomainBound(timeDomainBoundToYear(siblingSource))
		: (siblingSource ?? (0 === siblingIndex ? 0 : 100));
	const edited = isTime
		? yearToTimeDomainBound(editedValue)
		: formatNum(editedValue, 'integer');
	return 0 === editedIndex ? [edited, sibling] : [sibling, edited];
}

export const getDomain = (min, max, type, scale, axis) => {
	// x axis is a bit of a misnomer for bar types. It refers exclusively to the dependent axis.
	if ('bar' === type && 'x' === axis) {
		return null;
	}
	if ('stacked-bar' === type && 'x' === axis) {
		return null;
	}
	if ('dot-plot' === type && 'x' === axis) {
		return null;
	}
	// likewise, no domain for a pie, waffle, or heat map table chart
	if ('pie' === type || 'waffle' === type || 'heat-map-table' === type) {
		return null;
	}
	if ('time' === scale && 'x' === axis) {
		const start = toExplicitTimeDomainDate(min);
		const end = toExplicitTimeDomainDate(max);
		return start && end ? [start, end] : null;
	}
	if (Number.isNaN(Number(min)) || Number.isNaN(Number(max))) {
		return null;
	}
	return [parseFloat(min), parseFloat(max)];
};

/**
 * Read bounds from a modern `[min, max]` domain attribute.
 *
 * Legacy object-form domains (`{ min, max }`) are intentionally ignored.
 * Scale resolvers historically required an array, so those objects never
 * affected the rendered axis — charts inferred from data. Promoting
 * `{ min: 2000, max: 2020 }` (common on published line charts) into Dates
 * locks every time-scale chart to that false default.
 *
 * @param {unknown} domain
 * @return {[unknown, unknown]} Min and max domain bounds.
 */
export const getDomainBounds = (domain) => {
	if (Array.isArray(domain)) {
		return [domain[0], domain[1]];
	}
	return [undefined, undefined];
};

/**
 * Infer the axis domain the chart would use from table data (for editor hints).
 *
 * @param {Object}                    chartAttributes Block attributes.
 * @param {'independent'|'dependent'} axis            Which axis to infer.
 * @return {[number, number]|null} Min/max when data supports inference.
 */
export function getInferredAxisDomainFromData(chartAttributes, axis) {
	const io = chartAttributes?.io ?? {};
	const chartData = io.chartData ?? [];
	if (!Array.isArray(chartData) || chartData.length === 0) {
		return null;
	}

	const dataRender = chartAttributes?.dataRender ?? {};
	const independentAxis = chartAttributes?.independentAxis ?? {};
	const dependentAxis = chartAttributes?.dependentAxis ?? {};

	if (axis === 'independent') {
		const xKey = dataRender.x ?? 'x';
		const scale = dataRender.xScale ?? independentAxis.scale ?? 'linear';
		const values = chartData
			.map((row) => row?.[xKey])
			.filter(
				(value) => value !== null && value !== undefined && value !== ''
			)
			.map((value) => {
				if (scale === 'time') {
					const asNumber = Number(value);
					if (
						Number.isFinite(asNumber) &&
						Math.abs(asNumber) < 10000
					) {
						return asNumber;
					}
					const date = new Date(value);
					return Number.isNaN(date.getTime())
						? NaN
						: date.getFullYear();
				}
				return Number(value);
			})
			.filter((value) => Number.isFinite(value));

		if (values.length === 0) {
			return null;
		}

		return [Math.min(...values), Math.max(...values)];
	}

	const categories = dataRender.categories ?? [];
	if (categories.length === 0) {
		return null;
	}

	let min = Infinity;
	let max = -Infinity;
	chartData.forEach((row) => {
		categories.forEach((category) => {
			const value = Number(row?.[category]);
			if (Number.isFinite(value)) {
				min = Math.min(min, value);
				max = Math.max(max, value);
			}
		});
	});

	if (!Number.isFinite(min) || !Number.isFinite(max)) {
		return null;
	}

	if (dependentAxis.showZero && min > 0) {
		min = 0;
	}

	return [min, max];
}

export const getTicks = (ticks) => {
	// Return ticks as-is, parsing will be handled by charting-utilities
	return ticks;
};

export const formatNum = (num, output) => {
	if ('string' === typeof num && 'integer' === output) {
		return parseInt(num, 10);
	}
	if ('string' === typeof num && 'float' === output) {
		return parseFloat(num);
	}
	return num;
};

/**
 * Read a number input that may legitimately be left empty.
 *
 * An empty input means "off", which is not the same as 0 — storing 0 would
 * keep the option switched on with a floor that nothing falls below.
 *
 * @param {string|number|null|undefined} num
 * @return {number|null} The number, or null when the input is empty.
 */
export const formatOptionalNum = (num) => {
	if ('' === num || null === num || undefined === num) {
		return null;
	}
	const parsed = parseFloat(num);
	return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Parse a date string according to a specified format
 * @param {string} dateStr - The date string to parse
 * @param {string} format  - The format of the date string (e.g., 'MM/DD/YYYY', 'YYYY-MM-DD')
 * @return {Date|string} Parsed Date object or original string if parsing fails
 */
export const parseDateString = (dateStr, format) => {
	if (!dateStr || !format) {
		return dateStr;
	}

	const str = String(dateStr).trim();

	// Format mapping for different date formats
	const formatParsers = {
		YYYY: (s) => {
			const year = parseInt(s, 10);
			return !isNaN(year) ? new Date(year, 0, 1) : null;
		},
		'YYYY-MM': (s) => {
			const parts = s.split('-');
			if (parts.length === 2) {
				const year = parseInt(parts[0], 10);
				const month = parseInt(parts[1], 10) - 1;
				return !isNaN(year) && !isNaN(month)
					? new Date(year, month, 1)
					: null;
			}
			return null;
		},
		'YYYY-MM-DD': (s) => {
			const parts = s.split('-');
			if (parts.length === 3) {
				const year = parseInt(parts[0], 10);
				const month = parseInt(parts[1], 10) - 1;
				const day = parseInt(parts[2], 10);
				return !isNaN(year) && !isNaN(month) && !isNaN(day)
					? new Date(year, month, day)
					: null;
			}
			return null;
		},
		'MM-YYYY': (s) => {
			const parts = s.split('-');
			if (parts.length === 2) {
				const month = parseInt(parts[0], 10) - 1;
				const year = parseInt(parts[1], 10);
				return !isNaN(year) && !isNaN(month)
					? new Date(year, month, 1)
					: null;
			}
			return null;
		},
		'MM-DD-YYYY': (s) => {
			const parts = s.split('-');
			if (parts.length === 3) {
				const month = parseInt(parts[0], 10) - 1;
				const day = parseInt(parts[1], 10);
				const year = parseInt(parts[2], 10);
				return !isNaN(year) && !isNaN(month) && !isNaN(day)
					? new Date(year, month, day)
					: null;
			}
			return null;
		},
		'DD-MM-YYYY': (s) => {
			const parts = s.split('-');
			if (parts.length === 3) {
				const day = parseInt(parts[0], 10);
				const month = parseInt(parts[1], 10) - 1;
				const year = parseInt(parts[2], 10);
				return !isNaN(year) && !isNaN(month) && !isNaN(day)
					? new Date(year, month, day)
					: null;
			}
			return null;
		},
		'MM/DD/YYYY': (s) => {
			const parts = s.split('/');
			if (parts.length === 3) {
				const month = parseInt(parts[0], 10) - 1;
				const day = parseInt(parts[1], 10);
				const year = parseInt(parts[2], 10);
				return !isNaN(year) && !isNaN(month) && !isNaN(day)
					? new Date(year, month, day)
					: null;
			}
			return null;
		},
		'MM/YYYY': (s) => {
			const parts = s.split('/');
			if (parts.length === 2) {
				const month = parseInt(parts[0], 10) - 1;
				const year = parseInt(parts[1], 10);
				return !isNaN(year) && !isNaN(month)
					? new Date(year, month, 1)
					: null;
			}
			return null;
		},
		'DD/MM/YYYY': (s) => {
			const parts = s.split('/');
			if (parts.length === 3) {
				const day = parseInt(parts[0], 10);
				const month = parseInt(parts[1], 10) - 1;
				const year = parseInt(parts[2], 10);
				return !isNaN(year) && !isNaN(month) && !isNaN(day)
					? new Date(year, month, day)
					: null;
			}
			return null;
		},
	};

	const parser = formatParsers[format];
	if (parser) {
		const parsed = parser(str);
		if (parsed && !isNaN(parsed.getTime())) {
			return parsed;
		}
	}

	// Fallback: try native Date parsing
	const fallbackDate = new Date(str);
	if (!isNaN(fallbackDate.getTime())) {
		return fallbackDate;
	}

	// If all parsing fails, return original string
	return str;
};

/**
 * Strip non-numeric characters while preserving decimal precision (e.g. "1.50").
 *
 * @param {string} str Raw cell text.
 * @return {string} Sanitized numeric string, or empty when no digits remain.
 */
export const sanitizeNumericString = (str) => {
	let value = String(str).replace(/[^0-9.-]/g, '');

	if (!value.match(/[0-9]/g)) {
		return '';
	}

	const decimalIndex = value.indexOf('.');
	if (decimalIndex !== -1) {
		value =
			value.slice(0, decimalIndex + 1) +
			value.slice(decimalIndex + 1).replace(/\./g, '');
	}

	const negativeIndex = value.indexOf('-');
	if (negativeIndex !== -1) {
		value =
			value.slice(0, negativeIndex + 1) +
			value.slice(negativeIndex + 1).replace(/-/g, '');
	}

	return value;
};

// use a reducer to create an array of objects with the headers as keys
// and the table data as values
export const formatCellContent = (
	content,
	key,
	scale,
	groupBreaksCategory,
	xScale,
	xFormat,
	preserveStringKeys = []
) => {
	if ('ordinal' === scale) {
		return content;
	}

	// group breaks category is used to identify the category that the group breaks are applied to
	// if the key is x or groupBreaksCategory, return the content
	if ('x' === key || groupBreaksCategory === key) {
		// If this is the x-axis and we have a time scale, parse the date
		if ('x' === key && 'time' === xScale && xFormat) {
			return parseDateString(content, xFormat);
		}
		return content;
	}
	// Preserve string values for specified keys (e.g. Sankey 'target' column)
	if (Array.isArray(preserveStringKeys) && preserveStringKeys.includes(key)) {
		return content;
	}
	// TODO: temporary fix for less than signs in table cells.
	// If value is < something, return empty string
	if (content.includes('&lt;') || content.charAt(0) === '<') {
		return '';
	}
	return sanitizeNumericString(content);
};

/**
 * Type-aware cell content parser that uses columnMeta when available.
 *
 * When the table's columnMeta declares a specific data type for a column,
 * this function uses it directly instead of guessing. Falls back to the
 * existing formatCellContent logic for 'auto' or absent metadata.
 *
 * @param {string}   content             Raw cell HTML/text
 * @param {string}   key                 Header key ('x' for first column, header label otherwise)
 * @param {Object[]} columnMeta          The table's columnMeta array
 * @param {number}   colIndex            0-based column index in the table
 * @param {string}   scale               mapScale value
 * @param {string}   groupBreaksCategory Active group breaks category
 * @param {string}   xScale              Independent axis scale ('time', 'ordinal', etc.)
 * @param {string}   xFormat             Date format string
 * @param {string[]} preserveStringKeys  Keys that should stay as strings
 * @return {*} Parsed value
 */
export const formatCellContentTyped = (
	content,
	key,
	columnMeta,
	colIndex,
	scale,
	groupBreaksCategory,
	xScale,
	xFormat,
	preserveStringKeys = []
) => {
	if (Array.isArray(preserveStringKeys) && preserveStringKeys.includes(key)) {
		return content;
	}

	const meta = columnMeta?.[colIndex];
	const dataType = meta?.dataType;

	if (dataType && dataType !== 'auto') {
		switch (dataType) {
			case 'number':
			case 'currency':
			case 'percentage': {
				const stripped = sanitizeNumericString(content);
				if (!stripped) {
					return '';
				}
				const num = parseFloat(stripped);
				return Number.isNaN(num) ? content : stripped;
			}
			case 'date':
				return parseDateString(content, xFormat);
			case 'fips':
			case 'iso3alpha':
			case 'iso3numeric':
			case 'text':
			case 'url':
				return content;
			default:
				break;
		}
	}

	return formatCellContent(
		content,
		key,
		scale,
		groupBreaksCategory,
		xScale,
		xFormat,
		preserveStringKeys
	);
};

/**
 * Safely remove all HTML tags from input string by iteratively applying regex until no tags remain
 *
 * @param {string} input - String potentially containing HTML tags
 * @return {string} String with all HTML tags removed
 */
function removeHtmlTags(input) {
	let previous;
	do {
		previous = input;
		input = input.replace(/<[^>]*>/g, '');
	} while (input !== previous);
	return input;
}

/**
 * Generate default alt text based on chart type and title
 *
 * @param {string} chartType - Type of chart (bar, line, pie, etc.)
 * @param {string} metaTitle - Chart title
 * @return {string} Default alt text
 */
export const generateDefaultAltText = (chartType, metaTitle) => {
	// Convert chart type to readable format
	const chartTypeMap = {
		bar: 'bar',
		'diverging-bar': 'diverging bar',
		line: 'line',
		area: 'area',
		'stacked-area': 'stacked area',
		scatter: 'scatter',
		pie: 'pie',
		waffle: 'waffle',
		'dot-plot': 'dot plot',
		'stacked-bar': 'stacked bar',
		'grouped-bar': 'grouped bar',
		'exploded-bar': 'exploded bar',
		'map-usa': 'map of the United States',
		'map-usa-counties': 'county map of the United States',
		'map-usa-block': 'block map of the United States',
		'map-usa-hex': 'hex map of the United States',
		'map-world': 'world map',
	};

	const readableChartType = chartTypeMap[chartType] || chartType;
	const cleanTitle = metaTitle ? removeHtmlTags(metaTitle) : '';

	if (cleanTitle) {
		return `A ${readableChartType} chart showing that ${cleanTitle}.`;
	}

	return `A ${readableChartType} chart.`;
};
