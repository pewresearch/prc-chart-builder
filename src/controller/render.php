<?php
/**
 * Render the prc-block/chart-builder-controller block.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

// In admin context's just return the content.
if ( is_admin() ) {
	return $content;
}

if ( null === $block || empty( $block->inner_blocks ) ) {
	return '';
}

wp_enqueue_script( 'wp-url' );
wp_enqueue_script( 'prc-functions' );

/**
 * Initialize variables and get basic post and device data
 */
$post_id          = get_the_ID();
$publication_date = get_the_date( 'Y-m-d', $post_id );
$root_url         = get_bloginfo( 'url' );
$permalink        = get_permalink( $post_id );
$is_mobile = 'mobile' === \PRC\Platform\get_current_device();

/**
 * Get controller block attributes
 */
$controller_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes(
	'prc-block/chart-builder-controller',
	isset( $attributes ) ? $attributes : array()
);
$block_id          = $controller_attributes['id'];
$align             = $controller_attributes['align'];
$tabs_active = $controller_attributes['tabsActive'];
$share_active = $controller_attributes['shareActive'];
$is_static_chart   = $controller_attributes['isStatic'] || $controller_attributes['chartType'] === 'static';
$is_freeform_chart = $controller_attributes['isFreeform'];

// todo: this is a way to retrieve the datasets for the chart. not sure yet if we want to surface this in the chart builder block.
// $post_type = get_post_type();
// if ( 'chart' === $post_type ) {
// $post_id = get_the_ID();
// $datasets = wp_get_post_terms( $post_id, 'datasets' );
// $datasets = array_map(
// function ( $dataset ) {
// return array(
// 'type'  => 'dataset',
// 'id'    => $dataset->term_id,
// 'label' => $dataset->name,
// 'url'   => get_term_link( $dataset ),
// );
// },
// $datasets
// );
// }

/**
 * Discover and process all inner blocks in one pass
 */
$inner_blocks = $block->parsed_block['innerBlocks'];
$blocks = array(
	'chart' => null,
	'table' => null,
	'freeform' => null,
	'image' => null,
);

foreach ( $inner_blocks as $inner_block ) {
	$block_name = $inner_block['blockName'] ?? '';

	switch ( $block_name ) {
		case 'prc-block/chart-builder':
			$blocks['chart'] = $inner_block;
			break;
		case 'core/table':
		case 'prc-block/table':
			$blocks['table'] = $inner_block;
			break;
	}
}

// if no chart block, return
if ( ! $blocks['chart'] ) {
	return '';
}

if ( $is_freeform_chart ) {
	$blocks['freeform'] = array_filter( $blocks['chart']['innerBlocks'], function ( $chart_inner_block ) {
		return 'core/group' === ( $chart_inner_block['blockName'] ) && 'wp-chart-builder-freeform-chart' === ( $chart_inner_block['attrs']['className'] ?? '' );
	} ) ?? null;
} else {
	$blocks['freeform'] = null;
}

if ( $is_static_chart) {
	// Find image block within chart block if it exists
	foreach ( $blocks['chart']['innerBlocks'] as $chart_inner_block ) {
		if ( 'core/image' === ( $chart_inner_block['blockName'] ?? '' ) ) {
			$blocks['image'] = $chart_inner_block;
			break;
		}
	}
}

/**
 * Process chart block attributes
 */
$chart_attributes = array();
$width = '640px';
$featured_image_id = null;
$featured_image_url = null;

