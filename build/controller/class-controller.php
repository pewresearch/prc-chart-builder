<?php
/**
 * Controller Block
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Controller Block
 *
 * @package PRC\Platform\Chart_Builder
 */
class Controller {
	/**
	 * The constructor.
	 *
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
		$loader->add_filter( 'prc_table_validation_schemas', $this, 'register_validation_schemas' );
	}

	/**
	 * Register chart-builder-specific validation schemas that the table block's
	 * validation engine can enforce (geo maps, time series, etc.).
	 *
	 * @param array $schemas Existing schemas from other plugins.
	 * @return array
	 */
	public function register_validation_schemas( $schemas ) {
		$schemas[] = array(
			'slug'          => 'geo-state',
			'label'         => 'US State Map',
			'requiredTypes' => array( 'fips' ),
		);
		$schemas[] = array(
			'slug'          => 'geo-county',
			'label'         => 'US County Map',
			'requiredTypes' => array( 'fips' ),
		);
		$schemas[] = array(
			'slug'          => 'geo-country',
			'label'         => 'World Map (Alpha-3)',
			'requiredTypes' => array( 'iso3alpha' ),
		);
		$schemas[] = array(
			'slug'          => 'geo-country-numeric',
			'label'         => 'World Map (Numeric)',
			'requiredTypes' => array( 'iso3numeric' ),
		);
		$schemas[] = array(
			'slug'          => 'timeseries',
			'label'         => 'Time Series',
			'requiredTypes' => array( 'date', 'number' ),
		);
		return $schemas;
	}

