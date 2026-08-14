<?php
/**
 * Edge cache invalidation when the chart theme changes (PRC-528).
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Purges VIP edge cache so chart pages with inline window.prcChartBuilderTheme
 * data are not served from stale HTML cache entries.
 *
 * Since PRC-628, the theme payload is scoped to chart bundle handles — chart-less
 * pages no longer embed it — but any page that rendered a chart still bakes the
 * inline global into cached HTML and must be invalidated on theme save.
 */
class Theme_Cache_Invalidator {

	/**
	 * Purge edge cache after a chart theme save.
	 *
	 * A whole-site purge remains necessary until the theme is served from a
	 * versioned asset instead of inline HTML on chart pages.
	 *
	 * @hook prc_chart_builder_theme_saved (documented below; fired by REST save)
	 */
	public static function purge_edge_cache(): void {
		/**
		 * Fires when the active chart theme is persisted and edge cache should bust.
		 *
		 * @since 3.11.0
		 */
		do_action( 'prc_chart_builder_purge_theme_cache' );

		if ( function_exists( 'wpcom_vip_purge_edge_cache' ) ) {
			wpcom_vip_purge_edge_cache();
			return;
		}

		if ( function_exists( 'wpcom_invalidate_cache_for_url' ) ) {
			wpcom_invalidate_cache_for_url( home_url( '/' ) );
		}
	}
}
