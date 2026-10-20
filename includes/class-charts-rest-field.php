<?php
/**
 * Read-only charts field for posts that embed synced charts.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Registers the charts field on public REST post types.
 */
class Charts_Rest_Field {

	/**
	 * Hook field registration.
	 *
	 * @param object $loader Hook loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'rest_api_init', $this, 'register_rest_fields' );
	}

	/**
	 * Register the charts field on public REST post types.
	 *
	 * The chart post type and attachments are excluded.
	 *
	 * @hook rest_api_init
	 * @return void
	 */
	public function register_rest_fields(): void {
		$post_types = get_post_types(
			array(
				'public'       => true,
				'show_in_rest' => true,
			)
		);
		unset( $post_types[ Content_Type::$post_type ], $post_types['attachment'] );

		if ( empty( $post_types ) ) {
			return;
		}

		register_rest_field(
			array_values( $post_types ),
			'charts',
			array(
				'get_callback' => array( $this, 'get_charts_field' ),
				'schema'       => array(
					'description' => __( 'Published charts embedded in this post.', 'prc-chart-builder' ),
					'type'        => 'array',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
					'items'       => array(
						'type'       => 'object',
						'properties' => array(
							'id'     => array(
								'type' => 'integer',
							),
							'title'  => array(
								'type' => 'string',
							),
							'pngUrl' => array(
								'type' => 'string',
							),
							'url'    => array(
								'type' => 'string',
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Published charts embedded in the post.
	 *
	 * @param array $post REST post array.
	 * @return array<int, array{id:int,title:string,pngUrl:string,url:string}>
	 */
	public function get_charts_field( array $post ): array {
		$post_id = (int) ( $post['id'] ?? 0 );
		if ( $post_id <= 0 || post_password_required( $post_id ) ) {
			return array();
		}

		$refs   = array_values(
			array_unique(
				Synced_Chart::extract_synced_chart_refs(
					(string) get_post_field( 'post_content', $post_id )
				)
			)
		);
		$charts = array();

		foreach ( $refs as $chart_id ) {
			$chart_id = (int) $chart_id;
			$chart    = get_post( $chart_id );
			if ( ! $chart instanceof \WP_Post ) {
				continue;
			}
			if ( Content_Type::$post_type !== $chart->post_type ) {
				continue;
			}
			if ( 'publish' !== $chart->post_status ) {
				continue;
			}
			if ( '' !== (string) $chart->post_password ) {
				continue;
			}

			$charts[] = array(
				'id'     => $chart_id,
				'title'  => wp_strip_all_tags( wp_specialchars_decode( get_the_title( $chart ), ENT_QUOTES ) ),
				'pngUrl' => Chart_Static_Images::resolve_png_url( $chart_id ),
				'url'    => (string) get_permalink( $chart_id ),
			);
		}

		return $charts;
	}
}