if ( $blocks['chart'] ) {
	$chart_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes(
		'prc-block/chart-builder',
		$blocks['chart']['attrs'] ?? array()
	);

	$width = ( $chart_attributes['width'] ?? 640 ) . 'px';

	// Handle preformatted data
	$preformatted_data = $attributes['chartPreformattedData'] ?? null;
	if ( $preformatted_data ) {
		$blocks['chart']['attrs']['hasPreformattedData'] = true;
		$blocks['chart']['attrs']['preformattedData'] = $preformatted_data;
	}

	// Process static image if present
	if ( $blocks['image'] ) {
		$static_chart_img = wp_get_attachment_image_src( $blocks['image']['attrs']['id'], 'full' );
		$blocks['chart']['attrs']['isStaticChart'] = true;
		$blocks['chart']['attrs']['staticImageId'] = $blocks['image']['attrs']['id'];
		$blocks['chart']['attrs']['staticImageUrl'] = $static_chart_img[0];
		$blocks['chart']['attrs']['staticImageInnerHTML'] = $blocks['image']['innerHTML'];

		$featured_image_id = $blocks['image']['attrs']['id'];
		$featured_image_url = $static_chart_img[0];
	} else {
		$featured_image_id = $chart_attributes['pngId'] ?? null;
		$featured_image_url = $chart_attributes['pngUrl'] ?? null;
	}
}

/**
 * Process table block and generate table with metadata
 */
$table_array = null;
$table_with_meta = '';
if ( $blocks['table'] ) {
	$blocks['table']['attrs']['className'] = 'chart-builder-data-table';

	$table_array = $attributes['tableData'] ?? false;
	if ( true !== $table_array || empty( $attributes['tableData'] ) ) {
		$table_array = \PRC\Platform\Core\WP_HTML_Sub_Processors\parse_table_block_into_array( $blocks['table']['innerHTML'] );
	}

	$table_height = ( $chart_attributes['height'] ?? 400 ) - 65 . 'px';

	$meta_title = $chart_attributes['metaTitle'] ?? '';
	$meta_subtitle = $chart_attributes['metaSubtitle'] ?? '';
	$meta_source = $chart_attributes['metaSource'] ?? '';
	$meta_note = $chart_attributes['metaNote'] ?? '';
	$meta_tag = $chart_attributes['metaTag'] ?? '';

	ob_start();
	?>
	<hr style="margin: 0px 0px 10px; max-width: <?php echo esc_attr( $width ); ?>;">
	<div class="cb__title"><?php echo apply_filters( 'the_content', $meta_title ); ?></div>
	<div class="cb__subtitle"><?php echo apply_filters( 'the_content', $meta_subtitle ); ?></div>
	<div style="max-width: <?php echo esc_attr( $width ); ?> !important; height: <?php echo esc_attr( $table_height ); ?> !important; margin-bottom: 20px; overflow: auto;">
		<?php echo wp_kses( render_block( $blocks['table'] ), 'post' ); ?>
	</div>
	<div class="wp-block-buttons">
		<div class="wp-block-button has-custom-width has-custom-font-size is-style-fill has-sans-serif-font-family has-small-label-font-size">
			<a
				data-wp-on--click="actions.downloadData"
				data-wp-on--keydown="actions.downloadData"
				style="height: 45px!important;"
				tabindex="0"
				class="wp-block-button__link has-white-color has-link-color-background-color has-text-color has-background wp-element-button wp-chart-builder-download button">
				Download data as .csv
			</a>
		</div>
	</div>
	<div class="cb__note"><?php echo apply_filters( 'the_content', $meta_note ); ?></div>
	<div class="cb__note"><?php echo apply_filters( 'the_content', $meta_source ); ?></div>
	<div class="cb__tag"><?php echo apply_filters( 'the_content', $meta_tag ); ?></div>
	<hr style="margin: 10px 0px 0px; max-width: <?php echo esc_attr( $width ); ?>;">
	<?php
	$table_with_meta = ob_get_clean();
}

if ( $blocks['chart'] ) {
	$blocks['chart']['attrs']['tableData'] = wp_json_encode( $table_array );
}

/**
 * Generate share modal if needed
 */
