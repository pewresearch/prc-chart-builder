<?php
/**
 * Chart Builder Controller
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Chart Builder Controller
 *
 * @package PRC\Platform\Chart_Builder
 */
class Controller {
	/**
	 * The controller attributes.
	 *
	 * @var array
	 */
	public $controller_attributes;

	/**
	 * The chart attributes.
	 *
	 * @var array
	 */
	public $chart_attributes;

	/**
	 * The table attributes.
	 *
	 * @var array
	 */
	public $table_attributes;

	/**
	 * The align.
	 *
	 * @var string
	 */
	public $align;

	/**
	 * The enable share tabs.
	 *
	 * @var boolean
	 */
	public $enable_share_tabs;

	/**
	 * The block id.
	 *
	 * @var string
	 */
	public $block_id;

	/**
	 * The post id.
	 *
	 * @var string
	 */
	public $post_id;

	/**
	 * The permalink.
	 *
	 * @var string
	 */
	public $permalink;

	/**
	 * The publication date.
	 *
	 * @var string
	 */
	public $publication_date;

	/**
	 * The root url.
	 *
	 * @var string
	 */
	public $root_url;

	/**
	 * The featured image id.
	 *
	 * @var string
	 */
	public $featured_image_id;

	/**
	 * The featured image url.
	 *
	 * @var string
	 */
	public $featured_image_url;

	/**
	 * The meta title.
	 *
	 * @var string
	 */
	public $meta_title;

	/**
	 * The meta subtitle.
	 *
	 * @var string
	 */
	public $meta_subtitle;

	/**
	 * The meta note.
	 *
	 * @var string
	 */
	public $meta_note;

	/**
	 * The meta source.
	 *
	 * @var string
	 */
	public $meta_source;

	/**
	 * The meta tag.
	 *
	 * @var string
	 */
	public $meta_tag;

	/**
	 * The width.
	 *
	 * @var string
	 */
	public $width;

	/**
	 * The table height.
	 *
	 * @var string
	 */
	public $table_height;

	/**
	 * The table array.
	 *
	 * @var array
	 */
	public $table_array;

	/**
	 * The constructor.
	 *
	 * @param mixed $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Render the share modal.
	 *
	 * @return string The rendered share modal.
	 */
	public function share_modal() {
		ob_start();
		?>
	<div
		class="share-modal__overlay"
		id="share-modal__overlay-<?php echo esc_attr( $this->block_id ); ?>"
		data-wp-class--active="state.isActive"
		data-wp-on--click="actions.hideModal"
		data-wp-on--keydown="actions.hideModal"
		data-chart-view="share"
	></div>
	<div
		class="share-modal" id="share-modal-<?php echo esc_attr( $this->block_id ); ?>"
		data-wp-class--active="state.isActive"
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
					class="share-modal__button share-modal__button--bluesky"
					data-wp-on--click="actions.shareBluesky"
					data-wp-on--keydown="actions.shareBluesky"
				>
					<span>Share on Bluesky</span>
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
		return ob_get_clean();
	}

	/**
	 * Initialize the controller block and set the
	 * block id, align, enable share tabs, post id, publication date, root url, and permalink properties.
	 */
	public function parse_controller_block() {
		$block_id          = $this->controller_attributes['id'];
		$align             = $this->controller_attributes['align'];
		$enable_share_tabs = $this->controller_attributes['tabsActive'];

		$post_id          = get_the_ID();
		$publication_date = get_the_date( 'Y-m-d', $post_id );
		$root_url         = get_bloginfo( 'url' );
		$permalink        = get_permalink( $post_id );

		$this->block_id          = $block_id;
		$this->align             = $align;
		$this->enable_share_tabs = $enable_share_tabs;
		$this->post_id           = $post_id;
		$this->publication_date  = $publication_date;
		$this->root_url          = $root_url;
		$this->permalink         = $permalink;
	}

	/**
	 * Parse the chart block for the block, attributes, and to set the meta attributes, width, and table height.
	 *
	 * @param array $inner_blocks The inner blocks of the controller block.
	 * @return array The chart block and chart attributes.
	 */
	public function parse_chart_block( $inner_blocks ) {
		$chart_block      = array_filter(
			$inner_blocks,
			function ( $b ) {
				return array_key_exists( 'blockName', $b ) && 'prc-block/chart-builder' === $b['blockName'];
			}
		);
		$chart_block      = array_pop( $chart_block );
		$chart_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes(
			'prc-block/chart-builder',
			isset( $chart_block['attrs'] ) ? $chart_block['attrs'] : array()
		);

		$this->featured_image_id  = $chart_attributes['staticImageId'];
		$this->featured_image_url = $chart_attributes['staticImageUrl'];

		// Set the meta attributes from the chart block attributes.
		$this->meta_title    = $chart_attributes['metaTitle'];
		$this->meta_subtitle = $chart_attributes['metaSubtitle'];
		$this->meta_note     = $chart_attributes['metaNote'];
		$this->meta_source   = $chart_attributes['metaSource'];
		$this->meta_tag      = $chart_attributes['metaTag'];

		// Set the width from the chart block attributes.
		$this->width = $chart_attributes['width'] . 'px' ?? '640px';

		// The height of chart minus the height of the buttons and the margin between the chart and the buttons.
		$this->table_height = $chart_attributes['height'] - 65 . 'px';

		return $chart_block;
	}

