<?php
/**
 * Chart Inspector Sidebar Panel
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WP_Error;

/**
 * Chart Inspector Sidebar Panel
 *
 * Provides an inspector panel for chart post types that shows all posts
 * that reference the current chart.
 *
 * @package PRC\Platform\Chart_Builder
 */
class Inspector_Sidebar_Panel {

	/**
	 * Handle for the inspector sidebar panel editor assets.
	 *
	 * @var string
	 */
	protected static $handle = 'prc-chart-builder-inspector-sidebar-panel';

	/**
	 * Constructor.
	 *
	 * @param \PRC\Platform\Chart_Builder\Loader $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'enqueue_block_editor_assets', $this, 'enqueue_block_plugin_assets' );
		$loader->add_action( 'rest_api_init', $this, 'register_rest_routes' );
	}

	/**
	 * Register REST API routes for fetching chart usage data.
	 */
	public function register_rest_routes() {
		register_rest_route(
			'prc-chart-builder/v1',
			'/chart/(?P<id>\d+)/referencing-posts',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_referencing_posts' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => array(
					'id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Get referencing posts for a chart.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error Response object or error.
	 */
	public function get_referencing_posts( $request ) {
		$chart_id = $request->get_param( 'id' );

		// Verify the chart exists and is of the correct post type.
		$chart = get_post( $chart_id );
		if ( ! $chart || Content_Type::$post_type !== $chart->post_type ) {
			return new WP_Error(
				'invalid_chart',
				__( 'Invalid chart ID', 'prc-chart-builder' ),
				array( 'status' => 404 )
			);
		}

		// Get the post IDs that reference this chart.
		$referencing_post_ids = Synced_Chart::get_chart_usage_post_ids( $chart_id );

		if ( empty( $referencing_post_ids ) ) {
			return new \WP_REST_Response( array(), 200 );
		}

		// Fetch the posts with necessary data.
		$posts_data = array();
		foreach ( $referencing_post_ids as $post_id ) {
			$post = get_post( $post_id );
			if ( ! $post ) {
				continue;
			}

			$posts_data[] = array(
				'id'        => $post->ID,
				'title'     => $post->post_title,
				'type'      => $post->post_type,
				'status'    => $post->post_status,
				'edit_url'  => get_edit_post_link( $post->ID, 'raw' ),
				'permalink' => get_permalink( $post->ID ),
				'date'      => $post->post_date,
				'modified'  => $post->post_modified,
			);
		}

		return new \WP_REST_Response( $posts_data, 200 );
	}

	/**
	 * Register the block plugin assets.
	 */
	public function register_block_plugin_assets() {
		$asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return new WP_Error( 'prc-chart-builder-inspector-panel', 'Asset file not found' );
		}

		$asset      = include $asset_file;
		$asset_slug = self::$handle;
		$script_src = plugins_url( 'build/index.js', __FILE__ );
		$style_src  = plugins_url( 'build/index.css', __FILE__ );

		$script = wp_register_script(
			$asset_slug,
			$script_src,
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( plugin_dir_path( __FILE__ ) . 'build/index.css' ) ) {
			$style = wp_register_style(
				$asset_slug,
				$style_src,
				array(),
				$asset['version']
			);
		}

		if ( ! $script ) {
			return new WP_Error( 'prc-chart-builder-inspector-panel', 'Failed to register script assets' );
		}

		return true;
	}

	/**
	 * Enqueue the block plugin assets.
	 */
	public function enqueue_block_plugin_assets() {
		$registered       = $this->register_block_plugin_assets();
		$screen_post_type = get_current_screen() ? get_current_screen()->post_type : null;

		// Only enqueue on chart post type edit screens.
		if ( ! $screen_post_type || Content_Type::$post_type !== $screen_post_type ) {
			return;
		}

		if ( is_admin() && ! is_wp_error( $registered ) ) {
			wp_enqueue_script( self::$handle );
			if ( wp_style_is( self::$handle, 'registered' ) ) {
				wp_enqueue_style( self::$handle );
			}

			// Localize script with necessary data.
			wp_localize_script(
				self::$handle,
				'prcChartInspectorPanel',
				array(
					'nonce'    => wp_create_nonce( 'wp_rest' ),
					'apiUrl'   => rest_url( 'prc-chart-builder/v1/' ),
					'postType' => Content_Type::$post_type,
				)
			);
		}
	}
}
