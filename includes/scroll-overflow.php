<?php
/**
 * Horizontal scroll shell for freeform charts.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Mark freeform HTML as a scroll shell when Overflow is Scroll.
 *
 * The shell rules live in controller/style.scss. This only sets the class and
 * the layout width. Responsive and preserve-aspect-ratio are unchanged.
 *
 * @param string $html       Rendered freeform markup.
 * @param string $overflow_x layout.overflowX.
 * @param string $width      Layout width, including the px unit.
 * @return string
 */
function wrap_scroll_overflow( $html, $overflow_x, $width ) {
	if ( 'scroll' !== $overflow_x && 'scroll-fixed-y-axis' !== $overflow_x ) {
		return $html;
	}

	return sprintf(
		'<div class="cb__overflow-scroll" style="--cb-layout-width:%1$s"><div class="cb__overflow-scroll__content">%2$s</div></div>',
		esc_attr( $width ),
		$html
	);
}
