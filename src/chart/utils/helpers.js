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
	if (!str || str.trim() === '') {
		return [];
	}
	return str
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
		.map(Number)
		.filter((num) => !Number.isNaN(num));
};

export const stringToArray = (str) => {
	if (!str || str.trim() === '') {
		return [];
	}
	return str
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);
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

// use a reducer to create an array of objects with the headers as keys
// and the table data as values
export const formatCellContent = (content, key, scale, groupBreaksCategory) => {
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
 * @returns {string} String with all HTML tags removed
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
 * @returns {string} Default alt text
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
