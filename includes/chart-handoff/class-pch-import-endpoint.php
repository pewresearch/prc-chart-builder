<?php
/**
 * PRC Chart Handoff (PCH) Import REST Endpoint.
 *
 * Accepts a PCH JSON object, converts it to Chart Builder v2 block attributes,
 * serializes those attributes into WordPress block markup, creates a chart post,
 * and returns the new post ID.
 *
 * Route: POST /prc-chart-builder/v1/import-pch
 *
 * The conversion logic here is a PHP port of:
 *   includes/chart-handoff/src/pch-to-chart-builder.js
 *
 * Both must be kept in sync when the PCH schema evolves.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * PCH Import Endpoint.
 */
class PCH_Import_Endpoint {
	use \PRC\Platform\Chart_Builder\Chart_Block_Defaults;

	private const REST_NAMESPACE   = 'prc-chart-builder/v1';
	private const REST_ROUTE       = '/import-pch';
	private const SUPPORTED_SCHEMA = 'prc-chart-handoff/v1';

	private const CONTROLLER_BLOCK = 'prc-chart-builder/controller';
	private const CHART_BLOCK      = 'prc-chart-builder/chart';
	private const TABLE_BLOCK      = 'prc-block/table';

	/**
	 * @var Loader
	 */
	protected $loader;

	/**
	 * @param Loader $loader
	 */
	public function __construct( $loader ) {
		$this->loader = $loader;
		$loader->add_action( 'rest_api_init', $this, 'register_rest_route' );
	}

