/**
 * Small runtime helpers consumed by the chart view module (`src/chart/view.js`).
 *
 * Grouped into one file — chart-slice predicates, viewport resolution, and the
 * viewport-entry render trigger — because each is only used by the frontend
 * view runtime and is too small to warrant a standalone module.
 */

/* eslint-disable jsdoc/check-line-alignment */

/* -------------------------------------------------------------------------- */
/* Chart-slice predicates                                                     */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Viewport resolution                                                        */
/* -------------------------------------------------------------------------- */

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
	return resolveViewportFromWidth(window.innerWidth);
}

/* -------------------------------------------------------------------------- */
/* Viewport-entry render trigger                                              */
/* -------------------------------------------------------------------------- */

/**
 * Chart ids that already have a viewport IntersectionObserver attached.
 * Guards against watchForRender attaching a second observer on re-runs.
 *
 * @type {Set<string>}
 */
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

	// Fallback: observer unavailable or element missing.
	onEnter();
	return false;
}
