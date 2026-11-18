/**
 * Keep anchored chart popovers inside the visual viewport.
 *
 * WordPress Popover flips across its placement axis and does not shift unless
 * asked. A label near the left edge of a phone then opens its panel past the
 * screen. Shift slides the panel back. Resize stays off on the element popover
 * so it does not fight that shift; the frame caps the box instead.
 */

import { useEffect, useState } from '@wordpress/element';

/** Placement for the chart element settings popover (labels, shapes, ticks, …). */
export const CHART_ELEMENT_POPOVER_PLACEMENT = {
	placement: 'top',
	offset: 12,
	flip: true,
	shift: true,
	resize: false,
};

/**
 * Flip, then shift, for the other chart popovers that anchor to a control.
 * Resize is off because Popover ignores shift when resize is on.
 */
export const anchoredChartPopoverProps = {
	flip: true,
	shift: true,
	resize: false,
};

const FRAME_GUTTER = 16;
const PREFERRED_MIN_WIDTH = 300;
const PREFERRED_MAX_HEIGHT = 400;

/**
 * Box limits that keep a chart popover inside the visual viewport.
 * A missing viewport keeps the previous preferred size.
 *
 * @param {number} viewportWidth  Visual viewport width in pixels.
 * @param {number} viewportHeight Visual viewport height in pixels.
 * @return {{ minWidth: number, maxWidth: number|undefined, maxHeight: number }} Frame sizes.
 */
export function chartPopoverFrame(viewportWidth, viewportHeight) {
	const width = Number.isFinite(viewportWidth) ? viewportWidth : 0;
	const height = Number.isFinite(viewportHeight) ? viewportHeight : 0;
	if (width <= FRAME_GUTTER || height <= FRAME_GUTTER) {
		return {
			minWidth: PREFERRED_MIN_WIDTH,
			maxWidth: undefined,
			maxHeight: PREFERRED_MAX_HEIGHT,
		};
	}

	const availableWidth = Math.floor(width - FRAME_GUTTER);
	const availableHeight = Math.floor(height - FRAME_GUTTER);
	return {
		minWidth: Math.min(PREFERRED_MIN_WIDTH, availableWidth),
		maxWidth: availableWidth,
		maxHeight: Math.min(PREFERRED_MAX_HEIGHT, availableHeight),
	};
}

/**
 * Read the visual viewport, falling back to the layout viewport.
 *
 * @param {Window|undefined} view Window that owns the anchor.
 * @return {{ width: number, height: number }} Viewport size.
 */
function readViewport(view) {
	const visual = view?.visualViewport;
	return {
		width: visual?.width ?? view?.innerWidth ?? 0,
		height: visual?.height ?? view?.innerHeight ?? 0,
	};
}

/**
 * Track the anchor's visual viewport and return popover box limits.
 *
 * @param {Element|null|undefined} anchor Element the popover anchors to.
 * @return {{ minWidth: number, maxWidth: number|undefined, maxHeight: number }} Frame sizes.
 */
export function useChartPopoverFrame(anchor) {
	const view =
		anchor?.ownerDocument?.defaultView ??
		(typeof window === 'undefined' ? undefined : window);

	const [frame, setFrame] = useState(() => {
		const size = readViewport(view);
		return chartPopoverFrame(size.width, size.height);
	});

	useEffect(() => {
		if (!view?.addEventListener) {
			return undefined;
		}

		const update = () => {
			const size = readViewport(view);
			const next = chartPopoverFrame(size.width, size.height);
			setFrame((current) => {
				if (
					current.minWidth === next.minWidth &&
					current.maxWidth === next.maxWidth &&
					current.maxHeight === next.maxHeight
				) {
					return current;
				}
				return next;
			});
		};

		update();
		const visual = view.visualViewport;
		visual?.addEventListener?.('resize', update);
		visual?.addEventListener?.('scroll', update);
		view.addEventListener('resize', update);

		return () => {
			visual?.removeEventListener?.('resize', update);
			visual?.removeEventListener?.('scroll', update);
			view.removeEventListener('resize', update);
		};
	}, [view]);

	return frame;
}
