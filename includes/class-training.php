<?php
/**
 * Chart Builder training module, its tour, and the data table help tip.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare( strict_types=1 );

namespace PRC\Platform\Chart_Builder;

/**
 * Soft-depends on prc-wp-admin-tours through its register actions.
 */
class Training {
	use Chart_Block_Defaults;

	public const MODULE_ID = 'chart-builder-basics';
	public const TOUR_ID   = 'chart-builder-basics';
	public const HINT_ID   = 'prc-chart-builder/data-table-help';

	private const WIZARD = '.prc-chart-cpt-wizard';

	/**
	 * Constructor.
	 *
	 * @param Loader $loader Loader.
	 */
	public function __construct( Loader $loader ) {
		$loader->add_action( 'prc_wp_admin_tours_register', $this, 'register_tours' );
		$loader->add_action( 'prc_wp_admin_tours_register_modules', $this, 'register_module' );
	}

	/**
	 * Register the module tour and, where the host supports help tips, the data table tip.
	 *
	 * @hook prc_wp_admin_tours_register
	 *
	 * @param object $registry Tour registry.
	 */
	public function register_tours( $registry ): void {
		if ( ! is_object( $registry ) || ! method_exists( $registry, 'register' ) ) {
			return;
		}

		$registry->register( self::tour_config() );

		// Without help tips, the host would run an unknown mode as a spotlight tour.
		if ( self::host_supports_hints() ) {
			$registry->register( self::hint_config() );
		}
	}

	/**
	 * Register the Chart Builder training module.
	 *
	 * @hook prc_wp_admin_tours_register_modules
	 *
	 * @param object $registry Training module registry.
	 */
	public function register_module( $registry ): void {
		if ( ! is_object( $registry ) || ! method_exists( $registry, 'register' ) ) {
			return;
		}

		$registry->register( $this->module_config() );
	}

	/**
	 * Whether prc-wp-admin-tours accepts `mode: hint` tours.
	 */
	public static function host_supports_hints(): bool {
		return function_exists( '\PRC\Platform\Wp_Admin_Tours\allowed_tour_modes' )
			&& in_array( 'hint', \PRC\Platform\Wp_Admin_Tours\allowed_tour_modes(), true );
	}

	/**
	 * Training module definition.
	 *
	 * @return array<string, mixed>
	 */
	public function module_config(): array {
		return array(
			'id'       => self::MODULE_ID,
			'builder'  => Content_Type::$post_type,
			'title'    => __( 'Build your first chart', 'prc-chart-builder' ),
			'tour'     => self::TOUR_ID,
			'sandbox'  => array(
				'post_type' => Content_Type::$post_type,
				'template'  => $this->sandbox_content(),
			),
			'requires' => array(),
			'order'    => 10,
		);
	}

	/**
	 * Selector for a step button in the chart wizard progress bar.
	 *
	 * A step button only renders for a step the user can move to, so clicking
	 * the step the wizard is already on finds nothing and does nothing.
	 *
	 * @param int $step 1-based wizard step.
	 */
	private static function wizard_step_button( int $step ): string {
		return self::WIZARD . ' .prc-chart-wizard__steps > li:nth-child(' . $step . ') .prc-chart-wizard__step-button';
	}

	/**
	 * Selector for an element on one wizard step.
	 *
	 * @param string $step     `data-wizard-step` value.
	 * @param string $selector Selector inside that step.
	 */
	private static function on_wizard_step( string $step, string $selector ): string {
		return self::WIZARD . '[data-wizard-step="' . $step . '"] ' . $selector;
	}

