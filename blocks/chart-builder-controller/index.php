<?php

namespace PRC;
use WP_HTML_Tag_Processor;

class Chart_Builder_Controller extends PRC_Chart_Builder {
	public static $view_script_handle = null;
	public static $block_json = null;
	public static $dir = __DIR__;

	public function __construct( $init = false ) {
		if ( true === $init ) {
			// Do hooks here
			$block_json_file = PRC_CHART_BUILDER_DIR . '/blocks/chart-builder/build/block.json';
			self::$block_json = wp_json_file_decode( $block_json_file, array( 'associative' => true ) );
			self::$block_json['file'] = wp_normalize_path( realpath( $block_json_file ) );
			add_action( 'init', array( $this, 'register_block' ), 11 );
		}
	}

	public function render_table_with_meta_text($chart_block, $table_block, $id, $chart_attributes) {
		if ( empty($chart_block) || empty($table_block) ) {
			return '';
		}
		if ( ! array_key_exists('blockName', $chart_block) || ! array_key_exists('blockName', $table_block) ) {
			return '';
		}
		$block = '';
		$metaTitle = array_key_exists('metaTitle', $chart_attributes) ? $chart_attributes['metaTitle'] : '';
		$metaSubtitle = array_key_exists('metaSubtitle', $chart_attributes) ? $chart_attributes['metaSubtitle'] : '';
		$metaNote = array_key_exists('metaNote', $chart_attributes) ? $chart_attributes['metaNote'] : '';
		$metaSource = array_key_exists('metaSource', $chart_attributes) ? $chart_attributes['metaSource'] : '';
		$metaTag = array_key_exists('metaTag', $chart_attributes) ? $chart_attributes['metaTag'] : 'PEW RESEARCH CENTER';
		$width = array_key_exists('width', $chart_attributes) ? $chart_attributes['width'] . 'px' : '100%';
		$height = array_key_exists('height', $chart_attributes) ? $chart_attributes['height']-50 . 'px' : 'auto';

		ob_start();
		?>
		<hr style="margin: 0px 0px 10px; max-width: <?php echo esc_attr($width);?>;">
		<div class="cb__title"><?php echo esc_html($metaTitle);?></div>
		<div class="cb__subtitle"><?php echo esc_html($metaSubtitle);?></div>
		<div style="max-width: <?php echo esc_attr($width);?> !important; height: <?php echo esc_attr($height);?> !important; margin-bottom: 20px; overflow: auto;">
			<?php echo wp_kses(render_block( $table_block ), 'post'); ?>
		</div>
		<div class="wp-block-buttons wp-container-2">
			<div class="wp-block-button has-custom-width has-custom-font-size is-style-fill has-sans-serif-font-family has-small-label-font-size">
				<a download class="wp-block-button__link has-white-color has-link-color-background-color has-text-color has-background wp-element-button wp-chart-builder-download button">Download data as .csv</a>
			</div>
		 </div>
		<div class="cb__note" ><?php echo apply_filters('the_content', $metaNote);?></div>
		<div class="cb__note"><?php echo apply_filters('the_content',$metaSource);?></div>
		<div class="cb__tag"><?php echo esc_html($metaTag);?></div>
		<hr style="margin: 10px 0px 0px; max-width: <?php echo esc_attr($width);?>;">
		<?php
		$block .= ob_get_clean();
		$parsed_block = parse_blocks(normalize_whitespace($block));

		return render_block( array_pop($parsed_block) );
	}

	// TODO: read to table function when WP_HTML_Tag_Processor is fixed -->




