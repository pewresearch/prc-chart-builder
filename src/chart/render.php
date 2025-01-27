<?php
namespace PRC\Platform\Chart_Builder;

wp_enqueue_script('prc-charting-library');

if ( is_admin() || null === $block ) {
	return $content;
}
// @TODO: Can we remove this dependency on the platform core somehow...
$block_attributes = \PRC\Platform\Block_Utils\get_block_attributes('prc-block/chart-builder', $attributes);
$id            		= $block_attributes['id'];
if ( false === $id ) {
	new \WP_Error( 'missing_id', __( 'Chart Block is missing ID', 'prc-block-library' ) );
	return;
}
$target_namespace       = array_key_exists( 'interactiveNamespace', $attributes ) ? $attributes['interactiveNamespace'] : 'prc-block/chart-builder';
$svg_fallback 		   = $block_attributes['svgUrl'];

// get the publication date of the post
// @TODO: @benwormald what's going on with the post id here? Would it be better to get it from the global context? context.postId?
$post_id               = get_the_ID();
$publication_date 	   = get_the_date('Y-m-d', $post_id);
$root_url 	  		   = get_bloginfo('url');
$chart_data 		   = $block_attributes['chartData'];
$table_data 		   = $block_attributes['tableData'];
$has_preformatted_data = $block_attributes['hasPreformattedData'];
$preformatted_data 	   = $block_attributes['preformattedData'];
$should_render 	   	   = $block_attributes['defaultShouldRender'];
if ( $has_preformatted_data && $preformatted_data ) {
	$chart_data = $preformatted_data;
}

wp_interactivity_state(
	$target_namespace,
	[
		$id => [
			'chart-data' => $chart_data,
			// decode the table data to ensure it is an array
			'table-data' => json_decode($table_data, true),
			'chart-hash' => $id,
			'post-id' => $post_id,
			'post-url' => get_permalink( $post_id ),
			'post-pub-date' => $publication_date,
			'root-url' => $root_url,
			'iframe-height' => null,
			'should-render' => $should_render,
		],
	],
);

$block_attrs = [
	'id'							=> wp_unique_id('chart-block-'),
	'data-wp-key'           		=> $id,
	'data-wp-interactive'			=> wp_json_encode(['namespace' => $target_namespace]),
	'data-wp-context' 				=> wp_json_encode([
		'id' => $id,
		'attributes' => $block->attributes,
	]),
	'class' 						=> 'wp-chart-builder-inner',
	'data-wp-watch--init-render' => 'callbacks.watchForRender',
	// 'data-wp-run' => false === $has_custom_render ? 'callbacks.onRun' : null,
];


$block_wrapper_attrs = get_block_wrapper_attributes($block_attrs);

$chart = wp_sprintf('<div id="%1$s"><img src="%2$s" alt="Chart" class="chart-fallback" /></div>',
	$id,
	$svg_fallback
);
// scaffold chart text elements
$meta_text_active = $block_attributes['metaTextActive'];
if ($meta_text_active) {
	$max_width = $block_attributes['width'];
	$top_rule = $block_attributes['horizontalRules'] ? wp_sprintf('<hr class="cb__hr" style="margin: 0 0 10px; max-width:%1$s;" />',
		$max_width
	) : '';
	$bottom_rule = $block_attributes['horizontalRules'] ? wp_sprintf('<hr class="cb__hr" style="margin: 10px 0 0; max-width:%1$s;" />',
		$max_width
	) : '';
	echo wp_sprintf(/* html */'
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
		$chart,
		$block_attributes['metaSource'],
		$block_attributes['metaNote'],
		$block_attributes['metaTag'],
		$bottom_rule
	);
} else {
	echo wp_sprintf('<div %1$s>%2$s</div>', $block_wrapper_attrs, $chart);
}
