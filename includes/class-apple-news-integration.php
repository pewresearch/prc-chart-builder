<?php
/**
 * Integration with prc-apple-news deterministic ANF pipeline.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Connects prc-chart-builder with the Apple News block converter.
 */
class Apple_News_Integration {

	/**
	 * Authored chart width used when the chart block does not set one.
	 *
	 * Mirrors DEFAULT_CHART_WIDTH in src/synced-chart/flatten.js, which the
	 * editor already uses for the float preview width.
	 */
	public const DEFAULT_CHART_WIDTH = 640;

	/**
	 * Register the Apple News block callbacks.
	 *
	 * @param Loader $loader The loader instance.
	 */
	public function __construct( $loader ) {
		$loader->add_action(
			'prc_apple_news_register_block_callbacks',
			$this,
			'register_anf_callbacks'
		);
	}

	/**
	 * Register chart handlers with the Apple News block registry.
	 *
	 * @hook prc_apple_news_register_block_callbacks
	 */
	public function register_anf_callbacks(): void {
		if ( ! class_exists( '\PRC\Platform\Apple_News\ANF\ANF_Block_Registry' ) ) {
			return;
		}

		\PRC\Platform\Apple_News\ANF\ANF_Block_Registry::register(
			'prc-chart-builder/synced-chart',
			array( $this, 'synced_chart_to_anf' )
		);

		\PRC\Platform\Apple_News\ANF\ANF_Block_Registry::register(
			'prc-chart-builder/controller',
			array( $this, 'controller_to_anf' )
		);

		\PRC\Platform\Apple_News\ANF\ANF_Block_Registry::register(
			'prc-chart-builder/chart',
			static fn() => array()
		);
	}

	/**
	 * Convert a synced chart reference into ANF components.
	 *
	 * @param array    $block Parsed block.
	 * @param \WP_Post $post  Post.
	 * @return array<int,array<string,mixed>>
	 */
	public function synced_chart_to_anf( array $block, \WP_Post $post ): array {
		$ref = $block['attrs']['ref'] ?? null;
		if ( ! $ref ) {
			return array();
		}

		$align = isset( $block['attrs']['align'] ) ? sanitize_key( (string) $block['attrs']['align'] ) : '';

		$chart_post = get_post( (int) $ref );
		if ( ! $chart_post || Content_Type::$post_type !== $chart_post->post_type ) {
			return array();
		}

		$allowed_statuses = array( 'publish' );
		if ( is_user_logged_in() || is_preview() ) {
			$allowed_statuses[] = 'draft';
			$allowed_statuses[] = 'future';
			$allowed_statuses[] = 'private';
		}
		if ( ! in_array( $chart_post->post_status, $allowed_statuses, true ) ) {
			return array();
		}

		$chart_blocks = parse_blocks( $chart_post->post_content );
		$width        = self::find_chart_width( $chart_blocks );

		$thumbnail_id = get_post_thumbnail_id( $chart_post->ID );
		if ( $thumbnail_id ) {
			$png_url = wp_get_attachment_url( $thumbnail_id );
			if ( $png_url ) {
				$title = get_the_title( $chart_post );
				if ( '' === trim( $title ) ) {
					$title = 'Chart';
				}
				return $this->chart_photo_components( $png_url, wp_strip_all_tags( $title ), $align, $width );
			}
		}

		foreach ( $chart_blocks as $chart_block ) {
			if ( 'prc-chart-builder/controller' === ( $chart_block['blockName'] ?? '' ) ) {
				return $this->controller_to_anf( $chart_block, $post, $align );
			}
		}

		return array();
	}

