<?php
/**
 * Chart Patterns — registers WordPress block pattern categories for each chart type.
 *
 * Categories are registered here so they appear in the block editor's "Create pattern"
 * dialog. Designers create and maintain the actual patterns entirely within the editor:
 * build a chart, select the blocks, "Create pattern" → "Not synced" → assign to the
 * appropriate prc-chart-builder-{type} category.
 *
 * Patterns saved this way are loaded automatically by WordPress into the pattern
 * registry and exposed to the "Add New Chart" modal via get_patterns_for_modal().
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Class Chart_Patterns
 */
class Chart_Patterns {
	/**
	 * The loader instance.
	 *
	 * @var Loader
	 */
	protected $loader;

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader instance.
	 */
	public function __construct( $loader ) {
		$this->loader = $loader;
		$this->loader->add_action( 'init', $this, 'register_chart_pattern_categories', 9 );
	}

	/**
	 * Register the top-level and per-type pattern categories.
	 *
	 * @hook init, priority 9
	 */
	public function register_chart_pattern_categories() {
		register_block_pattern_category(
			'prc-chart-builder',
			array( 'label' => __( 'Chart Builder', 'prc-chart-builder' ) )
		);

		foreach ( Content_Type::$known_chart_types as $slug => $label ) {
			register_block_pattern_category(
				"prc-chart-builder-{$slug}",
				// translators: %s is the chart type label, e.g. "Bar".
				array( 'label' => sprintf( __( '%s Charts', 'prc-chart-builder' ), $label ) )
			);
		}
	}

}
