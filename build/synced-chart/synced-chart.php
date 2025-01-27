<?php
namespace PRC\Platform\Chart_Builder;

class Synced_Chart {
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

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

		if ( 'publish' !== $synced_chart_block->post_status || ! empty( $synced_chart_block->post_password ) ) {
			return '';
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

	public function block_init() {
		register_block_type_from_metadata( PRC_CHART_BUILDER_DIR . '/build/synced-chart', [
			'render_callback' => array($this, 'render_block_callback'),
		] );
	}
}
