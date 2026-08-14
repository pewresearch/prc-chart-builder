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
	 * Classic script handle used when only Script Modules are queued (PRC-628).
	 *
	 * wp_add_inline_script() does not support module handles; this empty-src
	 * footer script prints before Script Modules in wp_print_footer_scripts().
	 *
	 * @var string
	 */
	public const THEME_INLINE_HANDLE = 'prc-chart-builder-theme-data';

	/**
	 * Classic chart-builder bundles that read window.prcChartBuilderTheme at import.
	 *
	 * @var string[]
	 */
	private const CHART_BUNDLE_SCRIPT_HANDLES = array(
		'prc-custom-charts',
		'prc-charting-library',
		'prc-chart-builder-chart-editor-script',
		'prc-chart-builder-controller-editor-script',
		'prc-chart-builder-synced-chart-editor-script',
	);

	/**
	 * Chart blocks whose editor bundles read window.prcChartBuilderTheme at import.
	 *
	 * @var string[]
	 */
	private const CHART_EDITOR_BLOCK_NAMES = array(
		'prc-chart-builder/chart',
		'prc-chart-builder/controller',
		'prc-chart-builder/synced-chart',
	);

	/**
	 * Whether the theme global has been attached this request.
	 *
	 * @var bool
	 */
	private static $theme_global_delivered = false;

	/**
	 * Whether the slice-8 palette repair path has already run this request.
	 *
	 * @var bool
	 */
	private static $repair_attempted = false;

	/**
	 * Constructor.
	 *
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'register_theme_delivery_script' );

		// Block editor + Chart Library admin: attach the global before the chart
		// editor bundles, which read it at module import. Attaching to registered
		// handles only materializes on pages that actually load those bundles.
		$loader->add_action( 'admin_enqueue_scripts', $this, 'deliver_theme_global_to_editor', 100 );

		// Frontend safety net; Chart::render_block_callback() is the primary path.
		$loader->add_action( 'wp_print_footer_scripts', $this, 'maybe_deliver_theme_global', 1 );

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
	 * Register the empty-src handle used for module-only delivery.
	 *
	 * @hook init
	 */
	public function register_theme_delivery_script(): void {
		wp_register_script(
			self::THEME_INLINE_HANDLE,
			'',
			array(),
			defined( 'PRC_CHART_BUILDER_VERSION' ) ? PRC_CHART_BUILDER_VERSION : '1.0.0',
			true
		);
	}

	/**
	 * Attach window.prcChartBuilderTheme when a chart bundle is queued.
	 *
	 * @hook wp_print_footer_scripts
	 */
	public function maybe_deliver_theme_global(): void {
		if ( self::$theme_global_delivered || ! self::chart_bundles_are_queued() ) {
			return;
		}

		self::deliver_theme_global();
	}

	/**
	 * Attach window.prcChartBuilderTheme before chart editor bundles in wp-admin.
	 *
	 * The block editor and the Chart Library admin page load the chart, controller,
	 * and synced-chart editor bundles, each of which reads the global at module
	 * import. Attaching `before` their registered handles guarantees the global is
	 * defined first and only prints on pages that actually load those bundles.
	 *
	 * @hook admin_enqueue_scripts
	 */
	public function deliver_theme_global_to_editor(): void {
		if ( self::$theme_global_delivered ) {
			return;
		}

		$registry = \WP_Block_Type_Registry::get_instance();
		$handles  = array();

		foreach ( self::CHART_EDITOR_BLOCK_NAMES as $block_name ) {
			$block_type = $registry->get_registered( $block_name );
			if ( $block_type instanceof \WP_Block_Type && ! empty( $block_type->editor_script_handles ) ) {
				$handles = array_merge( $handles, $block_type->editor_script_handles );
			}
		}

		$handles = array_values( array_unique( $handles ) );
		if ( empty( $handles ) ) {
			return;
		}

		$inline = self::get_theme_global_inline_script();
		foreach ( $handles as $handle ) {
			wp_add_inline_script( $handle, $inline, 'before' );
		}

		self::$theme_global_delivered = true;
	}

	/**
	 * Whether a classic chart-builder script handle is queued this request.
	 *
	 * Script Modules are intentionally excluded: WP_Script_Modules has no stable
	 * public is_enqueued() API across core versions. Frontend module paths call
	 * deliver_theme_global() explicitly from Chart::render_block_callback().
	 */
	public static function chart_bundles_are_queued(): bool {
		foreach ( self::CHART_BUNDLE_SCRIPT_HANDLES as $handle ) {
			if ( wp_script_is( $handle, 'enqueued' ) || wp_script_is( $handle, 'to_do' ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Attach window.prcChartBuilderTheme before the first queued chart bundle.
	 *
	 * Classic bundles get wp_add_inline_script( ..., 'before' ). Script Module
	 * paths enqueue THEME_INLINE_HANDLE in the footer, which prints before modules.
	 */
	public static function deliver_theme_global(): void {
		if ( self::$theme_global_delivered ) {
			return;
		}

		$inline = self::get_theme_global_inline_script();

		foreach ( self::CHART_BUNDLE_SCRIPT_HANDLES as $handle ) {
			if ( wp_script_is( $handle, 'enqueued' ) || wp_script_is( $handle, 'to_do' ) ) {
				wp_add_inline_script( $handle, $inline, 'before' );
				self::$theme_global_delivered = true;
				return;
			}
		}

		wp_enqueue_script( self::THEME_INLINE_HANDLE );
		wp_add_inline_script( self::THEME_INLINE_HANDLE, $inline, 'before' );
		self::$theme_global_delivered = true;
	}

	/**
	 * Inline JS assignment for window.prcChartBuilderTheme.
	 */
	public static function get_theme_global_inline_script(): string {
		// Cast to object so an empty theme serializes as {} (not []).
		$json = wp_json_encode( (object) self::get_theme_for_frontend() );

		return 'window.prcChartBuilderTheme = ' . $json . ';';
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
	 * chart-theme.json fallback and persist so the next request is clean.
	 *
	 * @param array<string, mixed> $theme Active theme option value.
	 * @return array<string, mixed>
	 */
	private static function repair_invalid_palette_colors( array $theme ): array {
		if ( self::palettes_colors_are_valid( $theme ) ) {
			return $theme;
		}

		// Empty / deleted option must stay empty — shipped defaults (pink/purple
		// general) apply via JS. Do not resurrect fallback palettes on every request.
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

		if ( self::$repair_attempted ) {
			return $theme;
		}

		self::$repair_attempted = true;

		$fallback = Theme_Seeder::load_theme_file();
		if ( is_wp_error( $fallback ) || empty( $fallback['palettes']['colors'] ) || ! is_array( $fallback['palettes']['colors'] ) ) {
			return $theme;
		}

		if ( ! isset( $theme['palettes'] ) || ! is_array( $theme['palettes'] ) || array_is_list( $theme['palettes'] ) ) {
			$theme['palettes'] = array();
		}

		$theme['palettes']['colors'] = $fallback['palettes']['colors'];

		if ( empty( $theme['palettes']['colorNames'] ) && ! empty( $fallback['palettes']['colorNames'] ) ) {
			$theme['palettes']['colorNames'] = $fallback['palettes']['colorNames'];
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
}
