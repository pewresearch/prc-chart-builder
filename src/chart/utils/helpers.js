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

export const stringToArrayOfNums = (str) =>
	str
		.split(',')
		.map(Number)
		.filter((num) => !Number.isNaN(num));

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

export const getTicks = (ticks, scale) => {
	if ('time' === scale) {
		return ticks.map((tick) => new Date(`${tick}`));
	}
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
export const formatCellContent = (content, key, scale) => {
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

	if ('x' === key) {
		return content;
	}
	// TODO: temporary fix for less than signs in table cells.
	// If value is < something, return empty string
	if (content.includes('&lt;') || content.charAt(0) === '<') {
		return '';
	}
	return replaceNonNumeric(content);
};