	/**
	 * Authored pixel width from `layout.width` on the chart block.
	 *
	 * The PNG URL says nothing about the size the author chose, so the ANF
	 * layout reads the same attribute the editor uses for its float preview.
	 *
	 * @param array<int,array<string,mixed>> $blocks Parsed blocks to search.
	 * @return int Width in pixels.
	 */
	public static function find_chart_width( array $blocks ): int {
		foreach ( $blocks as $block ) {
			if ( ! is_array( $block ) ) {
				continue;
			}

			if ( 'prc-chart-builder/chart' === ( $block['blockName'] ?? '' ) ) {
				$width = $block['attrs']['layout']['width'] ?? null;

				return is_numeric( $width ) && (int) $width > 0
					? (int) $width
					: self::DEFAULT_CHART_WIDTH;
			}

			$inner = $block['innerBlocks'] ?? array();
			if ( ! empty( $inner ) && is_array( $inner ) ) {
				$found = self::find_chart_width( $inner );
				if ( $found > 0 ) {
					return $found;
				}
			}
		}

		return 0;
	}

	/**
	 * Convert a chart controller block into ANF components.
	 *
	 * @param array    $block Parsed block.
	 * @param \WP_Post $post  Post.
	 * @param string   $align Gutenberg alignment.
	 * @param int|null $width Authored chart width in pixels.
	 * @return array<int,array<string,mixed>>
	 */
	public function controller_to_anf( array $block, \WP_Post $post, string $align = '', ?int $width = null ): array {
		$inner_blocks = $block['innerBlocks'] ?? array();
		$chart_block  = null;

		foreach ( $inner_blocks as $inner ) {
			if ( 'prc-chart-builder/chart' === ( $inner['blockName'] ?? '' ) ) {
				$chart_block = $inner;
				break;
			}
		}

		if ( ! $chart_block ) {
			return array();
		}

		if ( null === $width ) {
			$width = self::find_chart_width( array( $chart_block ) );
		}

		$attrs = $chart_block['attrs'] ?? array();
		if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
			$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
		}

		$png_url = $this->resolve_chart_png_url( $attrs );
		if ( '' === $png_url ) {
			return array();
		}

		$metadata = $attrs['metadata'] ?? array();
		$title    = wp_strip_all_tags( $metadata['title'] ?? 'Chart' );

		return $this->chart_photo_components( $png_url, $title, $align, $width );
	}

	/**
	 * Build the photo (and caption) components for a chart PNG.
	 *
	 * @param string   $url   Image URL.
	 * @param string   $title Alt/caption text.
	 * @param string   $align Gutenberg alignment.
	 * @param int|null $width Authored chart width in pixels.
	 * @return array<int,array<string,mixed>>
	 */
	private function chart_photo_components( string $url, string $title, string $align = '', ?int $width = null ): array {
		if ( null === $width || $width <= 0 ) {
			$width = self::DEFAULT_CHART_WIDTH;
		}

		$alignment = '\PRC\Platform\Apple_News\ANF\ANF_Alignment';
		$mapping   = class_exists( $alignment )
			? $alignment::layout_for_alignment( $align, $width )
			: null;

		$photo = array(
			'role' => 'photo',
			'URL'  => $url,
		);

		if ( null !== $mapping ) {
			$photo = $alignment::apply_layout_to_component( $photo, $mapping['layout'], $mapping['extra'] );
		} else {
			$photo['layout'] = 'full-width-image';
		}

		if ( in_array( $align, array( 'left', 'right' ), true ) || '' === trim( $title ) ) {
			return array( $photo );
		}

		$container_layout = is_string( $photo['layout'] ?? null ) ? $photo['layout'] : 'full-width-image';
		unset( $photo['layout'] );

		return array(
			array(
				'role'       => 'container',
				'layout'     => $container_layout,
				'components' => array(
					$photo,
					array(
						'role'      => 'caption',
						'text'      => '<p>' . esc_html( $title ) . '</p>',
						'format'    => 'html',
						'textStyle' => 'default-body',
						'layout'    => 'body-layout',
					),
				),
			),
		);
	}

	/**
	 * Resolve the exported PNG URL from chart block attributes.
	 *
	 * @param array $attrs Chart block attrs.
	 * @return string
	 */
	private function resolve_chart_png_url( array $attrs ): string {
		$io = $attrs['io'] ?? array();
		return is_string( $io['pngUrl'] ?? null ) && '' !== $io['pngUrl'] ? $io['pngUrl'] : '';
	}
}
