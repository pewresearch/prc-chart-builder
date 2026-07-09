<?php
/**
 * Chart theme REST API (PRC-528).
 *
 * Slice 7: read-only GET endpoint for the active chart theme.
 * Slice 8: POST persistence with validation and edge cache purge.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * REST controller for the per-site chart theme.
 */
class Theme_REST_Controller {

	private const REST_NAMESPACE = 'prc-chart-builder/v1';
	private const REST_ROUTE     = '/theme';

	/**
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'rest_api_init', $this, 'register_rest_routes' );
	}

	/**
	 * Register theme REST routes.
	 *
	 * @hook rest_api_init
	 */
	public function register_rest_routes(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_theme' ),
					'permission_callback' => array( $this, 'can_manage_theme' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'save_theme' ),
					'permission_callback' => array( $this, 'can_manage_theme' ),
				),
			)
		);
	}

	/**
	 * Whether the current user may read or write the chart theme.
	 *
	 * Admins and designers (edit_theme_options) — not writers/editors/authors.
	 */
	public function can_manage_theme(): bool {
		return current_user_can( 'edit_theme_options' );
	}

	/**
	 * GET /prc-chart-builder/v1/theme — return the active chart theme.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_theme( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- REST signature
		return new WP_REST_Response( Settings::get_active_theme(), 200 );
	}

	/**
	 * POST /prc-chart-builder/v1/theme — persist the active chart theme.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_theme( WP_REST_Request $request ) {
		$body = $request->get_json_params();

		$validated = Theme_Validator::validate( $body );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		Settings::save_active_theme( $validated );
		Theme_Cache_Invalidator::purge_edge_cache();

		/**
		 * Fires after the chart theme REST save completes.
		 *
		 * @param array<string, mixed> $theme Saved theme payload.
		 */
		do_action( 'prc_chart_builder_theme_saved', $validated );

		return new WP_REST_Response( Settings::get_active_theme(), 200 );
	}
}
