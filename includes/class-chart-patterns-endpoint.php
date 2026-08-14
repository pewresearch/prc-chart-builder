<?php
/**
 * Cached REST endpoint for chart-builder pattern library (metadata + content).
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

use WP_REST_Request;
use WP_REST_Response;

/**
 * Serves a lightweight pattern library index for the creation wizard.
 */
class Chart_Patterns_Endpoint {

	/**
	 * Transient key for the cached index.
	 *
	 * @var string
	 */
	public const TRANSIENT_KEY = 'prc_chart_builder_pattern_index_v2';

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	private const REST_NAMESPACE = 'prc-chart-builder/v1';

	/**
	 * REST route path (without namespace).
	 *
	 * @var string
	 */
	private const REST_ROUTE_PATH = '/chart-patterns';

	/**
	 * Fully-qualified REST route for documentation / tests.
	 *
	 * @var string
	 */
	public const REST_ROUTE = '/prc-chart-builder/v1/chart-patterns';

	/**
	 * Pattern category prefix.
	 *
	 * @var string
	 */
	private const CHART_PATTERN_PREFIX = 'prc-chart-builder-';

	/**
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'rest_api_init', $this, 'register_rest_routes' );
		$loader->add_action( 'save_post_wp_block', $this, 'invalidate_cache', 10, 0 );
		$loader->add_action( 'deleted_post', $this, 'maybe_invalidate_on_delete', 10, 2 );
	}

	/**
	 * Register chart-patterns REST route.
	 *
	 * @hook rest_api_init
	 */
	public function register_rest_routes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE_PATH,
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_pattern_index' ),
					'permission_callback' => array( $this, 'can_read_patterns' ),
				),
			)
		);
	}

	/**
	 * Whether the current user may read the pattern index.
	 */
	public function can_read_patterns(): bool {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * REST callback: return cached pattern index.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_pattern_index( WP_REST_Request $request ): WP_REST_Response {
		unset( $request );
		$cached = get_transient( self::TRANSIENT_KEY );
		if ( is_array( $cached ) && isset( $cached['patterns'], $cached['counts'], $cached['version'] ) ) {
			return new WP_REST_Response( $cached, 200 );
		}

		$payload = $this->build_index();
		set_transient( self::TRANSIENT_KEY, $payload, DAY_IN_SECONDS );

		return new WP_REST_Response( $payload, 200 );
	}

	/**
	 * Build the pattern index from wp_block posts and pattern categories.
	 *
	 * @return array{patterns: array<int, array>, counts: array<string, int>, version: string}
	 */
	public function build_index(): array {
		$terms = get_terms(
			array(
				'taxonomy'   => 'wp_pattern_category',
				'hide_empty' => false,
				'number'     => 100,
			)
		);

		$term_id_to_slug = array();
		$chart_term_ids  = array();
		if ( ! is_wp_error( $terms ) ) {
			foreach ( $terms as $term ) {
				$term_id_to_slug[ (int) $term->term_id ] = (string) $term->slug;
				if ( str_starts_with( (string) $term->slug, self::CHART_PATTERN_PREFIX ) ) {
					$chart_term_ids[] = (int) $term->term_id;
				}
			}
		}

		$patterns = array();
		$counts   = array();

		if ( empty( $chart_term_ids ) ) {
			return array(
				'patterns' => array(),
				'counts'   => array(),
				'version'  => $this->compute_version( array() ),
			);
		}

		$query = new \WP_Query(
			array(
				'post_type'      => 'wp_block',
				'post_status'    => array( 'publish', 'draft', 'private' ),
				'posts_per_page' => 2000,
				'no_found_rows'  => true,
				'tax_query'      => array(
					array(
						'taxonomy' => 'wp_pattern_category',
						'field'    => 'term_id',
						'terms'    => $chart_term_ids,
					),
				),
			)
		);

		foreach ( $query->posts as $post ) {
			if ( ! $post instanceof \WP_Post ) {
				continue;
			}

			$post_terms = wp_get_post_terms( $post->ID, 'wp_pattern_category', array( 'fields' => 'ids' ) );
			if ( is_wp_error( $post_terms ) ) {
				continue;
			}

			$type_slug = '';
			foreach ( $post_terms as $term_id ) {
				$slug = $term_id_to_slug[ (int) $term_id ] ?? '';
				if ( str_starts_with( $slug, self::CHART_PATTERN_PREFIX ) ) {
					$type_slug = substr( $slug, strlen( self::CHART_PATTERN_PREFIX ) );
					$counts[ $type_slug ] = ( $counts[ $type_slug ] ?? 0 ) + 1;
					break;
				}
			}

			if ( '' === $type_slug ) {
				continue;
			}

			$patterns[] = array(
				'id'       => (int) $post->ID,
				'title'    => get_the_title( $post ),
				'excerpt'  => (string) $post->post_excerpt,
				'typeSlug' => $type_slug,
				'content'  => (string) $post->post_content,
			);
		}

		return array(
			'patterns' => $patterns,
			'counts'   => $counts,
			'version'  => $this->compute_version( $patterns ),
		);
	}

	/**
	 * Compute a cache version hash from pattern ids and modified times.
	 *
	 * @param array<int, array{id: int}> $patterns Pattern rows.
	 * @return string
	 */
	private function compute_version( array $patterns ): string {
		if ( empty( $patterns ) ) {
			return md5( 'empty' );
		}

		$ids = wp_list_pluck( $patterns, 'id' );
		$modified_parts = array();
		foreach ( $ids as $id ) {
			$modified_parts[] = (int) $id . ':' . (string) get_post_modified_time( 'U', true, (int) $id );
		}

		return md5( implode( '|', $modified_parts ) );
	}

	/**
	 * Invalidate the cached pattern index.
	 *
	 * @hook save_post_wp_block
	 */
	public function invalidate_cache(): void {
		delete_transient( self::TRANSIENT_KEY );
	}

	/**
	 * Invalidate cache when a wp_block post is deleted.
	 *
	 * @hook deleted_post
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 */
	public function maybe_invalidate_on_delete( int $post_id, $post ): void {
		if ( $post instanceof \WP_Post && 'wp_block' === $post->post_type ) {
			$this->invalidate_cache();
		}
	}
}
