<?php
declare(strict_types=1);
/**
 * Integration with prc-apple-news deterministic ANF pipeline.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Connects prc-chart-builder with the Apple News block converter.
 */
class Apple_News_Integration {

	/**
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

		$thumbnail_id = get_post_thumbnail_id( $chart_post->ID );
		if ( $thumbnail_id ) {
			$png_url = wp_get_attachment_url( $thumbnail_id );
			if ( $png_url ) {
				$title = get_the_title( $chart_post ) ?: 'Chart';
				return $this->chart_photo_components( $png_url, wp_strip_all_tags( $title ), $align );
			}
		}

		$chart_blocks = parse_blocks( $chart_post->post_content );
		foreach ( $chart_blocks as $chart_block ) {
			if ( 'prc-chart-builder/controller' === ( $chart_block['blockName'] ?? '' ) ) {
				return $this->controller_to_anf( $chart_block, $post, $align );
			}
		}

		return array();
	}

	/**
	 * @param array    $block Parsed block.
	 * @param \WP_Post $post  Post.
	 * @return array<int,array<string,mixed>>
	 */
	public function controller_to_anf( array $block, \WP_Post $post, string $align = '' ): array {
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

		return $this->chart_photo_components( $png_url, $title, $align );
	}

	/**
	 * @param string $url   Image URL.
	 * @param string $title Alt/caption text.
	 * @return array<int,array<string,mixed>>
	 */
	private function chart_photo_components( string $url, string $title, string $align = '' ): array {
		if ( in_array( $align, array( 'left', 'right' ), true ) && class_exists( '\PRC\Platform\Apple_News\ANF\ANF_Alignment' ) ) {
			$mapping = \PRC\Platform\Apple_News\ANF\ANF_Alignment::layout_for_alignment(
				$align,
				\PRC\Platform\Apple_News\ANF\ANF_Alignment::derive_width( $url )
			);

			if ( null !== $mapping ) {
				return array(
					\PRC\Platform\Apple_News\ANF\ANF_Alignment::apply_layout_to_component(
						array(
							'role' => 'photo',
							'URL'  => $url,
						),
						$mapping['layout'],
						$mapping['extra']
					),
				);
			}
		}

		$photo = array(
			'role'   => 'photo',
			'URL'    => $url,
			'layout' => 'full-width-image',
		);

		if ( '' === trim( $title ) ) {
			return array( $photo );
		}

		return array(
			array(
				'role'       => 'container',
				'layout'     => 'full-width-image',
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
	 * @param array $attrs Chart block attrs.
	 * @return string
	 */
	private function resolve_chart_png_url( array $attrs ): string {
		$io = $attrs['io'] ?? array();
		return is_string( $io['pngUrl'] ?? null ) && '' !== $io['pngUrl'] ? $io['pngUrl'] : '';
	}
}
