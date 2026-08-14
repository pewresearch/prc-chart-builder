<?php
/**
 * Idempotent chart theme seeder (PRC-528 slice 9 / PRC-560).
 *
 * Loads the committed chart-theme.json fallback snapshot and writes it to
 * prc_chart_builder_theme when the site has no active theme yet. Edit the JSON
 * directly when the fallback snapshot needs updating.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WP_Error;

/**
 * Seeds the per-site fallback chart theme once.
 */
class Theme_Seeder {

	/**
	 * Committed fallback theme JSON filename.
	 *
	 * @var string
	 */
	public const THEME_FILENAME = 'chart-theme.json';

	/**
	 * Absolute path to the committed fallback theme JSON.
	 */
	public static function get_theme_file_path(): string {
		return PRC_CHART_BUILDER_DIR . '/includes/settings/' . self::THEME_FILENAME;
	}

	/**
	 * Load and validate the committed fallback theme payload.
	 *
	 * @return array<string, mixed>|WP_Error
	 */
	public static function load_theme_file() {
		$path = self::get_theme_file_path();

		if ( ! file_exists( $path ) ) {
			return new WP_Error(
				'theme_file_missing',
				sprintf(
					/* translators: %s: expected file path */
					__( 'Chart theme file not found: %s', 'prc-chart-builder' ),
					$path
				)
			);
		}

		$decoded = json_decode( file_get_contents( $path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		if ( ! is_array( $decoded ) ) {
			return new WP_Error(
				'theme_file_invalid_json',
				__( 'Chart theme file contains invalid JSON.', 'prc-chart-builder' )
			);
		}

		$validated = Theme_Validator::validate( $decoded );
		if ( is_wp_error( $validated ) ) {
			return new WP_Error(
				'theme_file_invalid_shape',
				sprintf(
					/* translators: %s: validation error message */
					__( 'Chart theme file failed validation: %s', 'prc-chart-builder' ),
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
	 * Seed the fallback chart theme when the option is unset or empty.
	 *
	 * @return bool|WP_Error True when seeded, false when skipped (idempotent no-op).
	 */
	public static function seed_if_empty() {
		if ( self::has_active_theme() ) {
			return false;
		}

		$theme = self::load_theme_file();
		if ( is_wp_error( $theme ) ) {
			return $theme;
		}

		Settings::save_active_theme( $theme );

		return true;
	}
}
