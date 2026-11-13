/**
 * Zoom levels for the chart preview, in percent.
 */
export const ZOOM_MIN = 25;
export const ZOOM_MAX = 200;
export const ZOOM_DEFAULT = 100;
const ZOOM_STEP = 25;

/**
 * @param {number} zoom Zoom in percent.
 * @return {number} Zoom held between ZOOM_MIN and ZOOM_MAX.
 */
export function clampZoom(zoom) {
	return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

/**
 * @param {string} value Text typed in the zoom field, e.g. `80` or `80%`.
 * @return {number|null} Zoom in percent, or null when the text is not a number.
 */
export function parseZoomInput(value) {
	const text = String(value).trim().replace(/%$/, '');
	if (text === '') {
		return null;
	}
	const zoom = Number(text);
	return Number.isFinite(zoom) ? clampZoom(Math.round(zoom)) : null;
}

/**
 * Next zoom for the plus or minus button. A typed value between steps moves
 * to the nearest step in that direction.
 *
 * @param {number} zoom      Current zoom in percent.
 * @param {1|-1}   direction 1 to zoom in, -1 to zoom out.
 * @return {number} Next zoom in percent.
 */
export function stepZoom(zoom, direction) {
	const next =
		direction > 0
			? Math.floor(zoom / ZOOM_STEP) * ZOOM_STEP + ZOOM_STEP
			: Math.ceil(zoom / ZOOM_STEP) * ZOOM_STEP - ZOOM_STEP;
	return clampZoom(next);
}
