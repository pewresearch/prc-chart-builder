<?php
/**
 * Canonical parent resolution for chart CPT posts.
 *
 * Chart posts can be embedded in multiple articles. Editors may designate
 * which referencing post should be treated as the canonical parent for SEO.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Resolves the canonical parent post for a chart CPT.
 */
class Canonical_Parent {
	/**
	 * Post meta key storing the editor-selected canonical parent post ID.
	 *
	 * @var string
	 */
	public static string $meta_key = 'canonical_parent_id';

	/**
	 * Get post IDs that reference this chart (synced-chart usage meta).
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return int[]
	 */
	public static function get_referencing_post_ids( int $chart_post_id ): array {
		if ( ! class_exists( __NAMESPACE__ . '\Synced_Chart' ) ) {
			return array();
		}

		return Synced_Chart::get_chart_usage_post_ids( $chart_post_id );
	}

	/**
	 * Get the editor's explicit canonical parent selection (may be invalid).
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return int Post ID, or 0 when unset.
	 */
	public static function get_selected_parent_id( int $chart_post_id ): int {
		$selected = (int) get_post_meta( $chart_post_id, self::$meta_key, true );

		return $selected > 0 ? $selected : 0;
	}

	/**
	 * Whether a post ID is a valid published referencing parent for a chart.
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @param int $parent_id     Candidate parent post ID.
	 * @return bool
	 */
	public static function is_valid_published_parent( int $chart_post_id, int $parent_id ): bool {
		if ( $parent_id <= 0 ) {
			return false;
		}

		if ( ! in_array( $parent_id, self::get_referencing_post_ids( $chart_post_id ), true ) ) {
			return false;
		}

		return 'publish' === get_post_status( $parent_id );
	}

	/**
	 * Resolve the canonical parent post ID for a chart.
	 *
	 * Uses the explicit selection when valid; otherwise the first published
	 * referencing post in usage-meta order.
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return int Parent post ID, or 0 when none.
	 */
	public static function resolve_parent_id( int $chart_post_id ): int {
		$selected = self::get_selected_parent_id( $chart_post_id );
		if ( $selected > 0 && self::is_valid_published_parent( $chart_post_id, $selected ) ) {
			return $selected;
		}

		foreach ( self::get_referencing_post_ids( $chart_post_id ) as $post_id ) {
			if ( 'publish' === get_post_status( $post_id ) ) {
				return (int) $post_id;
			}
		}

		return 0;
	}

	/**
	 * Resolve the canonical parent permalink for a chart post.
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return string Parent permalink, or empty string when none.
	 */
	public static function resolve_parent_url( int $chart_post_id ): string {
		$parent_id = self::resolve_parent_id( $chart_post_id );
		if ( $parent_id <= 0 ) {
			return '';
		}

		$url = get_permalink( $parent_id );

		return is_string( $url ) ? $url : '';
	}

	/**
	 * Clear an invalid explicit selection on save.
	 *
	 * @hook save_post_chart
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 * @param bool     $update  Whether this is an existing post being updated.
	 * @return void
	 */
	public static function sanitize_meta_on_save( int $post_id, \WP_Post $post, bool $update ): void {
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		$selected = self::get_selected_parent_id( $post_id );
		if ( $selected <= 0 ) {
			return;
		}

		if ( ! in_array( $selected, self::get_referencing_post_ids( $post_id ), true ) ) {
			delete_post_meta( $post_id, self::$meta_key );
		}
	}
}