	/**
	 * Render block callback
	 *
	 * @param mixed $attributes Attributes.
	 * @param mixed $content Content.
	 * @param mixed $block Block.
	 * @return string
	 */
	public function render_block_callback( $attributes, $content, $block ) {
		// In admin context just return the content.
		if ( is_admin() ) {
			return $content;
		}

		if ( null === $block || empty( $block->inner_blocks ) ) {
			return '';
		}

		wp_enqueue_script( 'wp-url' );
		wp_enqueue_script( 'prc-functions' );

		/**
		 * Initialize variables and get basic post and device data.
		 */
		$current_post_id  = get_the_ID();
		$publication_date = get_the_date( 'Y-m-d', $current_post_id );
		$root_url         = get_bloginfo( 'url' );
		$permalink        = get_permalink( $current_post_id );
		$is_mobile        = 'mobile' === \PRC\BlockUtils\get_current_device();

		// Resolve the canonical chart post URL for the context menu.
		// When the controller is synced into a report, refId is the chart CPT post ID.
		$chart_ref_id   = $block->context['refId'] ?? null;
		$chart_post_url = $chart_ref_id ? get_permalink( $chart_ref_id ) : $permalink;

		/**
		 * Get controller block attributes.
		 */
		$controller_attributes = \PRC\Platform\Chart_Builder\Block_Utils::get_block_attributes(
			'prc-chart-builder/controller',
			isset( $attributes ) ? $attributes : array()
		);
		$block_id              = $controller_attributes['id'];
		$align                 = $controller_attributes['align'];
		$tabs_active           = $controller_attributes['tabsActive'];
		$share_active          = $controller_attributes['shareActive'];
		$is_static_chart       = $controller_attributes['isStatic'];
		$is_freeform_chart     = $controller_attributes['isFreeform'];

		// TODO: This is a way to retrieve the datasets for the chart. Not sure yet if we want to surface this in the chart builder block.
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
		// }.

		/**
		 * Discover and process all inner blocks in one pass.
		 */
		$inner_blocks = $block->parsed_block['innerBlocks'];
		$blocks       = array(
			'chart'    => null,
			'table'    => null,
			'freeform' => null,
			'image'    => null,
		);

		foreach ( $inner_blocks as $inner_block ) {
			$block_name = $inner_block['blockName'] ?? '';

			switch ( $block_name ) {
				case 'prc-chart-builder/chart':
					$blocks['chart'] = $inner_block;
					break;
				case 'core/table':
				case 'prc-block/table':
					$blocks['table'] = $inner_block;
					break;
			}
		}

		// If no chart block, return.
		if ( ! $blocks['chart'] ) {
			return '';
		}

		if ( $is_freeform_chart ) {
			$blocks['freeform'] = array_filter(
				$blocks['chart']['innerBlocks'],
				function ( $chart_inner_block ) {
					$class_name = $chart_inner_block['attrs']['className'] ?? '';
					// Use str_contains to handle additional classes like 'is-style-default'.
					return 'core/group' === ( $chart_inner_block['blockName'] ) && str_contains( $class_name, 'wp-chart-builder-freeform-chart' );
				}
			) ?? null;
		} else {
			$blocks['freeform'] = null;
		}

		/**
		 * Process chart block attributes.
		 */
		$chart_attributes   = array();
		$width              = '640px';
		$featured_image_id  = null;
		$featured_image_url = null;

		if ( $blocks['chart'] ) {
			// Migrate v1 attributes to v2 if needed (server-side migration)
			$raw_chart_attrs = $blocks['chart']['attrs'] ?? array();
			if ( ! isset( $raw_chart_attrs['_version'] ) || 'v2' !== $raw_chart_attrs['_version'] ) {
				$raw_chart_attrs = \PRC\Platform\Chart_Builder\Block_Migration::migrate_attributes_v1_to_v2( $raw_chart_attrs );
			}

			// IMPORTANT: Update the block's attrs with migrated version so render_block() passes correct attributes
			// This prevents the chart block from re-running migration and losing controller modifications
			$blocks['chart']['attrs'] = $raw_chart_attrs;

			// After migration, use nested structure directly (no need for get_block_attributes)
			$chart_attributes = $raw_chart_attrs;

			$width = ( $chart_attributes['layout']['width'] ?? 640 ) . 'px';

			// Check if chart is static - either from controller attribute or chart's io.isStaticChart
			$chart_is_static = $is_static_chart || ( $chart_attributes['io']['isStaticChart'] ?? false );
			// Update $is_static_chart to reflect the actual chart status for use later in the function
			$is_static_chart = $chart_is_static;

			// Find image block within chart block if it's a static chart.
			if ( $chart_is_static ) {
				foreach ( $blocks['chart']['innerBlocks'] as $chart_inner_block ) {
					if ( 'core/image' === ( $chart_inner_block['blockName'] ?? '' ) ) {
						$blocks['image'] = $chart_inner_block;
						break;
					}
				}
			}

			// Handle preformatted data.
			$preformatted_data = $attributes['chartPreformattedData'] ?? null;
			if ( $preformatted_data ) {
				$blocks['chart']['attrs']['io']['hasPreformattedData'] = true;
				$blocks['chart']['attrs']['io']['preformattedData']    = $preformatted_data;
			}

			// Process static image if present.
			if ( $blocks['image'] ) {
				$static_chart_img                                 = wp_get_attachment_image_src( $blocks['image']['attrs']['id'], 'full' );
				$blocks['chart']['attrs']['io']['isStaticChart']        = true;
				$blocks['chart']['attrs']['io']['staticImageId']        = $blocks['image']['attrs']['id'];
				$blocks['chart']['attrs']['io']['staticImageUrl']       = $static_chart_img[0];
				$blocks['chart']['attrs']['io']['staticImageInnerHTML'] = $blocks['image']['innerHTML'];

				$featured_image_id  = $blocks['image']['attrs']['id'];
				$featured_image_url = $static_chart_img[0];
			} elseif ( $chart_is_static && ! empty( $chart_attributes['io']['staticImageId'] ) ) {
				// Handle case where static chart data is already in attributes (no image block found)
				$static_chart_img = wp_get_attachment_image_src( $chart_attributes['io']['staticImageId'], 'full' );
				if ( $static_chart_img ) {
					$blocks['chart']['attrs']['io']['isStaticChart']  = true;
					$blocks['chart']['attrs']['io']['staticImageUrl'] = $static_chart_img[0];
					$featured_image_id                                = $chart_attributes['io']['staticImageId'];
					$featured_image_url                               = $static_chart_img[0];
				}
		} else {
			// The featured image is the canonical server-generated PNG.
			// When synced into another post, refId is the chart CPT post ID —
			// use it so we read meta from the chart post, not the parent article.
			$chart_meta_id  = $chart_ref_id ?? $current_post_id;
			$server_png_id  = (int) get_post_thumbnail_id( $chart_meta_id );
			$server_png_url = $server_png_id ? (string) wp_get_attachment_url( $server_png_id ) : '';
				if ( $server_png_id && $server_png_url ) {
					$featured_image_id  = $server_png_id;
					$featured_image_url = $server_png_url;
				} else {
					$featured_image_id  = $chart_attributes['io']['pngId'] ?? null;
					$featured_image_url = $chart_attributes['io']['pngUrl'] ?? null;
				}
			}
		}

		/**
		 * Process table block and generate table with metadata.
		 */
		$table_array     = null;
		$table_with_meta = '';
		if ( $blocks['table'] ) {
			$blocks['table']['attrs']['className'] = 'chart-builder-data-table';

			$table_array = Table_Export::filter_hidden_columns(
				\PRC\Html\parse_table_block_into_array( $blocks['table']['innerHTML'] ),
				$blocks['table']['attrs'] ?? array()
			);

			$meta_title                   = $chart_attributes['metadata']['title'] ?? '';
			$meta_subtitle                = $chart_attributes['metadata']['subtitle'] ?? '';
			$meta_source                  = $chart_attributes['metadata']['source'] ?? '';
			$meta_note                    = $chart_attributes['metadata']['note'] ?? '';
			$meta_tag                     = $chart_attributes['metadata']['tag'] ?? '';
			$meta_question_wording        = $chart_attributes['io']['questionWording'] ?? '';
			$meta_question_wording_active = $chart_attributes['io']['questionWordingActive'] ?? false;
			ob_start();
			?>
			<hr style="margin: 0px 0px 10px; max-width: <?php echo esc_attr( $width ); ?>;">
			<div class="cb__title"><?php echo wp_kses_post( $meta_title ); ?></div>
			<div class="cb__subtitle"><?php echo wp_kses_post( $meta_subtitle ); ?></div>
			<div class="wp-chart-builder-table__inner" style="max-width: <?php echo esc_attr( $width ); ?> !important; margin-bottom: 0; overflow: auto;">
				<?php echo render_block( $blocks['table'] ); //phpcs:ignore ?>
			</div>
			<hr class="cb__download-data-button-hr">
			<div class="cb__download-data-button">
				<a
					data-wp-on--click="actions.downloadData"
					data-wp-on--keydown="actions.downloadData"
					tabindex="0"
					role="button"
					class="has-sans-serif-font-family"
				>
					Download data as .csv
				</a>
			</div>
			<?php if ( $meta_question_wording_active ) { ?>
				<?php
				$plus_icon  = \PRC\Platform\Icons\render( 'regular', 'circle-plus', 1 );
				$minus_icon = \PRC\Platform\Icons\render( 'regular', 'circle-minus', 1 );
				?>
				<div class="cb__note cb__note--question-wording-button" role="button" data-wp-on--click="actions.toggleQuestionWordingExpanded">
					<span data-wp-bind--hidden="state.isQuestionExpanded"><?php echo $plus_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons\render returns trusted SVG markup ?></span>
					<span data-wp-bind--hidden="state.isQuestionExpanded">Expand to find question wording</span>
					<span data-wp-bind--hidden="!state.isQuestionExpanded"><?php echo $minus_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons\render returns trusted SVG markup ?></span>
					<span data-wp-bind--hidden="!state.isQuestionExpanded">Collapse question wording</span>
				</div>
				<div class="cb__note cb__note--question-wording" data-wp-bind--hidden="!state.isQuestionExpanded">
					<?php echo wp_kses_post( $meta_question_wording ); ?>
				</div>
			<?php } ?>
			<div class="cb__note"><?php echo wp_kses_post( $meta_note ); ?></div>
			<div class="cb__note"><?php echo wp_kses_post( $meta_source ); ?></div>
			<div class="cb__tag"><?php echo wp_kses_post( $meta_tag ); ?></div>
			<hr style="margin: 10px 0px 0px; max-width: <?php echo esc_attr( $width ); ?>;">
			<?php
				$table_with_meta = ob_get_clean();
		}

		if ( $blocks['chart'] ) {
			$blocks['chart']['attrs']['io']['tableData'] = wp_json_encode( $table_array );
		}

		/**
		 * Process freeform chart and wrap with metadata if active.
		 */
		$freeform_with_meta = '';
		if ( $blocks['freeform'] ) {
			$blocks_to_render = is_array( $blocks['freeform'] ) && isset( $blocks['freeform'][0]['blockName'] ) ? $blocks['freeform'] : array( $blocks['freeform'] );
			$rendered_freeform = '';
			foreach ( $blocks_to_render as $block_to_render ) {
				$rendered_freeform .= render_block( $block_to_render );
			}

			$meta_text_active = $chart_attributes['metadata']['active'] ?? false;
			if ( $meta_text_active ) {
				$meta_title                   = $chart_attributes['metadata']['title'] ?? '';
				$meta_subtitle                = $chart_attributes['metadata']['subtitle'] ?? '';
				$meta_source                  = $chart_attributes['metadata']['source'] ?? '';
				$meta_note                    = $chart_attributes['metadata']['note'] ?? '';
				$meta_tag                     = $chart_attributes['metadata']['tag'] ?? '';
				$meta_question_wording        = $chart_attributes['io']['questionWording'] ?? '';
				$meta_question_wording_active = $chart_attributes['io']['questionWordingActive'] ?? false;
				$top_rule                     = $chart_attributes['layout']['horizontalRules'] ? wp_sprintf(
					'<hr class="cb__hr" style="margin: 0 0 10px; max-width:%1$s;" />',
					esc_attr( $width )
				) : '';
				$bottom_rule                  = $chart_attributes['layout']['horizontalRules'] ? wp_sprintf(
					'<hr class="cb__hr" style="margin: 10px 0 0px; max-width:%1$s;" />',
					esc_attr( $width )
				) : '';

				$question_wording_html = '';
				if ( $meta_question_wording_active ) {
					$plus_icon  = \PRC\Platform\Icons\render( 'regular', 'circle-plus', 1 );
					$minus_icon = \PRC\Platform\Icons\render( 'regular', 'circle-minus', 1 );

					ob_start();
					?>
					<div class="cb__note cb__note--question-wording-button" role="button" data-wp-on--click="actions.toggleQuestionWordingExpanded">
						<span data-wp-bind--hidden="state.isQuestionExpanded"><?php echo $plus_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons\render returns trusted SVG markup ?></span>
						<span data-wp-bind--hidden="state.isQuestionExpanded">Expand to find question wording</span>
						<span data-wp-bind--hidden="!state.isQuestionExpanded"><?php echo $minus_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Icons\render returns trusted SVG markup ?></span>
						<span data-wp-bind--hidden="!state.isQuestionExpanded">Collapse question wording</span>
					</div>
					<div class="cb__note cb__note--question-wording" data-wp-bind--hidden="!state.isQuestionExpanded">
						<?php echo wp_kses_post( $meta_question_wording ); ?>
					</div>
					<?php
					$question_wording_html = ob_get_clean();
				}

				ob_start();
				?>
				<div class="cb__text-wrapper" style="max-width:<?php echo esc_attr( $width ); ?>;">
					<?php echo $top_rule; // phpcs:ignore ?>
					<div class="cb__title"><?php echo wp_kses_post( $meta_title ); ?></div>
					<div class="cb__subtitle"><?php echo wp_kses_post( $meta_subtitle ); ?></div>
					<?php echo $rendered_freeform; // phpcs:ignore ?>
					<?php echo $question_wording_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already escaped in ob_get_clean. ?>
					<div class="cb__note"><?php echo wp_kses_post( $meta_note ); ?></div>
					<div class="cb__note"><?php echo wp_kses_post( $meta_source ); ?></div>
					<div class="cb__tag"><?php echo wp_kses_post( $meta_tag ); ?></div>
					<?php echo $bottom_rule; // phpcs:ignore ?>
				</div>
				<?php
				$freeform_with_meta = ob_get_clean();
			} else {
				$freeform_with_meta = $rendered_freeform;
			}
		}

			/**
			 * Generate share modal if needed.
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

			// Check if URL has the parameter offerSVGDownload and if so, add the data attribute to the block.
			$offer_svg_download = isset( $_GET['offerSVGDownload'] ) ? sanitize_text_field( wp_unslash( $_GET['offerSVGDownload'] ) ) : false;

			/**
			 * Setup Interactivity API.
			 */
			$target_namespace = $attributes['interactiveNamespace'] ?? 'prc-chart-builder/controller';
			$state            = wp_interactivity_state(
				$target_namespace,
				array(
					$block_id => array(
						'preformattedData'   => $preformatted_data ?? null,
						'activeTab'          => 'chart',
						'webShareSupported'  => $is_mobile ? false : true,
						'isQuestionExpanded' => false,
					),
				),
			);

		$context = array(
			'id'               => $block_id,
			'postId'           => $current_post_id,
			'postUrl'          => $permalink,
			'chartPostUrl'     => $chart_post_url,
			'postPubDate'      => $publication_date,
			'rootUrl'          => $root_url,
			'featuredImageId'  => $featured_image_id,
			'featuredImageUrl' => $featured_image_url,
			'title'            => $chart_attributes['metadata']['title'] ?? '',
			'subtitle'         => $chart_attributes['metadata']['subtitle'] ?? '',
			'note'             => $chart_attributes['metadata']['note'] ?? '',
			'source'           => $chart_attributes['metadata']['source'] ?? '',
			'tag'              => $chart_attributes['metadata']['tag'] ?? '',
			'tableData'        => $table_array,
		);

		$block_attrs = get_block_wrapper_attributes(
			array(
				'id'                                     => $block_id,
				'data-wp-interactive'                    => $target_namespace,
				'data-wp-context'                        => wp_json_encode( $context ),
				// add is freeform chart class if it is a freeform chart
				'class'                                  => 'wp-chart-builder-wrapper align' . $align . ($is_freeform_chart ? ' wp-block-prc-chart-builder-controller--freeform' : ''),
				'style'                                  => 'max-width:' . $width . ';',
				'data-wp-init--detect-web-share-support' => 'callbacks.detectWebShareSupport',
				'data-wp-init--sync-table-height'        => 'callbacks.syncTableHeight',
				// 'data-wp-init--log-migration-attributes' => 'callbacks.logMigrationAttributes',
				'data-png-url'                           => esc_url( $featured_image_url ?? '' ),
				'data-has-csv'                           => $table_array ? 'true' : 'false',
				'data-post-url'                          => esc_url( $permalink ),
				'data-chart-url'                         => esc_url( $chart_post_url ),
				'data-chart-title'                       => esc_attr( $chart_attributes['metadata']['title'] ?? '' ),
			)
		);

			/**
			 * Render the complete chart builder.
			 */
			ob_start();
			?>
		<div <?php echo wp_kses_post( $block_attrs ); ?>>
			<?php
			// If the chart is a freeform chart, and the share tabs are active, render the freeform chart in the tabbed interface.
			if ( $tabs_active && $is_freeform_chart && $blocks['freeform'] && $blocks['table'] ) {
					echo wp_sprintf(
						'<div class="wp-chart-builder-chart active" data-chart-view="chart" data-allow-overlay="true" data-wp-class--active="state.isActive">%s%s</div>
					<div class="wp-chart-builder-table" data-chart-view="table" data-wp-class--active="state.isActive" id="%s-table" style="max-width:%s;">%s</div>',
						$freeform_with_meta, //phpcs:ignore
						$share_modal, //phpcs:ignore
						esc_attr( $block_id ),
						esc_attr( $width ),
						$table_with_meta //phpcs:ignore
					);
				// If the chart is a freeform chart, and the share tabs are not active, render the freeform chart.
			} elseif ( $is_freeform_chart && $blocks['freeform'] ) {
				echo $freeform_with_meta; //phpcs:ignore
				// If the chart is a regular chart, and the share tabs are active, render the chart in the tabbed interface.
		} elseif ( $tabs_active && $blocks['chart'] && $blocks['table'] ) {
			$chart_context = $chart_ref_id ? array( 'refId' => $chart_ref_id ) : array();
			echo wp_sprintf(
				'<div class="wp-chart-builder-chart active" data-chart-view="chart" data-allow-overlay="true" data-wp-class--active="state.isActive">%s%s</div>
				<div class="wp-chart-builder-table" data-chart-view="table" data-wp-class--active="state.isActive" id="%s-table" style="max-width:%s;">%s</div>',
				( new \WP_Block( $blocks['chart'], $chart_context ) )->render(), //phpcs:ignore
				$share_modal, //phpcs:ignore
				esc_attr( $block_id ),
				esc_attr( $width ),
				$table_with_meta //phpcs:ignore
			);
			// If the chart is a regular chart, and the share tabs are not active, render the chart.
		} elseif ( $blocks['chart'] ) {
			$chart_context = $chart_ref_id ? array( 'refId' => $chart_ref_id ) : array();
			// If the chart has an image, render the image, otherwise render the chart.
			echo $blocks['image'] ? render_block( $blocks['image'] ) : ( new \WP_Block( $blocks['chart'], $chart_context ) )->render(); //phpcs:ignore
				// If there is an error, render an error message.
			} else {
				echo wp_sprintf(
					'<p class="error-message">An error has occurred on chart %s. Please try again later.</p>',
					esc_attr( $block_id )
				);
			}

			// If the offer SVG download is active, render the download SVG button.
			if ( $offer_svg_download ) {
				echo wp_sprintf(
					'<button data-wp-on--click="actions.downloadSVG" class="download-svg sans-serif blue-link" style="margin-bottom: 20px;" data-chart-id="%s">Download graphic as SVG</button>',
					esc_attr( $block_id )
				);
			}

		// If the share tabs are active, render the view buttons.
		if ( $tabs_active ) {
			echo wp_sprintf( '<div class="wp-chart-builder-view-buttons" style="max-width:%s;">', esc_attr( $width ) );

			// Left group: Chart / Data tab buttons.
			echo '<div class="wp-chart-builder-view-buttons__tabs">';
			foreach ( array( 'chart' => 'Chart', 'table' => 'Data' ) as $view => $label ) {
				echo wp_sprintf(
					'<button class="view-button view-button--%s" data-chart-view="%s" data-chart-id="%s" data-wp-on--click="actions.setActiveTab" data-wp-class--active="state.isActive">%s</button>',
					esc_attr( $view ),
					esc_attr( $view ),
					esc_attr( $block_id ),
					esc_html( $label )
				);
			}
			echo '</div>';

			// Right group: Download image (if PNG exists) + Share.
			echo '<div class="wp-chart-builder-view-buttons__actions">';
			if ( $featured_image_url ) {
				echo wp_sprintf(
					'<button class="view-button view-button--download-image" data-chart-id="%s" data-wp-on--click="actions.downloadImage">Download Image</button>',
					esc_attr( $block_id )
				);
			}
			if ( $share_active ) {
				echo wp_sprintf(
					'<button class="view-button view-button--share" data-chart-view="share" data-chart-id="%s" data-wp-on--click="actions.setActiveTab" data-wp-class--active="state.isActive">Share</button>',
					esc_attr( $block_id )
				);
			}
			echo '</div>';

			echo '</div>';
		}
			?>
		</div>
		<?php
		$controller_content = ob_get_clean();

			return wp_sprintf(
				'<figure class="wp-chart-builder">%s</figure>',
				$controller_content, //phpcs:ignore
			);
	}

	/**
	 * Initialize the block.
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
