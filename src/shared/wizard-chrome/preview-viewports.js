/**
 * Canvas widths for the Preview Chart viewport toggle, and the CSS custom
 * properties that apply them to the preview pane. Kept free of component
 * imports so the mapping can be unit tested on its own.
 */
import { __, sprintf } from '@wordpress/i18n';

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

/** Narrowest canvas that counts as Desktop (Gutenberg's tablet→desktop). */
const DESKTOP_MIN_WIDTH = PREVIEW_VIEWPORT_WIDTHS.tablet + 1;

/** Narrowest preview first. A wider size is the one past the chart's match. */
const PREVIEW_VIEWPORT_ORDER = ['mobile', 'tablet', 'desktop'];

/**
 * The viewport whose settings a canvas of this width shows on the site.
 *
 * @param {number} width Canvas width in px.
 * @return {string} `'desktop'` | `'tablet'` | `'mobile'`.
 */
export function getPreviewViewportForWidth(width) {
	if (width <= PREVIEW_VIEWPORT_WIDTHS.mobile) {
		return 'mobile';
	}
	return width < DESKTOP_MIN_WIDTH ? 'tablet' : 'desktop';
}

/**
 * Every viewport resolves to a definite width. A shrink-to-fit card would
 * settle at whatever the chart last rendered, which caps the preview at the
 * pane width and leaves wide charts unable to reach their authored size.
 *
 * @param {string}      viewport      `'desktop'` | `'tablet'` | `'mobile'`.
 * @param {number|null} [customWidth] Hand-picked canvas width, if any.
 * @param {number|null} [fullWidth]   Canvas width that renders the chart at
 *                                    its authored `layout.width`. Desktop
 *                                    uses it, and no viewport is wider.
 * @return {Object} Inline style for the preview pane.
 */
export function getPreviewViewportStyle(
	viewport,
	customWidth = null,
	fullWidth = null
) {
	const requested =
		customWidth || PREVIEW_VIEWPORT_WIDTHS[viewport] || fullWidth;
	// The chart never draws wider than its layout.width, so a wider card
	// only adds margin and makes the chart look smaller than on Desktop.
	const width =
		requested && fullWidth ? Math.min(requested, fullWidth) : requested;

	return {
		'--prc-chart-preview-width': width ? `${width}px` : 'max-content',
	};
}

/**
 * Preview sizes that would not change the chart.
 *
 * A size is turned off when the chart is no wider than that viewport, because
 * the chart never draws wider than its own width. The size the chart falls
 * into stays available, and so does every narrower size.
 *
 * @param {number} chartWidth Chart `layout.width` in pixels.
 * @return {string[]} Viewport keys to disable.
 */
export function getDisabledPreviewViewports(chartWidth) {
	if (typeof chartWidth !== 'number' || !Number.isFinite(chartWidth)) {
		return [];
	}

	const matched = getPreviewViewportForWidth(chartWidth);
	const matchedIndex = PREVIEW_VIEWPORT_ORDER.indexOf(matched);
	if (matchedIndex < 0) {
		return [];
	}

	return PREVIEW_VIEWPORT_ORDER.filter(
		(viewport, index) => index > matchedIndex
	);
}

/**
 * The size the Preview step renders. A size that would not change the chart
 * shows the size the chart matches instead. The author's own pick is left
 * alone, so Style Chart keeps editing the size they chose.
 *
 * @param {string}      viewport   `'desktop'` | `'tablet'` | `'mobile'`.
 * @param {number|null} chartWidth Chart `layout.width` in pixels.
 * @return {string} Viewport to render.
 */
export function getEffectivePreviewViewport(viewport, chartWidth) {
	if (!getDisabledPreviewViewports(chartWidth).includes(viewport)) {
		return viewport;
	}
	return getPreviewViewportForWidth(chartWidth);
}

/**
 * Help under Preview size. Names the sizes that are off, and why.
 *
 * @param {number} chartWidth Chart `layout.width` in pixels.
 * @return {string} Explainer for the preview size control.
 */
export function getPreviewSizeHelp(chartWidth) {
	const disabled = getDisabledPreviewViewports(chartWidth);

	if (disabled.includes('tablet')) {
		return sprintf(
			/* translators: %d: chart width in pixels. */
			__(
				"This chart's max width is set to %dpx. Tablet and Desktop are unavailable because the chart will always render at this width on those devices.",
				'prc-chart-builder'
			),
			chartWidth
		);
	}

	if (disabled.includes('desktop')) {
		return sprintf(
			/* translators: %d: chart width in pixels. */
			__(
				"This chart's max width is set to %dpx. Desktop is unavailable because the chart will always render at this width on that device.",
				'prc-chart-builder'
			),
			chartWidth
		);
	}

	return sprintf(
		/* translators: %d: chart width in pixels. */
		__(
			"This chart's max width is set to %dpx. Below 782px the preview uses the Tablet settings, and below 480px the Mobile settings.",
			'prc-chart-builder'
		),
		chartWidth
	);
}

/**
 * Range of canvas widths worth offering for a chart: up to its own width cap,
 * and always far enough to reach the Desktop breakpoint.
 *
 * @param {number} chartWidth The chart's `layout.width`.
 * @return {{min: number, max: number, chartWidth: number}} Inclusive slider
 *                                                         bounds, and the cap.
 */
export function getPreviewWidthRange(chartWidth) {
	const max = Math.max(chartWidth + PREVIEW_CARD_PADDING, DESKTOP_MIN_WIDTH);

	return {
		min: Math.min(PREVIEW_MIN_WIDTH, max),
		max,
		chartWidth,
	};
}
