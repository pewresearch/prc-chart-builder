/**
 * CSV export utilities for chart data downloads.
 */

export const UTF8_BOM = '\uFEFF';

/** @type {Array<[string, string]>} */
const HTML_ENTITY_REPLACEMENTS = [
	['&lt;', '<'],
	['&gt;', '>'],
	['&quot;', '"'],
	['&#39;', "'"],
	['&apos;', "'"],
	['&nbsp;', '\u00A0'],
	['&amp;', '&'],
];

/**
 * Decode a subset of HTML entities without DOM innerHTML.
 *
 * @param {string} value Raw string.
 * @return {string}
 */
function decodeHtmlEntities(value) {
	let decoded = value;
	for (const [entity, char] of HTML_ENTITY_REPLACEMENTS) {
		decoded = decoded.split(entity).join(char);
	}
	return decoded;
}

/**
 * Strip real HTML element markup (RichText), not bare "<" in prose.
 *
 * Mirrors WordPress wp_strip_all_tags.
 *
 * @param {string} value Raw string.
 * @return {string}
 */
function stripHtmlTags(value) {
	return value.replace(/<\/?[a-zA-Z][^>]*>/g, '');
}

/**
 * Remove zero-width and stray BOM characters from cell text.
 *
 * @param {string} value Plain text.
 * @return {string}
 */
function stripInvisibleCharacters(value) {
	return value.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * Prepare field text for CSV: decode entities, strip RichText tags.
 *
 * @param {string|undefined|null} str Raw cell or metadata value.
 * @return {string} Plain text ready for RFC 4180 encoding.
 */
function prepareCsvText(str) {
	if (undefined === str || null === str) {
		return '';
	}

	return stripInvisibleCharacters(
		stripHtmlTags(decodeHtmlEntities(String(str)))
	);
}

/**
 * RFC 4180-encode a prepared CSV field value.
 *
 * @param {string} value Prepared plain text.
 * @return {string}
 */
function encodeCsvField(value) {
	if (
		value.indexOf(',') > -1 ||
		value.indexOf('"') > -1 ||
		value.indexOf('\n') > -1 ||
		value.indexOf('\r') > -1
	) {
		return `"${value.replace(/"/g, '""')}"`;
	}

	return value;
}

/**
 * Strip HTML tags and RFC 4180-encode a CSV field value.
 *
 * @param {string|undefined|null} str Raw cell or metadata value.
 * @return {string} Sanitized field value.
 */
function sanitizeCsvField(str) {
	return encodeCsvField(prepareCsvText(str));
}

/**
 * Convert array of arrays to formatted CSV, with optional metadata.
 *
 * @param {Array[]|string} objArray   Array of rows (or JSON string).
 * @param {Object}         [metadata] Optional { title, subtitle, note, source, tag }.
 * @return {string|false} CSV string or false if empty/invalid.
 */
export function arrayToCSV(objArray, metadata) {
	if (undefined === objArray || objArray.length === 0) {
		return false;
	}

	const array =
		'object' !== typeof objArray ? JSON.parse(objArray) : objArray;

	let str = '';
	if (undefined !== metadata) {
		str += `${sanitizeCsvField(metadata.title)}\n${sanitizeCsvField(metadata.subtitle)}\n\n`;
	}

	for (let i = 0; i < array.length; i += 1) {
		let line = '';
		for (let j = 0; j < array[i].length; j += 1) {
			if (j > 0) {
				line += ',';
			}
			line += sanitizeCsvField(array[i][j]);
		}
		str += `${line}\n`;
	}

	if (undefined !== metadata) {
		str += `\n${sanitizeCsvField(metadata.note)}\n${sanitizeCsvField(metadata.source)}\n${sanitizeCsvField(metadata.tag)}`;
	}

	return str;
}
