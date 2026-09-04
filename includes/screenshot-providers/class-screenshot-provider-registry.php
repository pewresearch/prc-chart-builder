<?php
/**
 * Screenshot provider registry and resolution.
 *
 * @package PRC\Platform\Chart_Builder\Screenshot_Providers
 */

namespace PRC\Platform\Chart_Builder\Screenshot_Providers;

use PRC\Platform\Chart_Builder\Screenshot_Settings;

/**
 * Resolves which screenshot backend to use for chart PNG capture.
 */
class Screenshot_Provider_Registry {

	/**
	 * Auto-detect order when no provider slug is pinned.
	 *
	 * @var string[]
	 */
	public const AUTO_DETECT_ORDER = array(
		'screenshotone',
		'cloudflare',
		'firebase',
		'endpoint',
	);

	/**
	 * Registered provider instances keyed by slug.
	 *
	 * @return array<string, Screenshot_Provider>
	 */
	public static function get_providers(): array {
		$providers = array(
			'screenshotone' => new Screenshotone_Provider(),
			'cloudflare'    => new Cloudflare_Provider(),
			'firebase'      => new Firebase_Provider(),
			'endpoint'      => new Endpoint_Provider(),
		);

		/**
		 * Filter registered screenshot providers.
		 *
		 * @param array<string, Screenshot_Provider> $providers Providers keyed by slug.
		 */
		$providers = apply_filters( 'prc_chart_builder_screenshot_providers', $providers );

		return is_array( $providers ) ? $providers : array();
	}

	/**
	 * Resolve the active provider for this request.
	 *
	 * @return Screenshot_Provider|null Null when no provider is configured.
	 */
	public static function resolve(): ?Screenshot_Provider {
		$providers = self::get_providers();
		$slug      = self::resolve_slug();

		if ( '' !== $slug ) {
			if ( ! isset( $providers[ $slug ] ) ) {
				return null;
			}

			$provider = $providers[ $slug ];

			return $provider->is_configured() ? $provider : null;
		}

		foreach ( self::AUTO_DETECT_ORDER as $candidate ) {
			if ( ! isset( $providers[ $candidate ] ) ) {
				continue;
			}

			$provider = $providers[ $candidate ];
			if ( $provider->is_configured() ) {
				return $provider;
			}
		}

		return null;
	}

	/**
	 * Read the VIP constant pin, when one is set.
	 *
	 * @return string Empty string when the constant is unset or blank.
	 */
	public static function get_constant_slug(): string {
		if ( ! defined( 'PRC_PLATFORM_CHART_SCREENSHOT_PROVIDER' ) ) {
			return '';
		}

		$constant = constant( 'PRC_PLATFORM_CHART_SCREENSHOT_PROVIDER' );

		return is_string( $constant ) ? $constant : '';
	}

	/**
	 * Read the pinned provider slug from constants, settings, and filters.
	 *
	 * @return string Empty string selects auto-detect.
	 */
	public static function resolve_slug(): string {
		$slug = self::get_constant_slug();

		if ( '' === $slug && class_exists( '\\PRC\\Platform\\Chart_Builder\\Screenshot_Settings' ) ) {
			$slug = Screenshot_Settings::get_provider_slug();
		}

		/**
		 * Filter the selected screenshot provider slug.
		 *
		 * Runs after the platform constant and site settings are read. Return
		 * an empty string to auto-detect the first configured provider.
		 *
		 * @param string $slug Provider slug from the constant, settings, or empty.
		 */
		$slug = apply_filters( 'prc_chart_builder_screenshot_provider', $slug );

		return is_string( $slug ) ? $slug : '';
	}
}
