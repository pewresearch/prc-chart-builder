<?php
/**
 * Resolve static PNG / SVG thumbnail URLs for chart CPT posts.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Shared helpers for chart featured-image and io fallback URLs.
 */
class Chart_Static_Images {

	/**
	 * Resolve static PNG (or fallback) URLs for a chart post.
	 *
	 * Priority: featured image (server-generated PNG) → io.pngUrl → io.svgUrl.
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return array{url:string,thumbnailUrl:string,squareUrl:string}
	 */
	public static function resolve_static_image_urls( int $chart_post_id ): array {
		$thumbnail_id = (int) get_post_thumbnail_id( $chart_post_id );
		$url          = $thumbnail_id ? (string) wp_get_attachment_url( $thumbnail_id ) : '';

		if ( ! $url ) {
			$io  = self::get_chart_io_attributes( $chart_post_id );
			$url = (string) ( $io['pngUrl'] ?? '' );
			if ( ! $url && ! empty( $io['pngId'] ) ) {
				$url = (string) wp_get_attachment_url( (int) $io['pngId'] );
			}
			if ( ! $url ) {
				$url = (string) ( $io['svgUrl'] ?? '' );
			}
			if ( ! $url && ! empty( $io['svgId'] ) ) {
				$url = (string) wp_get_attachment_url( (int) $io['svgId'] );
			}
		}

		if ( ! $url ) {
			return array(
				'url'          => '',
				'thumbnailUrl' => '',
				'squareUrl'    => '',
			);
		}

		$thumbnail_url = $url;
		$square_url    = $url;

		if ( $thumbnail_id ) {
			$thumb = wp_get_attachment_image_url( $thumbnail_id, 'medium' );
			if ( $thumb ) {
				$thumbnail_url = $thumb;
			}
			$square = wp_get_attachment_image_url( $thumbnail_id, 'square' );
			if ( $square ) {
				$square_url = $square;
			}
		}

		return array(
			'url'          => $url,
			'thumbnailUrl' => $thumbnail_url,
			'squareUrl'    => $square_url,
		);
	}

	/**
	 * Read io attributes from the chart block inside a chart CPT post.
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return array<string,mixed>
	 */
	public static function get_chart_io_attributes( int $chart_post_id ): array {
		$content = (string) get_post_field( 'post_content', $chart_post_id );
		if ( '' === $content ) {
			return array();
		}

		$chart_block = self::find_chart_block( parse_blocks( $content ) );
		if ( null === $chart_block ) {
			return array();
		}

		$attrs = $chart_block['attrs'] ?? array();
		if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
			$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
		}

		return $attrs['io'] ?? array();
	}

	/**
	 * Find the first prc-chart-builder/chart block, searching one level of inner blocks.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array|null
	 */
	private static function find_chart_block( array $blocks ): ?array {
		foreach ( $blocks as $block ) {
			if ( 'prc-chart-builder/chart' === ( $block['blockName'] ?? '' ) ) {
				return $block;
			}
			foreach ( $block['innerBlocks'] ?? array() as $inner ) {
				if ( 'prc-chart-builder/chart' === ( $inner['blockName'] ?? '' ) ) {
					return $inner;
				}
			}
		}

		return null;
	}
}
