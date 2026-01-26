// Transform data from table block into json useable for chart builder
export const formattedData = (data, scale, chartType) => {
	const { body, tableHeaders } = data;
	const seriesData = [];
	const scaleData = (d, s) => {
		if (
			'bar' === chartType ||
			'stacked-bar' === chartType ||
			'pie' === chartType ||
			'dot-plot' === chartType
		) {
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

export const getDomain = (min, max, type, scale, axis) => {
	if (Number.isNaN(min) || Number.isNaN(max)) {
		return [0, 100];
	}
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
	// likewise, no domain for a pie chart
	if ('pie' === type) {
		return null;
	}
	if ('time' === scale && 'x' === axis) {
		return [new Date(min, 0), new Date(max, 0)];
	}
	return [parseFloat(min), parseFloat(max)];
};

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

// use a reducer to create an array of objects with the headers as keys
// and the table data as values
export const formatCellContent = (
	content,
	key,
	scale,
	groupBreaksCategory,
	xScale,
	xFormat
) => {
	if ('ordinal' === scale) {
		return content;
	}
	const replaceNonNumeric = (str) => {
		// Replace all non-numeric, non-decimal characters, and negative sign
		str = str.replace(/[^0-9.-]/g, '');

		// if string has no numbers, return empty string
		if (!str.match(/[0-9]/g)) {
			return '';
		}
		// Replace all non-numeric, non-decimal characters, and negative sign
		str = str.replace(/[^0-9.-]/g, '');

		// if string has no numbers, return empty string
		if (!str.match(/[0-9]/g)) {
			return '';
		}

		// Ensure only the first decimal place is kept
		const decimalIndex = str.indexOf('.');
		if (decimalIndex !== -1) {
			str =
				str.slice(0, decimalIndex + 1) +
				str.slice(decimalIndex + 1).replace(/\./g, '');
		}

		// Likewise, ensure only the first negative sign is kept
		const negativeIndex = str.indexOf('-');
		if (negativeIndex !== -1) {
			str =
				str.slice(0, negativeIndex + 1) +
				str.slice(negativeIndex + 1).replace(/-/g, '');
		}

		return str;
	};

	// group breaks category is used to identify the category that the group breaks are applied to
	// if the key is x or groupBreaksCategory, return the content
	if ('x' === key || groupBreaksCategory === key) {
		// If this is the x-axis and we have a time scale, parse the date
		if ('x' === key && 'time' === xScale && xFormat) {
			return parseDateString(content, xFormat);
		}
		return content;
	}
	// TODO: temporary fix for less than signs in table cells.
	// If value is < something, return empty string
	if (content.includes('&lt;') || content.charAt(0) === '<') {
		return '';
	}
	return replaceNonNumeric(content);
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
		'dot-plot': 'dot plot',
		'stacked-bar': 'stacked bar',
		'grouped-bar': 'grouped bar',
		'exploded-bar': 'exploded bar',
		'map-usa': 'map of the United States',
		'map-usa-counties': 'county map of the United States',
		'map-usa-block': 'block map of the United States',
		'map-world': 'world map',
	};

	const readableChartType = chartTypeMap[chartType] || chartType;
	const cleanTitle = metaTitle ? removeHtmlTags(metaTitle) : '';

	if (cleanTitle) {
		return `A ${readableChartType} chart showing that ${cleanTitle}.`;
	}

	return `A ${readableChartType} chart.`;
};