	/**
	 * Register the REST route.
	 *
	 * @hook rest_api_init
	 */
	public function register_rest_route(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => static function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * Handle the import request.
	 *
	 * The full PCH JSON object is expected as the request body (Content-Type:
	 * application/json). WordPress's REST API parses JSON bodies automatically.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response|WP_Error
	 */
	public function handle_request( WP_REST_Request $request ) {
		$pch = $request->get_json_params();

		if ( empty( $pch ) ) {
			return new WP_Error(
				'pch_empty',
				__( 'Request body must be a valid PCH JSON object.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		// Validate schema version.
		$schema = $pch['$schema'] ?? '';
		if ( $schema !== self::SUPPORTED_SCHEMA ) {
			return new WP_Error(
				'pch_unsupported_schema',
				sprintf(
					/* translators: 1: received schema, 2: expected schema */
					__( 'Unsupported PCH schema "%1$s". Expected "%2$s".', 'prc-chart-builder' ),
					esc_html( $schema ),
					self::SUPPORTED_SCHEMA
				),
				array( 'status' => 400 )
			);
		}

		$chart_type = sanitize_text_field( $pch['chartType'] ?? '' );
		if ( ! $chart_type ) {
			return new WP_Error(
				'pch_missing_chart_type',
				__( 'PCH file is missing the required "chartType" field.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		$data = $pch['data'] ?? array();
		if ( empty( $data['values'] ) || ! is_array( $data['values'] ) ) {
			return new WP_Error(
				'pch_missing_data',
				__( 'PCH file is missing the required "data.values" array.', 'prc-chart-builder' ),
				array( 'status' => 400 )
			);
		}

		// Convert PCH -> CB block attributes.
		$orientation = $pch['orientation'] ?? 'horizontal';
		$cb_type     = $this->resolve_cb_chart_type( $chart_type, $orientation );
		$chart_attrs = $this->pch_to_chart_attributes( $pch );

		$title = sanitize_text_field( $pch['metadata']['title'] ?? '' );
		if ( ! $title ) {
			$title = ucfirst( str_replace( '-', ' ', $cb_type ) ) . ' Chart';
		}

		$content = $this->build_block_content( $cb_type, $chart_attrs, $data );

		$post_id = wp_insert_post(
			array(
				'post_type'    => Content_Type::$post_type,
				'post_title'   => $title,
				'post_content' => $content,
				'post_status'  => 'draft',
			),
			true
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		return new WP_REST_Response(
			array(
				'post_id'   => $post_id,
				'edit_url'  => get_edit_post_link( $post_id, 'raw' ),
				'warnings'  => $pch['warnings'] ?? array(),
			),
			201
		);
	}

	// ── Conversion: PCH -> CB block attributes ────────────────────────────────
	//
	// PHP port of pch-to-chart-builder.js. Keep in sync when schema evolves.

	/**
	 * Convert a full PCH object to a complete set of CB v2 chart block attributes.
	 *
	 * Uses the same 3-layer merge as the AI endpoint:
	 *   1. block.json defaults       (all attributes at their defaults)
	 *   2. variation template         (chart-type-specific overrides)
	 *   3. PCH overrides              (what the import actually specifies)
	 *
	 * This produces a fully-formed attribute set so WordPress does NOT trigger
	 * the v1→v2 migration path (which injects _v1Original / _legacy junk).
	 *
	 * @param array $pch
	 * @return array Complete CB v2 chart block attributes.
	 */
	private function pch_to_chart_attributes( array $pch ): array {
		$pch_type    = $pch['chartType'];
		$orientation = $pch['orientation'] ?? 'horizontal';
		$data        = $pch['data'] ?? array();
		$metadata    = $pch['metadata'] ?? array();
		$config      = $pch['config'] ?? array();

		// PCH uses bar+vertical where CB uses 'column', stacked-bar+vertical → 'stacked-column'.
		$cb_type = $this->resolve_cb_chart_type( $pch_type, $orientation );

		// ── Layer 1 + 2: block.json defaults → variation template ─────────────
		$defaults  = $this->get_chart_block_defaults();
		$variation = $this->get_variation_template_defaults( $cb_type );
		$merged    = $this->deep_merge( $defaults, $variation );

		// ── Layer 3: PCH-specific overrides ───────────────────────────────────
		// Only include keys that PCH actually specifies — empty arrays would
		// clobber the variation template defaults via deep_merge.
		[ 'io' => $io, 'dataRender' => $data_render ] = $this->resolve_data( $data );

		$pch_overrides = array(
			'_version'        => 'v2',
			'layout'          => array_filter(
				array(
					'type'        => $cb_type,
					'orientation' => $orientation,
					'width'       => $config['width'] ?? null,
					'height'      => $config['height'] ?? null,
				),
				static fn( $v ) => $v !== null
			),
			'metadata'        => $this->resolve_metadata( $metadata ),
			'io'              => $io,
			'dataRender'      => $data_render,
		);

		$independent = $this->resolve_independent_axis( $config['independentAxis'] ?? array() );
		if ( ! empty( $independent ) ) {
			$pch_overrides['independentAxis'] = $independent;
		}

		$dependent = $this->resolve_dependent_axis( $config['dependentAxis'] ?? array(), $data['yType'] ?? 'numeric' );
		if ( ! empty( $dependent ) ) {
			$pch_overrides['dependentAxis'] = $dependent;
		}

		$legend = $this->resolve_legend( $config['legend'] ?? array() );
		if ( ! empty( $legend ) ) {
			$pch_overrides['legend'] = $legend;
		}

		$labels = $this->resolve_labels( $config['labels'] ?? array() );
		if ( ! empty( $labels ) ) {
			$pch_overrides['labels'] = $labels;
		}

		if ( ! empty( $config['colors'] ) && is_array( $config['colors'] ) ) {
			$pch_overrides['io']['customColors'] = $config['colors'];
		}

		$pch_overrides = array_merge( $pch_overrides, $this->resolve_type_specific_options( $pch_type, $config ) );

		// ── Merge all three layers ────────────────────────────────────────────
		$merged = $this->deep_merge( $merged, $pch_overrides );

		$merged['layout']['type'] = $cb_type;

		return $merged;
	}

	/**
	 * Map a PCH chartType + orientation pair to the CB layout.type slug.
	 *
	 * PCH uses "bar" for both horizontal bars and vertical columns, distinguished
	 * by orientation. CB uses separate slugs: "bar" (horizontal) vs "column" (vertical).
	 * Same for stacked-bar → stacked-column.
	 *
	 * @param string $pch_type    PCH chartType value.
	 * @param string $orientation PCH orientation value.
	 * @return string CB layout.type slug.
	 */
	private function resolve_cb_chart_type( string $pch_type, string $orientation ): string {
		if ( 'bar' === $pch_type && 'vertical' === $orientation ) {
			return 'column';
		}
		if ( 'stacked-bar' === $pch_type && 'vertical' === $orientation ) {
			return 'stacked-column';
		}
		return $pch_type;
	}

	/**
	 * Pivot PCH tidy/long rows into Chart Builder wide format (matches table + io.chartData).
	 *
	 * CB expects: first column = independent axis (key `x` in chartData), further columns =
	 * one per series/category. See class-chart-ai-ability::serialize_chart_blocks and
	 * .shared/variation-templates/stacked-bar.js.
	 *
	 * @param array $data PCH data object (values, xColumn, yColumn, categoryColumn).
	 * @return array{
	 *   chart_data: array<int, array<string, mixed>>,
	 *   categories: array<int, string|int|float>,
	 *   is_multi_series: bool,
	 *   table_headers: array<int, string>,
	 *   table_body_rows: array<int, array<int, string|string>>
	 * }
	 */
	private function pivot_pch_data_to_wide( array $data ): array {
		$values          = $data['values'] ?? array();
		$x_column        = $data['xColumn'] ?? 'x';
		$y_column        = $data['yColumn'] ?? 'y';
		$category_column = $data['categoryColumn'] ?? null;

		if ( ! $category_column ) {
			$chart_data    = array();
			$body_rows     = array();
			$table_headers = array( $x_column, $y_column );
			foreach ( $values as $row ) {
				$xv = $row[ $x_column ] ?? '';
				$yv = $row[ $y_column ] ?? '';
				$chart_data[] = array(
					'x'        => $xv,
					$y_column  => $yv,
				);
				$body_rows[] = array( (string) $xv, (string) $yv );
			}
			return array(
				'chart_data'      => $chart_data,
				'categories'      => array(),
				'is_multi_series' => false,
				'table_headers'   => $table_headers,
				'table_body_rows' => $body_rows,
			);
		}

		$categories = array();
		foreach ( $values as $row ) {
			$cat = $row[ $category_column ] ?? null;
			if ( $cat !== null && ! in_array( $cat, $categories, true ) ) {
				$categories[] = $cat;
			}
		}

		$by_x = array();
		foreach ( $values as $row ) {
			$xv = $row[ $x_column ] ?? '';
			$ck = $row[ $category_column ] ?? '';
			$yv = $row[ $y_column ] ?? '';
			if ( ! isset( $by_x[ $xv ] ) ) {
				$by_x[ $xv ] = array();
			}
			$by_x[ $xv ][ $ck ] = $yv;
		}

		$x_order = array();
		foreach ( $values as $row ) {
			$xv = $row[ $x_column ] ?? '';
			if ( ! in_array( $xv, $x_order, true ) ) {
				$x_order[] = $xv;
			}
		}

		$chart_data    = array();
		$body_rows     = array();
		$table_headers = array_merge( array( $x_column ), array_map( 'strval', $categories ) );

		foreach ( $x_order as $xv ) {
			$entry = array( 'x' => $xv );
			$row_cells = array( (string) $xv );
			foreach ( $categories as $cat ) {
				$cat_key = (string) $cat;
				$val     = $by_x[ $xv ][ $cat ] ?? '';
				$entry[ $cat_key ] = $val;
				$row_cells[]       = (string) $val;
			}
			$chart_data[] = $entry;
			$body_rows[]  = $row_cells;
		}

		return array(
			'chart_data'      => $chart_data,
			'categories'      => $categories,
			'is_multi_series' => true,
			'table_headers'   => $table_headers,
			'table_body_rows' => $body_rows,
		);
	}

	/**
	 * Map PCH data section to CB io + dataRender attributes.
	 *
	 * @param array $data PCH data object.
	 * @return array{ io: array, dataRender: array }
	 */
	private function resolve_data( array $data ): array {
		$x_type = $data['xType'] ?? 'categorical';
		$y_col  = $data['yColumn'] ?? 'y';

		$x_scale_map = array(
			'categorical' => 'linear',
			'numeric'     => 'linear',
			'date'        => 'time',
		);

		// Wide table + chartData keys (x, then series columns) — matches CB + AI endpoint.
		$pivot = $this->pivot_pch_data_to_wide( $data );

		$x_col = $data['xColumn'] ?? 'x';

		$io = array(
			'chartData'           => $pivot['chart_data'],
			'availableCategories' => $pivot['categories'],
			'independentVariable' => 'x',
		);

		$data_render = array(
			'x'         => 'x',
			'y'         => $y_col,
			'xScale'    => $x_scale_map[ $x_type ] ?? 'linear',
			'yScale'    => 'linear',
			'categories'=> $pivot['categories'],
		);

		return array(
			'io'         => $io,
			'dataRender' => $data_render,
		);
	}

	/**
	 * Map PCH metadata to CB metadata attributes.
	 *
	 * @param array $meta
	 * @return array
	 */
	private function resolve_metadata( array $meta ): array {
		return array(
			'active'   => true,
			'title'    => $meta['title'] ?? '',
			'subtitle' => $meta['subtitle'] ?? '',
			'note'     => $meta['note'] ?? '',
			'source'   => $meta['source'] ?? '',
			'tag'      => 'PEW RESEARCH CENTER',
			'alt'      => '',
		);
	}

	/**
	 * Map PCH config.independentAxis to CB independentAxis partial.
	 *
	 * @param array $axis
	 * @return array
	 */
	private function resolve_independent_axis( array $axis ): array {
		$result = array();
		if ( isset( $axis['label'] ) )           $result['label']           = $axis['label'];
		if ( isset( $axis['scale'] ) )           $result['scale']           = $axis['scale'];
		if ( isset( $axis['domain'] ) )          $result['domain']          = $axis['domain'];
		if ( isset( $axis['tickFormat'] ) )      $result['tickFormat']      = $axis['tickFormat'];
		if ( isset( $axis['tickUnit'] ) )        $result['tickUnit']        = $axis['tickUnit'];
		if ( isset( $axis['tickUnitPosition'] ) ) $result['tickUnitPosition'] = $axis['tickUnitPosition'];
		if ( isset( $axis['showZero'] ) )        $result['showZero']        = (bool) $axis['showZero'];
		return $result;
	}

	/**
	 * Map PCH config.dependentAxis to CB dependentAxis partial.
	 * yType='percentage' implies tickUnit='%' when not explicitly set.
	 *
	 * @param array  $axis
	 * @param string $y_type
	 * @return array
	 */
	private function resolve_dependent_axis( array $axis, string $y_type = 'numeric' ): array {
		$result = array();
		if ( isset( $axis['label'] ) )    $result['label']    = $axis['label'];
		if ( isset( $axis['scale'] ) )    $result['scale']    = $axis['scale'];
		if ( isset( $axis['domain'] ) )   $result['domain']   = $axis['domain'];
		if ( isset( $axis['tickFormat'] ) ) $result['tickFormat'] = $axis['tickFormat'];
		if ( isset( $axis['showZero'] ) ) $result['showZero'] = (bool) $axis['showZero'];

		if ( isset( $axis['tickUnit'] ) ) {
			$result['tickUnit'] = $axis['tickUnit'];
		} elseif ( $y_type === 'percentage' ) {
			$result['tickUnit']         = '%';
			$result['tickUnitPosition'] = 'end';
		}

		if ( isset( $axis['tickUnitPosition'] ) ) {
			$result['tickUnitPosition'] = $axis['tickUnitPosition'];
		}

		return $result;
	}

	/**
	 * @param array $legend PCH config.legend
	 * @return array
	 */
	private function resolve_legend( array $legend ): array {
		$result = array();
		if ( isset( $legend['active'] ) )      $result['active']      = (bool) $legend['active'];
		if ( isset( $legend['orientation'] ) ) $result['orientation'] = $legend['orientation'];
		return $result;
	}

	/**
	 * @param array $labels PCH config.labels
	 * @return array
	 */
	private function resolve_labels( array $labels ): array {
		$result = array();
		if ( isset( $labels['active'] ) )   $result['active']           = (bool) $labels['active'];
		if ( isset( $labels['position'] ) ) $result['labelPositionBar'] = $labels['position'];
		return $result;
	}

	/**
	 * Map PCH chart-type-specific config sections to CB type-specific attributes.
	 *
	 * @param string $chart_type
	 * @param array  $config
	 * @return array
	 */
	private function resolve_type_specific_options( string $chart_type, array $config ): array {
		$result = array();

		if ( in_array( $chart_type, array( 'bar', 'stacked-bar' ), true ) ) {
			$opts        = $config['barOptions'] ?? array();
			$bar_partial = array();
			if ( isset( $opts['barPadding'] ) )      $bar_partial['barPadding']      = $opts['barPadding'];
			if ( isset( $opts['barGroupPadding'] ) ) $bar_partial['barGroupPadding'] = $opts['barGroupPadding'];
			if ( isset( $opts['stackOffset'] ) )     $bar_partial['stackOffset']     = $opts['stackOffset'];
			if ( ! empty( $bar_partial ) )           $result['bar']                  = $bar_partial;
		}

		if ( in_array( $chart_type, array( 'line', 'area', 'stacked-area' ), true ) ) {
			$opts         = $config['lineOptions'] ?? array();
			$line_partial = array();
			if ( isset( $opts['interpolation'] ) )    $line_partial['interpolation']    = $opts['interpolation'];
			if ( isset( $opts['strokeWidth'] ) )      $line_partial['strokeWidth']      = $opts['strokeWidth'];
			if ( isset( $opts['showPoints'] ) )       $line_partial['showPoints']       = (bool) $opts['showPoints'];
			if ( isset( $opts['areaFillOpacity'] ) )  $line_partial['areaFillOpacity']  = $opts['areaFillOpacity'];
			if ( ! empty( $line_partial ) )           $result['line']                   = $line_partial;
		}

		if ( $chart_type === 'dot-plot' ) {
			$opts        = $config['dotPlotOptions'] ?? array();
			$dot_partial = array();
			if ( isset( $opts['connectPoints'] ) ) $dot_partial['connectPoints'] = (bool) $opts['connectPoints'];
			if ( ! empty( $dot_partial ) )         $result['dotPlot']            = $dot_partial;
		}

		if ( $chart_type === 'scatter' ) {
			$opts = $config['scatterOptions'] ?? array();
			if ( isset( $opts['showRegressionLine'] ) || isset( $opts['regressionType'] ) ) {
				$regression = array();
				if ( isset( $opts['showRegressionLine'] ) ) $regression['active'] = (bool) $opts['showRegressionLine'];
				if ( isset( $opts['regressionType'] ) )     $regression['type']   = $opts['regressionType'];
				$result['regression'] = $regression;
			}
		}

		if ( $chart_type === 'diverging-bar' ) {
			$opts        = $config['divergingBarOptions'] ?? array();
			$div_partial = array();
			if ( isset( $opts['positiveCategories'] ) ) $div_partial['positiveCategories'] = $opts['positiveCategories'];
			if ( isset( $opts['negativeCategories'] ) ) $div_partial['negativeCategories'] = $opts['negativeCategories'];
			if ( ! empty( $div_partial ) )              $result['divergingBar']             = $div_partial;
		}

		return $result;
	}

	// ── Block serialization ───────────────────────────────────────────────────

	/**
	 * Build serialized WordPress block markup from the converted attributes.
	 *
	 * Structure mirrors what the JS CreateNewChartModal builds:
	 *   prc-chart-builder/controller
	 *     prc-block/table      (data table)
	 *     prc-chart-builder/chart  (chart config)
	 *
	 * @param string $chart_type
	 * @param array  $chart_attrs  Converted CB chart block attributes.
	 * @param array  $data         PCH data section.
	 * @return string Serialized block content for the post.
	 */
	private function build_block_content( string $chart_type, array $chart_attrs, array $data ): string {
		// Lock the chart so editors can't accidentally remove it.
		$chart_attrs['lock'] = array(
			'move'   => true,
			'remove' => true,
		);

		// Wide-format table (same pivot as resolve_data / Chart Builder variation templates).
		$pivot       = $this->pivot_pch_data_to_wide( $data );
		$header_cols = $pivot['table_headers'];
		$head_rows   = array(
			array(
				'cells' => array_values( array_map(
					static fn( $h ) => array( 'content' => $h, 'tag' => 'th' ),
					$header_cols
				) ),
			),
		);

		$body_rows = array();
		foreach ( $pivot['table_body_rows'] as $row_vals ) {
			$cells = array();
			foreach ( $row_vals as $cell ) {
				$cells[] = array( 'content' => (string) $cell, 'tag' => 'td' );
			}
			$body_rows[] = array( 'cells' => $cells );
		}

		$table_attrs = array(
			'isScrollOnPc'     => true,
			'isScrollOnMobile' => true,
			'sticky'           => 'first-column',
			'className'        => 'chart-builder-data-table',
			'fontSize'         => 'small',
			'fontFamily'       => 'sans-serif',
			'head'             => $head_rows,
			'body'             => $body_rows,
		);

		$table_html   = $this->build_table_html( $head_rows, $body_rows );
		$table_markup = $this->serialize_block( self::TABLE_BLOCK, $table_attrs, $table_html );
		$chart_markup = $this->serialize_block( self::CHART_BLOCK, $chart_attrs, '' );

		$controller_attrs   = array( 'chartType' => $chart_type );
		$controller_content = "\n" . $table_markup . "\n\n" . $chart_markup . "\n";

		return $this->serialize_block( self::CONTROLLER_BLOCK, $controller_attrs, $controller_content );
	}

	/**
	 * Build inner HTML for a prc-block/table block.
	 * Mirrors the structure the block's save() function produces.
	 *
	 * @param array $head_rows
	 * @param array $body_rows
	 * @return string
	 */
	private function build_table_html( array $head_rows, array $body_rows ): string {
		$classes = 'wp-block-prc-block-table is-scroll-on-pc is-scroll-on-mobile chart-builder-data-table has-sans-serif-font-family has-small-font-size';

		$thead = '';
		foreach ( $head_rows as $row ) {
			$cells = '';
			foreach ( $row['cells'] ?? array() as $cell ) {
				$tag     = in_array( $cell['tag'] ?? 'th', array( 'th', 'td' ), true ) ? $cell['tag'] : 'th';
				$content = esc_html( $cell['content'] ?? '' );
				$cells  .= "<{$tag}>{$content}</{$tag}>";
			}
			$thead .= "<tr>{$cells}</tr>";
		}

		$tbody = '';
		foreach ( $body_rows as $row ) {
			$cells = '';
			foreach ( $row['cells'] ?? array() as $cell ) {
				$tag     = in_array( $cell['tag'] ?? 'td', array( 'th', 'td' ), true ) ? $cell['tag'] : 'td';
				$content = esc_html( $cell['content'] ?? '' );
				$cells  .= "<{$tag}>{$content}</{$tag}>";
			}
			$tbody .= "<tr>{$cells}</tr>";
		}

		return "\n<figure class=\"{$classes}\"><table class=\"has-fixed-layout is-sticky-first-column\"><thead>{$thead}</thead><tbody>{$tbody}</tbody></table></figure>\n";
	}

	/**
	 * Produce WordPress block comment markup for a single block.
	 *
	 * @param string $block_name
	 * @param array  $attributes
	 * @param string $inner_html Inner content for container blocks.
	 * @return string
	 */
	private function serialize_block( string $block_name, array $attributes, ?string $inner_html = null ): string {
		$attrs_json = wp_json_encode( $attributes );

		if ( null === $inner_html ) {
			return sprintf( '<!-- wp:%s %s /-->', $block_name, $attrs_json );
		}

		return sprintf(
			"<!-- wp:%s %s -->\n%s<!-- /wp:%s -->",
			$block_name,
			$attrs_json,
			$inner_html ? $inner_html . "\n" : '',
			$block_name
		);
	}
}
