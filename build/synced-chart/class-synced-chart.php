<?php
/**
 * Synced Chart Block
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Synced Chart Block
 *
 * @package PRC\Platform\Chart_Builder
 */
class Synced_Chart {
	/**
	 * The meta key for storing post IDs where synced charts are used.
	 *
	 * @var string
	 */
	public static $synced_chart_usage_meta_key = 'prc_synced_chart_used_in_posts';

	/**
	 * Constructor
	 *
	 * @param object $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Add a post ID to the chart's usage tracking meta.
	 *
	 * @param int $chart_post_id The chart post ID.
	 * @param int $current_post_id The post ID where the chart is being used.
	 * @return void
	 */
	private function add_post_id_to_chart_usage( $chart_post_id, $current_post_id ) {
		// Validate input parameters.
		if ( ! is_numeric( $chart_post_id ) || ! is_numeric( $current_post_id ) ) {
			return;
		}

		$chart_post_id   = (int) $chart_post_id;
		$current_post_id = (int) $current_post_id;

		// Ensure current post ID is 1. not the same as the chart ID, and 2. not pointing to an autosave.
		if ( $chart_post_id === $current_post_id || wp_is_post_autosave( $current_post_id ) ) {
			return;
		}

		// Get existing post IDs from meta.
		$existing_post_ids = get_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key, true );

		// Initialize as empty array if meta doesn't exist or isn't an array.
		if ( ! is_array( $existing_post_ids ) ) {
			$existing_post_ids = array();
		}

		// Add current post ID if not already present.
		if ( ! in_array( $current_post_id, $existing_post_ids, true ) ) {
			$existing_post_ids[] = $current_post_id;
			update_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key, $existing_post_ids );
		}
	}

	/**
	 * Get the list of post IDs where a specific chart is used.
	 *
	 * @param int $chart_post_id The chart post ID.
	 * @return array Array of post IDs where the chart is used.
	 */
	public static function get_chart_usage_post_ids( $chart_post_id ) {
		if ( ! is_numeric( $chart_post_id ) ) {
			return array();
		}

		$chart_post_id = (int) $chart_post_id;
		$post_ids      = get_post_meta( $chart_post_id, self::$synced_chart_usage_meta_key, true );

		return is_array( $post_ids ) ? $post_ids : array();
	}

	/**
	 * Render block callback
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $content Block content.
	 * @return string Block content.
	 */
	public function render_block_callback( $attributes, $content ) {
		static $seen_refs = array();

		if ( empty( $attributes['ref'] ) ) {
			return '';
		}

		$synced_chart_block = get_post( $attributes['ref'] );
		if ( ! $synced_chart_block || Content_Type::$post_type !== $synced_chart_block->post_type ) {
			return '';
		}

		if ( isset( $seen_refs[ $attributes['ref'] ] ) ) {
			// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
			// is set in `wp_debug_mode()`.
			$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

			return $is_debug ?
				// translators: Visible only in the front end, this warning takes the place of a faulty block.
				__( '[block rendering halted]' ) :
				'';
		}

		$allowed_statuses = array( 'publish' );
		if ( is_user_logged_in() ) {
			$allowed_statuses[] = 'draft';
			$allowed_statuses[] = 'private';
		} elseif ( ! empty( $synced_chart_block->post_password ) ) {
			return '';
		}

		if ( ! in_array( $synced_chart_block->post_status, $allowed_statuses ) ) {
			return;
		}

		// Track usage: Report the current post ID to the chart post meta.
		$current_post_id = get_the_ID();
		if ( $current_post_id && $current_post_id !== $attributes['ref'] ) {
			$this->add_post_id_to_chart_usage( $attributes['ref'], $current_post_id );
		}

		$seen_refs[ $attributes['ref'] ] = true;

		// Handle embeds for synced chart blocks.
		global $wp_embed;
		$content = $wp_embed->run_shortcode( $synced_chart_block->post_content );
		$content = $wp_embed->autoembed( $content );

		$content = do_blocks( $content );

		unset( $seen_refs[ $attributes['ref'] ] );
		return $content;
	}

	/**
	 * Block init
	 *
	 * @hook init
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_CHART_BUILDER_DIR . '/build/synced-chart',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
