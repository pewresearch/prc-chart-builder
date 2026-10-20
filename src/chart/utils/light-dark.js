/**
 * Light-mode component of a color value.
 *
 * - `light-dark(#456A83, #739EBA)` → `#456A83` (light component)
 * - `#456A83` → `#456A83`
 * - anything else → returned unchanged (e.g. rgba / named color)
 *
 * @param {string} color Color value.
 * @return {string} Light-mode color.
 */
export function extractHex(color) {
	const value = String(color ?? '').trim();

	const lightDark = value.match(/^light-dark\(\s*([^,]+?)\s*,/i);
	if (lightDark) {
		return lightDark[1].trim();
	}

	return value;
}

/**
 * Dark-mode component from a `light-dark()` string, or the value unchanged.
 *
 * @param {string} color Color value.
 * @return {string} Dark-mode color.
 */
export function extractDarkHex(color) {
	const value = String(color ?? '').trim();

	const lightDark = value.match(/^light-dark\(\s*[^,]+?\s*,\s*(.+?)\s*\)$/i);
	if (lightDark) {
		return lightDark[1].trim();
	}

	return value;
}
