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
		$loader->add_action( 'init', $this, 'register_chart_meta' );
		$loader->add_filter( 'prc_platform__datasets_enabled_post_types', $this, 'enable_datasets_support' );
		$loader->add_filter( 'oembed_response_data', $this, 'modify_oembed_response', 10, 4 );
		$loader->add_filter( 'manage_' . self::$post_type . '_posts_columns', $this, 'add_design_slug_column' );
		$loader->add_action( 'manage_' . self::$post_type . '_posts_custom_column', $this, 'render_design_slug_column', 10, 2 );
		$loader->add_filter( 'manage_edit-' . self::$post_type . '_sortable_columns', $this, 'make_design_slug_sortable' );
		$loader->add_action( 'pre_get_posts', $this, 'make_design_slug_searchable' );
		$loader->add_filter( 'rest_' . self::$post_type . '_query', $this, 'make_design_slug_rest_searchable', 10, 2 );
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
	 * Register custom meta fields for the chart post type.
	 */
	public function register_chart_meta() {
		register_post_meta(
			self::$post_type,
			'design_slug',
			array(
				'type'              => 'string',
				'description'       => __( 'Design slug used by the design team for chart naming conventions.', 'prc-chart-builder' ),
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * Add Design Slug column to the admin list table.
	 *
	 * @hook manage_chart_posts_columns
	 *
	 * @param array $columns The existing columns.
	 * @return array The modified columns.
	 */
	public function add_design_slug_column( $columns ) {
		// Insert the Design Slug column after the title column.
		$new_columns = array();
		foreach ( $columns as $key => $value ) {
			$new_columns[ $key ] = $value;
			if ( 'title' === $key ) {
				$new_columns['design_slug'] = __( 'Design Slug', 'prc-chart-builder' );
			}
		}
		return $new_columns;
	}

	/**
	 * Render the Design Slug column content.
	 *
	 * @hook manage_chart_posts_custom_column
	 *
	 * @param string $column The column name.
	 * @param int    $post_id The post ID.
	 */
	public function render_design_slug_column( $column, $post_id ) {
		if ( 'design_slug' === $column ) {
			$design_slug = get_post_meta( $post_id, 'design_slug', true );
			if ( ! empty( $design_slug ) ) {
				echo esc_html( $design_slug );
			} else {
				echo '<span style="color: #999;">—</span>';
			}
		}
	}

	/**
	 * Make the Design Slug column sortable.
	 *
	 * @hook manage_edit-chart_sortable_columns
	 *
	 * @param array $columns The sortable columns.
	 * @return array The modified sortable columns.
	 */
	public function make_design_slug_sortable( $columns ) {
		$columns['design_slug'] = 'design_slug';
		return $columns;
	}

	/**
	 * Make the design slug meta field searchable in the admin and REST API.
	 *
	 * @hook pre_get_posts
	 *
	 * @param WP_Query $query The WordPress query object.
	 */
	public function make_design_slug_searchable( $query ) {
		// Only apply to searches for the chart post type.
		// Allow both admin searches and REST API searches.
		$is_admin_search = is_admin() && $query->is_search() && $query->is_main_query();
		$is_rest_search  = defined( 'REST_REQUEST' ) && REST_REQUEST && $query->is_search();

		if ( ! $is_admin_search && ! $is_rest_search ) {
			return;
		}

		// Only apply to chart post type queries.
		$post_type = $query->get( 'post_type' );
		if ( self::$post_type !== $post_type ) {
			return;
		}

		// Get the search term.
		$search_term = $query->get( 's' );
		if ( empty( $search_term ) ) {
			return;
		}

		// Add meta query to search design_slug field.
		$meta_query = $query->get( 'meta_query' ) ?: array();

		// Add design slug to the search.
		$meta_query[] = array(
			'key'     => 'design_slug',
			'value'   => $search_term,
			'compare' => 'LIKE',
		);

		$query->set( 'meta_query', $meta_query );

		$query->set( 's', '' );
	}

	/**
	 * Make the design slug meta field searchable via REST API.
	 *
	 * This enables searching by design_slug when using WPEntitySearch component
	 * or any REST API query that searches for charts.
	 *
	 * @hook rest_chart_query
	 *
	 * @param array            $args    Array of arguments for WP_Query.
	 * @param \WP_REST_Request $request The REST API request.
	 * @return array Modified query arguments.
	 */
	public function make_design_slug_rest_searchable( $args, $request ) {
		// Only apply if there's a search parameter.
		$search = $request->get_param( 's' );
		if ( empty( $search ) ) {
			return $args;
		}

		// Add meta query to search design_slug field.
		if ( ! isset( $args['meta_query'] ) ) {
			$args['meta_query'] = array();
		}

		$args['meta_query'][] = array(
			'key'     => 'design_slug',
			'value'   => $search,
			'compare' => 'LIKE',
		);

		// Clear the standard search to only search meta.
		$args['s'] = '';

		return $args;
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
