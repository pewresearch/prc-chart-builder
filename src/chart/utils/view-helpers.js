/* eslint-disable jsdoc/check-line-alignment */

/**
 * Whether a chart store slice is a prc-custom-charts chart (e.g. RLS stacked bar).
 *
 * @param {Object|undefined} slice Per-chart state slice from the store.
 * @return {boolean} True when the chart uses the prc-custom-charts renderer path.
 */
export function isCustomChartSlice(slice) {
	if (!slice?.attributes) {
		return false;
	}
	const io = slice.attributes.io ?? {};
	return (
		!!io.isCustomChart ||
		!!(io.customAttributes && io.customAttributes.chartType)
	);
}

/**
 * Whether a chart mount element contains live chart content (not SSR fallback).
 *
 * @param {HTMLElement|null} mountEl Chart mount root (`#data-prc-chart-id`).
 * @return {boolean} True when a custom chart is already mounted in the node.
 */
export function mountHasLiveChart(mountEl) {
	if (!mountEl || mountEl.childElementCount === 0) {
		return false;
	}
	return Array.from(mountEl.children).some(
		(child) => !child.classList.contains('chart-fallback')
	);
}

/**
 * Gutenberg / @wordpress/compose viewport breakpoints.
 *
 * Matches `@wordpress/compose` `useViewportMatch` and the block editor device
 * preview canvas (`useResizeCanvas`: Mobile = 479px, Tablet = 781px). Keep in
 * sync with `packages/base-styles/_breakpoints.scss`.
 *
 * @see node_modules/@wordpress/compose/src/hooks/use-viewport-match/index.js
 * @see node_modules/@wordpress/block-editor/src/components/block-visibility/use-block-visibility.js
 */
export const VIEWPORT_BREAKPOINTS = {
	mobile: 480,
	medium: 782,
};

/**
 * Class on the /export/ document root. Charts on that page always use the
 * desktop attribute set so a 640px chart is not treated as tablet.
 *
 * @type {string}
 */
export const EXPORT_ROOT_CLASS = 'wp-chart-builder-export';

/**
 * Whether the current document is the chart /export/ screenshot page.
 *
 * @return {boolean} True when the document body carries `EXPORT_ROOT_CLASS`.
 */
export function isChartExportPage() {
	if (typeof document === 'undefined') {
		return false;
	}
	return Boolean(document.body?.classList.contains(EXPORT_ROOT_CLASS));
}

/**
 * Resolve chart viewport from a pixel width using Gutenberg breakpoint semantics.
 *
 * @param {number} width Viewport width in pixels (typically `window.innerWidth`).
 * @return {'mobile' | 'tablet' | 'desktop'} Active chart viewport bucket.
 */
export function resolveViewportFromWidth(width) {
	if (width < VIEWPORT_BREAKPOINTS.mobile) {
		return 'mobile';
	}
	if (width < VIEWPORT_BREAKPOINTS.medium) {
		return 'tablet';
	}
	return 'desktop';
}

/**
 * Determine viewport from the current window width.
 *
 * Uses Gutenberg breakpoints so frontend resize behavior matches the editor
 * device preview (Mobile / Tablet / Desktop toolbar).
 *
 * @return {'mobile' | 'tablet' | 'desktop'} Active chart viewport bucket.
 */
export function getViewportFromWidth() {
	if (typeof window === 'undefined') {
		return 'desktop';
	}
	if (isChartExportPage()) {
		return 'desktop';
	}
	return resolveViewportFromWidth(window.innerWidth);
}

/**
 * Chart ids whose live slice is on a different viewport than `viewport`.
 *
 * Window resize is page-wide. `watchForResize` is bound on every chart
 * element and shares one debounce timer, so the handler must switch every
 * standard chart — not only the last element whose callback won the timeout.
 * Custom charts opt out of `data-wp-on-window--resize` and stay skipped.
 *
 * @param {Object} charts   `state.charts` map keyed by chart id.
 * @param {string} viewport Target viewport ('mobile', 'tablet', 'desktop').
 * @return {string[]} Chart ids that should receive a viewport switch.
 */
export function chartIdsNeedingViewportSwitch(charts, viewport) {
	return Object.keys(charts || {}).filter((id) => {
		const slice = charts[id];
		if (!slice || isCustomChartSlice(slice)) {
			return false;
		}
		return slice.currentViewport !== viewport;
	});
}

const viewportObserverIds = new Set();

/**
 * When the viewport-entry trigger is active and the chart hasn't rendered yet,
 * attach an IntersectionObserver and defer `onEnter` until the element enters
 * the viewport. The Set guard prevents a second observer on re-runs.
 *
 * @param {string}   id      Chart id (matches data-prc-chart-id).
 * @param {Function} onEnter Callback invoked when the chart enters the viewport.
 * @return {boolean} True when deferred (caller should skip immediate render).
 */
export function attachViewportRenderTrigger(id, onEnter) {
	if (viewportObserverIds.has(id)) {
		return true;
	}

	viewportObserverIds.add(id);
	const el = document.querySelector(`[data-prc-chart-id="${id}"]`);
	if (el && typeof window.IntersectionObserver !== 'undefined') {
		const observer = new window.IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					observer.disconnect();
					onEnter();
				}
			},
			{ threshold: 0.1 }
		);
		observer.observe(el);
		return true;
	}

	onEnter();
	return false;
}
