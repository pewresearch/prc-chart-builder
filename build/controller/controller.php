<?php
namespace PRC\Platform\Chart_Builder;

class Controller {
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'block_init' );
	}

	public function block_init() {
		register_block_type_from_metadata( PRC_CHART_BUILDER_DIR . '/build/controller' );
	}
}