	public function render_chart_builder_controller( $attributes, $content = '', $block = null ) {
		if ( is_admin() ) {
			return $content;
		}

		if ( null === $block || empty( $block->inner_blocks ) ) {
			return '';
		}
		$script_handle = 'prc-block-chart-builder-controller-view-script';
		$id = $attributes['id'];

		$chart_block = array_filter(
			$block->parsed_block['innerBlocks'],
			function( $b ) {
				return array_key_exists('blockName', $b) && 'prc-block/chart-builder' === $b['blockName'];
			}
		);

		$chart_block = array_pop($chart_block);


		// get the image inner block
		$image_block = array_filter(
			$chart_block['innerBlocks'],
				function( $b ) {
					return array_key_exists('blockName', $b) && 'core/image' === $b['blockName'];
				}
		);
		$image_block = array_pop($image_block);

		$chart_block['attrs']['id'] = $id;
		$chart_block['attrs']['className'] = 'active';

		if ( $image_block ) {
			// get attachment image url
			$static_chart_img = wp_get_attachment_image_src( $image_block['attrs']['id'], 'full' );
			$static_chart_image_src = $static_chart_img[0];
			$chart_block['attrs']['staticImageId'] = $image_block['attrs']['id'];
			$chart_block['attrs']['staticImageUrl'] = $static_chart_image_src;
		}


		$active_share_tabs = array_key_exists('tabsActive', $attributes) ? $attributes['tabsActive'] : false;
		$table_block = array_filter(
			$block->parsed_block['innerBlocks'],
			function( $b ) {
				return array_key_exists('blockName', $b) &&
					('flexible-table-block/table' === $b['blockName'] || 'core/table' === $b['blockName']);
			}
		);
		$table_block = array_pop( $table_block );

		// if the table was set to be hidden in the editor, we need to reasssign class to unhide it.
		$preformatted_data = array_key_exists('chartPreformattedData', $attributes) ? $attributes['chartPreformattedData'] : null;

		$table_array = null;
		if ($table_block) {
			$table_block['attrs']['className'] = 'chart-builder-data-table';
			// TODO: uncomment when WP_HTML_Tag_Processor is fixed
			$table_array = array_key_exists('tableData', $attributes) ? $attributes['tableData'] : false;
			$table_array = true !== $table_array || empty($attributes['tableData']) ? parse_table_block_into_array( $table_block['innerHTML'] ) : $table_array;
		}

		// @TODO: I wonder if we can create a wordpress redux registry to manage multiple chart configs on a page...
		wp_add_inline_script($script_handle, "if ( !window.tableData ) {window.tableData = {};} window.tableData['".$id."'] = " . wp_json_encode( $table_array ) . ";");

		wp_add_inline_script($script_handle, "if ( !window.chartPreformattedData ) {window.chartPreformattedData = {};} window.chartPreformattedData['".$id."'] = " . wp_json_encode( $preformatted_data ) . ";");

		// check if url has the parameter offerSVGDownload and if so, add the data attribute to the block
		$offer_svg_download = isset( $_GET['offerSVGDownload'] ) ? $_GET['offerSVGDownload'] : false;
		$maxWidth = array_key_exists('width', $chart_block['attrs']) ? $chart_block['attrs']['width'].'px' : '640px';
		$align = array_key_exists('align', $attributes) ? $attributes['align'] : 'center';

		$block_attrs = get_block_wrapper_attributes(
			array(
				'class' => 'wp-chart-builder-wrapper' . ' align' . $align,
				'style' => 'max-width:'.$maxWidth.';',
			)
		);
		ob_start();
		?>
		<div <?php echo $block_attrs; ?>>
			<?php
				if ( $active_share_tabs && $chart_block && $table_block) {
					$table_with_meta = $this->render_table_with_meta_text($chart_block, $table_block, $id, $chart_block['attrs']);
					echo render_block( $chart_block );
					// parse HTML string
					echo wp_sprintf('<div class="wp-chart-builder-table" data-chart-hash="%1$s" style="max-width:%2$s;">%3$s</div>', esc_attr($id), esc_attr($maxWidth), wp_kses($table_with_meta, 'post'));
				} elseif ( $chart_block ) {
					echo render_block( $chart_block );
				} else {
					// if no chart block, render a p tag with error message
					echo wp_sprintf('<p class="error-message">An error has occurred on chart %1$s. Please try again later.</p>', esc_attr($id));
				}
				if ( $offer_svg_download ) {
					echo wp_sprintf('<a href="#" class="download-svg sans-serif blue-link" style="margin-bottom: 20px;" data-chart-id="%1$s">Download graphic as SVG</a>', esc_attr($id));
				}
			?>
			<?php
				if ($active_share_tabs) {
					echo '<div class="wp-chart-builder-view-buttons" style="max-width:' . esc_attr($maxWidth) . '">';
					echo '<button class="view-button view-button--chart active" data-chart-id="' . esc_attr($id) . '">Chart</button>';
					echo '<button class="view-button view-button--table" data-chart-id="' . esc_attr($id) . '">Data</button>';
					echo '<button class="view-button view-button--share" data-chart-id="' . esc_attr($id) . '">Share</button>';
					echo '</div>';
				}
			?>
		</div>
		<?php
		return ob_get_clean();
	}

	public function register_block() {
		register_block_type( self::$dir . '/build', array(
			'render_callback' => array($this, 'render_chart_builder_controller'),
		) );

    }

}
