<?php
/**
 * Admin DataViews Page for PRC Chart Builder
 *
 * @package PRC\Platform\Chart_Builder\Admin
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Class Admin_Dataviews
 *
 * Registers a DataViews admin page for the Chart post type.
 */
class Admin {
	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    3.0.0
	 * @access   protected
	 * @var      Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * Constructor: hook into admin_menu and enqueue scripts.
	 *
	 * @param Loader $loader The loader that's responsible for maintaining and registering all hooks for the plugin.
	 */
	public function __construct( $loader ) {
		$this->loader = $loader;
		$this->loader->add_action( 'admin_menu', $this, 'register_admin_page' );
		$this->loader->add_action( 'admin_enqueue_scripts', $this, 'enqueue_assets' );
	}

	/**
	 * Register the Charts DataViews admin page under the Charts menu.
	 */
	public function register_admin_page() {
		add_submenu_page(
			'edit.php?post_type=chart',
			__( 'Chart Builder Library', 'prc-chart-builder' ),
			__( 'Library (BETA)', 'prc-chart-builder' ),
			'manage_options',
			'prc-chart-builder-library',
			array( $this, 'render_page' )
		);
	}

	/**
	 * Render the admin page container for the React app.
	 */
	public function render_page() {
		echo '<div id="prc-chart-dataviews-admin"></div></div>';
	}

	/**
	 * Enqueue the React app only on our admin page.
	 *
	 * @param string $hook The current admin page hook.
	 */
	public function enqueue_assets( $hook ) {
		if ( ! isset( $_GET['page'] ) || 'prc-chart-builder-library' !== $_GET['page'] ) {
			return;
		}
		$asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';
		error_log( print_r( $asset_file, true ) );
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$script_url = plugins_url( 'build/index.js', __FILE__ );
		error_log( print_r( $script_url, true ) );
		$asset = include $asset_file;

		wp_enqueue_script(
			'prc-chart-builder-library',
			$script_url,
			$asset['dependencies'],
			$asset['version'],
			true
		);
		wp_enqueue_style(
			'prc-chart-builder-library',
			plugins_url( 'build/style-index.css', __FILE__ ),
			array(),
			$asset['version']
		);
		// wp_localize_script(
		// 'prc-chart-dataviews-admin',
		// 'prcChartDataviewsAdmin',
		// array(
		// 'nonce'    => wp_create_nonce( 'wp_rest' ),
		// 'postType' => 'chart',
		// )
		// );
	}
}
