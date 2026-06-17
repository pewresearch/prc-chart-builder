<?php
/**
 * SEO class for the chart builder.
 *
 * Hooks into prc-schema-seo filters to provide chart-specific meta tags:
 *  - description → chart alt text (metadata.alt from block attrs)
 *  - og:image    → chart featured image URL (set by the PNG export pipeline)
 *
 * twitter:card is automatically upgraded to summary_large_image by prc-schema-seo
 * whenever an og:image URL is present.
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
		$this->loader->add_filter( 'prc_schema_seo_description_fallback', $this, 'filter_chart_description', 11, 2 );
		$this->loader->add_filter( 'prc_schema_seo_og_image_url', $this, 'filter_chart_og_image_url', 10, 3 );
		$this->loader->add_filter( 'prc_schema_seo_canonical_url', $this, 'filter_chart_canonical_url', 10, 3 );
	}

	/**
	 * Extract the alt text from a chart CPT post's block content.
	 *
	 * Uses WP_Block_Processor to stream forward and stop as soon as the
	 * first prc-chart-builder/chart block inside a controller is found, avoiding
	 * the full parse_blocks() allocation of the entire post content.
	 *
	 * @param int $post_id Chart post ID.
	 * @return string The chart alt text, or empty string if not found.
	 */
	private function get_chart_description( int $post_id ): string {
		$post_content = get_post_field( 'post_content', $post_id );
		if ( empty( $post_content ) ) {
			return '';
		}

		$processor = new \WP_Block_Processor( $post_content );

		// Advance to the controller, then to the chart nested inside it.
		if ( ! $processor->next_block( 'prc-chart-builder/controller' ) ) {
			return '';
		}
		if ( ! $processor->next_block( 'prc-chart-builder/chart' ) ) {
			return '';
		}

		$attrs = $processor->allocate_and_return_parsed_attributes() ?? array();
		if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
			$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
		}

		$alt = wp_strip_all_tags( $attrs['metadata']['alt'] ?? '' );
		return $alt;
	}

	/**
	 * Replace the SEO description with the chart's alt text.
	 *
	 * @hook prc_schema_seo_description_fallback 11
	 *
	 * @param string $description Current description.
	 * @param int    $post_id     Post ID.
	 * @return string
	 */
	public function filter_chart_description( string $description, int $post_id ): string {
		if ( ! is_singular( Content_Type::$post_type ) ) {
			return $description;
		}

		$chart_description = $this->get_chart_description( $post_id );

		return ! empty( $chart_description ) ? $chart_description : $description;
	}

	/**
	 * Inject the chart's featured image URL as the og:image.
	 *
	 * The PNG export pipeline sets the chart post's featured image via
	 * set_post_thumbnail(). We surface it here via the og:image URL filter so
	 * prc-schema-seo needs no chart-specific knowledge.
	 *
	 * @hook prc_schema_seo_og_image_url 10
	 *
	 * @param string $og_image_url Current og:image URL (may be empty).
	 * @param int    $post_id      Post ID (0 for archives/terms).
	 * @param array  $seo_data     Resolved SEO data.
	 * @return string
	 */
	public function filter_chart_og_image_url( string $og_image_url, int $post_id, array $seo_data ): string {
		if ( ! $post_id || ! is_singular( Content_Type::$post_type ) || ! empty( $og_image_url ) ) {
			return $og_image_url;
		}

		$thumbnail_id = get_post_thumbnail_id( $post_id );

		return $thumbnail_id ? (string) wp_get_attachment_url( $thumbnail_id ) : $og_image_url;
	}

	/**
	 * Point chart post canonical URLs at the resolved parent article.
	 *
	 * @hook prc_schema_seo_canonical_url 10
	 *
	 * @param string $canonical_url Current canonical URL.
	 * @param int    $post_id       Post ID.
	 * @param array  $seo_data      Resolved SEO data.
	 * @return string
	 */
	public function filter_chart_canonical_url( string $canonical_url, int $post_id, array $seo_data ): string {
		if ( ! $post_id || Content_Type::$post_type !== get_post_type( $post_id ) ) {
			return $canonical_url;
		}

		$parent_url = Canonical_Parent::resolve_parent_url( $post_id );

		return $parent_url ?: $canonical_url;
	}
}
