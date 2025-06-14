<?php
namespace PRC\Platform\Chart_Builder;

use WP_Error;

/**
 * Loads the plugin's dependencies.
 *
 * @link       https://github.com/pewresearch/prc-religious-landscape-study
 * @since      3.0.0
 *
 * @package    PRC_CHART_BUILDER
 * @subpackage PRC_CHART_BUILDER/includes
 */


/**
 * The core plugin class, responsible for loading all dependencies, defining
 * the plugin version, and registering the hooks that define the plugin.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      3.0.0
 * @package    PRC_CHART_BUILDER
 * @subpackage PRC_CHART_BUILDER/includes
 * @author     Seth Rubenstein <srubenstein@pewresearch.org>
 */
class Bootstrap {

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
	 * The unique identifier of this plugin.
	 *
	 * @since    3.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    3.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 * Define the core functionality of chart-builder as initialized by hooks.
	 *
	 * @since    3.0.0
	 */
	public function __construct() {
		$this->version     = PRC_CHART_BUILDER_VERSION;
		$this->plugin_name = PRC_CHART_BUILDER_NAMESPACE;

		// Initialize the plugin and include the required modules dependencies.
		$this->load_dependencies();

		// Initialize and register the plugin modules and blocks.
		$this->register_modules();
		$this->register_blocks();
	}

	/**
	 * Include a file from the plugin's includes directory.
	 *
	 * @param mixed $file_path
	 * @return WP_Error|void
	 */
	public function include( $file_path ) {
		if ( file_exists( plugin_dir_path( __DIR__ ) . 'includes/' . $file_path ) ) {
			require_once plugin_dir_path( __DIR__ ) . 'includes/' . $file_path;
		} else {
			return new WP_Error( 'missing-dependency', __( 'Missing dependency.', PRC_CHART_BUILDER_NAMESPACE ) );
		}
	}

	/**
	 * Include a file from the plugin's includes directory.
	 *
	 * @param mixed $block_file_name
	 * @return WP_Error|void
	 */
	private function include_block( $block_file_name ) {
		$directory = 'local' === wp_get_environment_type() ? 'src' : 'build';
		if ( defined( 'WP_PLAYGROUND' ) && true === WP_PLAYGROUND ) {
			$directory = 'build';
		}
		$block_file_path = $directory . '/' . $block_file_name . '/' . $block_file_name . '.php';
		// check if WP_PLAYGROUND constant is defined and is true
		if ( file_exists( plugin_dir_path( __DIR__ ) . $block_file_path ) ) {
			require_once plugin_dir_path( __DIR__ ) . $block_file_path;
		} else {
			return new WP_Error( 'missing-block', __( 'Block missing:: ' . $block_file_name, PRC_CHART_BUILDER_NAMESPACE ) );
		}
	}

	/**
	 * Include all blocks.
	 *
	 * @return void
	 */
	private function load_blocks() {
		$directory = 'local' === wp_get_environment_type() ? '/src' : '/build';
		if ( defined( 'WP_PLAYGROUND' ) && true === WP_PLAYGROUND ) {
			$directory = '/build';
		}
		$block_files = glob( PRC_CHART_BUILDER_DIR . $directory . '/*', GLOB_ONLYDIR );
		foreach ( $block_files as $block ) {
			$block  = basename( $block );
			$loaded = $this->include_block( $block );
			if ( is_wp_error( $loaded ) ) {
				return new WP_Error( 'missing-block', __( 'Block missing:: ' . $block, PRC_CHART_BUILDER_NAMESPACE ) );
			}
		}
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * Create an instance of the loader which will be used to register the hooks
	 * with WordPress.
	 *
	 * @since    3.0.0
	 * @access   private
	 */
	private function load_dependencies() {
		// Include plugin loading class.
		$this->include( 'class-loader.php' );
		$this->include( 'class-content-type.php' );
		$this->include( 'class-media-library.php' );
		$this->include( 'class-block-utils.php' );
		$this->include( 'class-seo.php' );
		$this->include( 'admin/class-admin.php' );

		$this->load_blocks();

		// Initialize the loader.
		$this->loader = new Loader();
		$this->loader->add_action( 'init', $this, 'register_default_templates' );
	}

	/**
	 * Register the various modules that make the RLS plugin and overall system work.
	 *
	 * @since   3.0.0
	 * @access private
	 */
	private function register_modules() {
		new Content_Type( $this->get_loader() );
		new Media_Library( $this->get_loader() );
		new SEO( $this->get_loader() );
		new Admin( $this->get_loader() );
	}

	/**
	 * Register the various blocks that make the RLS plugin and overall system work.
	 *
	 * @since   3.0.0
	 * @access private
	 */
	private function register_blocks() {
		\wp_register_block_metadata_collection(
			PRC_CHART_BUILDER_DIR . '/build',
			PRC_CHART_BUILDER_DIR . '/build/blocks-manifest.php'
		);
		if ( ! defined( 'WP_PLAYGROUND' ) || true !== WP_PLAYGROUND ) {
			new Synced_Chart( $this->get_loader() );
		}
		new Controller( $this->get_loader() );
		new Chart( $this->get_loader() );
	}

	/**
	 * Register the default block templates for the RLS plugin.
	 */
	public function register_default_templates() {
		function get_template_content( $template ) {
			ob_start();
			include PRC_CHART_BUILDER_DIR . "/templates/{$template}";
			return ob_get_clean();
		}

		if ( defined( 'WP_PLAYGROUND' ) && true === WP_PLAYGROUND ) {
			register_block_template(
				'prc-chart-builder//single-chart-playground',
				array(
					'title'       => __( 'Single Chart Playground', PRC_CHART_BUILDER_NAMESPACE ),
					'description' => __( 'Displays a single chart.', PRC_CHART_BUILDER_NAMESPACE ),
					'content'     => get_template_content( 'single-chart-playground.php' ),
				)
			);
		} else {
			register_block_template(
				'prc-chart-builder//single-chart',
				array(
					'title'       => __( 'Single Chart', PRC_CHART_BUILDER_NAMESPACE ),
					'description' => __( 'Displays a single chart.', PRC_CHART_BUILDER_NAMESPACE ),
					'content'     => get_template_content( 'single-chart.php' ),
				)
			);
		}
	}

	/**
	 * Run the loader to execute all of the hooks with WordPress.
	 *
	 * @since    3.0.0
	 */
	public function run() {
		$this->loader->run();
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * The reference to the class that orchestrates the hooks with the plugin.
	 *
	 * @since     1.0.0
	 * @return    PRC_CHART_BUILDER_Loader    Orchestrates the hooks of the plugin.
	 */
	public function get_loader() {
		return $this->loader;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}
}
