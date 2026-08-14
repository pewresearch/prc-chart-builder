/**
 * Tokens authors can insert into the rich Tooltip Template.
 * Same names as the legacy mustache `format` string.
 */

export const TOOLTIP_TEMPLATE_TOKENS = [
	{ token: '{{row}}', label: 'row' },
	{ token: '{{value}}', label: 'value' },
	{ token: '{{column}}', label: 'column' },
];

const INTERNAL_ROW_KEY_PATTERN = /^__/;
const RESERVED_ROW_KEYS = new Set(['tooltip', 'tooltipHeader']);

/**
 * Whether a flat-data key should appear in the insert-token UI.
 *
 * @param {string} key
 * @return {boolean}
 */
export function isTooltipTemplateDataKey(key) {
	if (typeof key !== 'string' || key.length === 0) {
		return false;
	}
	if (INTERNAL_ROW_KEY_PATTERN.test(key)) {
		return false;
	}
	if (RESERVED_ROW_KEYS.has(key)) {
		return false;
	}
	return true;
}

/**
 * Unique flat-data keys from the current chart table, sorted for the insert UI.
 *
 * @param {Array<Object>|null|undefined} chartData
 * @return {Array<{ token: string, label: string }>}
 */
export function getTooltipTemplateDataTokens(chartData) {
	if (!Array.isArray(chartData) || chartData.length === 0) {
		return [];
	}

	const keys = new Set();
	for (const row of chartData) {
		if (!row || typeof row !== 'object') {
			continue;
		}
		for (const key of Object.keys(row)) {
			if (isTooltipTemplateDataKey(key)) {
				keys.add(key);
			}
		}
	}

	return [...keys]
		.sort((a, b) => a.localeCompare(b))
		.map((key) => ({
			token: `{{${key}}}`,
			label: key,
		}));
}

/**
 * Example values for every token, previewed from the first data row so authors
 * can see what a token resolves to before hovering the chart.
 *
 * `{{row}}` / `{{value}}` / `{{column}}` are virtual: the chart resolves them
 * per hovered point, so the first row's x, its first numeric column value, and
 * that column's header stand in as the preview.
 *
 * @param {Array<Object>|null|undefined} chartData
 * @return {Object<string, string>} Token to example value.
 */
export function getTooltipTokenExamples(chartData) {
	if (!Array.isArray(chartData) || chartData.length === 0) {
		return {};
	}

	const firstRow = chartData.find((row) => row && typeof row === 'object');
	if (!firstRow) {
		return {};
	}

	const examples = {};
	let firstNumericKey = null;

	for (const key of Object.keys(firstRow)) {
		if (!isTooltipTemplateDataKey(key)) {
			continue;
		}
		const value = firstRow[key];
		if (value === null || value === undefined) {
			continue;
		}
		examples[`{{${key}}}`] = String(value);
		if (
			null === firstNumericKey &&
			'x' !== key &&
			/[0-9]/.test(String(value))
		) {
			firstNumericKey = key;
		}
	}

	if (undefined !== firstRow.x && null !== firstRow.x) {
		examples['{{row}}'] = String(firstRow.x);
	}
	if (firstNumericKey) {
		examples['{{value}}'] = String(firstRow[firstNumericKey]);
		examples['{{column}}'] = firstNumericKey;
	}

	return examples;
}

/**
 * Append a token to the current template HTML string.
 *
 * @param {?string} template Current RichText HTML (null when unused).
 * @param {string}  token    Token text, e.g. `{{value}}`.
 * @return {string} Updated template HTML.
 */
export function appendTooltipToken(template, token) {
	return `${template ?? ''}${token}`;
}
