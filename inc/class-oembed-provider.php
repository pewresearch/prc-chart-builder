<?php
namespace PRC;

class oEmbedProvider extends PRC_Chart_Builder {
	public function __construct($init = false) {
		add_filter( 'oembed_response_data', 'modify_oembed_response', 10, 4 );
	}

	public function modify_oembed_response( $data, $post, $width, $height ) {
		// Doing a little bit of checking here to make sure we're only modifying the oEmbed response for the chart post type.
		if ( ! is_object( $post ) || ! isset( $post->post_type ) || self::$post_type !== $post->post_type ) {
			return $data;
		}

		$data['type'] = 'rich';
		return $data;
	}
}

new oEmbedProvider(true);