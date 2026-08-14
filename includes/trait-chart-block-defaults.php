<?php
/**
 * Shared helpers for building complete chart block attribute sets.
 *
 * Provides:
 *  - get_chart_block_defaults()          — block.json → default values
 *  - get_variation_template_defaults()   — chart-type-specific overrides
 *  - deep_merge()                        — recursive associative array merge
 *
 * Used by PCH_Import_Endpoint and Chart_AI_Ability to produce fully-formed
 * chart block attributes so WordPress doesn't trigger the v1→v2 migration.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

trait Chart_Block_Defaults {

	/**
	 * Get default attribute values from the chart block.json.
	 *
	 * @return array<string, mixed>
	 */
	private function get_chart_block_defaults(): array {
		$block_json_path = PRC_CHART_BUILDER_DIR . '/build/chart/block.json';

		if ( ! file_exists( $block_json_path ) ) {
			$block_json_path = PRC_CHART_BUILDER_DIR . '/src/chart/block.json';
		}

		if ( ! file_exists( $block_json_path ) ) {
			return array();
		}

		$block_json = json_decode( file_get_contents( $block_json_path ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( ! isset( $block_json['attributes'] ) ) {
			return array();
		}

		// Migration-only attributes that should never be set on new blocks.
		$exclude = array( '_v1Original', '_legacy', '_migrationMeta' );

		$defaults = array();
		foreach ( $block_json['attributes'] as $key => $config ) {
			if ( array_key_exists( 'default', $config ) && ! in_array( $key, $exclude, true ) ) {
				$defaults[ $key ] = $config['default'];
			}
		}

		return $this->apply_theme_config_to_defaults( $defaults );
	}

	/**
	 * Layer active theme.config over block.json defaults (PRC-528 slice 6).
	 *
	 * Mirrors editor/server default injection so AI, PCH import, and CLI paths
	 * see the same themed defaults as new charts inserted in the block editor.
	 *
	 * @param array<string, mixed> $defaults block.json attribute defaults.
	 * @return array<string, mixed>
	 */
	private function apply_theme_config_to_defaults( array $defaults ): array {
		$theme  = Settings::get_active_theme();
		$config = $theme['config'] ?? array();

		if ( ! is_array( $config ) || array_is_list( $config ) || array() === $config ) {
			return $defaults;
		}

		foreach ( Theme_Block_Defaults::CURATED_THEME_CONFIG_GROUPS as $group ) {
			if ( ! isset( $defaults[ $group ] ) || ! is_array( $defaults[ $group ] ) ) {
				continue;
			}

			$theme_partial = $config[ $group ] ?? null;

			$defaults[ $group ] = Theme_Block_Defaults::apply_theme_group_default(
				$defaults[ $group ],
				$theme_partial
			);
		}

		return $defaults;
	}

	/**
	 * Chart-type-specific attribute overrides layered on top of block.json defaults.
	 *
	 * @param string $chart_type Chart type slug.
	 * @return array<string, mixed>
	 */
	private function get_variation_template_defaults( string $chart_type ): array {
		// Tag and other brand metadata come from block.json + theme.config
		// (see apply_theme_config_to_defaults); variation templates only set active.
		$shared_metadata = array(
			'active' => true,
		);
		$shared_io = array(
			'isConvertedChart' => false,
		);

		$templates = array(
			'bar' => array(
				'layout'          => array( 'type' => 'bar', 'orientation' => 'horizontal', 'width' => 420, 'height' => 160, 'padding' => array( 'left' => 100 ) ),
				'metadata'        => $shared_metadata,
				'independentAxis' => array( 'tickCount' => null, 'domainPadding' => 16, 'axis' => array( 'stroke' => '', 'strokeWidth' => 1 ), 'tickLabels' => array( 'textAnchor' => 'end', 'verticalAnchor' => 'middle', 'dx' => -5 ) ),
				'dependentAxis'   => array( 'active' => false ),
				'tooltip'         => array( 'active' => true, 'headerValue' => 'independentValue', 'format' => '{{column}}: {{value}}' ),
				'labels'          => array( 'active' => true, 'color' => 'contrast', 'labelPositionDY' => 3 ),
				'legend'          => array( 'active' => true, 'markerStyle' => 'rect' ),
				'bar'             => array( 'barWidth' => 24, 'barGroupOffset' => 28 ),
				'dataRender'      => array( 'sortOrder' => 'descending' ),
				'io'              => $shared_io,
			),
			'column' => array(
				'layout'          => array( 'type' => 'column', 'orientation' => 'vertical', 'width' => 420, 'height' => 300, 'padding' => array( 'top' => 30, 'bottom' => 40 ) ),
				'metadata'        => $shared_metadata,
				'independentAxis' => array( 'active' => true, 'tickMarksActive' => false ),
				'dependentAxis'   => array( 'active' => true, 'tickMarksActive' => true, 'abbreviateTicks' => true ),
				'tooltip'         => array( 'active' => true, 'format' => '{{column}}: {{value}}' ),
				'labels'          => array( 'active' => true, 'color' => 'contrast' ),
				'legend'          => array( 'active' => true, 'markerStyle' => 'rect' ),
				'dataRender'      => array( 'sortOrder' => 'none' ),
				'io'              => $shared_io,
			),
			'line' => array(
				'layout'          => array( 'type' => 'line', 'width' => 420, 'height' => 356, 'padding' => array( 'top' => 10, 'left' => 30, 'bottom' => 30, 'right' => 20 ) ),
				'metadata'        => $shared_metadata,
				'independentAxis' => array( 'tickMarksActive' => true, 'scale' => 'time' ),
				'dependentAxis'   => array( 'showZero' => true, 'tickMarksActive' => true ),
				'tooltip'         => array( 'active' => true, 'offsetX' => 30, 'offsetY' => 30, 'headerValue' => 'categoryValue', 'format' => '{{row}}: {{value}}' ),
				'labels'          => array( 'color' => 'inherit' ),
				'line'            => array( 'strokeWidth' => 4, 'showPoints' => true ),
				'nodes'           => array( 'pointSize' => 4, 'pointFill' => 'inherit', 'pointFillOpacity' => 1, 'pointStrokeWidth' => 1, 'pointStroke' => 'inherit' ),
				'legend'          => array( 'active' => true, 'markerStyle' => 'line' ),
				'dataRender'      => array( 'sortOrder' => 'ascending', 'xScale' => 'time', 'xFormat' => 'YYYY' ),
				'io'              => $shared_io,
			),
			'area' => array(
				'layout'     => array( 'type' => 'area', 'width' => 420, 'height' => 300, 'padding' => array( 'top' => 10, 'left' => 30, 'bottom' => 30, 'right' => 20 ) ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{row}}: {{value}}' ),
				'legend'     => array( 'active' => true, 'markerStyle' => 'line' ),
				'dataRender' => array( 'sortOrder' => 'ascending' ),
				'io'         => $shared_io,
			),
			'stacked-bar' => array(
				'layout'          => array( 'type' => 'stacked-bar', 'orientation' => 'horizontal', 'width' => 420, 'height' => 220, 'padding' => array( 'left' => 100 ) ),
				'metadata'        => $shared_metadata,
				'independentAxis' => array( 'active' => false ),
				'dependentAxis'   => array( 'active' => true, 'tickMarksActive' => true ),
				'tooltip'         => array( 'active' => true, 'format' => '{{column}}: {{value}}' ),
				'labels'          => array( 'active' => true, 'color' => 'contrast' ),
				'legend'          => array( 'active' => true, 'markerStyle' => 'rect' ),
				'dataRender'      => array( 'sortOrder' => 'none' ),
				'io'              => $shared_io,
			),
			'stacked-column' => array(
				'layout'     => array( 'type' => 'stacked-column', 'width' => 420, 'height' => 300 ),
				'metadata'   => $shared_metadata,
				'legend'     => array( 'active' => true, 'markerStyle' => 'rect' ),
				'dataRender' => array( 'sortOrder' => 'none' ),
				'io'         => $shared_io,
			),
			'stacked-area' => array(
				'layout'     => array( 'type' => 'stacked-area', 'width' => 420, 'height' => 300 ),
				'metadata'   => $shared_metadata,
				'legend'     => array( 'active' => true, 'markerStyle' => 'line' ),
				'dataRender' => array( 'sortOrder' => 'ascending' ),
				'io'         => $shared_io,
			),
			'pie' => array(
				'layout'          => array( 'type' => 'pie', 'width' => 420, 'height' => 350, 'padding' => array( 'left' => 20, 'bottom' => 20, 'right' => 20 ) ),
				'metadata'        => $shared_metadata,
				'independentAxis' => array( 'tickCount' => null, 'domainPadding' => 16 ),
				'dependentAxis'   => array( 'active' => false ),
				'tooltip'         => array( 'active' => true, 'headerValue' => 'independentValue', 'format' => '{{column}}: {{value}}' ),
				'labels'          => array( 'active' => true, 'color' => 'contrast', 'labelPositionDX' => -20 ),
				'legend'          => array( 'active' => true, 'markerStyle' => 'circle' ),
				'dataRender'      => array( 'sortOrder' => 'reverse' ),
				'io'              => $shared_io,
			),
			'scatter' => array(
				'layout'     => array( 'type' => 'scatter', 'width' => 420, 'height' => 300, 'padding' => array( 'left' => 40, 'bottom' => 40, 'top' => 10 ) ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{row}}: {{value}}' ),
				'nodes'      => array( 'pointSize' => 5 ),
				'dataRender' => array( 'sortOrder' => 'none' ),
				'io'         => $shared_io,
			),
			'bee-swarm' => array(
				'layout'     => array( 'type' => 'bee-swarm', 'width' => 420, 'height' => 220, 'padding' => array( 'left' => 40, 'bottom' => 50, 'top' => 20 ) ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{row}}: {{value}}' ),
				'nodes'      => array( 'pointSize' => 5 ),
				'dataRender' => array( 'sortOrder' => 'none', 'categories' => array() ),
				'legend'     => array( 'active' => true, 'markerStyle' => 'circle' ),
				'io'         => $shared_io,
			),
			'dot-plot' => array(
				'layout'     => array( 'type' => 'dot-plot', 'width' => 420, 'height' => 300, 'orientation' => 'horizontal' ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{row}}: {{value}}' ),
				'legend'     => array( 'active' => true ),
				'dataRender' => array( 'sortOrder' => 'none' ),
				'io'         => $shared_io,
			),
			'diverging-bar' => array(
				'layout'     => array( 'type' => 'diverging-bar', 'orientation' => 'horizontal', 'width' => 420, 'height' => 220 ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{column}}: {{value}}' ),
				'labels'     => array( 'active' => true, 'color' => 'contrast' ),
				'legend'     => array( 'active' => true, 'markerStyle' => 'rect' ),
				'dataRender' => array( 'sortOrder' => 'none' ),
				'io'         => $shared_io,
			),
			'exploded-bar' => array(
				'layout'     => array( 'type' => 'exploded-bar', 'orientation' => 'horizontal', 'width' => 420, 'height' => 220 ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{column}}: {{value}}' ),
				'labels'     => array( 'active' => true, 'color' => 'contrast' ),
				'legend'     => array( 'active' => true, 'markerStyle' => 'rect' ),
				'dataRender' => array( 'sortOrder' => 'none' ),
				'io'         => $shared_io,
			),
			'treemap' => array(
				'layout'     => array( 'type' => 'treemap', 'width' => 640, 'height' => 400 ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{row}}: {{value}}' ),
				'labels'     => array( 'active' => true ),
				'dataRender' => array( 'sortOrder' => 'none' ),
				'io'         => $shared_io,
			),
			'waffle' => array(
				'layout'     => array( 'type' => 'waffle', 'width' => 640, 'height' => 420 ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{row}}: {{value}}' ),
				'legend'     => array( 'active' => true, 'markerStyle' => 'rect' ),
				'dataRender' => array( 'categories' => array( 'y' ), 'sortOrder' => 'descending' ),
				'waffle'     => array(
					'cellShape'   => 'square',
					'cellGap'     => 0.1,
					'cellRadius'  => 3,
					'emptyFill'   => '#E6E7E8',
					'columns'     => 10,
					'rows'        => 10,
					'max'         => null,
					'cellSize'    => 14,
					'cellSizeMode'=> 'clamp',
					'displayMode' => 'whole',
				),
				'io'         => $shared_io,
			),
			'heat-map-table' => array(
				'layout'     => array( 'type' => 'heat-map-table', 'width' => 720, 'height' => 480 ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true, 'format' => '{{row}} · {{column}}: {{value}}%' ),
				'labels'     => array( 'active' => true, 'color' => 'contrast' ),
				'legend'     => array( 'active' => true, 'markerStyle' => 'rect' ),
				'dataRender' => array(
					'sortOrder'      => 'none',
					'mapScale'       => 'linear',
					'mapScaleDomain' => array( 0, 100 ),
				),
				'heatMapTable' => array(
					'cellGap'             => 0,
					'cellRadius'          => 0,
					'showValues'          => true,
					'emptyFill'           => '#F5F5F5',
					'rowLabelWidth'       => 0,
					'columnHeaderHeight'  => 48,
					'minCellWidth'        => 40,
					'minCellHeight'       => 28,
				),
				'io'         => array_merge(
					$shared_io,
					array(
						'chartFamily' => 'chart',
						'colorValue'  => 'blue-spectrum',
					)
				),
			),
			'sankey' => array(
				'layout'     => array( 'type' => 'sankey', 'width' => 640, 'height' => 400 ),
				'metadata'   => $shared_metadata,
				'tooltip'    => array( 'active' => true ),
				'dataRender' => array( 'sortOrder' => 'none' ),
				'io'         => $shared_io,
			),
			'freeform' => array(
				'layout'   => array( 'type' => 'freeform', 'width' => 640, 'height' => 400 ),
				'metadata' => $shared_metadata,
				'io'       => $shared_io,
			),
		);

		if ( isset( $templates[ $chart_type ] ) ) {
			return $templates[ $chart_type ];
		}

		return array(
			'layout'   => array( 'type' => $chart_type, 'width' => 640, 'height' => 400 ),
			'metadata' => $shared_metadata,
		);
	}

	/**
	 * Recursively deep-merge two arrays. Source values override target values.
	 * Associative arrays are merged recursively. Lists and scalars are replaced.
	 *
	 * @param array<string, mixed> $target Defaults.
	 * @param array<string, mixed> $source Overrides.
	 * @return array<string, mixed>
	 */
	private function deep_merge( array $target, array $source ): array {
		$output = $target;

		foreach ( $source as $key => $value ) {
			if (
				is_array( $value ) &&
				! array_is_list( $value ) &&
				isset( $target[ $key ] ) &&
				is_array( $target[ $key ] ) &&
				! array_is_list( $target[ $key ] )
			) {
				$output[ $key ] = $this->deep_merge( $target[ $key ], $value );
			} else {
				$output[ $key ] = $value;
			}
		}

		return $output;
	}
}
