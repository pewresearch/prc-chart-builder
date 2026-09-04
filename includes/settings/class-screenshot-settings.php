<?php
/**
 * Chart screenshot capture settings.
 *
 * Site-level defaults for PNG capture. Stored outside the portable chart
 * theme so import / export never overwrite provider or viewport choices.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use PRC\Platform\Chart_Builder\Screenshot_Providers\Screenshot_Capture_Spec;
use PRC\Platform\Chart_Builder\Screenshot_Providers\Screenshot_Provider_Registry;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Screenshot option + REST endpoint.
 */
class Screenshot_Settings {

	/**
	 * Per-site option holding screenshot defaults.
	 *
	 * @var string
	 */
	public const OPTION_KEY = 'prc_chart_builder_screenshot_settings';

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
	private const REST_ROUTE_PATH = '/screenshot-settings';

	/**
	 * Fully-qualified REST route for documentation / tests.
	 *
	 * @var string
	 */
	public const REST_ROUTE = '/prc-chart-builder/v1/screenshot-settings';

	/**
	 * Human-readable labels for first-party providers.
	 *
	 * @var array<string, string>
	 */
	public const PROVIDER_LABELS = array(
		'screenshotone' => 'ScreenshotOne',
		'cloudflare'    => 'Cloudflare Browser Rendering',
		'firebase'      => 'Firebase screenshotElement',
		'endpoint'      => 'Signed HTTP endpoint',
	);

	/**
	 * VIP constants that configure each first-party provider.
	 *
	 * Values are never exposed. The settings UI only shows the name and
	 * whether the constant is defined and non-empty.
	 *
	 * @var array<string, string[]>
	 */
	public const PROVIDER_CONSTANTS = array(
		'screenshotone' => array(
			'PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY',
			'PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY',
		),
		'cloudflare'    => array(
			'PRC_PLATFORM_CLOUDFLARE_ACCOUNT_ID',
			'PRC_PLATFORM_CLOUDFLARE_BROWSER_RENDERING_API_TOKEN',
		),
		'firebase'      => array(
			'PRC_PLATFORM_FIREBASE_KEY',
			'PRC_PLATFORM_FIREBASE_PROJECT_ID',
		),
		'endpoint'      => array(
			'PRC_PLATFORM_CHART_SCREENSHOT_ENDPOINT_URL',
			'PRC_PLATFORM_CHART_SCREENSHOT_ENDPOINT_KEY',
		),
	);

	/**
	 * Maximum delay editors may persist, in seconds.
	 *
	 * @var int
	 */
	private const MAX_DELAY_SECONDS = 60;

	/**
	 * Maximum side padding editors may persist, in pixels.
	 *
	 * @var int
	 */
	private const MAX_SIDE_PADDING = 200;

	/**
	 * Maximum device scale factor editors may persist.
	 *
	 * @var int
	 */
	private const MAX_DEVICE_SCALE_FACTOR = 3;

	/**
	 * Constructor.
	 *
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'rest_api_init', $this, 'register_rest_routes' );
	}

	/**
	 * Hardcoded capture defaults. Match Screenshot_Service / Capture_Spec constants.
	 *
	 * @return array<string, int|string>
	 */
	public static function get_defaults(): array {
		return array(
			'provider'              => '',
			'selector'              => Screenshot_Capture_Spec::DEFAULT_SELECTOR,
			'delay_seconds'         => Screenshot_Capture_Spec::DEFAULT_DELAY_SECONDS,
			'device_scale_factor'   => Screenshot_Capture_Spec::DEFAULT_DEVICE_SCALE_FACTOR,
			'viewport_side_padding' => Screenshot_Capture_Spec::DEFAULT_VIEWPORT_SIDE_PADDING,
			'default_chart_width'   => Screenshot_Service::DEFAULT_CHART_WIDTH,
			'default_chart_height'  => Screenshot_Service::DEFAULT_CHART_HEIGHT,
		);
	}

