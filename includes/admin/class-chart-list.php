<?php
/**
 * Chart DataViews admin list on the shared shell.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

use WP_Post;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the Charts list on the shared DataViews shell and enriches rows/filters.
 */
class Chart_List {
	/**
	 * Admin page slug for the DataViews list (stable URL for bookmarks).
	 */
	public const PAGE_SLUG = 'prc-chart-builder-library';

	/**
	 * Script and style handle for the list provider.
	 */
	public const SCRIPT_HANDLE = 'prc-chart-builder-admin-dataview';

	/**
	 * Classic list parent / default CPT list URL.
	 */
	private const CHARTS_PARENT = 'edit.php?post_type=chart';

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'prc_wp_admin_dataview_register_lists', $this, 'register_list' );
		$loader->add_action( 'admin_menu', $this, 'declutter_chart_submenu', 1001 );
		$loader->add_action( 'admin_enqueue_scripts', $this, 'enqueue_provider_assets', 20 );
		$loader->add_filter( 'prc_wp_admin_dataview_localize', $this, 'localize_provider', 10, 2 );
		$loader->add_filter( 'prc_wp_admin_dataview_shape_row', $this, 'shape_row', 10, 3 );
		$loader->add_filter( 'prc_wp_admin_dataview_query_args', $this, 'query_args', 10, 3 );
		$loader->add_filter( 'posts_join', $this, 'search_join_design_slug', 10, 2 );
		$loader->add_filter( 'posts_search', $this, 'search_or_design_slug', 10, 2 );
		$loader->add_filter( 'posts_distinct', $this, 'search_distinct', 10, 2 );
	}

	/**
	 * Register the chart list with the shared DataViews shell.
	 *
	 * @param object $lists Shared list registry.
	 */
	public function register_list( $lists ): void {
		if ( ! is_object( $lists ) || ! method_exists( $lists, 'register' ) ) {
			return;
		}

		$lists->register(
			array(
				'postType'  => Content_Type::$post_type,
				'pageSlug'  => self::PAGE_SLUG,
				'menuTitle' => __( 'All Charts', 'prc-chart-builder' ),
				'pageTitle' => __( 'All Charts', 'prc-chart-builder' ),
				'duplicate' => array(
					'includeMeta' => array(
						'design_slug',
						'_thumbnail_id',
					),
				),
			)
		);
	}

	/**
	 * Keep only All Charts, Add New, and Settings on the Charts submenu flyout.
	 *
	 * When the shell rewrites All Charts to the DataViews page slug, that slug
	 * is kept. When DataViews is disabled for chart, the classic
	 * edit.php?post_type=chart All Charts entry is kept instead. Taxonomy
	 * screens stay registered and reachable by URL.
	 *
	 * @hook admin_menu, priority 1001
	 */
	public function declutter_chart_submenu(): void {
		global $submenu;

		if ( ! isset( $submenu[ self::CHARTS_PARENT ] ) || ! is_array( $submenu[ self::CHARTS_PARENT ] ) ) {
			return;
		}

		$allowed_slugs = array(
			self::PAGE_SLUG,
			// Classic All Charts when shell DataViews for chart is disabled
			// (rewrite never swaps edit.php?post_type=chart → PAGE_SLUG).
			self::CHARTS_PARENT,
			'post-new.php?post_type=' . Content_Type::$post_type,
			Theme_Admin::ADMIN_PAGE_SLUG,
		);

		$rewritten = array();
		$seen      = array();
		foreach ( $submenu[ self::CHARTS_PARENT ] as $key => $item ) {
			if ( ! is_array( $item ) || ! isset( $item[2] ) ) {
				continue;
			}

			if ( ! in_array( $item[2], $allowed_slugs, true ) ) {
				continue;
			}

			if ( isset( $seen[ $item[2] ] ) ) {
				continue;
			}
			$seen[ $item[2] ]  = true;
			$rewritten[ $key ] = $item;
		}
		$submenu[ self::CHARTS_PARENT ] = $rewritten;
	}

	/**
	 * Add chart type filter options to the shell boot data.
	 *
	 * @param array  $localize Localized shell data.
	 * @param string $post_type Current post type.
	 * @return array
	 */
	public function localize_provider( $localize, $post_type ) {
		if ( Content_Type::$post_type !== $post_type ) {
			return $localize;
		}

		$localize['chart'] = array(
			'chartTypeTerms' => Admin::get_chart_type_terms(),
		);

		return $localize;
	}

	/**
	 * Enqueue the chart provider after the shared shell.
	 *
	 * @param string $hook_suffix Current admin hook.
	 */
	public function enqueue_provider_assets( $hook_suffix ): void {
		unset( $hook_suffix );

		if ( ! wp_script_is( 'prc-wp-admin-dataview', 'enqueued' ) ) {
			return;
		}

		$build_dir  = PRC_CHART_BUILDER_DIR . '/build/admin-dataview/';
		$asset_file = $build_dir . 'index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;
		$base  = PRC_CHART_BUILDER_DIR . '/prc-chart-builder.php';

		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			plugins_url( 'build/admin-dataview/index.js', $base ),
			array_merge( $asset['dependencies'], array( 'prc-wp-admin-dataview' ) ),
			$asset['version'],
			true
		);

		if ( file_exists( $build_dir . 'style-index.css' ) ) {
			wp_enqueue_style(
				self::SCRIPT_HANDLE,
				plugins_url( 'build/admin-dataview/style-index.css', $base ),
				array( 'wp-components' ),
				$asset['version']
			);
		}
	}

	/**
	 * Enrich rows with static preview URLs and chart summary fields.
	 *
	 * @param array   $row       Row.
	 * @param WP_Post $post      Post.
	 * @param string  $post_type Post type.
	 * @return array
	 */
	public function shape_row( $row, $post, $post_type ) {
		if ( ! $post instanceof WP_Post || Content_Type::$post_type !== $post_type ) {
			return $row;
		}

		$static_urls = Chart_Static_Images::resolve_static_image_urls( (int) $post->ID );
		$row['featuredImage'] = (string) ( $static_urls['thumbnailUrl'] ?? '' );

		$chart_type_slug  = '';
		$chart_type_label = '';
		$terms            = wp_get_post_terms( $post->ID, Content_Type::$chart_type_taxonomy, array( 'fields' => 'all' ) );
		if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
			$chart_type_slug  = (string) $terms[0]->slug;
			$chart_type_label = (string) $terms[0]->name;
		}
		if ( '' === $chart_type_label && isset( Content_Type::$known_chart_types[ $chart_type_slug ] ) ) {
			$chart_type_label = Content_Type::$known_chart_types[ $chart_type_slug ];
		}

		$row['chartType']      = $chart_type_slug;
		$row['chartTypeLabel'] = $chart_type_label;
		$row['designSlug']     = (string) get_post_meta( $post->ID, 'design_slug', true );
		$row['modified']       = get_post_modified_time( 'c', true, $post );

		return $row;
	}

	/**
	 * Map chart type filter and gallery EXISTS fallback.
	 *
	 * Shell search keeps `s` and searches title + `design_slug` on MySQL.
	 * Skip the gallery EXISTS clause during search: `chart_type` is not in
	 * current ES documents, so EXISTS matches nothing if EP integrates.
	 *
	 * @param array           $query_args Query args.
	 * @param WP_REST_Request $request    Request.
	 * @param string          $post_type  Post type.
	 * @return array
	 */
	public function query_args( $query_args, $request, $post_type ) {
		if ( ! is_array( $query_args ) || Content_Type::$post_type !== $post_type ) {
			return $query_args;
		}

		if ( ! $request instanceof WP_REST_Request ) {
			return $query_args;
		}

		$tax_query = isset( $query_args['tax_query'] ) && is_array( $query_args['tax_query'] )
			? $query_args['tax_query']
			: array();

		$chart_type = (string) $request->get_param( 'chartType' );
		$slugs      = array_values(
			array_filter(
				array_map( 'sanitize_title', explode( ',', $chart_type ) )
			)
		);
		$search     = trim( (string) $request->get_param( 'search' ) );

		if ( ! empty( $slugs ) ) {
			$tax_query[] = array(
				'taxonomy' => Content_Type::$chart_type_taxonomy,
				'field'    => 'slug',
				'terms'    => $slugs,
				'operator' => 'IN',
			);
		} elseif ( '' === $search ) {
			$has_chart_type_clause = false;
			foreach ( $tax_query as $clause ) {
				if ( is_array( $clause ) && isset( $clause['taxonomy'] ) && Content_Type::$chart_type_taxonomy === $clause['taxonomy'] ) {
					$has_chart_type_clause = true;
					break;
				}
			}
			if ( ! $has_chart_type_clause ) {
				$tax_query[] = array(
					'taxonomy' => Content_Type::$chart_type_taxonomy,
					'operator' => 'EXISTS',
				);
			}
		}

		if ( ! empty( $tax_query ) ) {
			$query_args['tax_query'] = $tax_query;
		}

		return $query_args;
	}

	/**
	 * Join design_slug meta for MySQL search fallback.
	 *
	 * @param string   $join  Join SQL.
	 * @param WP_Query $query Query.
	 * @return string
	 */
	public function search_join_design_slug( $join, $query ) {
		global $wpdb;
		if ( ! $this->is_chart_mysql_search( $query ) ) {
			return $join;
		}
		$join .= " LEFT JOIN {$wpdb->postmeta} AS prc_chart_design_slug ON ({$wpdb->posts}.ID = prc_chart_design_slug.post_id AND prc_chart_design_slug.meta_key = 'design_slug') ";
		return $join;
	}

	/**
	 * OR design_slug into MySQL search so ES-down fallback still matches slugs.
	 *
	 * @param string   $search Search SQL.
	 * @param WP_Query $query  Query.
	 * @return string
	 */
	public function search_or_design_slug( $search, $query ) {
		global $wpdb;
		if ( ! $this->is_chart_mysql_search( $query ) ) {
			return $search;
		}
		if ( ! is_string( $search ) || '' === $search ) {
			return $search;
		}

		$like      = '%' . $wpdb->esc_like( (string) $query->get( 's' ) ) . '%';
		$or        = $wpdb->prepare( ' OR (prc_chart_design_slug.meta_value LIKE %s) ', $like );
		$trimmed   = rtrim( $search );
		$rewritten = preg_replace( '/\)\)$/', $or . '))', $trimmed, 1 );
		if ( is_string( $rewritten ) && $rewritten !== $trimmed ) {
			return $rewritten;
		}

		return $trimmed . $or;
	}

	/**
	 * Deduplicate rows after the design_slug join.
	 *
	 * @param string   $distinct Distinct SQL.
	 * @param WP_Query $query    Query.
	 * @return string
	 */
	public function search_distinct( $distinct, $query ) {
		if ( ! $this->is_chart_mysql_search( $query ) ) {
			return $distinct;
		}
		return 'DISTINCT';
	}

	/**
	 * Whether this is a chart list search that will run on MySQL.
	 *
	 * @param mixed $query Query.
	 * @return bool
	 */
	private function is_chart_mysql_search( $query ): bool {
		if ( ! $query instanceof \WP_Query ) {
			return false;
		}
		if ( Content_Type::$post_type !== $query->get( 'post_type' ) ) {
			return false;
		}
		$term = $query->get( 's' );
		return is_string( $term ) && '' !== $term;
	}
}
