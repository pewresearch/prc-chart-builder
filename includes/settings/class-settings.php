<?php
/**
 * Chart theme settings — the per-site "active chart theme" (PRC-528).
 *
 * Slice 1 scope: store the theme in a per-site option, expose it via
 * get_active_theme(), and deliver it to the editor + frontend as the
 * window.prcChartBuilderTheme global that the resolve layer
 * (src/chart/utils/resolve-defaults.js) already consumes.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Active chart theme storage + delivery.
 */
class Settings {

	/**
	 * Per-site option holding the active chart theme.
	 *
	 * Shape: { config: PartialAttributes, palettes: {...} }.
	 * Per-role fontFamily defaults live in config (Bucket 3); palette names in
	 * palettes (Bucket 2). Actual font families are owned by theme.json (Bucket 1).
	 *
	 * @var string
	 */
	const OPTION_KEY = 'prc_chart_builder_theme';

	/**
	 * Constructor.
	 *
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		// Print early in document head so the global exists before any chart-builder
		// bundle evaluates variation templates (which call mergeWithDefaults at import).
		$loader->add_action( 'wp_head', $this, 'print_theme_global', 1 );
		$loader->add_action( 'admin_head', $this, 'print_theme_global', 1 );

		// Slice 4: server-side layout default parity with the editor filter.
		$loader->add_filter(
			'register_block_type_args',
			Theme_Block_Defaults::class,
			'filter_register_block_type_args',
			10,
			2
		);
	}

	/**
	 * The active chart theme for this site.
	 *
	 * Returns an empty array when unset or corrupt (non-array or list-shaped),
	 * which the resolve layer treats as "no theme" — identical to pre-theme behavior.
	 *
	 * @return array
	 */
	public static function get_active_theme(): array {
		$theme = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $theme ) || array_is_list( $theme ) ) {
			return array();
		}

		return self::repair_invalid_palette_colors( $theme );
	}

	/**
	 * Whether palettes.colors is a non-empty slug → swatch map.
	 *
	 * @param array<string, mixed> $theme Active theme option value.
	 */
	public static function palette_colors_are_valid( array $theme ): bool {
		if ( ! isset( $theme['palettes']['colors'] ) || ! is_array( $theme['palettes']['colors'] ) ) {
			return false;
		}

		$colors = $theme['palettes']['colors'];

		if ( array_is_list( $colors ) || array() === $colors ) {
			return false;
		}

		foreach ( $colors as $swatches ) {
			if ( is_array( $swatches ) && array_is_list( $swatches ) && array() !== $swatches ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Count of named palette catalogs with at least one swatch.
	 *
	 * @param array<string, mixed> $theme Active theme option value.
	 */
	public static function count_palette_colors( array $theme ): int {
		if ( ! self::palette_colors_are_valid( $theme ) ) {
			return 0;
		}

		return count( $theme['palettes']['colors'] );
	}

	/**
	 * Whether palettes.colors is a non-empty slug → swatch map.
	 *
	 * @param array<string, mixed> $theme Active theme option value.
	 */
	private static function palettes_colors_are_valid( array $theme ): bool {
		return self::palette_colors_are_valid( $theme );
	}

	/**
	 * Restore palette swatches corrupted by the slice-8 validator bug (colors: []).
	 *
	 * When colorNames survived but colors were stripped, merge from the frozen
	 * legacy theme file and persist so the next request is clean.
	 *
	 * @param array<string, mixed> $theme Active theme option value.
	 * @return array<string, mixed>
	 */
	private static function repair_invalid_palette_colors( array $theme ): array {
		if ( self::palettes_colors_are_valid( $theme ) ) {
			return $theme;
		}

		// Empty / deleted option must stay empty — shipped defaults (pink/purple
		// general) apply via JS. Do not resurrect legacy palettes on every request.
		if ( array() === $theme ) {
			return $theme;
		}

		$has_theme_footprint = (
			( isset( $theme['config'] ) && is_array( $theme['config'] ) && array() !== $theme['config'] )
			|| ( isset( $theme['palettes']['colorNames'] ) && is_array( $theme['palettes']['colorNames'] ) && array() !== $theme['palettes']['colorNames'] )
		);

		if ( ! $has_theme_footprint ) {
			return $theme;
		}

		$legacy = Theme_Seeder::load_legacy_theme();
		if ( is_wp_error( $legacy ) || empty( $legacy['palettes']['colors'] ) || ! is_array( $legacy['palettes']['colors'] ) ) {
			return $theme;
		}

		if ( ! isset( $theme['palettes'] ) || ! is_array( $theme['palettes'] ) || array_is_list( $theme['palettes'] ) ) {
			$theme['palettes'] = array();
		}

		$theme['palettes']['colors'] = $legacy['palettes']['colors'];

		if ( empty( $theme['palettes']['colorNames'] ) && ! empty( $legacy['palettes']['colorNames'] ) ) {
			$theme['palettes']['colorNames'] = $legacy['palettes']['colorNames'];
		}

		update_option( self::OPTION_KEY, $theme );

		return $theme;
	}

	/**
	 * Persist the active chart theme option.
	 *
	 * @param array<string, mixed> $theme Sanitized theme payload.
	 * @return bool Whether the option was updated.
	 */
	public static function save_active_theme( array $theme ): bool {
		return update_option( self::OPTION_KEY, $theme );
	}

	/**
	 * Active chart theme payload for the frontend resolve layer.
	 *
	 * Merges the per-site option with runtime theme.json font family presets
	 * (slug → var-free stack). Font presets are not persisted in the option;
	 * they are resolved from theme.json on every request so a webfont swap
	 * (Bucket 1) propagates to charts storing font tokens.
	 *
	 * @return array<string, mixed>
	 */
	public static function get_theme_for_frontend(): array {
		$theme = self::get_active_theme();

		$theme['fontFamilies'] = Theme_Admin::get_theme_font_families();

		return $theme;
	}

	/**
	 * Print window.prcChartBuilderTheme in the document head.
	 *
	 * Uses a head hook (not a false-src script handle) so the global is available
	 * in every context: frontend, block editor, and Chart Library admin — all of
	 * which load chart-builder bundles that read the theme at module import time.
	 *
	 * @hook wp_head
	 * @hook admin_head
	 */
	public function print_theme_global(): void {
		static $printed = false;

		if ( $printed ) {
			return;
		}

		$printed = true;

		// Cast to object so an empty theme serializes as {} (not []).
		$json = wp_json_encode( (object) self::get_theme_for_frontend() );

		printf(
			'<script id="prc-chart-builder-theme-data">window.prcChartBuilderTheme = %s;</script>' . "\n",
			$json // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- wp_json_encode
		);
	}
}
