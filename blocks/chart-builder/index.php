<?php
namespace PRC;

class Chart_Builder extends PRC_Chart_Builder {

	public static $view_script_handle = null;
	public static $block_json = null;
	public static $dir = __DIR__;

	public function __construct( $init = false ) {
		if ( true === $init ) {
			$block_json_file = PRC_CHART_BUILDER_DIR . '/blocks/chart-builder/build/block.json';
			self::$block_json = wp_json_file_decode( $block_json_file, array( 'associative' => true ) );
			self::$block_json['file'] = wp_normalize_path( realpath( $block_json_file ) );
			add_action( 'init', array( $this, 'register_block' ), 11 );
		}
	}

	public function render_chart_builder( $attributes, $content = '', $block = null ) {
		if ( is_admin() || null === $block ) {
			return $content;
		}
		$script_handle = 'prc-block-chart-builder-view-script';
		// do action query monitor
		$attrs         = wp_json_encode( $block->attributes );
		$id            = array_key_exists('id', $attributes) ? $attributes['id'] : false;
		if ( false === $id ) {
			new \WP_Error( 'missing_id', __( 'Chart Block is missing ID', 'prc-block-library' ) );
			return;
		}

		$post_id 	   = get_the_ID();
		// get the publication date of the post
		$publication_date = get_the_date('Y-m-d', $post_id);
		$root_url 	   = get_bloginfo('url');
		wp_add_inline_script($script_handle, "if ( !window.chartConfigs ) {window.chartConfigs = {};} chartConfigs['".$id."'] = " . $attrs . ";");

		$block_attrs = get_block_wrapper_attributes(
			array(
				'class' => 'wp-chart-builder-inner',
				'data-chart-hash' => $id,
				'data-post-id' => $post_id,
				'data-post-url' => get_permalink( $post_id ),
				'data-post-pub-date' => $publication_date,
				'data-root-url' => $root_url,
				'data-iframe-height' => null,
			)
		);

		ob_start();
		?>
		<div <?php echo $block_attrs;?>>
			<div class="ui active centered inline loader"></div>
		</div>
		<?php
		return ob_get_clean();
	}

	public function register_block() {
		register_block_type( self::$dir . '/build', array(
			'render_callback' => array($this, 'render_chart_builder'),
		) );

    }

}
