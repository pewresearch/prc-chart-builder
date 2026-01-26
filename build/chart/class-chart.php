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
	 * Merge viewport-specific overrides into base attributes
	 *
	 * @param array  $attributes The full block attributes object.
	 * @param string $device_type Current device type ('mobile', 'tablet', or 'desktop').
	 * @return array Merged attributes with viewport overrides applied.
	 */
	private function merge_viewport_attributes( $attributes, $device_type ) {
		// Desktop uses base attributes only (no override).
		if ( ! $device_type || 'desktop' === $device_type ) {
			return $attributes;
		}

		// Get viewport-specific overrides.
		$viewport_overrides = $attributes[ $device_type ] ?? array();

		// If no overrides exist, return base attributes.
		if ( empty( $viewport_overrides ) ) {
			return $attributes;
		}

		// Deep merge: viewport overrides take precedence over base attributes.
		$merged = $attributes;

		// Merge each top-level attribute group that has overrides.
		foreach ( $viewport_overrides as $attribute_group => $group_overrides ) {
			if ( isset( $merged[ $attribute_group ] ) && is_array( $merged[ $attribute_group ] ) && is_array( $group_overrides ) ) {
				// Deep merge the attribute group.
				$merged[ $attribute_group ] = array_merge( $merged[ $attribute_group ], $group_overrides );
			}
		}

		return $merged;
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

		// Detect current device type and merge viewport-specific overrides.
		// Allow client-side viewport override via query param for responsive rehydration.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only viewport hint, no state change.
		$viewport_override = isset( $_GET['cb_viewport'] ) ? sanitize_key( $_GET['cb_viewport'] ) : null;
		$device_type       = $viewport_override && in_array( $viewport_override, array( 'mobile', 'tablet', 'desktop' ), true )
			? $viewport_override
			: \PRC\Platform\get_current_device();
		$attributes        = $this->merge_viewport_attributes( $attributes, $device_type );

		// Prevent double rendering by tracking rendered blocks.
		static $rendered_blocks = array();

		// After migration and viewport merging, $attributes has ALL values (nested + flat for compatibility)
		// No need for get_block_attributes() since migration sets all defaults
		$block_attributes = $attributes;

		// Conditionally load prc-custom-charts if the block has a customAttributes property.
		if ( isset( $block_attributes['io']['customAttributes'] ) && isset( $block_attributes['io']['customAttributes']['chartType'] ) ) {
			wp_enqueue_script( 'prc-custom-charts' );
		} else {
			wp_enqueue_script( 'prc-charting-library' );
		}

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
		$svg_fallback     = $block_attributes['io']['svgUrl'] ?? '';

		$chart_data            = $block_attributes['io']['chartData'];
		$is_static_chart       = $block_attributes['io']['isStaticChart'];
		$table_data            = $block_attributes['io']['tableData'];
		$has_preformatted_data = $block_attributes['io']['hasPreformattedData'];
		$preformatted_data     = $block_attributes['io']['preformattedData'];
		$should_render         = $block_attributes['io']['defaultShouldRender'] ?? true;

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
					'chart-data'         => $chart_data,
					// Decode the table data to ensure it is an array.
					'table-data'         => $table_data ? json_decode( $table_data, true ) : null,
					'chart-hash'         => $block_id,
					'iframe-height'      => null,
					'should-render'      => $should_render,
					'attributes'         => $attributes, // ✅ Use migrated attributes, not $block->attributes
					'isQuestionExpanded' => false,
					'currentViewport'    => $device_type,
				),
			),
		);

		$block_attrs = array(
			'id'                          => wp_unique_id( 'chart-block-' ),
			'data-wp-key'                 => $block_id,
			'data-wp-interactive'         => $target_namespace,
			'data-wp-router-region'       => 'chart-' . $block_id,
			'data-wp-context'             => wp_json_encode(
				array(
					'id' => $block_id,
				)
			),
			'class'                       => 'wp-chart-builder-inner',
			'data-wp-watch--init-render'  => $is_static_chart ? null : 'callbacks.watchForRender',
			'data-wp-on-window--resize'   => 'callbacks.watchForResize',
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
				$block_attributes['io']['staticImageId'],
				$block_attributes['io']['staticImageInnerHTML']
			);
		}

		// Scaffold chart text elements.
		$meta_text_active = $block_attributes['metadata']['active'] ?? false;
		if ( $meta_text_active ) {
			$max_width = $block_attributes['layout']['width'] . 'px';
			$top_rule      = $block_attributes['layout']['horizontalRules'] ? wp_sprintf(
				'<hr class="cb__hr" style="margin: 0 0 10px; max-width:%1$s;" />',
				$max_width
			) : '';
			$bottom_rule   = $block_attributes['layout']['horizontalRules'] ? wp_sprintf(
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
					<div class="cb__text-wrapper" style="max-width:%2$s;">
						%3$s
						<div class="cb__title">%4$s</div>
						<div class="cb__subtitle">%5$s</div>
						%6$s
						%7$s
						<div class="cb__note">%8$s</div>
						<div class="cb__note">%9$s</div>
						<div class="cb__tag">%10$s</div>
						%11$s
					</div>
				</div>',
					wp_kses_post( $block_wrapper_attrs ),
					esc_attr( $max_width ),
					$top_rule, // phpcs:ignore
					wp_kses_post( $block_attributes['metadata']['title'] ),
					wp_kses_post( $block_attributes['metadata']['subtitle'] ),
					$is_static_chart ? $static_chart : $chart, //phpcs:ignore
					$question_wording_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Already escaped in ob_get_clean.
					wp_kses_post( $block_attributes['metadata']['note'] ),
					wp_kses_post( $block_attributes['metadata']['source'] ),
					wp_kses_post( $block_attributes['metadata']['tag'] ),
					$bottom_rule // phpcs:ignore
				);
		} else {
				return wp_sprintf( '<div %1$s>%2$s</div>', wp_kses_post( $block_wrapper_attrs ), $is_static_chart ? $static_chart : $chart ); //phpcs:ignore
		}
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
