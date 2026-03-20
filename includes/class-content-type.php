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
	 * The chart_type taxonomy slug.
	 *
	 * @var string
	 */
	public static $chart_type_taxonomy = 'chart_type';

	/**
	 * The constructor.
	 *
	 * @param mixed $loader The loader object.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'register_types' );
		$loader->add_action( 'init', $this, 'register_chart_meta' );
		$loader->add_action( 'init', $this, 'register_chart_type_taxonomy' );
		$loader->add_action( 'init', $this, 'register_export_endpoint' );
		$loader->add_action( 'save_post_' . self::$post_type, $this, 'sync_chart_type_on_save', 10, 3 );
		$loader->add_filter( 'prc_platform_post_publish_pipeline_post_types', $this, 'opt_into_publish_pipeline' );
		$loader->add_filter( 'oembed_response_data', $this, 'modify_oembed_response', 10, 4 );
		$loader->add_filter( 'manage_' . self::$post_type . '_posts_columns', $this, 'add_design_slug_column' );
		$loader->add_action( 'manage_' . self::$post_type . '_posts_custom_column', $this, 'render_design_slug_column', 10, 2 );
		$loader->add_filter( 'manage_edit-' . self::$post_type . '_sortable_columns', $this, 'make_design_slug_sortable' );
		$loader->add_action( 'pre_get_posts', $this, 'make_design_slug_searchable' );
		$loader->add_filter( 'rest_' . self::$post_type . '_query', $this, 'make_design_slug_rest_searchable', 10, 2 );
		$loader->add_filter( 'rest_' . self::$post_type . '_query', $this, 'filter_by_chart_type', 10, 2 );
	}

	/**
	 * Known chart type slugs, matching the chartType attribute values set by block variations.
	 *
	 * @var array
	 */
	public static $known_chart_types = array(
		'area'          => 'Area',
		'bar'           => 'Bar',
		'column'        => 'Column',
		'diverging-bar' => 'Diverging Bar',
		'dot-plot'      => 'Dot Plot',
		'exploded-bar'  => 'Exploded Bar',
		'freeform'      => 'Freeform',
		'line'          => 'Line',
		'map-usa'       => 'USA Map',
		'map-usa-block' => 'USA Block Map',
		'map-usa-county'=> 'USA County Map',
		'map-usa-hex'   => 'USA Hex Map',
		'map-world'     => 'World Map',
		'pie'           => 'Pie',
		'sankey'        => 'Sankey',
		'scatter'       => 'Scatter Plot',
		'stacked-area'  => 'Stacked Area',
		'stacked-bar'   => 'Stacked Bar',
		'stacked-column'=> 'Stacked Column',
		'treemap'       => 'Treemap',
	);

	/**
	 * Register the chart_type taxonomy.
	 *
	 * This taxonomy is managed programmatically — terms are set on save via sync_chart_type_on_save()
	 * and should not be manually edited by users. It exists solely to enable efficient server-side
	 * filtering in the REST API (e.g., /wp/v2/chart?chart_type=bar).
	 *
	 * @hook init
	 */
	public function register_chart_type_taxonomy() {
		$labels = array(
			'name'          => _x( 'Chart Types', 'Taxonomy General Name', 'prc-chart-builder' ),
			'singular_name' => _x( 'Chart Type', 'Taxonomy Singular Name', 'prc-chart-builder' ),
		);

		$args = array(
			'labels'            => $labels,
			'hierarchical'      => false,
			'public'            => false,
			'show_ui'           => false,
			'show_admin_column' => false,
			'show_in_nav_menus' => false,
			'show_in_rest'      => true,
			'rest_base'         => self::$chart_type_taxonomy,
			'rewrite'           => false,
		);

		register_taxonomy( self::$chart_type_taxonomy, self::$post_type, $args );

		// Pre-register all known chart type terms so they exist for filtering
		// even if no charts of that type have been saved yet.
		foreach ( self::$known_chart_types as $slug => $label ) {
			if ( ! term_exists( $slug, self::$chart_type_taxonomy ) ) {
				wp_insert_term( $label, self::$chart_type_taxonomy, array( 'slug' => $slug ) );
			}
		}
	}

	/**
	 * Extract the chartType attribute from a chart post's block content and sync it
	 * to the chart_type taxonomy. Called on save_post_chart.
	 *
	 * @hook save_post_chart
	 *
	 * @param int      $post_id The post ID.
	 * @param \WP_Post $post    The post object.
	 * @param bool     $update  Whether this is an existing post being updated.
	 */
	public function sync_chart_type_on_save( $post_id, $post, $update ) {
		// Skip autosaves, revisions, and trashed posts.
		if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
			return;
		}
		if ( 'trash' === $post->post_status ) {
			return;
		}
		if ( empty( $post->post_content ) ) {
			return;
		}

		$chart_type = self::extract_chart_type_from_content( $post->post_content );

		if ( ! $chart_type ) {
			return;
		}

		// Ensure the term exists before assigning.
		if ( ! term_exists( $chart_type, self::$chart_type_taxonomy ) ) {
			$label = self::$known_chart_types[ $chart_type ] ?? ucfirst( str_replace( '-', ' ', $chart_type ) );
			wp_insert_term( $label, self::$chart_type_taxonomy, array( 'slug' => $chart_type ) );
		}

		wp_set_object_terms( $post_id, $chart_type, self::$chart_type_taxonomy );
	}

	/**
	 * Parse block content to extract the chartType attribute from the controller block.
	 *
	 * @param string $post_content Raw post content.
	 * @return string|null The chartType slug, or null if not found.
	 */
	public static function extract_chart_type_from_content( $post_content ) {
		// The canonical chart type source depends on block vintage:
		//
		//   v2 (prc-chart-builder/*):
		//     - prc-chart-builder/chart  → layout.type (canonical, typed in block.json)
		//     - prc-chart-builder/controller → chartType (convenience duplicate)
		//
		//   v1 / legacy (prc-block/*):
		//     - prc-block/chart-builder → chartType (inner block, self-closing)
		//
		// Fast path: skip entirely if no recognisable chart block is present.
		$has_new    = false !== strpos( $post_content, 'prc-chart-builder/controller' );
		$has_legacy = false !== strpos( $post_content, 'prc-block/chart-builder' );

		if ( ! $has_new && ! $has_legacy ) {
			return null;
		}

		// v2: parse blocks to extract layout.type from the inner chart block.
		// Uses parse_blocks() because the chart block's JSON is deeply nested.
		if ( $has_new ) {
			$chart_type = self::extract_chart_type_from_parsed_blocks( parse_blocks( $post_content ) );
			if ( $chart_type ) {
				return sanitize_title( $chart_type );
			}
		}

		// v1 / legacy fallback: chartType on the inner prc-block/chart-builder (self-closing).
		if ( $has_legacy ) {
			$pattern = '/<!--\s*wp:prc-block\/chart-builder\s+(\{(?:[^{}]|\{[^{}]*\})*\})\s*\/-->/';
			if ( preg_match( $pattern, $post_content, $matches ) ) {
				$attrs = json_decode( $matches[1], true );
				if ( JSON_ERROR_NONE === json_last_error() && ! empty( $attrs['chartType'] ) ) {
					return sanitize_title( $attrs['chartType'] );
				}
			}
		}

		return null;
	}

	/**
	 * Walk parsed blocks to find the chart type from the canonical sources.
	 *
	 * Checks prc-chart-builder/chart → layout.type first, then falls back
	 * to prc-chart-builder/controller → chartType.
	 *
	 * @param array $blocks Parsed block array from parse_blocks().
	 * @return string|null Chart type slug or null.
	 */
	private static function extract_chart_type_from_parsed_blocks( $blocks ) {
		foreach ( $blocks as $block ) {
			// Canonical: layout.type on the inner chart block.
			if ( 'prc-chart-builder/chart' === $block['blockName'] ) {
				$type = $block['attrs']['layout']['type'] ?? null;
				if ( $type ) {
					return $type;
				}
			}

			// Fallback: chartType on the controller.
			if ( 'prc-chart-builder/controller' === $block['blockName'] ) {
				if ( ! empty( $block['attrs']['chartType'] ) ) {
					return $block['attrs']['chartType'];
				}
			}

			// Recurse into inner blocks.
			if ( ! empty( $block['innerBlocks'] ) ) {
				$found = self::extract_chart_type_from_parsed_blocks( $block['innerBlocks'] );
				if ( $found ) {
					return $found;
				}
			}
		}

		return null;
	}

	/**
	 * Add the chart post type to the post publish pipeline.
	 *
	 * @hook prc_platform_post_publish_pipeline_post_types
	 *
	 * @param array $post_types The allowed post types.
	 * @return array
	 */
	public function opt_into_publish_pipeline( $post_types ) {
		$post_types[] = self::$post_type;
		return $post_types;
	}

	/**
	 * Register the /export/ rewrite endpoint on chart post permalinks.
	 *
	 * Creates URLs like /chart/my-chart-slug/export/ which are intercepted
	 * by Chart_Export_Endpoint to render a minimal page for screenshot capture.
	 *
	 * @hook init
	 */
	public function register_export_endpoint() {
		add_rewrite_endpoint( 'export', EP_PERMALINK );
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
			'supports'            => array( 'title', 'editor', 'excerpt', 'author', 'thumbnail', 'revisions', 'prc-revisions', 'custom-fields', 'prc-datasets' ),
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

		register_post_meta(
			self::$post_type,
			'_chart_png_attachment_id',
			array(
				'type'              => 'integer',
				'description'       => __( 'Attachment ID of the server-generated PNG for this chart.', 'prc-chart-builder' ),
				'single'            => true,
				'show_in_rest'      => true,
				'default'           => 0,
				'sanitize_callback' => 'absint',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_post_meta(
			self::$post_type,
			'_chart_png_url',
			array(
				'type'              => 'string',
				'description'       => __( 'URL of the server-generated PNG for this chart.', 'prc-chart-builder' ),
				'single'            => true,
				'show_in_rest'      => true,
				'default'           => '',
				'sanitize_callback' => 'esc_url_raw',
				'auth_callback'     => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_post_meta(
			self::$post_type,
			'_chart_attributes_hash',
			array(
				'type'         => 'string',
				'description'  => __( 'MD5 hash of chart-affecting block attributes at time of last PNG generation.', 'prc-chart-builder' ),
				'single'       => true,
				'show_in_rest' => false,
				'default'      => '',
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
	 * When no explicit chart_type filter is applied in admin context, require that
	 * a chart_type term EXISTS so vestigial/legacy posts are excluded from the gallery.
	 *
	 * Specific chart_type filtering (e.g. ?chart_type=123) is handled natively by
	 * the WordPress REST API because the taxonomy has show_in_rest=true.
	 *
	 * @hook rest_chart_query
	 *
	 * @param array            $args    Array of arguments for WP_Query.
	 * @param \WP_REST_Request $request The REST API request.
	 * @return array Modified query arguments.
	 */
	public function filter_by_chart_type( $args, $request ) {
		if ( 'edit' !== $request->get_param( 'context' ) ) {
			return $args;
		}

		// If WP already added a chart_type tax_query (from the native param), skip the EXISTS fallback.
		if ( ! empty( $args['tax_query'] ) ) {
			foreach ( $args['tax_query'] as $clause ) {
				if ( is_array( $clause ) && isset( $clause['taxonomy'] ) && self::$chart_type_taxonomy === $clause['taxonomy'] ) {
					return $args;
				}
			}
		}

		if ( ! isset( $args['tax_query'] ) ) {
			$args['tax_query'] = array();
		}

		$args['tax_query'][] = array(
			'taxonomy' => self::$chart_type_taxonomy,
			'operator' => 'EXISTS',
		);

		return $args;
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
