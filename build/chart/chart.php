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
	 * @param mixed $loader
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	/**
	 * Initialize the block.
	 */
	public function block_init() {
		register_block_type_from_metadata( PRC_CHART_BUILDER_DIR . '/build/chart' );
	}
}
