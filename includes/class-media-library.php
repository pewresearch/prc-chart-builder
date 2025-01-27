<?php
namespace PRC\Platform\Chart_Builder;

class Media_Library {
	public function __construct($loader) {
		$loader->add_action('init', $this, 'register_chart_media_meta');
	}

	/**
	 * Register additional metadata for attachments to hide chart builder images from the media library.
	 */
	public function register_chart_media_meta() {
		register_meta(
			'attachment',
			'isChartBuilderImage',
			array(
				'type' => 'boolean',
				'description' => 'Is this image a chart builder image?',
				'single' => true,
				'show_in_rest' => true,
			)
		);
	}

	// Some sort of pre get posts filter in wp admin to filter this stuff...
	public function hide_chart_media_from_library() {

	}
}