$share_modal = '';
if ( $share_active ) {
	ob_start();
	?>
	<!-- register a callback on this div to see if the native share is supported -->
	<div
		class="share-modal__overlay"
		id="share-modal__overlay-<?php echo esc_attr( $block_id ); ?>"
		data-wp-class--active="state.isActive"
		data-wp-class--web-share-supported="state.webShareSupported"
		data-wp-on--click="actions.hideModal"
		data-wp-on--keydown="actions.hideModal"
		data-chart-view="share"
	></div>
	<!-- TODO: I would like to be able to use the social share block here. Need to modify it to work with the share modal. -->
	<div
		class="share-modal" id="share-modal-<?php echo esc_attr( $block_id ); ?>"
		data-wp-class--active="state.isActive"
		data-wp-class--web-share-supported="state.webShareSupported"
		data-chart-view="share"
	>
		<div class="share-modal__inner">
			<div class="share-modal__header">
				<h2 class="share-modal__title">Share this chart</h2>
				<button class="share-modal__close" aria-label="Close Share Modal" data-wp-on--click="actions.hideModal">
					<span class="dashicons dashicons-no-alt"></span>
				</button>
			</div>
			<div class="share-modal__body">
				<button
					type="button"
					class="share-modal__button share-modal__button--twitter"
					data-wp-on--click="actions.shareTwitter"
					data-wp-on--keydown="actions.shareTwitter"
				>
					<span>Share on X</span>
				</button>
				<button
					type="button"
					class="share-modal__button share-modal__button--facebook"
					data-wp-on--click="actions.shareFacebook"
					data-wp-on--keydown="actions.shareFacebook"
				>
					<span>Share on Facebook</span>
				</button>
			</div>
		</div>
	</div>
	<?php
	$share_modal = ob_get_clean();
}

// check if url has the parameter offerSVGDownload and if so, add the data attribute to the block
$offer_svg_download = isset( $_GET['offerSVGDownload'] ) ? $_GET['offerSVGDownload'] : false;

/**
 * Setup Interactivity API
 */
$target_namespace = $attributes['interactiveNamespace'] ?? 'prc-block/chart-builder-controller';
$state = wp_interactivity_state(
	$target_namespace,
	array(
		$block_id => array(
			'preformattedData' => $preformatted_data ?? null,
			'activeTab' => 'chart',
			'webShareSupported' => $is_mobile ? false : true,
		),
	),
);

$context = array(
	'id' => $block_id,
	'postId' => $post_id,
	'postUrl' => $permalink,
	'postPubDate' => $publication_date,
	'rootUrl' => $root_url,
	'featuredImageId' => $featured_image_id,
	'featuredImageUrl' => $featured_image_url,
	'title' => $chart_attributes['metaTitle'] ?? '',
	'subtitle' => $chart_attributes['metaSubtitle'] ?? '',
	'note' => $chart_attributes['metaNote'] ?? '',
	'source' => $chart_attributes['metaSource'] ?? '',
	'tag' => $chart_attributes['metaTag'] ?? '',
	'tableData' => $table_array,
);

$block_attrs = get_block_wrapper_attributes(
	array(
		'id' => $block_id,
		'data-wp-interactive' => $target_namespace,
		'data-wp-context' => wp_json_encode( $context ),
		'class' => 'wp-chart-builder-wrapper align' . $align,
		'style' => 'max-width:' . $width . ';',
		'data-wp-init' => 'callbacks.detectWebShareSupport',
	)
);

/**
 * Render the complete chart builder
 */
