<?php
/**
 * Idempotent legacy chart theme seeder (PRC-528 slice 9).
 *
 * Loads the frozen prc-legacy-theme.json snapshot and writes it to
 * prc_chart_builder_theme when the site has no active theme yet. Edit the JSON
 * directly when the legacy snapshot needs updating.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WP_Error;

/**
 * Seeds the per-site legacy PRC chart theme once.
 */
class Theme_Seeder {

	/**
	 * Committed legacy theme JSON filename.
	 *
	 * @var string
	 */
	public const LEGACY_THEME_FILENAME = 'prc-legacy-theme.json';

	/**
	 * Absolute path to the frozen legacy theme JSON.
	 */
	public static function get_legacy_theme_path(): string {
		return PRC_CHART_BUILDER_DIR . '/includes/settings/' . self::LEGACY_THEME_FILENAME;
	}

	/**
	 * Load and validate the frozen legacy theme payload.
	 *
	 * @return array<string, mixed>|WP_Error
	 */
	public static function load_legacy_theme() {
		$path = self::get_legacy_theme_path();

		if ( ! file_exists( $path ) ) {
			return new WP_Error(
				'legacy_theme_missing',
				sprintf(
					/* translators: %s: expected file path */
					__( 'Legacy chart theme file not found: %s', 'prc-chart-builder' ),
					$path
				)
			);
		}

		$decoded = json_decode( file_get_contents( $path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		if ( ! is_array( $decoded ) ) {
			return new WP_Error(
				'legacy_theme_invalid_json',
				__( 'Legacy chart theme file contains invalid JSON.', 'prc-chart-builder' )
			);
		}

		$validated = Theme_Validator::validate( $decoded );
		if ( is_wp_error( $validated ) ) {
			return new WP_Error(
				'legacy_theme_invalid_shape',
				sprintf(
					/* translators: %s: validation error message */
					__( 'Legacy chart theme file failed validation: %s', 'prc-chart-builder' ),
					$validated->get_error_message()
				)
			);
		}

		return $validated;
	}

	/**
	 * Whether this site already has a non-empty active chart theme.
	 */
	public static function has_active_theme(): bool {
		return array() !== Settings::get_active_theme();
	}

	/**
	 * Seed the legacy PRC theme when the option is unset or empty.
	 *
	 * @return bool|WP_Error True when seeded, false when skipped (idempotent no-op).
	 */
	public static function seed_if_empty() {
		if ( self::has_active_theme() ) {
			return false;
		}

		$legacy = self::load_legacy_theme();
		if ( is_wp_error( $legacy ) ) {
			return $legacy;
		}

		Settings::save_active_theme( $legacy );

		return true;
	}
}