	/**
	 * Next/Back tour over the sandbox chart. It runs only from the training module.
	 *
	 * @return array<string, mixed>
	 */
	public static function tour_config(): array {
		$editor_screen = array(
			'kind'     => 'postTypeEditor',
			'postType' => Content_Type::$post_type,
		);

		return array(
			'id'         => self::TOUR_ID,
			'title'      => __( 'Build your first chart', 'prc-chart-builder' ),
			'version'    => 1,
			'autoStart'  => false,
			'capability' => 'edit_posts',
			'screens'    => array( $editor_screen ),
			'steps'      => array(
				array(
					'id'          => 'chart-training-intro',
					'title'       => __( 'Practice on your own chart', 'prc-chart-builder' ),
					'description' => __( 'This draft is yours to practice on. Only you can see it, and it is deleted after three days. Use Next and Back to move through the tour.', 'prc-chart-builder' ),
					'selector'    => null,
				),
				array(
					'id'          => 'chart-training-steps',
					'title'       => __( 'Four steps build a chart', 'prc-chart-builder' ),
					'description' => __( 'Select Template, Add Data, Style Chart, and Preview Chart. Click a step to go to it. Next opens Add Data.', 'prc-chart-builder' ),
					'selector'    => self::WIZARD . ' .prc-chart-wizard__steps',
					'clickOnNext' => self::wizard_step_button( 2 ),
					'side'        => 'bottom',
				),
				array(
					'id'          => 'chart-training-data',
					'title'       => __( 'Add your data', 'prc-chart-builder' ),
					'description' => __( 'Type in the table, paste values from a spreadsheet, or upload a CSV file. The first column labels the bars. The preview changes as you type.', 'prc-chart-builder' ),
					'selector'    => self::on_wizard_step( 'data', '.chart-builder-data-table' ),
					'clickOnNext' => self::wizard_step_button( 3 ),
					'side'        => 'right',
				),
				array(
					'id'          => 'chart-training-style',
					'title'       => __( 'Style the chart', 'prc-chart-builder' ),
					'description' => __( 'Use the Appearance, Data, Text, and chart type tabs to set colors, labels, and sizes. You can also drag labels on the live preview.', 'prc-chart-builder' ),
					'selector'    => self::on_wizard_step( 'configure', '.prc-chart-modal__configure-controls' ),
					'clickOnBack' => self::wizard_step_button( 2 ),
					'side'        => 'right',
				),
				array(
					'id'          => 'chart-training-advanced',
					'title'       => __( 'Advanced Settings', 'prc-chart-builder' ),
					'description' => __( 'Advanced Settings opens every chart control in the block sidebar, such as axes, legend, tooltips, and annotations.', 'prc-chart-builder' ),
					'selector'    => self::on_wizard_step( 'configure', '.prc-chart-wizard__design-mode-entry' ),
					'clickOnNext' => self::wizard_step_button( 4 ),
					'side'        => 'top',
				),
				array(
					'id'          => 'chart-training-preview',
					'title'       => __( 'Preview the chart', 'prc-chart-builder' ),
					'description' => __( 'Check the chart at desktop, tablet, and mobile widths, in light and dark mode, and with color vision filters. These settings change only the preview.', 'prc-chart-builder' ),
					'selector'    => self::on_wizard_step( 'preview', '.prc-chart-modal__configure-controls' ),
					'clickOnBack' => self::wizard_step_button( 3 ),
					'side'        => 'right',
				),
				array(
					'id'          => 'chart-training-save',
					'title'       => __( 'Save your chart', 'prc-chart-builder' ),
					'description' => __( 'Save draft keeps your work. This practice chart stays a private draft. Click Done to finish your training.', 'prc-chart-builder' ),
					'selector'    => '.editor-post-save-draft, .editor-post-saved-state',
					'side'        => 'bottom',
				),
			),
		);
	}

