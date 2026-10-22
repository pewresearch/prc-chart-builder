<?php
/**
 * Chart Usage Links block.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Dynamic block for canonical and other chart placements.
 */
class Chart_Usage_Links {

	public const BLOCK_NAME = 'prc-chart-builder/chart-usage-links';

	/**
	 * @param Loader $loader Plugin loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * @hook init
	 */
	public function block_init(): void {
		register_block_type_from_metadata( PRC_CHART_BUILDER_DIR . '/build/chart-usage-links' );
	}

	/**
	 * Render a single list with the canonical parent first.
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return string
	 */
	public static function render_links( int $chart_post_id ): string {
		$items = array();

		$canonical_title = trim( Canonical_Parent::resolve_parent_title( $chart_post_id ) );
		$canonical_url   = trim( Canonical_Parent::resolve_parent_url( $chart_post_id ) );
		if ( '' !== $canonical_title && '' !== $canonical_url ) {
			$items[] = sprintf(
				'<li class="chart-usage-links__item chart-usage-links__item--canonical"><a href="%1$s">%2$s</a></li>',
				esc_url( $canonical_url ),
				esc_html( $canonical_title )
			);
		}

		foreach ( Canonical_Parent::get_public_referencing_posts( $chart_post_id ) as $post ) {
			$items[] = sprintf(
				'<li class="chart-usage-links__item"><a href="%1$s">%2$s</a></li>',
				esc_url( $post['url'] ),
				esc_html( $post['title'] )
			);
		}

		if ( empty( $items ) ) {
			return '';
		}

		return wp_kses_post(
			sprintf(
				'<ul class="chart-usage-links__list">%s</ul>',
				implode( '', $items )
			)
		);
	}
}
