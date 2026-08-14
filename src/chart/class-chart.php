<?php
/**
 * Chart Block
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Chart Block
 *
 * @package PRC\Platform\Chart_Builder
 */
class Chart {
	/**
	 * The constructor.
	 *
	 * @param mixed $loader Loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
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
		if ( is_admin() || null === $block ) {
			return $content;
		}

		// Migrate v1 attributes to v2 if needed (server-side migration)
		if ( ! isset( $attributes['_version'] ) || 'v2' !== $attributes['_version'] ) {
			$attributes = \PRC\Platform\Chart_Builder\Block_Migration::migrate_attributes_v1_to_v2( $attributes );
		}

		// First-paint device detection only — viewport switching is client-side.
		$device_type = \PRC\BlockUtils\get_current_device();

		// Prevent double rendering by tracking rendered blocks.
		static $rendered_blocks = array();

		// Base attributes (with mobile/tablet override objects intact) feed the
		// Interactivity store; merged attributes drive first-paint HTML only.
		$block_attributes  = $attributes;
		$render_attributes = Block_Utils::merge_viewport_attributes( $attributes, $device_type );

		// Conditionally load prc-custom-charts if the block has a customAttributes property.
		// Custom-charts is still on the classic-script handle; the default path
		// uses the Preact Script Module registered in
		// PRC_Charting_Library::init_charting_library_script_module().
		if ( isset( $block_attributes['io']['customAttributes'] ) && isset( $block_attributes['io']['customAttributes']['chartType'] ) ) {
			wp_enqueue_script( 'prc-custom-charts' );
		} else {
			wp_enqueue_script_module( '@prc/charting-library' );
		}

		Settings::deliver_theme_global();

		$block_id = $block_attributes['id'] ?? null;

		// Handle missing ID for converted charts.
		if ( null === $block_id || false === $block_id || empty( $block_id ) ) {
			$chart_converted = $block_attributes['io']['chartConverted'] ?? null;

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

		$target_namespace = array_key_exists( 'interactiveNamespace', $attributes ) ? $attributes['interactiveNamespace'] : 'prc-chart-builder/chart';

		// Resolve the static fallback image shown before JS hydrates and on error.
		// Priority: featured image (server-generated PNG) → io.pngUrl (block attr) → io.svgUrl (legacy).
		// When synced into another post, refId is the chart CPT post ID — use it
		// so we read meta from the chart post, not the parent article.
		$chart_post_id       = $block->context['refId'] ?? get_the_ID();
		$static_fallback_url = '';
		if ( $chart_post_id ) {
			$thumbnail_id        = get_post_thumbnail_id( $chart_post_id );
			$static_fallback_url = $thumbnail_id ? (string) wp_get_attachment_url( $thumbnail_id ) : '';
		}
		if ( ! $static_fallback_url ) {
			$static_fallback_url = $block_attributes['io']['pngUrl'] ?? '';
		}
		if ( ! $static_fallback_url ) {
			$static_fallback_url = $block_attributes['io']['svgUrl'] ?? '';
		}

		$chart_data            = $block_attributes['io']['chartData'] ?? array();
		$is_static_chart       = $block_attributes['io']['isStaticChart'] ?? false;
		$is_freeform_chart     = $block_attributes['io']['isFreeformChart'] ?? false;
		$is_custom_chart       = ! empty( $block_attributes['io']['isCustomChart'] )
			|| (
				isset( $block_attributes['io']['customAttributes']['chartType'] )
				&& ! empty( $block_attributes['io']['customAttributes']['chartType'] )
			);
		$table_data            = $block_attributes['io']['tableData'] ?? '';
		$has_preformatted_data = $block_attributes['io']['hasPreformattedData'] ?? false;
		$preformatted_data     = $block_attributes['io']['preformattedData'] ?? array();
		$should_render         = $block_attributes['io']['defaultShouldRender'] ?? true;

		if ( $has_preformatted_data && $preformatted_data ) {
			$chart_data = $preformatted_data;
		}

		// Chart should always have $chart_data, $is_static_chart, or be a freeform container.
		// Freeform charts are containers that don't have their own chart data.
		if ( ! $chart_data && ! $is_static_chart && ! $is_freeform_chart ) {
			new \WP_Error( 'missing_chart_data', __( 'Chart Block is missing chartData or isStaticChart', 'prc-block-library' ) );
			return;
		}

		// Strip internal migration fields before exposing attributes as public state.
		$public_attributes = $attributes;
		unset( $public_attributes['_legacy'], $public_attributes['_v1Original'], $public_attributes['_migrationMeta'] );

		// Nested + camelCased per-chart slice. Addressable by chart id so any
		// block on the page (sibling chart, scrollytelling step, REST poller)
		// can read/write `state.charts[ chartId ]` through @wordpress/interactivity.
		// The wrapper div carries data-prc-chart-id so consumer blocks can
		// resolve the target id from the DOM without needing the controller's
		// context.
		wp_interactivity_state(
			$target_namespace,
			array(
				'charts' => array(
					$block_id => array(
						'data'               => $chart_data,
						// Decode the table data to ensure it is an array.
						'tableData'          => $table_data ? json_decode( $table_data, true ) : null,
						'chartHash'          => $block_id,
						'iframeHeight'       => null,
						'shouldRender'       => $should_render,
						'attributes'         => $public_attributes,
						'isQuestionExpanded' => false,
						'currentViewport'    => $device_type,
					),
				),
			),
		);

		$block_attrs = array(
			'id'                          => wp_unique_id( 'chart-block-' ),
			'data-wp-key'                 => $block_id,
			'data-wp-interactive'         => $target_namespace,
			'data-prc-chart-id'           => $block_id,
			'data-wp-context'             => wp_json_encode(
				array(
					'id' => $block_id,
				)
			),
			'class'                       => 'wp-chart-builder-inner',
			'data-wp-watch--init-render'  => $is_static_chart || $is_freeform_chart ? null : 'callbacks.watchForRender',
			// Re-seed live store leaves after Interactivity Router navigations.
			// The router merges server state with override=false, so data/config
			// would otherwise stay frozen at the first mount (e.g. Religious
			// Projections country → country). Custom charts remount via the
			// empty-mount path in renderChart and do not need this watch.
			'data-wp-watch--sync-navigation' => $is_static_chart || $is_freeform_chart || $is_custom_chart ? null : 'callbacks.syncOnNavigation',
			'data-wp-on-window--resize'   => $is_custom_chart ? null : 'callbacks.watchForResize',
		);

		$block_wrapper_attrs = get_block_wrapper_attributes( $block_attrs );

		$fallback_width = isset( $render_attributes['layout']['width'] ) ? (int) $render_attributes['layout']['width'] : null;
		$fallback_style = $fallback_width ? sprintf( ' style="width:%dpx;height:auto;"', $fallback_width ) : '';
		if ( $static_fallback_url ) {
			$chart = wp_sprintf(
				'<div id="%1$s"><img src="%2$s" alt="Chart" class="chart-fallback chart-fallback--png"%3$s /></div>',
				$block_id,
				esc_url( $static_fallback_url ),
				$fallback_style
			);
		} else {
			$placeholder_style = $fallback_width
				? sprintf( ' style="width:%dpx;min-height:200px;"', $fallback_width )
				: ' style="min-height:200px;"';
			$chart = wp_sprintf(
				'<div id="%1$s"><div class="chart-fallback chart-fallback--placeholder"%2$s></div></div>',
				$block_id,
				$placeholder_style
			);
		}

		$static_chart = '';
		if ( $is_static_chart ) {
			$static_chart = wp_sprintf(
				'<div id="%1$s">%2$s</div>',
				$block_attributes['io']['staticImageId'],
				wp_kses_post( $block_attributes['io']['staticImageInnerHTML'] )
			);
		}

		// Freeform charts render their inner blocks (nested charts) instead of a single chart.
		$freeform_content = '';
		if ( $is_freeform_chart ) {
			$freeform_content = wp_sprintf(
				'<div id="%1$s" class="wp-chart-builder-freeform-content">%2$s</div>',
				$block_id,
				$content
			);
		}

		// Scaffold chart text elements. Always size + center the wrapper so
		// layout.width holds whether or not metadata text fields are active.
		$meta_text_active = $render_attributes['metadata']['active'] ?? false;
		$max_width        = ( $render_attributes['layout']['width'] ?? 640 ) . 'px';
		$chart_content    = $is_freeform_chart ? $freeform_content : ( $is_static_chart ? $static_chart : $chart );

		if ( $meta_text_active ) {
			$top_rule    = $render_attributes['layout']['horizontalRules'] ? wp_sprintf(
				'<hr class="cb__hr" style="margin: 0 0 10px; max-width:%1$s;" />',
				$max_width
			) : '';
			$bottom_rule = $render_attributes['layout']['horizontalRules'] ? wp_sprintf(
				'<hr class="cb__hr" style="margin: 10px 0 0; max-width:%1$s;" />',
				$max_width
			) : '';

			// Build question wording section if active.
			$meta_question_wording        = $block_attributes['io']['questionWording'] ?? '';
			$meta_question_wording_active = $block_attributes['io']['questionWordingActive'] ?? false;
			$question_wording_html        = '';

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

			return wp_sprintf(
				'
				<div %1$s>
					<div class="cb__text-wrapper" style="max-width:%2$s;width:100%%;margin-left:auto;margin-right:auto;">
						%3$s
						<div class="cb__title" data-meta-field="title">%4$s</div>
						<div class="cb__subtitle" data-meta-field="subtitle">%5$s</div>
						%6$s
						%7$s
						<div class="cb__note cb__note--note" data-meta-field="note">%8$s</div>
						<div class="cb__note cb__note--source" data-meta-field="source">%9$s</div>
						<div class="cb__tag" data-meta-field="tag">%10$s</div>
						%11$s
					</div>
				</div>',
				wp_kses_post( $block_wrapper_attrs ),
				esc_attr( $max_width ),
				$top_rule, // phpcs:ignore
				wp_kses_post( $render_attributes['metadata']['title'] ?? '' ),
				wp_kses_post( $render_attributes['metadata']['subtitle'] ?? '' ),
				$chart_content, //phpcs:ignore
				$question_wording_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already escaped in ob_get_clean.
				wp_kses_post( $render_attributes['metadata']['note'] ?? '' ),
				wp_kses_post( $render_attributes['metadata']['source'] ?? '' ),
				wp_kses_post( $render_attributes['metadata']['tag'] ?? '' ),
				$bottom_rule // phpcs:ignore
			);
		}

		return wp_sprintf(
			'<div %1$s><div class="cb__text-wrapper" style="max-width:%2$s;width:100%%;margin-left:auto;margin-right:auto;">%3$s</div></div>',
			wp_kses_post( $block_wrapper_attrs ),
			esc_attr( $max_width ),
			$chart_content //phpcs:ignore
		);
	}

	/**
	 * Initialize the block.
	 */
	public function block_init() {
		register_block_type_from_metadata(
			PRC_CHART_BUILDER_DIR . '/build/chart',
			array(
				'render_callback' => array( $this, 'render_block_callback' ),
			)
		);
	}
}
