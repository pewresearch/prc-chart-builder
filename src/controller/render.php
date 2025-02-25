<?php
namespace PRC\Platform\Chart_Builder;
if ( is_admin() ) {
	return $content;
}

wp_enqueue_script( 'wp-url' );
wp_enqueue_script( 'prc-functions' );

if ( null === $block || empty( $block->inner_blocks ) ) {
	return '';
}

// todo: this is a way to retrieve the datasets for the chart. not sure yet if we want to surface this in the chart builder block.
// $post_type = get_post_type();
// if ( 'chart' === $post_type ) {
// 	$post_id = get_the_ID();
// 	$datasets = wp_get_post_terms( $post_id, 'datasets' );
// 	$datasets = array_map(
// 		function ( $dataset ) {
// 			return array(
// 					'type'  => 'dataset',
// 					'id'    => $dataset->term_id,
// 					'label' => $dataset->name,
// 					'url'   => get_term_link( $dataset ),
// 				);
// 			},
// 			$datasets
// 		);
// }

// get the controller block attributes and set the id
$controller_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes( 'prc-block/chart-builder-controller', $attributes );
$id                    = $controller_attributes['id'];
$align                 = $controller_attributes['align'];
$active_share_tabs     = $controller_attributes['tabsActive'];

// CHART BUILDER BLOCK AND ATTRIBUTES
// get the chart block and its attributes
$chart_block = array_filter(
	$block->parsed_block['innerBlocks'],
	function ( $b ) {
		return array_key_exists( 'blockName', $b ) && 'prc-block/chart-builder' === $b['blockName'];
	}
);

$chart_block      = array_pop( $chart_block );
$chart_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes( 'prc-block/chart-builder', $chart_block['attrs'] );

$metaTitle        = $chart_attributes['metaTitle'];
$metaSubtitle     = $chart_attributes['metaSubtitle'];
$metaNote         = $chart_attributes['metaNote'];
$metaSource       = $chart_attributes['metaSource'];
$metaTag          = $chart_attributes['metaTag'];
$width            = $chart_attributes['width'] . 'px';
$maxWidth         = array_key_exists( 'width', $chart_block['attrs'] ) ? $chart_block['attrs']['width'] . 'px' : '640px';
// check if preformatted data is set on the controller block
$preformatted_data = array_key_exists( 'chartPreformattedData', $attributes ) ? $attributes['chartPreformattedData'] : null;
// if it exists, set hasPreformattedData to true on the chart block, and set the preformatted data on the chart block
if ( $preformatted_data ) {
	$chart_block['attrs']['hasPreformattedData'] = true;
	$chart_block['attrs']['preformattedData']    = $preformatted_data;
}

// IMAGE BLOCK AND ATTRIBUTES
// get the image inner block
$image_block = array_filter(
	$chart_block['innerBlocks'],
	function ( $b ) {
		return array_key_exists( 'blockName', $b ) && 'core/image' === $b['blockName'];
	}
);
$image_block = array_pop( $image_block );


if ( $image_block ) {
	// get attachment image url
	$static_chart_img                       = wp_get_attachment_image_src( $image_block['attrs']['id'], 'full' );
	$static_chart_image_src                 = $static_chart_img[0];
	$chart_block['attrs']['isStaticChart']  = true;
	$chart_block['attrs']['staticImageId']  = $image_block['attrs']['id'];
	$chart_block['attrs']['staticImageUrl'] = $static_chart_image_src;
	$chart_block['attrs']['staticImageInnerHTML'] = $image_block['innerHTML'];
}

$featured_image_id  = $image_block ? $chart_block['attrs']['staticImageId'] : $chart_attributes['pngId'];
$featured_image_url = $image_block ? $chart_block['attrs']['staticImageUrl'] : $chart_attributes['pngUrl'];

// TABLE BLOCK AND ATTRIBUTES
$table_block     = array_filter(
	$block->parsed_block['innerBlocks'],
	function ( $b ) {
		return array_key_exists( 'blockName', $b ) &&
			( 'core/table' === $b['blockName'] || 'flexible-table-block/table' === $b['blockName'] );
	}
);
$table_block     = array_pop( $table_block );
$table_array     = null;
$table_with_meta = '';
if ( $table_block ) {
	$table_block['attrs']['className'] = 'chart-builder-data-table';
	$table_array                       = array_key_exists( 'tableData', $attributes ) ? $attributes['tableData'] : false;
	$table_array                       = true !== $table_array || empty( $attributes['tableData'] ) ? parse_table_block_into_array( $table_block['innerHTML'] ) : $table_array;
	// height of chart - button margin - download button
	$table_height = $chart_attributes['height'] - 65 . 'px';
	ob_start();
	?>
	<hr style="margin: 0px 0px 10px; max-width: <?php echo esc_attr( $width ); ?>;">
	<div class="cb__title"><?php echo apply_filters( 'the_content', $metaTitle ); ?></div>
	<div class="cb__subtitle"><?php echo apply_filters( 'the_content', $metaSubtitle ); ?></div>
	<div style="max-width: <?php echo esc_attr( $width ); ?> !important; height: <?php echo esc_attr( $table_height ); ?> !important; margin-bottom: 20px; overflow: auto;">
		<?php echo wp_kses( render_block( $table_block ), 'post' ); ?>
	</div>
	<div class="wp-block-buttons wp-container-2">
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
		<div class="cb__note"><?php echo apply_filters( 'the_content', $metaSource ); ?></div>
		<div class="cb__note" ><?php echo apply_filters( 'the_content', $metaNote ); ?></div>
	<div class="cb__tag"><?php echo apply_filters( 'the_content', $metaTag ); ?></div>
	<hr style="margin: 10px 0px 0px; max-width: <?php echo esc_attr( $width ); ?>;">
	<?php
	$table_with_meta = ob_get_clean();
}

