/**
 * Image annotation helpers shared by the canvas, the popover, and the inspector.
 */

export const IMAGE_ANNOTATION_ALLOWED_TYPES = ['image/png', 'image/svg+xml'];

const DEFAULT_SIZE = 100;
const MAX_INITIAL_SIZE = 150;

/**
 * New free-placed image annotation. Media is picked after it is placed.
 *
 * @param {Object} position
 * @param {number} position.x Layout px.
 * @param {number} position.y Layout px.
 * @return {Object} Annotation item.
 */
export function createImageAnnotation({ x, y }) {
	return {
		kind: 'image',
		x,
		y,
		mediaId: 0,
		src: '',
		width: DEFAULT_SIZE,
		height: DEFAULT_SIZE,
		keepAspectRatio: true,
		alt: '',
		textAnchor: 'middle',
		verticalAnchor: 'middle',
		rotation: 0,
		opacity: 1,
		positioningContext: 'chart',
	};
}

/**
 * Annotation fields for a Media Library selection. Large images shrink to fit
 * a 150px box so they do not cover the chart; small ones keep natural size.
 *
 * @param {Object} media     MediaUpload selection.
 * @param {Object} [current] Current annotation (keeps alt when the attachment has none).
 * @return {Object} Partial annotation update.
 */
export function getImageAnnotationFromMedia(media, current = {}) {
	const naturalWidth = Number(media?.width) || 0;
	const naturalHeight = Number(media?.height) || 0;

	let width = DEFAULT_SIZE;
	let height = DEFAULT_SIZE;
	if (naturalWidth > 0 && naturalHeight > 0) {
		const scale = Math.min(
			1,
			MAX_INITIAL_SIZE / Math.max(naturalWidth, naturalHeight)
		);
		width = Math.round(naturalWidth * scale);
		height = Math.round(naturalHeight * scale);
	}

	return {
		mediaId: media?.id ?? 0,
		src: media?.url ?? '',
		width,
		height,
		alt: media?.alt || current.alt || '',
	};
}

/**
 * Size update for one side. With the aspect lock on (default), the other side
 * follows the current width:height ratio.
 *
 * @param {Object}           annotation Current annotation.
 * @param {'width'|'height'} side
 * @param {number|string}    value      New size in layout px.
 * @return {Object} Partial annotation update (empty when the value is invalid).
 */
export function resizeImageAnnotation(annotation, side, value) {
	const next = Math.round(Number(value));
	if (value === '' || !Number.isFinite(next) || next <= 0) {
		return {};
	}
	const width = Number(annotation?.width) || DEFAULT_SIZE;
	const height = Number(annotation?.height) || DEFAULT_SIZE;
	if (annotation?.keepAspectRatio === false) {
		return { [side]: next };
	}
	if (side === 'width') {
		return { width: next, height: Math.round((next * height) / width) };
	}
	return { width: Math.round((next * width) / height), height: next };
}
