<?php
/**
 * Chart theme admin settings page (PRC-528).
 *
 * Slice 11: read-only React UI for viewing the active chart theme.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the Chart Theme submenu, enqueues the settings React app, and
 * resolves theme.json typography.fontFamilies for the editor + frontend.
 */
class Theme_Admin {

	/**
	 * Admin page slug.
	 *
	 * @var string
	 */
	public const ADMIN_PAGE_SLUG = 'prc-chart-builder-theme';

	/**
	 * WordPress preset token prefix for font-family slugs (matches block editor).
	 */
	public const TOKEN_PREFIX = 'var:preset|font-family|';

	/**
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'admin_menu', $this, 'register_admin_page' );
		$loader->add_action( 'admin_enqueue_scripts', $this, 'enqueue_admin_assets' );
	}

	/**
	 * Register Charts > Chart Theme for administrators only.
	 *
	 * @hook admin_menu
	 */
	public function register_admin_page(): void {
		add_submenu_page(
			'edit.php?post_type=chart',
			__( 'Chart Theme', 'prc-chart-builder' ),
			__( 'Chart Theme', 'prc-chart-builder' ),
			'manage_options',
			self::ADMIN_PAGE_SLUG,
			array( $this, 'render_admin_page' )
		);
	}

	/**
	 * Render the React mount node.
	 */
	public function render_admin_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die(
				esc_html__( 'Sorry, you are not allowed to access this page.', 'prc-chart-builder' )
			);
		}

		echo '<div class="wrap"><div id="prc-chart-builder-theme-settings-admin"></div></div>';
	}

	/**
	 * Enqueue the settings bundle on the Chart Theme admin page only.
	 *
	 * @hook admin_enqueue_scripts
	 *
	 * @param string $hook_suffix Current admin page hook.
	 */
	public function enqueue_admin_assets( string $hook_suffix ): void {
		if ( 'chart_page_' . self::ADMIN_PAGE_SLUG !== $hook_suffix ) {
			return;
		}

		$asset_file = PRC_CHART_BUILDER_DIR . '/build/settings/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset  = require $asset_file;
		$handle = 'prc-chart-builder-theme-settings';

		wp_enqueue_script(
			$handle,
			plugins_url( 'build/settings/index.js', PRC_CHART_BUILDER_DIR . '/prc-chart-builder.php' ),
			$asset['dependencies'],
			$asset['version'],
			true
		);

		// The palette designer (slice 14) picks swatches from the site's
		// registered theme.json color palette. This admin page is not the block
		// editor, so there is no useSetting('color.palette'); expose it directly.
		wp_add_inline_script(
			$handle,
			'window.prcChartBuilderThemeEditor = ' . wp_json_encode(
				array(
					'themeColors'  => self::get_theme_palette(),
					'fontFamilies' => self::get_theme_font_families(),
				)
			) . ';',
			'before'
		);

		$style_path = PRC_CHART_BUILDER_DIR . '/build/settings/style-index.css';
		if ( file_exists( $style_path ) ) {
			$style_deps = array( 'wp-components' );
			if ( in_array( 'prc-components', $asset['dependencies'], true ) ) {
				$style_deps[] = 'prc-components';
			}

			wp_enqueue_style(
				$handle,
				plugins_url( 'build/settings/style-index.css', PRC_CHART_BUILDER_DIR . '/prc-chart-builder.php' ),
				$style_deps,
				$asset['version']
			);
		}
	}

	/**
	 * The site's registered theme.json color palette, flattened across origins
	 * (theme > custom > default) and de-duplicated by slug.
	 *
	 * @return array<int, array{slug:string,name:string,color:string}>
	 */
	private static function get_theme_palette(): array {
		if ( ! function_exists( 'wp_get_global_settings' ) ) {
			return array();
		}

		$palette = wp_get_global_settings( array( 'color', 'palette' ) );
		if ( ! is_array( $palette ) ) {
			return array();
		}

		// wp_get_global_settings may return either a flat list or an
		// origin-keyed map ({ default, theme, custom }); normalize both.
		$entries = array();
		if (
			isset( $palette['default'] ) ||
			isset( $palette['theme'] ) ||
			isset( $palette['custom'] )
		) {
			foreach ( array( 'theme', 'custom', 'default' ) as $origin ) {
				if ( ! empty( $palette[ $origin ] ) && is_array( $palette[ $origin ] ) ) {
					$entries = array_merge( $entries, $palette[ $origin ] );
				}
			}
		} else {
			$entries = $palette;
		}

		$seen = array();
		$out  = array();
		foreach ( $entries as $entry ) {
			if ( ! is_array( $entry ) || empty( $entry['color'] ) ) {
				continue;
			}
			$slug = isset( $entry['slug'] ) ? (string) $entry['slug'] : '';
			if ( '' !== $slug && isset( $seen[ $slug ] ) ) {
				continue;
			}
			$seen[ $slug ] = true;
			$out[]         = array(
				'slug'  => $slug,
				'name'  => isset( $entry['name'] ) ? (string) $entry['name'] : $slug,
				'color' => (string) $entry['color'],
			);
		}

		return $out;
	}

	/**
	 * The site's registered theme.json font families, flattened across origins
	 * (theme > custom > default) and de-duplicated by slug.
	 *
	 * Each entry's `value` is a var-free concrete stack (canvas-measurement safe).
	 *
	 * @return array<int, array{slug:string,name:string,value:string}>
	 */
	public static function get_theme_font_families(): array {
		if ( ! function_exists( 'wp_get_global_settings' ) ) {
			return array();
		}

		$families = wp_get_global_settings( array( 'typography', 'fontFamilies' ) );
		if ( ! is_array( $families ) ) {
			return array();
		}

		$entries = self::flatten_theme_json_font_entries( $families );
		if ( array() === $entries ) {
			return array();
		}

		/** @var array<string, string> $raw_by_slug slug => unresolved fontFamily string */
		$raw_by_slug = array();
		/** @var array<string, string> $name_by_slug slug => display name */
		$name_by_slug = array();

		foreach ( $entries as $entry ) {
			if ( ! is_array( $entry ) || empty( $entry['fontFamily'] ) ) {
				continue;
			}

			$slug = isset( $entry['slug'] ) ? (string) $entry['slug'] : '';
			if ( '' === $slug ) {
				continue;
			}

			$raw_by_slug[ $slug ]  = (string) $entry['fontFamily'];
			$name_by_slug[ $slug ] = isset( $entry['name'] ) ? (string) $entry['name'] : $slug;
		}

		if ( array() === $raw_by_slug ) {
			return array();
		}

		/** @var array<string, string> $resolved_by_slug */
		$resolved_by_slug = array();
		foreach ( $raw_by_slug as $slug => $font_family ) {
			$resolved_by_slug[ $slug ] = self::resolve_theme_font_family_stack(
				$font_family,
				$raw_by_slug
			);
		}

		$seen = array();
		$out  = array();
		foreach ( $entries as $entry ) {
			if ( ! is_array( $entry ) || empty( $entry['fontFamily'] ) ) {
				continue;
			}

			$slug = isset( $entry['slug'] ) ? (string) $entry['slug'] : '';
			if ( '' === $slug || isset( $seen[ $slug ] ) || ! isset( $resolved_by_slug[ $slug ] ) ) {
				continue;
			}

			$seen[ $slug ] = true;
			$value         = trim( $resolved_by_slug[ $slug ] );
			if ( '' === $value ) {
				continue;
			}

			$out[] = array(
				'slug'  => $slug,
				'name'  => $name_by_slug[ $slug ] ?? $slug,
				'value' => $value,
			);
		}

		return $out;
	}

	/**
	 * Map resolved concrete stacks to preset tokens for DB migration.
	 *
	 * @return array<string, string> resolved stack => token
	 */
	public static function get_literal_to_token_map(): array {
		$map = array();
		foreach ( self::get_theme_font_families() as $family ) {
			if ( empty( $family['value'] ) || empty( $family['slug'] ) ) {
				continue;
			}
			$map[ $family['value'] ] = self::TOKEN_PREFIX . $family['slug'];
		}
		return $map;
	}

	/**
	 * Flatten theme.json origin-keyed font settings into a single ordered list.
	 *
	 * @param array<string, mixed> $settings Flat list or origin-keyed map.
	 * @return array<int, mixed>
	 */
	private static function flatten_theme_json_font_entries( array $settings ): array {
		if (
			isset( $settings['default'] ) ||
			isset( $settings['theme'] ) ||
			isset( $settings['custom'] )
		) {
			$entries = array();
			foreach ( array( 'theme', 'custom', 'default' ) as $origin ) {
				if ( ! empty( $settings[ $origin ] ) && is_array( $settings[ $origin ] ) ) {
					$entries = array_merge( $entries, $settings[ $origin ] );
				}
			}
			return $entries;
		}

		return $settings;
	}

	/**
	 * Replace var(--wp--preset--font-family--<slug>) with the slug's stack.
	 *
	 * @param string               $font_family   Raw theme.json fontFamily value.
	 * @param array<string,string> $slug_to_stack Unresolved stacks keyed by slug.
	 * @return string
	 */
	public static function resolve_theme_font_family_stack( string $font_family, array $slug_to_stack ): string {
		$resolved = preg_replace_callback(
			'/var\(\s*--wp--preset--font-family--([a-z0-9-]+)\s*\)/',
			static function ( array $matches ) use ( $slug_to_stack ): string {
				$ref_slug = $matches[1];
				return $slug_to_stack[ $ref_slug ] ?? $matches[0];
			},
			$font_family
		);

		if ( ! is_string( $resolved ) ) {
			return $font_family;
		}

		// One nested var reference may remain after the first pass (e.g. serif → georgia).
		if ( str_contains( $resolved, 'var(--wp--preset--font-family--' ) ) {
			return self::resolve_theme_font_family_stack( $resolved, $slug_to_stack );
		}

		return $resolved;
	}
}
