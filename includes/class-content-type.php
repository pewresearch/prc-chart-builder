<?php
namespace PRC\Platform\Chart_Builder;

class Content_Type {
	public static $post_type = 'chart';
	public static $menu_icon = 'dashicons-chart-area';

	public function __construct($loader) {
		$loader->add_action('init', $this, 'register_types');
		$loader->add_filter('oembed_response_data', $this, 'modify_oembed_response', 10, 4);
		$loader->add_filter('prc_load_gutenberg', $this, 'enable_gutenberg_ramp');
	}

	public static function get_labels() {
		return [
			'name'                  => _x( 'Charts', 'Post Type General Name', PRC_CHART_BUILDER_NAMESPACE ),
			'singular_name'         => _x( 'Chart', 'Post Type Singular Name', PRC_CHART_BUILDER_NAMESPACE ),
			'menu_name'             => __( 'Charts', PRC_CHART_BUILDER_NAMESPACE ),
			'name_admin_bar'        => __( 'Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'archives'              => __( 'Chart Archives', PRC_CHART_BUILDER_NAMESPACE ),
			'parent_item_colon'     => __( 'Parent Chart:', PRC_CHART_BUILDER_NAMESPACE ),
			'all_items'             => __( 'All Charts', PRC_CHART_BUILDER_NAMESPACE ),
			'add_new_item'          => __( 'Add New Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'add_new'               => __( 'Add New', PRC_CHART_BUILDER_NAMESPACE ),
			'new_item'              => __( 'New Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'edit_item'             => __( 'Edit Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'update_item'           => __( 'Update Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'view_item'             => __( 'View Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'search_items'          => __( 'Search Charts', PRC_CHART_BUILDER_NAMESPACE ),
			'not_found'             => __( 'Not found', PRC_CHART_BUILDER_NAMESPACE ),
			'not_found_in_trash'    => __( 'Not found in Trash', PRC_CHART_BUILDER_NAMESPACE ),
			'featured_image'        => __( 'Chart Thumbnail', PRC_CHART_BUILDER_NAMESPACE ),
			'set_featured_image'    => __( 'Set chart thumbnail', PRC_CHART_BUILDER_NAMESPACE ),
			'remove_featured_image' => __( 'Remove chart thumbnail', PRC_CHART_BUILDER_NAMESPACE ),
			'use_featured_image'    => __( 'Use as chart thumbnail', PRC_CHART_BUILDER_NAMESPACE ),
			'insert_into_item'      => __( 'Insert into Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'uploaded_to_this_item' => __( 'Uploaded to this Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'items_list'            => __( 'Charts list', PRC_CHART_BUILDER_NAMESPACE ),
			'items_list_navigation' => __( 'Charts list navigation', PRC_CHART_BUILDER_NAMESPACE ),
			'filter_items_list'     => __( 'Filter Chart list', PRC_CHART_BUILDER_NAMESPACE ),
		];
	}

	public function register_types() {
		$rewrite = [
			'slug'  => 'chart',
			'pages' => false,
		];
		$args    = [
			'label'               => __( 'Chart', PRC_CHART_BUILDER_NAMESPACE ),
			'description'         => __( 'A store for chart blocks. This post type allows you to save a chart once and update everywhere it is used.', PRC_CHART_BUILDER_NAMESPACE ),
			'labels'              => self::get_labels(),
			'supports'            => ['title', 'editor', 'excerpt', 'author', 'thumbnail', 'revisions', 'custom-fields' ],
			'taxonomies'          => ['category'],
			'hierarchical'        => false,
			'public'              => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'menu_icon'		      => self::$menu_icon,
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
			'template'			  => [['prc-block/chart-builder-controller']],
		];

		register_post_type( self::$post_type, $args );
	}

	public function enable_gutenberg_ramp($post_types) {
		array_push($post_types, self::$post_type);
		return $post_types;
	}

	/**
	 * @hook oembed_response_data
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
