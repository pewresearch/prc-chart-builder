<?php
namespace PRC;

/**
 * Plugin Name:       PRC Chart Builder
 * Description:       Chart Builder is a chart building tool for the PRC Platform. It allows you to create rich, highly interactive charts and data visualizations all from the block editor. Support for synced charts via the Synced Chart block is also possible, allowing you to place one chart in many places and have them all update when the original is updated.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            Ben Wormald and Seth Rubenstein
 * Author URI:        https://pewresearch.org
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       prc-chart-builder
 **/


// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'PRC_CHART_BUILDER_DIR', __DIR__ );

class PRC_Chart_Builder {
	/**
	 * Easily accessible variable that points to the post type.
	 * @var string
	 */
	public static $post_type = 'chart';

	/**
	 * Easily accessible variable that points to the plugin filepath.
	 *
	 * @var string
	 */
	public static $plugin_file = __FILE__;

	/**
	 * Version, change whenever you push a change to production otherwise script concatenation will break Gutenberg.
	 *
	 * @var string
	 */
	public static $version = '0.1.0';

	public function __construct( $init = false ) {
		if ( true === $init ) {
			require_once plugin_dir_path( __FILE__ ) . '/blocks/chart/index.php';
			require_once plugin_dir_path( __FILE__ ) . '/blocks/chart-builder/index.php';
			require_once plugin_dir_path( __FILE__ ) . '/blocks/chart-builder-controller/index.php';
			require_once plugin_dir_path( __FILE__ ) . '/inc/class-legacy-conversion.php';
			require_once plugin_dir_path( __FILE__ ) . '/inc/class-wp-html-table-processor.php';

			$this->init_blocks();

			add_action( 'init', array( $this, 'register_chart_post_type' ) );
		}
	}

	public function register_chart_post_type() {
		$labels  = array(
			'name'                  => _x( 'Charts', 'Post Type General Name', 'prc-chart-builder' ),
			'singular_name'         => _x( 'Chart', 'Post Type Singular Name', 'prc-chart-builder' ),
			'menu_name'             => __( 'Charts', 'prc-chart-builder' ),
			'name_admin_bar'        => __( 'Chart', 'prc-chart-builder' ),
			'archives'              => __( 'Chart Archives', 'prc-chart-builder' ),
			'parent_item_colon'     => __( 'Parent Chart:', 'prc-chart-builder' ),
			'all_items'             => __( 'All Charts', 'prc-chart-builder' ),
			'add_new_item'          => __( 'Add New Chart', 'prc-chart-builder' ),
			'add_new'               => __( 'Add New', 'prc-chart-builder' ),
			'new_item'              => __( 'New Chart', 'prc-chart-builder' ),
			'edit_item'             => __( 'Edit Chart', 'prc-chart-builder' ),
			'update_item'           => __( 'Update Chart', 'prc-chart-builder' ),
			'view_item'             => __( 'View Chart', 'prc-chart-builder' ),
			'search_items'          => __( 'Search Charts', 'prc-chart-builder' ),
			'not_found'             => __( 'Not found', 'prc-chart-builder' ),
			'not_found_in_trash'    => __( 'Not found in Trash', 'prc-chart-builder' ),
			'featured_image'        => __( 'Chart Thumbnail', 'prc-chart-builder' ),
			'set_featured_image'    => __( 'Set chart thumbnail', 'prc-chart-builder' ),
			'remove_featured_image' => __( 'Remove chart thumbnail', 'prc-chart-builder' ),
			'use_featured_image'    => __( 'Use as chart thumbnail', 'prc-chart-builder' ),
			'insert_into_item'      => __( 'Insert into Chart', 'prc-chart-builder' ),
			'uploaded_to_this_item' => __( 'Uploaded to this Chart', 'prc-chart-builder' ),
			'items_list'            => __( 'Charts list', 'prc-chart-builder' ),
			'items_list_navigation' => __( 'Charts list navigation', 'prc-chart-builder' ),
			'filter_items_list'     => __( 'Filter Chart list', 'prc-chart-builder' ),
		);
		$rewrite = array(
			'slug'       => 'chart',
			'pages'      => false,
		);
		$args    = array(
			'label'               => __( 'Chart', 'prc-chart-builder' ),
			'description'         => __( 'A store for chart blocks, save once use everywhere.', 'prc-chart-builder' ),
			'labels'              => $labels,
			'supports'            => array( 'title', 'editor', 'excerpt', 'author', 'thumbnail', 'revisions', 'custom-fields' ),
			'taxonomies'          => array( 'topic' ),
			'hierarchical'        => false,
			'public'              => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'menu_icon'		      => 'dashicons-chart-area',
			'menu_position'       => 5,
			'show_in_admin_bar'   => true,
			'show_in_nav_menus'   => true,
			'show_in_rest'        => true,
			'can_export'          => true,
			'has_archive'         => 'charts',
			'exclude_from_search' => false,
			'publicly_queryable'  => true,
			'rewrite'             => $rewrite,
			'capability_type'     => 'post',
			'template'			  => array( array('prc-block/chart-builder-controller') )
		);

		register_post_type( self::$post_type, $args );

		add_filter(
			'prc_load_gutenberg',
			function ( $enabled_post_types ) {
				$enabled_post_types[] = self::$post_type;
				return $enabled_post_types;
			}
		);
	}

	public function init_blocks() {
		new Chart(true);
		new Chart_Builder(true);
		new Chart_Builder_Controller(true);
		new Legacy_Conversion(true);
	}
}

new PRC_Chart_Builder(true);
