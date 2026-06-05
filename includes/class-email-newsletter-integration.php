<?php
declare(strict_types=1);
/**
 * Integration with prc-email-builder's deterministic email pipeline.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use PRC\Platform\Email_Builder\Email_Block_Integration;

/**
 * Connects prc-chart-builder with the newsletter builder email pipeline.
 *
 * @package PRC\Platform\Chart_Builder
 */
class Email_Newsletter_Integration {

	/**
	 * @param Loader $loader The loader instance.
	 */
	public function __construct( $loader ) {
		$loader->add_action(
			'prc_email_builder_register_email_callbacks',
			$this,
			'register_email_callbacks'
		);
	}

	/**
	 * @hook prc_email_builder_register_email_callbacks
	 */
	public function register_email_callbacks(): void {
		if ( ! class_exists( '\PRC\Platform\Email_Builder\Email_Block_Registry' ) ) {
			return;
		}

		\PRC\Platform\Email_Builder\Email_Block_Registry::register(
			'prc-chart-builder/synced-chart',
			array( $this, 'synced_chart_to_email_html' )
		);

		\PRC\Platform\Email_Builder\Email_Block_Registry::register(
			'prc-chart-builder/controller',
			array( $this, 'controller_to_email_html' )
		);

		\PRC\Platform\Email_Builder\Email_Block_Registry::register(
			'prc-chart-builder/chart',
			'__return_empty_string'
		);
	}

	/**
	 * @param array    $block Parsed block.
	 * @param \WP_Post $post  Post.
	 * @return string
	 */
	public function synced_chart_to_email_html( array $block, \WP_Post $post ): string {
		$ref   = $block['attrs']['ref'] ?? null;
		$align = sanitize_key( (string) ( $block['attrs']['align'] ?? '' ) );

		if ( ! $ref ) {
			return '';
		}

		$chart_post = get_post( (int) $ref );
		if ( ! $chart_post || Content_Type::$post_type !== $chart_post->post_type ) {
			return '';
		}

		$allowed_statuses = array( 'publish' );
		if ( is_user_logged_in() || is_preview() || 'publish' === $post->post_status ) {
			$allowed_statuses[] = 'draft';
			$allowed_statuses[] = 'future';
			$allowed_statuses[] = 'private';
		}
		if ( ! in_array( $chart_post->post_status, $allowed_statuses, true ) ) {
			return '';
		}

		$thumbnail_id = get_post_thumbnail_id( $chart_post->ID );
		if ( $thumbnail_id ) {
			$png_url = wp_get_attachment_url( $thumbnail_id );
			if ( $png_url ) {
				$title = get_the_title( $chart_post ) ?: 'Chart';
				return $this->chart_image_markup( $png_url, wp_strip_all_tags( $title ), $align, 0 );
			}
		}

		$chart_blocks = parse_blocks( $chart_post->post_content );
		foreach ( $chart_blocks as $chart_block ) {
			if ( 'prc-chart-builder/controller' === ( $chart_block['blockName'] ?? '' ) ) {
				return $this->controller_to_email_html( $chart_block, $post );
			}
		}

		return '';
	}

	/**
	 * @param array    $block Parsed block.
	 * @param \WP_Post $post  Post.
	 * @return string
	 */
	public function controller_to_email_html( array $block, \WP_Post $post ): string {
		$align        = sanitize_key( (string) ( $block['attrs']['align'] ?? '' ) );
		$inner_blocks = $block['innerBlocks'] ?? array();
		$chart_block  = null;

		foreach ( $inner_blocks as $inner ) {
			if ( 'prc-chart-builder/chart' === ( $inner['blockName'] ?? '' ) ) {
				$chart_block = $inner;
				break;
			}
		}

		if ( ! $chart_block ) {
			return '';
		}

		$attrs = $chart_block['attrs'] ?? array();

		if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
			$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
		}

		$png_url = $this->resolve_chart_png_url( $attrs );
		if ( '' === $png_url ) {
			return '';
		}

		$metadata = $attrs['metadata'] ?? array();
		$title    = wp_strip_all_tags( $metadata['title'] ?? 'Chart' );

		return $this->chart_image_markup( $png_url, $title, $align, 0 );
	}

	/**
	 * @param string $url   Image URL.
	 * @param string $title Alt text.
	 * @param string $align Block alignment.
	 * @param int    $width Declared width (0 = default).
	 * @return string
	 */
	private function chart_image_markup( string $url, string $title, string $align, int $width ): string {
		if ( ! class_exists( Email_Block_Integration::class ) ) {
			return $this->legacy_chart_image_table( $url, $title );
		}

		return Email_Block_Integration::build_image_markup( $url, $title, $align, $width );
	}

	/**
	 * Fallback when newsletter-builder is not loaded.
	 *
	 * @param string $url   Image URL.
	 * @param string $title Alt text.
	 * @return string
	 */
	private function legacy_chart_image_table( string $url, string $title ): string {
		return sprintf(
			'<table width="100%%" cellpadding="0" cellspacing="0" border="0" role="presentation">'
			. '<tr><td style="padding:16px 0;">'
			. '<img src="%s" alt="%s" width="536" style="display:block;max-width:100%%;height:auto;border:0;" />'
			. '</td></tr></table>',
			esc_url( $url ),
			esc_attr( $title )
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
