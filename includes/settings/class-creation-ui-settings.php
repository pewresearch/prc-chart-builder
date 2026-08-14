<?php
/**
 * Chart creation UI rollout setting.
 *
 * Short-term site-level toggle that switches empty Chart Builder Controllers
 * between the classic variation picker and the new guided wizard.
 *
 * Stored outside the portable chart theme so it is not imported/exported with
 * design defaults.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Creation UI option + REST endpoint.
 */
class Creation_UI_Settings {

	/**
	 * Per-site option holding the rollout boolean.
	 *
	 * @var string
	 */
	public const OPTION_KEY = 'prc_chart_builder_new_creation_ui';

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
	private const REST_ROUTE_PATH = '/creation-ui';

	/**
	 * Fully-qualified REST route for documentation / tests.
	 *
	 * @var string
	 */
	public const REST_ROUTE = '/prc-chart-builder/v1/creation-ui';

	/**
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'rest_api_init', $this, 'register_rest_routes' );
	}

	/**
	 * Whether the new chart creation UI is enabled for this site.
	 *
	 * Missing and non-boolean values resolve to false so sites fail closed
	 * into the classic picker. The option stores `{ enabled: bool }` rather
	 * than a bare boolean because WordPress option round-trips can coerce
	 * `true` to `1`.
	 */
	public static function is_enabled(): bool {
		$stored = get_option( self::OPTION_KEY, null );

		if ( ! is_array( $stored ) || array_is_list( $stored ) ) {
			return false;
		}

		return true === ( $stored['enabled'] ?? null );
	}

	/**
	 * Persist the rollout setting.
	 *
	 * @param bool $enabled Whether the new creation UI is enabled.
	 */
	public static function set_enabled( bool $enabled ): void {
		update_option(
			self::OPTION_KEY,
			array(
				'enabled' => $enabled,
			)
		);
	}

	/**
	 * Register creation-ui REST routes.
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
					'callback'            => array( $this, 'get_setting' ),
					'permission_callback' => array( $this, 'can_manage_settings' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'save_setting' ),
					'permission_callback' => array( $this, 'can_manage_settings' ),
				),
			)
		);
	}

	/**
	 * Whether the current user may read or write the creation UI setting.
	 */
	public function can_manage_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET /prc-chart-builder/v1/creation-ui
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_setting( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		return new WP_REST_Response(
			array(
				'enabled' => self::is_enabled(),
			),
			200
		);
	}

	/**
	 * POST /prc-chart-builder/v1/creation-ui
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_setting( WP_REST_Request $request ) {
		$body = $request->get_json_params();
		if ( ! is_array( $body ) || ! array_key_exists( 'enabled', $body ) || ! is_bool( $body['enabled'] ) ) {
			return new WP_Error(
				'invalid_creation_ui_setting',
				__( 'Creation UI setting must be a JSON object with a boolean `enabled` property.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		self::set_enabled( $body['enabled'] );

		return new WP_REST_Response(
			array(
				'enabled' => self::is_enabled(),
			),
			200
		);
	}
}