ob_start();
?>
<div <?php echo $block_attrs; ?>>
	<?php
	// if the chart is a freeform chart, and the share tabs are active, render the freeform chart in the tabbed interface
	if ( $tabs_active && $blocks['freeform'] && $blocks['table'] ) {
		// Handle array of blocks or single block
		$blocks_to_render = is_array( $blocks['freeform'] ) && isset( $blocks['freeform'][0]['blockName'] ) ? $blocks['freeform'] : [ $blocks['freeform'] ];
		$rendered_blocks = '';
		foreach ( $blocks_to_render as $block_to_render ) {
			$rendered_blocks .= render_block( $block_to_render );
		}

		echo wp_sprintf(
			'<div class="wp-chart-builder-chart active" data-chart-view="chart" data-allow-overlay="true" data-wp-class--active="state.isActive">%s%s</div>
			<div class="wp-chart-builder-table" data-chart-view="table" data-wp-class--active="state.isActive" id="%s-table" style="max-width:%s;">%s</div>',
			$rendered_blocks,
			$share_modal,
			esc_attr( $block_id ),
			esc_attr( $width ),
			$table_with_meta
		);
	// if the chart is a freeform chart, and the share tabs are not active, render the freeform chart
	} elseif ( $blocks['freeform'] ) {
		$blocks_to_render = is_array( $blocks['freeform'] ) && isset( $blocks['freeform'][0]['blockName'] ) ? $blocks['freeform'] : [ $blocks['freeform'] ];
		foreach ( $blocks_to_render as $block_to_render ) {
			echo render_block( $block_to_render );
		}
	// if the chart is a regular chart, and the share tabs are active, render the chart in the tabbed interface
	} elseif ( $tabs_active && $blocks['chart'] && $blocks['table'] ) {
		echo wp_sprintf(
			'<div class="wp-chart-builder-chart active" data-chart-view="chart" data-allow-overlay="true" data-wp-class--active="state.isActive">%s%s</div>
			<div class="wp-chart-builder-table" data-chart-view="table" data-wp-class--active="state.isActive" id="%s-table" style="max-width:%s;">%s</div>',
			render_block( $blocks['chart'] ),
			$share_modal,
			esc_attr( $block_id ),
			esc_attr( $width ),
			$table_with_meta
		);
	// if the chart is a regular chart, and the share tabs are not active, render the chart
	} elseif ( $blocks['chart'] ) {
		// if the chart has an image, render the image, otherwise render the chart
		echo $blocks['image'] ? render_block( $blocks['image'] ) : render_block( $blocks['chart'] );
	// if there is an error, render an error message
	} else {
		echo wp_sprintf(
			'<p class="error-message">An error has occurred on chart %s. Please try again later.</p>',
			esc_attr( $block_id )
		);
	}

	// if the offer svg download is active, render the download svg button
	if ( $offer_svg_download ) {
		echo wp_sprintf(
			'<button data-wp-on--click="actions.downloadSVG" class="download-svg sans-serif blue-link" style="margin-bottom: 20px;" data-chart-id="%s">Download graphic as SVG</button>',
			esc_attr( $block_id )
		);
	}

	// if the share tabs are active, render the view buttons
	if ( $tabs_active ) {
		$buttons = array(
			'chart' => 'Chart',
			'table' => 'Data',
		);

		echo wp_sprintf( '<div class="wp-chart-builder-view-buttons" style="max-width:%s;">', esc_attr( $width ) );

		foreach ( $buttons as $view => $label ) {
			echo wp_sprintf(
				'<button class="view-button view-button--%s" data-chart-view="%s" data-chart-id="%s" data-wp-on--click="actions.setActiveTab" data-wp-class--active="state.isActive">%s</button>',
				esc_attr( $view ),
				esc_attr( $view ),
				esc_attr( $block_id ),
				esc_html( $label )
			);
		}

		if ( $share_active ) {
			echo wp_sprintf(
				'<button class="YOOOO view-button view-button--share" data-chart-view="share" data-chart-id="%s" data-wp-on--click="actions.setActiveTab" data-wp-class--active="state.isActive">Share</button>',
				esc_attr( $block_id )
			);
		}

		echo '</div>';
	}
	?>
</div>
<?php
$controller_content = ob_get_clean();

echo wp_sprintf(
	'<figure class="wp-chart-builder">%s</figure>',
	$controller_content
);