	/**
	 * Merged, sanitized settings for this site.
	 *
	 * @return array<string, int|string>
	 */
	public static function get_settings(): array {
		$stored = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $stored ) || array_is_list( $stored ) ) {
			$stored = array();
		}

		return self::sanitize_settings( array_merge( self::get_defaults(), $stored ) );
	}

	/**
	 * Persist sanitized screenshot settings.
	 *
	 * @param array<string, mixed> $settings Raw settings payload.
	 * @return array<string, int|string>
	 */
	public static function save_settings( array $settings ): array {
		$sanitized = self::sanitize_settings( array_merge( self::get_defaults(), $settings ) );
		update_option( self::OPTION_KEY, $sanitized );

		return $sanitized;
	}

	/**
	 * Provider slug stored in settings. Empty string means auto-detect.
	 *
	 * @return string
	 */
	public static function get_provider_slug(): string {
		$provider = self::get_settings()['provider'];

		return is_string( $provider ) ? $provider : '';
	}

	/**
	 * REST catalog, current settings, and resolution metadata.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_rest_payload(): array {
		$constant_slug = Screenshot_Provider_Registry::get_constant_slug();
		$resolved      = Screenshot_Provider_Registry::resolve();

		return array(
			'settings'          => self::get_settings(),
			'defaults'          => self::get_defaults(),
			'providers'         => self::get_provider_catalog(),
			'resolved_provider' => $resolved ? $resolved->get_slug() : '',
			'provider_locked'   => '' !== $constant_slug,
			'locked_provider'   => $constant_slug,
		);
	}

	/**
	 * Register screenshot settings REST routes.
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
	 * Whether the current user may read or write screenshot settings.
	 */
	public function can_manage_settings(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET /prc-chart-builder/v1/screenshot-settings
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_setting( WP_REST_Request $request ): WP_REST_Response { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		return new WP_REST_Response( self::get_rest_payload(), 200 );
	}

	/**
	 * POST /prc-chart-builder/v1/screenshot-settings
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_setting( WP_REST_Request $request ) {
		$body = $request->get_json_params();
		if ( ! is_array( $body ) || array_is_list( $body ) ) {
			return new WP_Error(
				'invalid_screenshot_settings',
				__( 'Screenshot settings must be a JSON object.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		$incoming = isset( $body['settings'] ) && is_array( $body['settings'] ) && ! array_is_list( $body['settings'] )
			? $body['settings']
			: $body;

		if ( '' !== Screenshot_Provider_Registry::get_constant_slug() ) {
			unset( $incoming['provider'] );
		}

		self::save_settings( array_merge( self::get_settings(), $incoming ) );

		return new WP_REST_Response( self::get_rest_payload(), 200 );
	}

	/**
	 * Sanitize a settings payload against known keys and ranges.
	 *
	 * @param array<string, mixed> $settings Raw or merged settings.
	 * @return array<string, int|string>
	 */
	public static function sanitize_settings( array $settings ): array {
		$defaults = self::get_defaults();
		$allowed  = array_keys( Screenshot_Provider_Registry::get_providers() );

		$provider = isset( $settings['provider'] ) ? sanitize_key( (string) $settings['provider'] ) : '';
		if ( '' !== $provider && ! in_array( $provider, $allowed, true ) ) {
			$provider = '';
		}

		$selector = isset( $settings['selector'] ) ? sanitize_text_field( (string) $settings['selector'] ) : '';
		if ( '' === $selector ) {
			$selector = $defaults['selector'];
		}

		return array(
			'provider'              => $provider,
			'selector'              => $selector,
			'delay_seconds'         => self::clamp_int( $settings['delay_seconds'] ?? $defaults['delay_seconds'], 0, self::MAX_DELAY_SECONDS ),
			'device_scale_factor'   => self::clamp_int( $settings['device_scale_factor'] ?? $defaults['device_scale_factor'], 1, self::MAX_DEVICE_SCALE_FACTOR ),
			'viewport_side_padding' => self::clamp_int( $settings['viewport_side_padding'] ?? $defaults['viewport_side_padding'], 0, self::MAX_SIDE_PADDING ),
			'default_chart_width'   => self::clamp_int( $settings['default_chart_width'] ?? $defaults['default_chart_width'], 1, Screenshot_Capture_Spec::MAX_VIEWPORT_PX ),
			'default_chart_height'  => self::clamp_int( $settings['default_chart_height'] ?? $defaults['default_chart_height'], 1, Screenshot_Capture_Spec::MAX_VIEWPORT_PX ),
		);
	}

	/**
	 * Provider catalog for the settings UI.
	 *
	 * @return array<int, array{slug: string, label: string, configured: bool, constants: array<int, array{name: string, set: bool}>}>
	 */
	public static function get_provider_catalog(): array {
		$catalog = array();

		foreach ( Screenshot_Provider_Registry::get_providers() as $slug => $provider ) {
			if ( ! is_string( $slug ) || '' === $slug ) {
				continue;
			}

			$catalog[] = array(
				'slug'       => $slug,
				'label'      => self::PROVIDER_LABELS[ $slug ] ?? $slug,
				'configured' => is_object( $provider ) && method_exists( $provider, 'is_configured' )
					? (bool) $provider->is_configured()
					: false,
				'constants'  => self::get_provider_constant_status( $slug ),
			);
		}

		return $catalog;
	}

	/**
	 * Credential-safe status for a provider's configuration variables.
	 *
	 * @param string $slug Provider slug.
	 * @return array<int, array{name: string, set: bool}>
	 */
	public static function get_provider_constant_status( string $slug ): array {
		$status = array();

		foreach ( self::PROVIDER_CONSTANTS[ $slug ] ?? array() as $name ) {
			if ( ! is_string( $name ) || '' === $name ) {
				continue;
			}

			$status[] = array(
				'name' => $name,
				'set'  => self::is_nonempty_constant( $name ),
			);
		}

		if ( 'firebase' === $slug ) {
			$status[] = array(
				'name' => 'PRC_PLATFORM_FIREBASE_SERVICE_ACCOUNT',
				'set'  => self::is_firebase_service_account_present(),
			);
		}

		return $status;
	}

	/**
	 * Whether the Firebase service-account JSON file is present.
	 *
	 * Screenshot capture mints an OIDC token from that file. The Platform
	 * Secret title is PRC_PLATFORM_FIREBASE_SERVICE_ACCOUNT. The value is
	 * never read here.
	 */
	private static function is_firebase_service_account_present(): bool {
		if ( ! defined( 'WPCOM_VIP_PRIVATE_DIR' ) ) {
			return false;
		}

		$path = \WPCOM_VIP_PRIVATE_DIR . '/firebase-service-account.json';

		return is_readable( $path );
	}

	/**
	 * Whether a named constant is defined and non-empty.
	 *
	 * Does not return the constant value.
	 *
	 * @param string $name Constant name.
	 */
	private static function is_nonempty_constant( string $name ): bool {
		if ( ! defined( $name ) ) {
			return false;
		}

		$value = constant( $name );

		return is_string( $value ) ? '' !== $value : ! empty( $value );
	}

	/**
	 * Clamp a numeric value to an inclusive integer range.
	 *
	 * @param mixed $value Raw value.
	 * @param int   $min   Minimum.
	 * @param int   $max   Maximum.
	 * @return int
	 */
	private static function clamp_int( mixed $value, int $min, int $max ): int {
		$int = is_numeric( $value ) ? (int) $value : $min;

		return max( $min, min( $max, $int ) );
	}
}
