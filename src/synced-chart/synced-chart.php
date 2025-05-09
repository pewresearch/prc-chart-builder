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
	 * Constructor
	 *
	 * @param object $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
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
