<?php
/**
 * Server-side chart theme default injection (PRC-528).
 *
 * Mirrors the editor-side blocks.registerBlockType filter
 * (src/chart/utils/apply-theme-block-defaults.js) via register_block_type_args.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Inject active theme.config into chart block.json defaults at registration.
 */
class Theme_Block_Defaults {

	/**
	 * Chart block name.
	 *
	 * @var string
	 */
	public const CHART_BLOCK_NAME = 'prc-chart-builder/chart';

	/**
	 * Presentation/style object groups theme.config may override.
	 *
	 * @var list<string>
	 */
	public const CURATED_THEME_CONFIG_GROUPS = array(
		'layout',
		'metadata',
		'plotBands',
		'independentAxis',
		'dependentAxis',
		'tooltip',
		'legend',
		'labels',
		'shapes',
		'bar',
		'line',
		'dotPlot',
		'errorBars',
		'explodedBar',
		'pie',
		'nodes',
		'beeSwarm',
		'regression',
		'map',
		'divergingBar',
		'diffColumn',
		'netValues',
		'treemap',
		'sankey',
		'waffle',
		'heatMapTable',
		'smallMultiples',
		'annotations',
	);

	/**
	 * Deep-merge theme partial over block.json default (immutable).
	 *
	 * @param array<string, mixed>      $block_default block.json default for the group.
	 * @param array<string, mixed>|null $theme_partial Active theme config for the group.
	 * @return array<string, mixed>
	 */
	public static function apply_theme_group_default( array $block_default, $theme_partial ): array {
		if (
			! is_array( $theme_partial ) ||
			array_is_list( $theme_partial ) ||
			array() === $theme_partial
		) {
			return $block_default;
		}

		return self::deep_merge_defaults( $block_default, $theme_partial );
	}

	/**
	 * Slice 4 alias — use apply_theme_group_default().
	 *
	 * @param array<string, mixed>      $block_default block.json layout default.
	 * @param array<string, mixed>|null $theme_partial Active theme config.layout.
	 * @return array<string, mixed>
	 */
	public static function apply_theme_layout_default( array $block_default, $theme_partial ): array {
		return self::apply_theme_group_default( $block_default, $theme_partial );
	}

	/**
	 * register_block_type_args filter — theme.config into chart defaults.
	 *
	 * @hook register_block_type_args
	 *
	 * @param array<string, mixed> $args       Block type registration args.
	 * @param string               $block_name Registered block name.
	 * @return array<string, mixed>
	 */
	public static function filter_register_block_type_args( array $args, string $block_name ): array {
		if ( self::CHART_BLOCK_NAME !== $block_name ) {
			return $args;
		}

		$theme  = Settings::get_active_theme();
		$config = $theme['config'] ?? array();

		if ( ! is_array( $config ) || array_is_list( $config ) || array() === $config ) {
			return $args;
		}

		$attributes = $args['attributes'] ?? array();
		$changed    = false;

		foreach ( self::CURATED_THEME_CONFIG_GROUPS as $group ) {
			$theme_partial = $config[ $group ] ?? null;

			if (
				! is_array( $theme_partial ) ||
				array_is_list( $theme_partial ) ||
				array() === $theme_partial
			) {
				continue;
			}

			$group_attribute = $attributes[ $group ] ?? null;
			if (
				! is_array( $group_attribute ) ||
				( $group_attribute['type'] ?? null ) !== 'object'
			) {
				continue;
			}

			$block_default = $group_attribute['default'] ?? array();
			if ( ! is_array( $block_default ) ) {
				$block_default = array();
			}

			$attributes[ $group ] = array(
				...$group_attribute,
				'default' => self::apply_theme_group_default( $block_default, $theme_partial ),
			);
			$changed            = true;
		}

		if ( ! $changed ) {
			return $args;
		}

		$args['attributes'] = $attributes;

		return $args;
	}

	/**
	 * Recursively deep-merge override into base (override wins; lists replace).
	 *
	 * @param array<string, mixed> $base     Base object.
	 * @param array<string, mixed> $override Overrides.
	 * @return array<string, mixed>
	 */
	public static function deep_merge_defaults( array $base, array $override ): array {
		$output = $base;

		foreach ( $override as $key => $value ) {
			if (
				is_array( $value ) &&
				! array_is_list( $value ) &&
				isset( $base[ $key ] ) &&
				is_array( $base[ $key ] ) &&
				! array_is_list( $base[ $key ] )
			) {
				$output[ $key ] = self::deep_merge_defaults( $base[ $key ], $value );
			} else {
				$output[ $key ] = $value;
			}
		}

		return $output;
	}
}
