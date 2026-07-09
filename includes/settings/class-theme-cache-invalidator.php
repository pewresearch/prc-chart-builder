<?php
/**
 * Edge cache invalidation when the chart theme changes (PRC-528).
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Purges VIP edge cache so updated window.prcChartBuilderTheme inline data
 * is not served from stale HTML cache entries.
 */
class Theme_Cache_Invalidator {

	/**
	 * Purge edge cache after a chart theme save.
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
