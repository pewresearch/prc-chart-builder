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

		$post_content      = get_post_field( 'post_content', $post_id );
		$blocks            = parse_blocks( $post_content );
		$controller_blocks = array_filter(
			$blocks,
			function ( $block ) {
				return 'prc-block/chart-builder-controller' === $block['blockName'];
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
						return 'prc-block/chart-builder' === $inner_block['blockName'];
					}
				);
			},
			$controller_blocks
		);
		// Get the first chart block.
		$chart_block = reset( $chart_blocks );
		$attributes  = $chart_block[1]['attrs'];

		$block_attribute = array_key_exists( $attribute, $attributes ) ? $attributes[ $attribute ] : false;

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
