<?php
namespace PRC\Platform\Chart_Builder;

class Media_Library {
	public function __construct($loader) {
		$loader->add_action('init', $this, 'register_chart_media_meta');
		$loader->add_filter('rest_attachment_query', $this, 'hide_chart_images_from_rest', 10, 2);
		$loader->add_filter('ajax_query_attachments_args', $this, 'hide_chart_images_from_media_library');
	}

	/**
	 * Register additional metadata for attachments to hide chart builder images from the media library.
	 */
	public function register_chart_media_meta() {
		register_meta(
			'post',
			'isChartBuilderImage',
			array(
				'object_subtype' => 'attachment',
				'type' => 'boolean',
				'description' => 'Is this image a chart builder image?',
				'single' => true,
				'show_in_rest' => true,
			)
		);
	}

	/**
	 * Hide chart builder images from REST API queries.
	 *
	 * This prevents chart-generated images from appearing in media library
	 * queries used by the block editor and other REST API consumers.
	 *
	 * @hook rest_attachment_query
	 *
	 * @param array            $args    Array of arguments for WP_Query.
	 * @param \WP_REST_Request $request The REST API request.
	 * @return array Modified query arguments.
	 */
	public function hide_chart_images_from_rest( $args, $request ) {
		// Initialize meta_query if it doesn't exist
		if ( ! isset( $args['meta_query'] ) ) {
			$args['meta_query'] = array();
		}

		// Exclude attachments where isChartBuilderImage is true
		$args['meta_query'][] = array(
			'relation' => 'OR',
			array(
				'key'     => 'isChartBuilderImage',
				'compare' => 'NOT EXISTS',
			),
			array(
				'key'     => 'isChartBuilderImage',
				'value'   => '1',
				'compare' => '!=',
			),
		);

		return $args;
	}

	/**
	 * Hide chart builder images from wp-admin media library.
	 *
	 * This prevents chart-generated images from appearing in the media library
	 * grid view (which uses AJAX) and media modal popups.
	 *
	 * @hook ajax_query_attachments_args
	 *
	 * @param array $query_args Query arguments for WP_Query.
	 * @return array Modified query arguments.
	 */
	public function hide_chart_images_from_media_library( $query_args ) {
		// Initialize meta_query if it doesn't exist
		if ( ! isset( $query_args['meta_query'] ) ) {
			$query_args['meta_query'] = array();
		}

		// Exclude attachments where isChartBuilderImage is true
		$query_args['meta_query'][] = array(
			'relation' => 'OR',
			array(
				'key'     => 'isChartBuilderImage',
				'compare' => 'NOT EXISTS',
			),
		);

		return $query_args;
	}
}