	/**
	 * Parse the table block for the block, attributes, and to set the table attributes.
	 *
	 * @param array $inner_blocks The inner blocks of the controller block.
	 * @return array The table block and table attributes.
	 */
	public function parse_table_block( $inner_blocks ) {
		$table_block  = array_filter(
			$inner_blocks,
			function ( $b ) {
				return array_key_exists( 'blockName', $b ) && in_array( $b['blockName'], array( 'core/table', 'prc-block/table' ) );
			}
		);
		$table_block  = array_pop( $table_block );
		$table_array  = null;
		$table_markup = false;

		if ( $table_block ) {
			$table_markup                      = '';
			$table_block['attrs']['className'] = 'chart-builder-data-table';

			$table_array = array_key_exists( 'tableData', $this->controller_attributes ) ? $this->controller_attributes['tableData'] : false;
			$table_array = true !== $table_array || empty( $this->controller_attributes['tableData'] ) ? \PRC\Platform\Core\WP_HTML_Sub_Processors\parse_table_block_into_array( $table_block['innerHTML'] ) : $table_array;

			ob_start();
			?>
	<hr style="margin: 0px 0px 10px; max-width: <?php echo esc_attr( $this->width ); ?>;">
	<div class="cb__title"><?php echo apply_filters( 'the_content', $this->meta_title ); ?></div>
	<div class="cb__subtitle"><?php echo apply_filters( 'the_content', $this->meta_subtitle ); ?></div>
	<div style="max-width: <?php echo esc_attr( $this->width ); ?> !important; height: <?php echo esc_attr( $this->table_height ); ?> !important; margin-bottom: 20px; overflow: auto;">
			<?php echo wp_kses( render_block( $table_block ), 'post' ); ?>
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
		<div class="cb__note"><?php echo apply_filters( 'the_content', $this->meta_source ); ?></div>
		<div class="cb__note"><?php echo apply_filters( 'the_content', $this->meta_note ); ?></div>
	<div class="cb__tag"><?php echo apply_filters( 'the_content', $this->meta_tag ); ?></div>
	<hr style="margin: 10px 0px 0px; max-width: <?php echo esc_attr( $this->width ); ?>;">
			<?php
			$table_markup = ob_get_clean();
		}

		$this->table_array = $table_array;

		return $table_markup;
	}

	/**
	 * Get associated datasets for the chart.
	 *
	 * @return array The associated datasets.
	 */
	public function get_datasets() {
		if ( 'chart' === get_post_type() ) {
			$datasets = wp_get_post_terms( $this->post_id, 'datasets' );
			$datasets = array_map(
				function ( $dataset ) {
					return array(
						'type'  => 'dataset',
						'id'    => $dataset->term_id,
						'label' => $dataset->name,
						'url'   => get_term_link( $dataset ),
					);
				},
				$datasets
			);
			return $datasets;
		}

		return array();
	}

	/**
	 * Render the block callback.
	 *
	 * @param array    $attributes The attributes of the block.
	 * @param string   $content The content of the block.
	 * @param WP_Block $block The block object.
	 * @return string The rendered block.
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		// In admin context's just return the content.
		if ( is_admin() ) {
			return '';
		}

		if ( null === $block || empty( $block->inner_blocks ) ) {
			return '';
		}

		$parsed_inner_blocks = $block->parsed_block['innerBlocks'];

		wp_enqueue_script( 'wp-url' );
		wp_enqueue_script( 'prc-functions' );

		$this->controller_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes(
			'prc-block/chart-builder-controller',
			isset( $attributes ) ? $attributes : array()
		);

		$this->parse_controller_block();

		/**
		 * Chart Block
		 */
		$chart_block = $this->parse_chart_block( $parsed_inner_blocks );

		// Check if preformatted data is set on the controller block manually.
		$preformatted_data = array_key_exists( 'chartPreformattedData', $attributes ) ? $attributes['chartPreformattedData'] : null;
		// If it exists, set hasPreformattedData to true on the chart block, and set the preformatted data on the chart block.
		if ( $preformatted_data ) {
			$chart_block['attrs']['hasPreformattedData'] = true;
			$chart_block['attrs']['preformattedData']    = $preformatted_data;
		}

		/**
		 * Image Block Parsing.
		 */
		$image_block = array_filter(
			$chart_block['innerBlocks'],
			function ( $b ) {
				return array_key_exists( 'blockName', $b ) && 'core/image' === $b['blockName'];
			}
		);
		$image_block = array_pop( $image_block );
		if ( $image_block ) {
			$static_chart_img       = wp_get_attachment_image_src( $image_block['attrs']['id'], 'full' );
			$static_chart_image_src = $static_chart_img[0];

			$chart_block['attrs']['isStaticChart']        = true;
			$chart_block['attrs']['staticImageId']        = $image_block['attrs']['id'];
			$chart_block['attrs']['staticImageUrl']       = $static_chart_image_src;
			$chart_block['attrs']['staticImageInnerHTML'] = $image_block['innerHTML'];
			$this->featured_image_id                      = $image_block['attrs']['staticImageId'];
			$this->featured_image_url                     = $image_block['attrs']['staticImageUrl'];
		}

