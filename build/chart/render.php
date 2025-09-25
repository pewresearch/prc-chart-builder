<?php
/**
 * Chart block render callback.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

wp_enqueue_script( 'prc-charting-library' );

if ( is_admin() || null === $block ) {
	return $content;
}

// Prevent double rendering by tracking rendered blocks
static $rendered_blocks = array();

$block_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes(
	'prc-chart-builder/chart',
	isset( $attributes ) ? $attributes : array()
);

$block_id = $block_attributes['id'];

// Handle missing ID for converted charts
if ( false === $block_id || empty( $block_id ) ) {
	$chart_converted = $block_attributes['chartConverted'] ?? null;

	// If this is a converted chart without an ID, generate a unique one.
	if ( $chart_converted && isset( $chart_converted['converted'] ) && $chart_converted['converted'] ) {
		$block_id = wp_unique_id( 'converted-chart-' );
		// Update the block attributes with the generated ID.
		$block_attributes['id'] = $block_id;
	} else {
		// For non-converted charts, return an error as before.
		new \WP_Error( 'missing_id', __( 'Chart Block is missing ID', 'prc-block-library' ) );
		return;
	}
}

// Check if this block has already been rendered.
if ( isset( $rendered_blocks[ $block_id ] ) ) {
	return $content;
}

// Mark this block as rendered.
$rendered_blocks[ $block_id ] = true;

$target_namespace = array_key_exists( 'interactiveNamespace', $attributes ) ? $attributes['interactiveNamespace'] : 'prc-chart-builder/chart';
$svg_fallback     = $block_attributes['svgUrl'];

$chart_data            = $block_attributes['chartData'];
$is_static_chart       = $block_attributes['isStaticChart'];
$table_data            = $block_attributes['tableData'];
$has_preformatted_data = $block_attributes['hasPreformattedData'];
$preformatted_data     = $block_attributes['preformattedData'];
$should_render         = $block_attributes['defaultShouldRender'] ?? true;

if ( $has_preformatted_data && $preformatted_data ) {
	$chart_data = $preformatted_data;
}

// chart should always have $chart_data or $is_static_chart. If neither is set, return an error.
if ( ! $chart_data && ! $is_static_chart ) {
	new \WP_Error( 'missing_chart_data', __( 'Chart Block is missing chartData or isStaticChart', 'prc-block-library' ) );
	return;
}

wp_interactivity_state(
	$target_namespace,
	array(
		$block_id => array(
			'chart-data'    => $chart_data,
			// Decode the table data to ensure it is an array.
			'table-data'    => $table_data ? json_decode( $table_data, true ) : null,
			'chart-hash'    => $block_id,
			'iframe-height' => null,
			'should-render' => $should_render,
			'attributes'    => $block->attributes,
		),
	),
);

$block_attrs = array(
	'id'                         => wp_unique_id( 'chart-block-' ),
	'data-wp-key'                => $block_id,
	'data-wp-interactive'        => $target_namespace,
	'data-wp-context'            => wp_json_encode(
		array(
			'id' => $block_id,
		)
	),
	'class'                      => 'wp-chart-builder-inner',
	'data-wp-watch--init-render' => $is_static_chart ? null : 'callbacks.watchForRender',
);


$block_wrapper_attrs = get_block_wrapper_attributes( $block_attrs );

$chart = wp_sprintf(
	'<div id="%1$s"><img src="%2$s" alt="Chart" class="chart-fallback" /></div>',
	$block_id,
	$svg_fallback
);

$static_chart = '';
if ( $is_static_chart ) {
	$static_chart = wp_sprintf(
		'<div id="%1$s">%2$s</div>',
		$block_attributes['staticImageId'],
		$block_attributes['staticImageInnerHTML']
	);
}

// Scaffold chart text elements.
$meta_text_active = $block_attributes['metaTextActive'];
if ( $meta_text_active ) {
		$max_width = $block_attributes['width'] . 'px';
	$top_rule      = $block_attributes['horizontalRules'] ? wp_sprintf(
		'<hr class="cb__hr" style="margin: 0 0 10px; max-width:%1$s;" />',
		$max_width
	) : '';
	$bottom_rule   = $block_attributes['horizontalRules'] ? wp_sprintf(
		'<hr class="cb__hr" style="margin: 10px 0 0; max-width:%1$s;" />',
		$max_width
	) : '';
		echo wp_sprintf(
			'
		<div %1$s>
			<div class="cb__text-wrapper" style="max-width:%2$s;">
				%3$s
				<div class="cb__title">%4$s</div>
				<div class="cb__subtitle">%5$s</div>
				%6$s
				<div class="cb__note">%7$s</div>
				<div class="cb__note">%8$s</div>
				<div class="cb__tag">%9$s</div>
				%10$s
			</div>
		</div>',
			wp_kses_post( $block_wrapper_attrs ),
			esc_attr( $max_width ),
			wp_kses_post( $top_rule ),
			wp_kses_post( $block_attributes['metaTitle'] ),
			wp_kses_post( $block_attributes['metaSubtitle'] ),
			wp_kses_post( $is_static_chart ? $static_chart : $chart ),
			wp_kses_post( $block_attributes['metaNote'] ),
			wp_kses_post( $block_attributes['metaSource'] ),
			wp_kses_post( $block_attributes['metaTag'] ),
			wp_kses_post( $bottom_rule )
		);
} else {
		echo wp_sprintf( '<div %1$s>%2$s</div>', wp_kses_post( $block_wrapper_attrs ), wp_kses_post( $is_static_chart ? $static_chart : $chart ) );
}
