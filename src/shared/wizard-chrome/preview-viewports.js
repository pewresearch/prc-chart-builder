/**
 * Canvas widths for the Preview Chart viewport toggle, and the CSS custom
 * properties that apply them to the preview pane. Kept free of component
 * imports so the mapping can be unit tested on its own.
 */

/**
 * Horizontal padding of the preview card, which sits between the pane's canvas
 * width and the width the chart actually gets. Mirrors the `padding: 16px` on
 * `.wp-block-prc-chart-builder-controller` in controller/style.scss.
 */
export const PREVIEW_CARD_PADDING = 32;

/** Narrowest canvas worth previewing. */
export const PREVIEW_MIN_WIDTH = 240;

/** One px below Gutenberg's mobile→tablet (480) and tablet→desktop (782) thresholds. */
export const PREVIEW_VIEWPORT_WIDTHS = {
	desktop: null,
	tablet: 781,
	mobile: 479,
};

/**
 * Every viewport resolves to a definite width. A shrink-to-fit card would
 * settle at whatever the chart last rendered, which caps the preview at the
 * pane width and leaves wide charts unable to reach their authored size.
 *
 * @param {string}      viewport      `'desktop'` | `'tablet'` | `'mobile'`.
 * @param {number|null} [customWidth] Hand-picked canvas width, if any.
 * @param {number|null} [fullWidth]   Canvas width that renders the chart at
 *                                    its authored `layout.width`; desktop.
 * @return {Object} Inline style for the preview pane.
 */
export function getPreviewViewportStyle(
	viewport,
	customWidth = null,
	fullWidth = null
) {
	const width = customWidth || PREVIEW_VIEWPORT_WIDTHS[viewport] || fullWidth;

	return {
		'--prc-chart-preview-width': width ? `${width}px` : 'max-content',
	};
}

/**
 * Range of canvas widths worth offering for a chart, given its own width cap.
 *
 * @param {number} chartWidth The chart's `layout.width`.
 * @return {{min: number, max: number}} Inclusive slider bounds.
 */
export function getPreviewWidthRange(chartWidth) {
	const max = chartWidth + PREVIEW_CARD_PADDING;

	return {
		min: Math.min(PREVIEW_MIN_WIDTH, max),
		max,
	};
}
