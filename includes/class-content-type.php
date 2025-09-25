<?php
/**
 * Content Type class for Chart Builder.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Content Type class for Chart Builder.
 */
class Content_Type {
	/**
	 * The post type slug.
	 *
	 * @var string
	 */
	public static $post_type = 'chart';
	/**
	 * The menu icon.
	 *
	 * @var string
	 */
	public static $menu_icon = 'dashicons-chart-area';

	/**
	 * The constructor.
	 *
	 * @param mixed $loader The loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'register_types' );
		$loader->add_filter( 'prc_platform__datasets_enabled_post_types', $this, 'enable_datasets_support' );
		$loader->add_filter( 'oembed_response_data', $this, 'modify_oembed_response', 10, 4 );
	}

	/**
	 * Get the labels for the post type.
	 *
	 * @return array
	 */
	public static function get_labels() {
		return array(
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
	}

	/**
	 * Register the post type.
	 */
	public function register_types() {
		$rewrite = array(
			'slug'  => 'chart',
			'pages' => false,
		);
		$args    = array(
			'label'               => __( 'Chart', 'prc-chart-builder' ),
			'description'         => __( 'A store for chart blocks. This post type allows you to save a chart once and update everywhere it is used.', 'prc-chart-builder' ),
			'labels'              => self::get_labels(),
			'supports'            => array( 'title', 'editor', 'excerpt', 'author', 'thumbnail', 'revisions', 'custom-fields' ),
			'taxonomies'          => array( 'category' ),
			'hierarchical'        => false,
			'public'              => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'menu_icon'           => self::$menu_icon,
			'menu_position'       => 10,
			'show_in_admin_bar'   => true,
			'show_in_nav_menus'   => true,
			'show_in_rest'        => true,
			'can_export'          => true,
			'has_archive'         => 'charts',
			'exclude_from_search' => false,
			'publicly_queryable'  => true,
			'rewrite'             => $rewrite,
			'capability_type'     => 'post',
			'template'            => array( array( 'prc-chart-builder/controller' ) ),
		);

		register_post_type( self::$post_type, $args );
	}

	/**
	 * Enable datasets support.
	 *
	 * @hook prc_platform__datasets_enabled_post_types
	 *
	 * @param array $post_types The post types.
	 * @return array The post types.
	 */
	public function enable_datasets_support( $post_types ) {
		$post_types[] = 'chart';
		return $post_types;
	}

	/**
	 * Modify the oEmbed response.
	 *
	 * @hook oembed_response_data
	 *
	 * @param mixed $data The oEmbed data.
	 * @param mixed $post The post object.
	 * @param mixed $width The width.
	 * @param mixed $height The height.
	 * @return mixed The modified data.
	 */
	public function modify_oembed_response( $data, $post, $width, $height ) {
		// Doing a little bit of checking here to make sure we're only modifying the oEmbed response for the chart post type.
		if ( ! is_object( $post ) || ! isset( $post->post_type ) || self::$post_type !== $post->post_type ) {
			return $data;
		}

		$data['type'] = 'rich';
		return $data;
	}
}