		/**
		 * Table Block
		 */
		$table_block                       = $this->parse_table_block( $parsed_inner_blocks );
		$chart_block['attrs']['tableData'] = wp_json_encode( $this->table_array );

		/**
		 * Set up Interactivity API global state for this chart instance.
		 */
		$target_namespace = array_key_exists( 'interactiveNamespace', $attributes ) ? $attributes['interactiveNamespace'] : 'prc-block/chart-builder-controller';

		$state = wp_interactivity_state(
			$target_namespace,
			array(
				$this->block_id => array(
					'preformattedData' => $preformatted_data,
					'activeTab'        => 'chart',
				),
			),
		);

		/**
		 * Set up Interactivity API context for this chart instance.
		 */
		$context = array(
			'id'               => $this->block_id,
			'postId'           => $this->post_id,
			'postUrl'          => $this->permalink,
			'postPubDate'      => $this->publication_date,
			'rootUrl'          => $this->root_url,
			'featuredImageId'  => $this->featured_image_id,
			'featuredImageUrl' => $this->featured_image_url,
			'title'            => $this->meta_title,
			'subtitle'         => $this->meta_subtitle,
			'note'             => $this->meta_note,
			'source'           => $this->meta_source,
			'tag'              => $this->meta_tag,
			'tableData'        => $this->table_array,
		);

		$block_attrs = get_block_wrapper_attributes(
			array(
				'id'                  => $this->block_id,
				'data-wp-interactive' => $target_namespace,
				'data-wp-context'     => wp_json_encode( $context ),
				'class'               => 'wp-chart-builder-wrapper align' . $this->align,
				'style'               => 'max-width:' . $this->width . ';',
				'data-wp-init'        => 'callbacks.onInit',
			)
		);
		ob_start();
		?>
	<div <?php echo $block_attrs; ?>>
		<?php
		$chart_block = render_block( $chart_block );

		if ( false !== $this->enable_share_tabs && $chart_block && $table_block ) {
			echo wp_sprintf(
				'<div class="wp-chart-builder-chart active" data-chart-view="chart" data-allow-overlay="true" data-wp-class--active="state.isActive">%1$s%2$s</div><div class="wp-chart-builder-table" data-chart-view="table" data-wp-class--active="state.isActive" id="%3$s-table" style="max-width:%4$s;">%5$s</div>',
				$chart_block, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				$this->share_modal(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				esc_attr( $this->block_id ),
				esc_attr( $this->width ),
				$table_block // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			);
		} elseif ( $chart_block && false === $this->enable_share_tabs ) {
			// If there is a chart block but share tabs are disabled, render just the chart or static image.
			if ( $image_block ) {
				echo render_block( $image_block ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			} else {
				echo $chart_block; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}
		} else {
			// If no chart block, render a paragraph with error message.
			echo wp_sprintf(
				'<p class="error-message">
					An error has occurred on chart <pre>%1$s</pre>. Please try again later.
				</p>',
				esc_attr( $this->block_id )
			);
		}
		// If the offerSVGDownload parameter is set, render a button to download the SVG.
		if ( isset( $_GET['offerSVGDownload'] ) && $_GET['offerSVGDownload'] ) {
			echo wp_sprintf(
				'<button data-wp-on--click="actions.downloadSVG" class="download-svg sans-serif blue-link" style="margin-bottom: 20px;" data-chart-id="%1$s">Download graphic as SVG</button>',
				esc_attr( $this->block_id )
			);
		}
		?>
		<?php
		// If the share tabs are enabled, render the different interface tab view buttons.
		if ( $this->enable_share_tabs ) {
			$button_template = '<button class="view-button view-button--%1$s" data-chart-view="%1$s" data-chart-id="%2$s" data-wp-on--click="actions.setActiveTab" data-wp-class--active="state.isActive">%3$s</button>';
			echo wp_sprintf(
				'<div class="wp-chart-builder-view-buttons" style="max-width:%1$s;">
					%2$s
					%3$s
					%4$s
				</div>',
				esc_attr( $this->width ),
				wp_sprintf( $button_template, 'chart', esc_attr( $this->block_id ), 'Chart' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				wp_sprintf( $button_template, 'table', esc_attr( $this->block_id ), 'Data' ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				wp_sprintf( $button_template, 'share', esc_attr( $this->block_id ), 'Share' ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			);
		}
		?>
	</div>
		<?php
		$controller = ob_get_clean();
		return wp_sprintf(
			'<div class="wp-chart-builder">%1$s</div>',
			$controller
		);
	}

	/**
	 * Initialize the block.
	 *
	 * @hook init
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_CHART_BUILDER_DIR . '/build/controller',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
