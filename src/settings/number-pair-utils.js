/**
 * @param {unknown} shippedValue
 * @return {[number, number]}
 */
export function defaultNumberPair(shippedValue) {
	if (
		Array.isArray(shippedValue) &&
		shippedValue.length >= 2 &&
		typeof shippedValue[0] === 'number' &&
		typeof shippedValue[1] === 'number'
	) {
		return [shippedValue[0], shippedValue[1]];
	}

	return [0, 100];
}

/**
 * @param {unknown} value
 * @return {string}
 */
export function formatNumberPairValue(value) {
	if (!Array.isArray(value) || value.length < 2) {
		return '';
	}

	return `[${value[0]}, ${value[1]}]`;
}

/**
 * Build the next stored pair from raw min/max inputs and shipped defaults.
 *
 * @param {string} minRaw
 * @param {string} maxRaw
 * @param {[number, number]} shipped
 * @return {number[]|undefined}
 */
export function parseNumberPairInput(minRaw, maxRaw, shipped) {
	const minEmpty = minRaw === '';
	const maxEmpty = maxRaw === '';

	if (minEmpty && maxEmpty) {
		return undefined;
	}

	const min = minEmpty ? shipped[0] : Number(minRaw);
	const max = maxEmpty ? shipped[1] : Number(maxRaw);

	if (Number.isNaN(min) || Number.isNaN(max)) {
		return undefined;
	}

	return [min, max];
}
