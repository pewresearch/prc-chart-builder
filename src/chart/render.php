<?php
namespace PRC\Platform\Chart_Builder;

wp_enqueue_script( 'prc-charting-library' );

if ( is_admin() || null === $block ) {
	return $content;
}

$block_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes(
	'prc-block/chart-builder',
	isset( $attributes ) ? $attributes : array()
);

$block_id = $block_attributes['id'];
if ( false === $block_id ) {
	new \WP_Error( 'missing_id', __( 'Chart Block is missing ID', 'prc-block-library' ) );
	return;
}
$target_namespace = array_key_exists( 'interactiveNamespace', $attributes ) ? $attributes['interactiveNamespace'] : 'prc-block/chart-builder';
$svg_fallback     = $block_attributes['svgUrl'];

$chart_data            = $block_attributes['chartData'];
$is_static_chart       = $block_attributes['isStaticChart'];
$table_data            = $block_attributes['tableData'];
$has_preformatted_data = $block_attributes['hasPreformattedData'];
$preformatted_data     = $block_attributes['preformattedData'];
$should_render         = $block_attributes['defaultShouldRender'];

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
			// decode the table data to ensure it is an array
			'table-data'    => $table_data ? json_decode( $table_data, true ) : null,
			'chart-hash'    => $block_id,
			'iframe-height' => null,
			'should-render' => $should_render,
			'attributes' => $block->attributes,
		),
	),
);

$block_attrs = array(
	'id'                         => wp_unique_id( 'chart-block-' ),
	'data-wp-key'                => $block_id,
	'data-wp-interactive'        => $target_namespace,
	'data-wp-context'            => wp_json_encode(
		array(
			'id'         => $block_id,
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
	$max_width   = $block_attributes['width'].'px';
	$top_rule    = $block_attributes['horizontalRules'] ? wp_sprintf(
		'<hr class="cb__hr" style="margin: 0 0 10px; max-width:%1$s;" />',
		$max_width
	) : '';
	$bottom_rule = $block_attributes['horizontalRules'] ? wp_sprintf(
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
		$block_wrapper_attrs,
		$max_width,
		$top_rule,
		$block_attributes['metaTitle'],
		$block_attributes['metaSubtitle'],
		$is_static_chart ? $static_chart : $chart,
		$block_attributes['metaNote'],
		$block_attributes['metaSource'],
		$block_attributes['metaTag'],
		$bottom_rule
	);
} else {
	echo wp_sprintf( '<div %1$s>%2$s</div>', $block_wrapper_attrs, $is_static_chart ? $static_chart : $chart );
}
