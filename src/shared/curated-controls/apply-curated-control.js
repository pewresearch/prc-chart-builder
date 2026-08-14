/**
 * Immutably set a nested value on chart attributes by dot path (or key array).
 * This is the single seam every curated control writes through, keeping the
 * control → attribute mapping declarative and easy to test.
 *
 * @param {Object}          attributes Chart attributes to patch.
 * @param {string|string[]} path       Dot path (e.g. `layout.padding.top`).
 * @param {*}               value      New value to assign at the path.
 * @return {Object} A new attributes object with the value applied.
 */
export function applyCuratedControl(attributes, path, value) {
	const keys = Array.isArray(path) ? path : path.split('.');
	if (keys.length === 0) {
		return attributes;
	}

	const [head, ...rest] = keys;
	if (rest.length === 0) {
		return { ...attributes, [head]: value };
	}

	return {
		...attributes,
		[head]: applyCuratedControl(attributes?.[head] ?? {}, rest, value),
	};
}
