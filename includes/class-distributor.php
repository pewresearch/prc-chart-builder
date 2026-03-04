<?php
/**
 * Distributor Integration
 *
 * Provides Distributor support for chart builder, enabling automatic remapping
 * of chart post IDs and attachment IDs when content is distributed.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

use WP_Error;

/**
 * Distributor Integration class.
 *
 * Handles:
 * - Remapping `ref` attribute in synced-chart blocks (chart post IDs)
 * - Remapping `io.staticImageId` and `io.pngId` in chart blocks (attachment IDs)
 * - Excluding usage tracking meta from distribution
 *
 * @package PRC\Platform\Chart_Builder
 */
class Distributor {
	/**
	 * Construct the Distributor integration class.
	 *
	 * @param mixed $loader The loader instance.
	 */
	public function __construct( $loader = null ) {
		$this->init( $loader );
	}

	/**
	 * Initialize hooks.
	 *
	 * @param mixed $loader The loader instance.
	 */
	public function init( $loader = null ): void {
		if ( null !== $loader ) {
			// Register data handlers on init (after Distributor loads).
			$loader->add_action( 'init', $this, 'register_distributor_data', 20 );
		}
	}

	/**
	 * Check if the Distributor plugin is active.
	 *
	 * @return bool True if Distributor is active.
	 */
	public static function is_distributor_active(): bool {
		return function_exists( 'distributor_register_data' );
	}

	/**
	 * Register custom data handlers with Distributor.
	 *
	 * @hook init
	 */
	public function register_distributor_data(): void {
		if ( ! self::is_distributor_active() ) {
			return;
		}

		// 1. Handle synced-chart ref (chart post ID in block content).
		// Uses built-in 'post' type which will pull/find the chart on target site.
		distributor_register_data(
			'prc_synced_chart_ref',
			array(
				'location'   => 'post_content',
				'attributes' => array(
					'block_name'      => 'prc-chart-builder/synced-chart',
					'block_attribute' => 'ref',
				),
				'type'       => 'post',
			)
		);

		// 2. Handle chart static image ID (nested in io object).
		distributor_register_data(
			'prc_chart_static_image',
			array(
				'location'           => 'post_content',
				'attributes'         => array(
					'block_name'      => 'prc-chart-builder/chart',
					'block_attribute' => array( 'io', 'staticImageId' ),
				),
				'pre_distribute_cb'  => array( self::class, 'nested_media_pre_distribute' ),
				'post_distribute_cb' => array( self::class, 'nested_media_post_distribute' ),
			)
		);

		// 3. Handle chart PNG ID (nested in io object).
		distributor_register_data(
			'prc_chart_png',
			array(
				'location'           => 'post_content',
				'attributes'         => array(
					'block_name'      => 'prc-chart-builder/chart',
					'block_attribute' => array( 'io', 'pngId' ),
				),
				'pre_distribute_cb'  => array( self::class, 'nested_media_pre_distribute' ),
				'post_distribute_cb' => array( self::class, 'nested_media_post_distribute' ),
			)
		);

		// 4. Exclude usage tracking meta from distribution (rebuilds automatically on render).
		add_filter( 'dt_excluded_meta', array( self::class, 'exclude_usage_meta' ) );
	}

	/**
	 * Pre-distribute callback for nested media attributes.
	 *
	 * Handles the io.staticImageId and io.pngId attributes which may be
	 * empty strings or integers.
	 *
	 * @param mixed $attr_value     The attribute value (attachment ID or empty string).
	 * @param int   $source_post_id The source post ID.
	 * @return array Extra data for the attachment.
	 */
	public static function nested_media_pre_distribute( $attr_value, int $source_post_id ): array {
		// Handle empty values - io.staticImageId and io.pngId may be empty strings.
		if ( empty( $attr_value ) || '' === $attr_value ) {
			return array();
		}

		$attachment_id = (int) $attr_value;

		if ( $attachment_id <= 0 ) {
			return array();
		}

		// Use Distributor's built-in media pre-distribute callback.
		if ( function_exists( 'distributor_media_pre_distribute_callback' ) ) {
			$media_data = distributor_media_pre_distribute_callback( $attachment_id, $source_post_id );
			return ! empty( $media_data ) ? $media_data : array();
		}

		// Fallback: collect basic attachment data.
		$attachment = get_post( $attachment_id );
		if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
			return array();
		}

		return array(
			'source_attachment_id' => $attachment_id,
			'url'                  => wp_get_attachment_url( $attachment_id ),
		);
	}

	/**
	 * Post-distribute callback for nested media attributes.
	 *
	 * Remaps the attachment ID using Distributor's built-in media callback.
	 *
	 * @param array $extra_data      The extra data from pre-distribute.
	 * @param mixed $source_value    The original attribute value.
	 * @param array $post_data       The post data being distributed.
	 * @param array $connection_data The connection data (unused but required by interface).
	 * @return mixed The new attachment ID or original value.
	 */
	public static function nested_media_post_distribute( array $extra_data, $source_value, array $post_data, array $connection_data = array() ) {
		// Handle empty values.
		if ( empty( $source_value ) || '' === $source_value || empty( $extra_data ) ) {
			return $source_value;
		}

		$source_id = (int) $source_value;

		if ( $source_id <= 0 ) {
			return $source_value;
		}

		// Use Distributor's built-in media post-distribute callback.
		if ( function_exists( 'distributor_media_post_distribute_callback' ) ) {
			$new_id = distributor_media_post_distribute_callback(
				$extra_data,
				$source_id,
				$post_data
			);

			if ( $new_id && ! is_wp_error( $new_id ) && is_numeric( $new_id ) ) {
				return (int) $new_id;
			}
		}

		// Return original value if remapping failed.
		return $source_value;
	}

	/**
	 * Exclude usage tracking meta from distribution.
	 *
	 * The prc_synced_chart_used_in_posts meta tracks which posts use a chart.
	 * This data is specific to the source site and rebuilds automatically
	 * when posts with synced-chart blocks are rendered on the target site.
	 *
	 * @hook dt_excluded_meta
	 *
	 * @param array $excluded Array of meta keys to exclude from distribution.
	 * @return array Modified array with usage meta excluded.
	 */
	public static function exclude_usage_meta( array $excluded ): array {
		$excluded[] = Synced_Chart::$synced_chart_usage_meta_key;
		return $excluded;
	}
}
