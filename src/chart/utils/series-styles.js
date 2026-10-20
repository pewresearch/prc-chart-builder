/**
 * Writes into the `seriesStyles` attribute, keyed by category name.
 *
 * Assignment is by name, so two categories may hold the same hex and a
 * reorder never moves a fill onto a different series.
 */

/**
 * Set an author-picked fill on one category.
 *
 * @param {Object} seriesStyles Current category styles.
 * @param {string} category     Color domain key.
 * @param {string} hex          Picked color.
 * @return {Object} Next category styles.
 */
export function setCategoryFill(seriesStyles, category, hex) {
	return {
		...seriesStyles,
		[category]: {
			...seriesStyles?.[category],
			fill: hex,
			fillSource: 'custom',
		},
	};
}

/**
 * Hand a category back to the palette.
 *
 * @param {Object} seriesStyles Current category styles.
 * @param {string} category     Color domain key.
 * @return {Object} Next category styles.
 */
export function clearCategoryFill(seriesStyles, category) {
	const next = { ...seriesStyles };
	const { fill, fillSource, ...rest } = next[category] ?? {};

	if (Object.keys(rest).length === 0) {
		delete next[category];
		return next;
	}

	next[category] = rest;
	return next;
}

/**
 * Set one style field on a category. A missing field falls through to the chart default.
 *
 * @param {Object} seriesStyles Current category styles.
 * @param {string} category     Color domain key.
 * @param {string} field        Style field name.
 * @param {*}      value        Field value.
 * @return {Object} Next category styles.
 */
export function setCategoryStyleField(seriesStyles, category, field, value) {
	return {
		...seriesStyles,
		[category]: {
			...seriesStyles?.[category],
			[field]: value,
		},
	};
}

/**
 * Drop every style on a category so the chart defaults paint again.
 *
 * @param {Object} seriesStyles Current category styles.
 * @param {string} category     Color domain key.
 * @return {Object} Next category styles.
 */
export function clearCategoryStyles(seriesStyles, category) {
	const next = { ...seriesStyles };
	delete next[category];
	return next;
}

/**
 * Drop one style field so the chart default paints again.
 *
 * @param {Object} seriesStyles Current category styles.
 * @param {string} category     Color domain key.
 * @param {string} field        Style field name.
 * @return {Object} Next category styles.
 */
export function clearCategoryStyleField(seriesStyles, category, field) {
	const next = { ...seriesStyles };
	const current = { ...next[category] };
	delete current[field];

	if (Object.keys(current).length === 0) {
		delete next[category];
		return next;
	}

	next[category] = current;
	return next;
}
