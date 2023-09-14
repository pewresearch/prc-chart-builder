<?php

namespace PRC;

class Chart extends PRC_Chart_Builder {
	public static $version = '0.1.0';
	public static $dir = __DIR__;

	public function __construct( $init = false ) {
		if ( true === $init ) {
			add_action('init', array($this, 'block_init'));
		}
	}

	public function render_synced_chart_block( $attributes, $content ) {
		static $seen_refs = array();

		if ( empty( $attributes['ref'] ) ) {
			return '';
		}

		$synced_chart_block = get_post( $attributes['ref'] );
		if ( ! $synced_chart_block || self::$post_type !== $synced_chart_block->post_type ) {
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

	/**
	* Registers the block using the metadata loaded from the `block.json` file.
	* Behind the scenes, it registers also all assets so they can be enqueued
	* through the block editor in the corresponding context.
	*
	* @see https://developer.wordpress.org/reference/functions/register_block_type/
	*/
	public function block_init() {
		register_block_type( self::$dir . '/build', array(
			'render_callback' => array($this, 'render_synced_chart_block'),
		) );
	}

}

