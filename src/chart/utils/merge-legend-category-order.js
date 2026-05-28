/**
 * Merge a persisted legend order with currently available categories.
 * - Preserves relative order of categories present in both
 * - Drops categories no longer available
 * - Appends newly available categories at the end (default order)
 *
 * @param {string[]} persistedOrder      Saved legend.categories order.
 * @param {string[]} availableCategories Current legend category set.
 * @return {string[]} Merged category order.
 */
export function mergeLegendCategoryOrder(
	persistedOrder = [],
	availableCategories = []
) {
	if (!availableCategories.length) {
		return persistedOrder || [];
	}

	const availableSet = new Set(availableCategories);
	const merged = (persistedOrder || []).filter((cat) =>
		availableSet.has(cat)
	);

	for (const cat of availableCategories) {
		if (!merged.includes(cat)) {
			merged.push(cat);
		}
	}

	return merged;
}

/**
 * Returns true when persisted and available lists differ in length or order.
 *
 * @param {string[]} persistedOrder
 * @param {string[]} availableCategories
 * @return {boolean} True when persisted order needs merging with available categories.
 */
export function isLegendCategoryOrderStale(
	persistedOrder,
	availableCategories
) {
	if (!persistedOrder?.length) {
		return false;
	}

	const merged = mergeLegendCategoryOrder(
		persistedOrder,
		availableCategories
	);

	return (
		merged.length !== persistedOrder.length ||
		merged.some((cat, index) => cat !== persistedOrder[index])
	);
}
