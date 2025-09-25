<?php
/**
 * SEO class for the chart builder.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * SEO class for the chart builder.
 *
 * @package PRC\Chart_Builder
 */
class SEO {
	/**
	 * The loader.
	 *
	 * @var Loader
	 */
	protected $loader;

	/**
	 * The constructor.
	 *
	 * @param Loader $loader The loader.
	 */
	public function __construct( $loader ) {
		$this->loader = $loader;
		$this->init();
	}

	/**
	 * Initialize the hooks.
	 */
	public function init() {
		$this->loader->add_filter( 'wpseo_opengraph_image', $this, 'get_chart_image', 100, 1 );
		$this->loader->add_filter( 'wpseo_metadesc', $this, 'get_chart_description', 100, 1 );
		$this->loader->add_filter( 'wpseo_title', $this, 'get_chart_title', 100, 1 );
	}

	/**
	 * Get the chart attribute.
	 *
	 * @param int    $post_id The post ID.
	 * @param string $attribute The attribute.
	 * @return string The attribute.
	 */
	public function get_chart_attribute( $post_id, $attribute ) {
		if ( ! is_singular( 'chart' ) ) {
			return;
		}

		// Prevent multiple processing of the same chart
		static $processed_charts = array();
		$cache_key = $post_id . '_' . $attribute;

		if ( isset( $processed_charts[ $cache_key ] ) ) {
			return $processed_charts[ $cache_key ];
		}

		$post_content      = get_post_field( 'post_content', $post_id );
		$blocks            = parse_blocks( $post_content );
		$controller_blocks = array_filter(
			$blocks,
			function ( $block ) {
				return 'prc-chart-builder/controller' === $block['blockName'];
			}
		);
		if ( empty( $controller_blocks ) ) {
			return;
		}
		$chart_blocks = array_map(
			function ( $block ) {
				return array_filter(
					$block['innerBlocks'],
					function ( $inner_block ) {
						return 'prc-chart-builder/chart' === $inner_block['blockName'];
					}
				);
			},
			$controller_blocks
		);

		// Get the first chart block.
		$chart_block = reset( $chart_blocks );

		// Validate that we have a chart block with the expected structure.
		if ( false === $chart_block || empty( $chart_block ) ) {
			return false;
		}

		// Get the first chart block from the inner blocks array.
		$chart_block = reset( $chart_block );

		// Validate that we have a chart block with the expected structure.
		if ( false === $chart_block || empty( $chart_block ) || ! isset( $chart_block['attrs'] ) ) {
			return false;
		}

		$attributes = $chart_block['attrs'];

		// Ensure attributes is an array before checking key existence.
		if ( ! is_array( $attributes ) ) {
			$processed_charts[ $cache_key ] = false;
			return false;
		}

		$block_attribute = array_key_exists( $attribute, $attributes ) ? $attributes[ $attribute ] : false;

		// Cache the result
		$processed_charts[ $cache_key ] = $block_attribute;

		return $block_attribute;
	}

	/**
	 * Get the chart title.
	 *
	 * @param string $title The title.
	 * @return string The title.
	 */
	public function get_chart_title( $title ) {
		global $post;
		if ( ! is_singular( 'chart' ) ) {
			return $title;
		}
		$id    = $post->ID;
		$title = $this->get_chart_attribute( $id, 'metaTitle' );
		return $title;
	}

	/**
	 * Get the chart image.
	 *
	 * @param string $image The image.
	 * @return string The image.
	 */
	public function get_chart_image( $image ) {
		global $post;
		if ( ! is_singular( 'chart' ) ) {
			return $image;
		}
		$id     = $post->ID;
		$png_id = $this->get_chart_attribute( $id, 'pngId' );
		$image  = wp_get_attachment_url( $png_id );

		return $image;
	}

	/**
	 * Get the chart description.
	 *
	 * @param string $description The description.
	 * @return string The description.
	 */
	public function get_chart_description( $description ) {
		global $post;
		if ( ! is_singular( 'chart' ) ) {
			return $description;
		}
		$id          = $post->ID;
		$description = $this->get_chart_attribute( $id, 'metaSource' );
		return $description;
	}
}
