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
		echo '<div id="prc-chart-dataviews-admin"></div>';
	}

	/**
	 * Enqueue the React app only on our admin page.
	 *
	 * ## Block Preview Architecture
	 *
	 * The "Add New Chart" modal renders saved block patterns as live previews
	 * using @wordpress/block-editor's BlockPreview component — the same
	 * technique used by the Site Editor's Patterns admin screen.
	 *
	 * BlockPreview requires two things that aren't present on a plain admin page:
	 *
	 * 1. A BlockEditorProvider in the React tree (provided in the modal root).
	 *    This bootstraps the block-editor Redux store.
	 *
	 * 2. Block types registered in JS so that parse() and BlockPreview can
	 *    handle any block markup in saved patterns. This requires:
	 *    a) wp-block-library script loaded (ships registerCoreBlocks())
	 *    b) registerCoreBlocks() called explicitly — WordPress loads the script
	 *       but does NOT auto-call the function outside of editor contexts.
	 *       We call it in index.js at module load time.
	 *    c) All custom block editor scripts enqueued so that blocks like
	 *       prc-chart-builder/controller, prc-block/table, etc. are registered.
	 *       We loop WP_Block_Type_Registry to enqueue editor_script_handles for
	 *       every registered block type.
	 *    d) Frontend (style_handles) and editor (editor_style_handles) CSS for
	 *       each block, so BlockPreview's iframe renders with correct styles.
	 *
	 * @param string $hook The current admin page hook.
	 */
	public function enqueue_assets( $hook ) {
		if ( ! isset( $_GET['page'] ) || 'prc-chart-builder-library' !== $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}
		$asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = include $asset_file;

		// Load wp-block-library so registerCoreBlocks() is available in JS.
		// Note: the script loads the function but does not call it — index.js
		// calls registerCoreBlocks() explicitly before React renders.
		wp_enqueue_script( 'wp-block-library' );
		wp_enqueue_style( 'wp-block-library' );
		wp_enqueue_style( 'wp-edit-blocks' );

		// Enqueue editor scripts + styles for every registered block type.
		// This ensures custom blocks (prc-chart-builder/*, prc-block/*, etc.)
		// are registered in the JS block registry so parse() can parse their
		// markup and BlockPreview can render them in the pattern picker.
		$block_registry = \WP_Block_Type_Registry::get_instance();
		foreach ( $block_registry->get_all_registered() as $block_type ) {
			foreach ( $block_type->editor_script_handles as $handle ) {
				wp_enqueue_script( $handle );
			}
			foreach ( $block_type->style_handles as $handle ) {
				wp_enqueue_style( $handle );
			}
			foreach ( $block_type->editor_style_handles as $handle ) {
				wp_enqueue_style( $handle );
			}
		}

		wp_enqueue_script(
			'prc-chart-builder-library',
			plugins_url( 'build/index.js', __FILE__ ),
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'prc-chart-builder-library',
			plugins_url( 'build/style-index.css', __FILE__ ),
			array( 'wp-components', 'wp-block-library', 'wp-edit-blocks' ),
			$asset['version']
		);

		$plugin_root = dirname( dirname( dirname( __FILE__ ) ) );
		$variation_images_url = plugins_url(
			'.shared/variation-images/',
			$plugin_root . '/prc-chart-builder.php'
		);

		wp_localize_script(
			'prc-chart-builder-library',
			'prcChartBuilderLibrary',
			array(
				'nonce'               => wp_create_nonce( 'wp_rest' ),
				'restUrl'             => esc_url_raw( rest_url() ),
				'chartTypeTerms'      => $this->get_chart_type_terms(),
				'variationImagesUrl'  => esc_url( $variation_images_url ),
			)
		);
	}

	/**
	 * Get all registered chart_type taxonomy terms for use in the React app.
	 *
	 * @return array Array of term objects with slug and name.
	 */
	private function get_chart_type_terms() {
		$terms = get_terms(
			array(
				'taxonomy'   => \PRC\Platform\Chart_Builder\Content_Type::$chart_type_taxonomy,
				'hide_empty' => false,
				'orderby'    => 'name',
			)
		);

		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return array();
		}

		$known_slugs = array_keys( Content_Type::$known_chart_types );

		return array_values(
			array_filter(
				array_map(
					static function ( $term ) {
						return array(
							'id'    => $term->term_id,
							'slug'  => $term->slug,
							'label' => $term->name,
							'count' => $term->count,
						);
					},
					$terms
				),
				static function ( $item ) use ( $known_slugs ) {
					return in_array( $item['slug'], $known_slugs, true );
				}
			)
		);
	}
}