$chart_block['attrs']['tableData'] = wp_json_encode( $table_array );
// SHARE MODAL
$share_modal = '';
if ( $active_share_tabs ) {
	ob_start();
	?>
	<div
		class="share-modal__overlay"
		id="share-modal__overlay-<?php echo esc_attr( $id ); ?>"
		data-wp-class--active="state.isActive"
		data-wp-on--click="actions.hideModal"
		data-wp-on--keydown="actions.hideModal"
		data-chart-view="share"
	></div>
	<!-- TODO: I would like to be able to use the social share block here. Need to modify it to work with the share modal. -->
	<div
		class="share-modal" id="share-modal-<?php echo esc_attr( $id ); ?>"
		data-wp-class--active="state.isActive"
		data-chart-view="share"
	>
		<div class="share-modal__inner">
			<div class="share-modal__header">
				<h2 class="share-modal__title">Share this chart</h2>
				<button class="share-modal__close" aria-label="Close Share Modal" data-wp-on--click="actions.hideModal">
						<!--checck   -->
				<?php echo \PRC\Platform\Icons\render( 'regular', 'xmark' ); ?>
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

// set up interactivity API scaffold
$target_namespace = array_key_exists( 'interactiveNamespace', $attributes ) ? $attributes['interactiveNamespace'] : 'prc-block/chart-builder-controller';
wp_interactivity_state(
	$target_namespace,
	array(
		$id => array(
			'preformattedData' => $preformatted_data,
			'activeTab'        => 'chart',
		),
	),
);

$post_id          = get_the_ID();
$publication_date = get_the_date( 'Y-m-d', $post_id );
$root_url         = get_bloginfo( 'url' );

$block_attrs = get_block_wrapper_attributes(
	array(
		'id'                  => $id,
		'data-wp-interactive' => wp_json_encode( array( 'namespace' => $target_namespace ) ),
		'data-wp-context'     => wp_json_encode(
			array(
				'id'               => $id,
				'postId'           => $post_id,
				'postUrl'          => get_permalink( $post_id ),
				'postPubDate'      => $publication_date,
				'rootUrl'          => $root_url,
				'featuredImageId'  => $featured_image_id,
				'featuredImageUrl' => $featured_image_url,
				'title'            => $metaTitle,
				'subtitle'         => $metaSubtitle,
				'note'             => $metaNote,
				'source'           => $metaSource,
				'tag'              => $metaTag,
				'tableData'        => $table_array,
			)
		),
		// 'data-wp-run'         => 'callbacks.onRun',
		'class'               => 'wp-chart-builder-wrapper' . ' align' . $align,
		'style'               => 'max-width:' . $maxWidth . ';',
	)
);
ob_start();
?>
<div <?php echo $block_attrs; ?>>
	<?php
	if ( $active_share_tabs && $chart_block && $table_block ) {
		echo wp_sprintf(
				/* html */ '
				<div
					class="wp-chart-builder-chart active"
					data-chart-view="chart"
					data-allow-overlay="true"
					data-wp-class--active="state.isActive"
				>
					%1$s
					%2$s
				</div>
				<div
					class="wp-chart-builder-table"
					data-chart-view="table"
					data-wp-class--active="state.isActive"
					id="%3$s-table"
					style="max-width:%4$s;">
						%5$s
				</div>',
			render_block( $chart_block ),
			$share_modal,
			esc_attr( $id ),
			esc_attr( $maxWidth ),
			$table_with_meta
		);
	} elseif ( $chart_block && false === $active_share_tabs ) {
		if ( $image_block ) {
			echo render_block( $image_block );
		} else {
			echo render_block( $chart_block );
		}
	} else {
		// if no chart block, render a p tag with error message
		echo wp_sprintf(
				/* html */            '
				<p class="error-message">
					An error has occurred on chart %1$s. Please try again later.
				</p>',
			esc_attr( $id )
		);
	}
	if ( $offer_svg_download ) {
		echo wp_sprintf(
				/* html */            '
				<button
					data-wp-on--click="actions.downloadSVG"
					class="download-svg sans-serif blue-link"
					style="margin-bottom: 20px;"
					data-chart-id="%1$s">
						Download graphic as SVG
				</button>',
			esc_attr( $id )
		);
	}
	?>
	<?php
	if ( $active_share_tabs ) {
		echo wp_sprintf(
				/* html */            '
				<div class="wp-chart-builder-view-buttons" style="max-width:%1$s;">
					<button
						class="view-button view-button--chart"
						data-chart-view="chart"
						data-chart-id="%2$s"
						data-wp-on--click="actions.setActiveTab"
						data-wp-class--active="state.isActive"
					>
						Chart
					</button>
					<button
						class="view-button view-button--table"
						data-chart-view="table"
						data-chart-id="%2$s"
						data-wp-on--click="actions.setActiveTab"
						data-wp-class--active="state.isActive"
					>
						Data
					</button>
					<button
						class="view-button view-button--share"
						data-chart-view="share"
						data-chart-id="%2$s"
						data-wp-on--click="actions.setActiveTab"
						data-wp-class--active="state.isActive"
					>
						Share
					</button>
				</div>',
			esc_attr( $maxWidth ),
			esc_attr( $id )
		);
	}
	?>
</div>
<?php
$controller = ob_get_clean();

echo wp_sprintf(
	/* html */    '
	<div class="wp-chart-builder">
		%1$s

	</div>',
	$controller
);