	/**
	 * Help tip on the chart data table.
	 *
	 * @return array<string, mixed>
	 */
	public static function hint_config(): array {
		return array(
			'id'         => self::HINT_ID,
			'title'      => __( 'Chart data help', 'prc-chart-builder' ),
			'version'    => 1,
			'mode'       => 'hint',
			'capability' => 'edit_posts',
			'screens'    => array(
				array(
					'kind'     => 'postTypeEditor',
					'postType' => Content_Type::$post_type,
				),
			),
			'steps'      => array(
				array(
					'id'          => 'data-table',
					'title'       => __( 'Chart data', 'prc-chart-builder' ),
					'description' => __( 'This table is the chart data. Type, paste from a spreadsheet, or upload a CSV file. The first column labels the chart.', 'prc-chart-builder' ),
					'selector'    => self::on_wizard_step( 'data', '.chart-builder-data-table' ),
					'side'        => 'bottom',
					'media'       => array(
						'poster' => 'chart-builder-data-table-poster',
						'video'  => 'chart-builder-data-table-video',
						'alt'    => __( 'Pasting spreadsheet values into the chart data table', 'prc-chart-builder' ),
					),
				),
			),
		);
	}

	/**
	 * Block markup for the sandbox: a horizontal bar chart with practice data.
	 *
	 * The table block saves static HTML, so the sandbox uses markup, not a block template array.
	 */
	public function sandbox_content(): string {
		$rows   = array(
			__( 'Fall', 'prc-chart-builder' )   => 35,
			__( 'Summer', 'prc-chart-builder' ) => 28,
			__( 'Spring', 'prc-chart-builder' ) => 22,
			__( 'Winter', 'prc-chart-builder' ) => 15,
		);
		$column = __( 'Favorite season', 'prc-chart-builder' );
		$value  = __( 'Percent', 'prc-chart-builder' );

		$body       = '';
		$chart_data = array();
		foreach ( $rows as $label => $number ) {
			$body        .= '<tr><td data-prc-v-col="0">' . esc_html( $label ) . '</td><td data-prc-v-col="1">' . (int) $number . '</td></tr>';
			$chart_data[] = array(
				'x'    => $label,
				$value => (string) $number,
			);
		}

		$table = serialize_block(
			array(
				'blockName'    => 'prc-block/table',
				'attrs'        => array(
					'isScrollOnPc'     => true,
					'isScrollOnMobile' => true,
					'sticky'           => 'first-column',
					'fontFamily'       => 'sans-serif',
					'fontSize'         => 'small',
					'className'        => 'chart-builder-data-table',
				),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(
					'<figure class="wp-block-prc-block-table is-scroll-on-pc is-scroll-on-mobile chart-builder-data-table has-sans-serif-font-family has-small-font-size"><table class="has-fixed-layout is-sticky-first-column"><colgroup><col/><col/></colgroup><thead><tr><th>' . esc_html( $column ) . '</th><th>' . esc_html( $value ) . '</th></tr></thead><tbody>' . $body . '</tbody></table></figure>',
				),
			)
		);

		$chart = serialize_block(
			array(
				'blockName'    => 'prc-chart-builder/chart',
				'attrs'        => $this->deep_merge(
					$this->deep_merge( $this->get_chart_block_defaults(), $this->get_variation_template_defaults( 'bar' ) ),
					array(
						'_version' => 'v2',
						'metadata' => array(
							'title'    => __( 'Practice chart: Fall is the most popular season', 'prc-chart-builder' ),
							'subtitle' => __( '% of people in this practice data who name each season as their favorite', 'prc-chart-builder' ),
							'note'     => '',
							'source'   => __( 'Source: Practice data for Chart Builder training. Not survey results.', 'prc-chart-builder' ),
						),
						'io'       => array(
							'chartData'           => $chart_data,
							'availableCategories' => array( $value ),
							'independentVariable' => $column,
							'defaultShouldRender' => true,
						),
						'lock'     => array(
							'move'   => true,
							'remove' => true,
						),
					)
				),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			)
		);

		return serialize_block(
			array(
				'blockName'    => 'prc-chart-builder/controller',
				'attrs'        => array(
					'chartType' => 'bar',
					'lock'      => array(
						'move'   => true,
						'remove' => true,
					),
				),
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array( "\n" . $table . "\n\n" . $chart . "\n" ),
			)
		);
	}
}
