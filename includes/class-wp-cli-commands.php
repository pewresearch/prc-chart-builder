<?php
/**
 * WP-CLI Commands for PRC Chart Builder
 *
 * @package    PRC_CHART_BUILDER
 * @subpackage PRC_CHART_BUILDER/includes
 * @since      3.0.1
 */

namespace PRC\Platform\Chart_Builder;

// Only load if WP-CLI is available.
if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

// Bail when running outside VIP infrastructure (wp-env, Playground): the parent class is unavailable.
if ( ! class_exists( 'WPCOM_VIP_CLI_Command' ) ) {
	return;
}

/**
 * WP-CLI Commands for PRC Chart Builder
 *
 * @since 3.0.1
 */
class WP_CLI_Commands extends \WPCOM_VIP_CLI_Command {

	/**
	 * Migrate block names in existing posts on blog ID 20.
	 *
	 * ## EXAMPLES
	 *
	 *     # Run the block migration
	 *     wp prc chart-builder migrate_blocks
	 *
	 *     # Run migration with dry-run to see what would be changed
	 *     wp prc chart-builder migrate_blocks --dry-run
	 *
	 *     # Force re-run migration (reset and run again)
	 *     wp prc chart-builder migrate_blocks --force
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 */
	public function migrate_blocks( $args, $assoc_args ) {
		$dry_run = isset( $assoc_args['dry-run'] );
		$force   = isset( $assoc_args['force'] );

		// Initialize the migration class.
		$loader = new Loader();
		$migration = new Block_Migration( $loader );

		if ( $force ) {
			\WP_CLI::log( 'Resetting migration status...' );
			delete_option( 'prc_chart_builder_block_migration_completed' );
			delete_option( 'prc_chart_builder_block_migration_status' );
			delete_option( 'prc_chart_builder_block_migration_stats' );
		}

		// Check if migration has already been completed.
		$migration_completed = get_option( 'prc_chart_builder_block_migration_completed', false );

		if ( $migration_completed && ! $force ) {
			\WP_CLI::warning( 'Migration has already been completed. Use --force to re-run.' );
			$status = $migration->get_migration_status();
			if ( ! empty( $status['stats'] ) ) {
				\WP_CLI::log( 'Previous migration stats:' );
				\WP_CLI::log( sprintf( '  Posts migrated: %d', $status['stats']['posts_migrated'] ?? 0 ) );
				\WP_CLI::log( sprintf( '  Meta entries migrated: %d', $status['stats']['meta_migrated'] ?? 0 ) );
				if ( isset( $status['stats']['timestamp'] ) ) {
					\WP_CLI::log( sprintf( '  Completed on: %s', $status['stats']['timestamp'] ) );
				}
			}
			return;
		}

		if ( $dry_run ) {
			\WP_CLI::log( 'Running dry-run to show what would be migrated...' );
			$this->dry_run_migration();
			return;
		}

		\WP_CLI::log( 'Starting block name migration...' );

		// Run the migration.
		$result = $migration->run_migration();

		if ( $result ) {
			$status = $migration->get_migration_status();
			$stats = $status['stats'] ?? array();

			\WP_CLI::success( 'Block migration completed successfully!' );
			\WP_CLI::log( sprintf( 'Posts migrated: %d', $stats['posts_migrated'] ?? 0 ) );
			\WP_CLI::log( sprintf( 'Meta entries migrated: %d', $stats['meta_migrated'] ?? 0 ) );

			if ( isset( $stats['timestamp'] ) ) {
				\WP_CLI::log( sprintf( 'Completed on: %s', $stats['timestamp'] ) );
			}
		} else {
			\WP_CLI::error( 'Migration failed. Check the error logs for details.' );
		}
	}

	/**
	 * Migrate a single post by ID.
	 *
	 * ## EXAMPLES
	 *
	 *     # Migrate a specific post
	 *     wp prc chart-builder migrate_single_post 12345
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 */
	public function migrate_single_post( $args, $assoc_args ) {
		if ( empty( $args[0] ) ) {
			\WP_CLI::error( 'Please provide a post ID to migrate.' );
			return;
		}

		$post_id = (int) $args[0];

		if ( $post_id <= 0 ) {
			\WP_CLI::error( 'Please provide a valid post ID.' );
			return;
		}

		// Initialize the migration class.
		$loader = new Loader();
		$migration = new Block_Migration( $loader );

		\WP_CLI::log( sprintf( 'Migrating post ID %d on blog 20...', $post_id ) );

		// Run single post migration.
		$result = $migration->migrate_single_post( $post_id );

		if ( ! $result['found'] ) {
			\WP_CLI::error( sprintf( 'Post ID %d: %s', $post_id, $result['error'] ) );
			return;
		}

		\WP_CLI::log( sprintf( 'Post found: "%s" (%s)', $result['post_title'], $result['post_type'] ) );

		if ( $result['migrated'] && $result['changes_made'] ) {
			\WP_CLI::success( sprintf( 'Post ID %d successfully migrated!', $post_id ) );
		} elseif ( $result['migrated'] && ! $result['changes_made'] ) {
			\WP_CLI::warning( sprintf( 'Post ID %d: %s', $post_id, $result['error'] ) );
		} else {
			\WP_CLI::error( sprintf( 'Post ID %d migration failed: %s', $post_id, $result['error'] ) );
		}
	}

	/**
	 * Test migration on sample content.
	 *
	 * ## EXAMPLES
	 *
	 *     # Test migration patterns
	 *     wp prc chart-builder test-migration
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 */
	public function test_migration( $args, $assoc_args ) {
		$loader = new Loader();
		$migration = new Block_Migration( $loader );

		// Test content with the exact pattern from the user.
		$test_content = '<!-- wp:prc-chart-builder/controller {"id":"98e55d59-8b64-497f-9c79-9f8192e0bae3","chartType":"line","tabsActive":false} -->
<!-- wp:prc-block/table {"className":"chart-builder-data-table","fontFamily":"sans-serif","fontSize":"small"} -->
<figure class="wp-block-prc-block-table chart-builder-data-table has-sans-serif-font-family has-small-font-size"><table class="has-fixed-layout"><thead><tr><th>Year</th><th></th></tr></thead><tbody><tr><td>2020</td><td>36%</td></tr><tr><td>2021</td><td>31%</td></tr><tr><td>2022</td><td>31%</td></tr><tr><td>2023</td><td>30%</td></tr><tr><td>2024</td><td>33%</td></tr></tbody></table></figure>
<!-- /wp:prc-block/table -->

<!-- wp:prc-block/chart-builder {"id":"98e55d59-8b64-497f-9c79-9f8192e0bae3-chart","chartData":[{"x":"2020","":"36"},{"x":"2021","":"31"},{"x":"2022","":"31"},{"x":"2023","":"30"},{"x":"2024","":"33"}],"chartType":"line","width":105,"height":200,"horizontalRules":false,"paddingLeft":15,"paddingBottom":30,"paddingRight":15,"sortOrder":"ascending","colorValue":"journalism-main","xMinDomain":2020,"xMaxDomain":2024,"xTickMarksActive":true,"xTickNum":2,"xTickExact":"2020,2024","xTickLabelDY":-5,"xScale":"time","xDateFormat":"\'%y","yAxisActive":false,"yMaxDomain":70,"showYMinDomainLabel":true,"yTickMarksActive":true,"yTickLabelTextAnchor":"end","yTickLabelVerticalAnchor":"middle","yTickLabelDX":-5,"plotBandsActive":true,"plotBands":[{"x":["2020-07-01T09:07:00","2022-07-24T09:07:00"],"y":[0,100],"label":"Facebook","style":{"band":{"stroke":"transparent","fill":"#fff","fillOpacity":0.1},"label":{"fontSize":12,"fill":"#2a2a2a","orientation":"horizontal","align":"top","dx":3,"dy":0}}}],"lineStrokeWidth":4,"nodeFill":"white","nodeStrokeWidth":1,"tooltipActiveOnMobile":false,"tooltipHeaderActive":false,"tooltipOffsetX":24,"tooltipOffsetY":30,"tooltipFormat":"{{row}}: {{value}}%","labelsActive":true,"showFirstLastPointsOnly":true,"labelPositionDX":3,"labelPositionDY":-8,"labelUnit":"%","labelFontSize":12,"legendTitle":"a","metaTextActive":false,"metaTitle":"Line Chart","metaSubtitle":"A subtitle for the chart","metaNote":"Note: Add note about the chart","metaSource":"Source: Add source note here","independentVariable":"Year","availableCategories":[""]} /-->
<!-- /wp:prc-chart-builder/controller -->';

		\WP_CLI::log( 'Testing migration patterns on sample content...' );

		$result = $migration->test_migration_on_content( $test_content );

		\WP_CLI::log( 'Blocks found in original content:' );
		foreach ( $result['blocks_found'] as $block ) {
			\WP_CLI::log( "  - $block" );
		}

		\WP_CLI::log( '' );
		\WP_CLI::log( 'Blocks found after migration:' );
		foreach ( $result['blocks_after'] as $block ) {
			\WP_CLI::log( "  - $block" );
		}

		\WP_CLI::log( '' );
		\WP_CLI::log( sprintf( 'Changes made: %s', $result['changes_made'] ? 'Yes' : 'No' ) );

		if ( $result['changes_made'] ) {
			\WP_CLI::log( '' );
			\WP_CLI::log( 'Updated content:' );
			\WP_CLI::log( $result['updated_content'] );
		}
	}

	/**
	 * Reset migration status to allow re-running.
	 *
	 * ## EXAMPLES
	 *
	 *     # Reset migration status
	 *     wp prc chart-builder reset-migration
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 */
	public function reset_migration( $args, $assoc_args ) {
		$loader = new Loader();
		$migration = new Block_Migration( $loader );

		\WP_CLI::log( 'Resetting migration status...' );

		$result = $migration->reset_migration_status();

		if ( $result ) {
			\WP_CLI::success( 'Migration status reset successfully. You can now re-run the migration.' );
		} else {
			\WP_CLI::error( 'Failed to reset migration status.' );
		}
	}

	/**
	 * Show migration status.
	 *
	 * ## EXAMPLES
	 *
	 *     # Show current migration status
	 *     wp prc chart-builder migration-status
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 */
	public function migration_status( $args, $assoc_args ) {
		$loader = new Loader();
		$migration = new Block_Migration( $loader );
		$status = $migration->get_migration_status();

		\WP_CLI::log( 'PRC Chart Builder Block Migration Status:' );
		\WP_CLI::log( sprintf( 'Completed: %s', $status['completed'] ? 'Yes' : 'No' ) );
		\WP_CLI::log( sprintf( 'Status: %s', $status['status'] ) );

		if ( ! empty( $status['stats'] ) ) {
			\WP_CLI::log( 'Migration Statistics:' );
			\WP_CLI::log( sprintf( '  Posts migrated: %d', $status['stats']['posts_migrated'] ?? 0 ) );
			\WP_CLI::log( sprintf( '  Meta entries migrated: %d', $status['stats']['meta_migrated'] ?? 0 ) );
			if ( isset( $status['stats']['timestamp'] ) ) {
				\WP_CLI::log( sprintf( '  Completed on: %s', $status['stats']['timestamp'] ) );
			}
		}
	}

	/**
	 * Backfill the chart_type taxonomy for all existing chart posts.
	 *
	 * Scans post_content for the chartType attribute on the inner chart block
	 * (prc-chart-builder/chart or legacy prc-block/chart-builder) and assigns the
	 * corresponding chart_type taxonomy term via direct DB writes.
	 *
	 * Modelled on Block_Migration::run_migration() — raw SQL batches with
	 * LIMIT/OFFSET, sleep between batches, and direct $wpdb inserts.
	 *
	 * Safe to run multiple times — idempotent.
	 *
	 * ## OPTIONS
	 *
	 * [--dry-run]
	 * : Preview which posts would be updated without making changes.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc chart-builder backfill_chart_types --dry-run
	 *     wp prc chart-builder backfill_chart_types
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 */
	public function backfill_chart_types( $args, $assoc_args ) {
		global $wpdb;

		$dry_run         = isset( $assoc_args['dry-run'] );
		$posts_per_page  = 50;
		$paged           = 1;
		$updated         = 0;
		$skipped         = 0;
		$total_processed = 0;
		$taxonomy        = Content_Type::$chart_type_taxonomy;

		if ( $dry_run ) {
			\WP_CLI::log( 'Dry-run mode — no changes will be made.' );
		}

		// Build a slug → term_taxonomy_id lookup so we never call wp_set_object_terms().
		$term_map = $this->build_term_map( $taxonomy );

		\WP_CLI::log( 'Backfilling chart_type taxonomy for chart posts...' );

		do {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$posts = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT ID, post_title, post_content FROM {$wpdb->posts}
					WHERE post_type = %s
					AND post_status IN ('publish','draft','private')
					AND (post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s)
					ORDER BY ID
					LIMIT %d OFFSET %d",
					Content_Type::$post_type,
					'%prc-chart-builder/controller %',
					'%prc-chart-builder/chart %',
					'%prc-block/chart-builder %',
					$posts_per_page,
					( $paged - 1 ) * $posts_per_page
				)
			);

			if ( empty( $posts ) ) {
				break;
			}

			foreach ( $posts as $post ) {
				$chart_type = Content_Type::extract_chart_type_from_content( $post->post_content );

				if ( ! $chart_type ) {
					++$skipped;
					continue;
				}

				// Resolve the term_taxonomy_id, creating the term if needed.
				if ( ! isset( $term_map[ $chart_type ] ) ) {
					$term_map = $this->ensure_term( $chart_type, $taxonomy, $term_map );
				}
				$tt_id = $term_map[ $chart_type ] ?? null;
				if ( ! $tt_id ) {
					\WP_CLI::warning( sprintf( 'Could not resolve term for "%s" on post %d.', $chart_type, $post->ID ) );
					++$skipped;
					continue;
				}

				// Check if the relationship already exists.
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$exists = $wpdb->get_var(
					$wpdb->prepare(
						"SELECT COUNT(*) FROM {$wpdb->term_relationships}
						WHERE object_id = %d AND term_taxonomy_id = %d",
						$post->ID,
						$tt_id
					)
				);

				if ( $exists ) {
					\WP_CLI::log( sprintf( '  [ok]   %d "%s" — already "%s"', $post->ID, $post->post_title, $chart_type ) );
					++$skipped;
				} elseif ( $dry_run ) {
					\WP_CLI::log( sprintf( '  [would set] %d "%s" → "%s"', $post->ID, $post->post_title, $chart_type ) );
					++$updated;
				} else {
					// Direct insert — avoids wp_set_object_terms() overhead and any
					// hooks/filters that cause fatals in the VIP dev environment.
					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
					$wpdb->insert(
						$wpdb->term_relationships,
						array(
							'object_id'        => $post->ID,
							'term_taxonomy_id' => $tt_id,
							'term_order'       => 0,
						),
						array( '%d', '%d', '%d' )
					);
					\WP_CLI::log( sprintf( '  [set]  %d "%s" → "%s"', $post->ID, $post->post_title, $chart_type ) );
					++$updated;
					clean_post_cache( $post->ID );
				}

				++$total_processed;
			}

			$paged++;

			// Pause between batches for cache revalidation.
			if ( count( $posts ) === $posts_per_page ) {
				sleep( 3 );
			}

			// Free memory.
			if ( method_exists( $this, 'vip_inmemory_cleanup' ) ) {
				$this->vip_inmemory_cleanup();
			}

		} while ( count( $posts ) === $posts_per_page );

		// Update term counts now that we inserted relationships directly.
		if ( ! $dry_run && ! empty( $term_map ) ) {
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->query(
				"UPDATE {$wpdb->term_taxonomy} tt
				SET count = (
					SELECT COUNT(*) FROM {$wpdb->term_relationships} tr
					WHERE tr.term_taxonomy_id = tt.term_taxonomy_id
				)
				WHERE tt.taxonomy = '{$taxonomy}'"
			);
		}

		\WP_CLI::log( '' );
		\WP_CLI::log( sprintf( 'Processed: %d | Updated: %d | Skipped: %d', $total_processed, $updated, $skipped ) );

		if ( $dry_run ) {
			\WP_CLI::log( 'Dry run complete. Run without --dry-run to apply.' );
		} else {
			\WP_CLI::success( 'chart_type backfill complete.' );
		}
	}

	/**
	 * Build a slug → term_taxonomy_id lookup for all existing terms in a taxonomy.
	 *
	 * @param string $taxonomy Taxonomy name.
	 * @return array<string, int> Map of slug to term_taxonomy_id.
	 */
	private function build_term_map( $taxonomy ) {
		global $wpdb;
		$map = array();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$rows = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT t.slug, tt.term_taxonomy_id
				FROM {$wpdb->terms} t
				INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
				WHERE tt.taxonomy = %s",
				$taxonomy
			)
		);
		foreach ( $rows as $row ) {
			$map[ $row->slug ] = (int) $row->term_taxonomy_id;
		}
		return $map;
	}

	/**
	 * Ensure a term exists for a given chart type slug and return the updated term map.
	 *
	 * @param string $slug     The chart type slug.
	 * @param string $taxonomy The taxonomy name.
	 * @param array  $term_map Existing slug → term_taxonomy_id map.
	 * @return array Updated term map.
	 */
	private function ensure_term( $slug, $taxonomy, $term_map ) {
		$known = Content_Type::$known_chart_types;
		$label = $known[ $slug ] ?? ucfirst( str_replace( '-', ' ', $slug ) );
		wp_insert_term( $label, $taxonomy, array( 'slug' => $slug ) );
		return $this->build_term_map( $taxonomy );
	}

	/**
	 * Backfill server-generated PNGs for existing published chart posts.
	 *
	 * The async Action Scheduler pipeline handles all future publishes automatically.
	 * This command is for one-time (or occasional) backfilling of charts that were
	 * published before the PNG export pipeline existed.
	 *
	 * Skips charts that already have an up-to-date PNG (hash match) by default.
	 * Always dry-runs unless --force is passed.
	 *
	 * ## OPTIONS
	 *
	 * [--post-id=<id>]
	 * : Target a single chart post by ID instead of processing all charts.
	 *
	 * [--dry-run]
	 * : Preview which charts would be processed without making any API calls
	 *   or DB writes.
	 *
	 * [--force-regenerate]
	 * : Re-generate PNGs even for charts that already have a current PNG.
	 *
 * [--base-url=<url>]
 * : Override the site base URL used to build export URLs. Useful when the
 *   site is not publicly reachable (e.g. local dev via ngrok) or when
 *   targeting a password-protected environment like alpha. HTTP basic auth
 *   credentials can be embedded directly in the URL.
 *
 * [--export-url=<url>]
 * : Bypass permalink construction entirely and pass this exact URL to
 *   ScreenshotOne. Useful for local testing against a specific remote URL
 *   (e.g. an alpha chart export page) without needing the post to exist
 *   on the local environment. Requires --post-id so the resulting PNG has
 *   a local post to attach to.
	 *
	 * ## EXAMPLES
	 *
	 *     # Preview which charts would be processed (no API calls)
	 *     wp prc chart-builder backfill_pngs --dry-run
	 *
	 *     # Backfill a single chart
	 *     wp prc chart-builder backfill_pngs --post-id=123
	 *
	 *     # Backfill all charts missing a PNG
	 *     wp prc chart-builder backfill_pngs
	 *
	 *     # Re-generate all PNGs regardless of current state
	 *     wp prc chart-builder backfill_pngs --force-regenerate
	 *
	 *     # Test against a specific remote export URL from local
	 *     wp prc chart-builder backfill_pngs --post-id=123 --export-url={{remote-url}}/chart/some-slug/export/
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 */
	public function backfill_pngs( $args, $assoc_args ) {
		global $wpdb;

		$dry_run          = isset( $assoc_args['dry-run'] );
		$force_regenerate = isset( $assoc_args['force-regenerate'] );
		$single_id        = isset( $assoc_args['post-id'] ) ? (int) $assoc_args['post-id'] : 0;
		$base_url         = isset( $assoc_args['base-url'] ) ? rtrim( $assoc_args['base-url'], '/' ) : '';
		$export_url       = isset( $assoc_args['export-url'] ) ? $assoc_args['export-url'] : '';

		if ( $export_url && ! $single_id ) {
			\WP_CLI::error( '--export-url requires --post-id so the PNG has a local post to attach to.' );
			return;
		}

		if ( $dry_run ) {
			\WP_CLI::log( 'Dry-run mode — no API calls or DB writes will be made.' );
		}
		if ( $base_url ) {
			\WP_CLI::log( sprintf( 'Base URL override: %s', $base_url ) );
		}
		if ( $export_url ) {
			\WP_CLI::log( sprintf( 'Export URL override: %s', $export_url ) );
		}

		$service = new Screenshot_Service();
		if ( ! $dry_run && ! $service->is_configured() ) {
			\WP_CLI::error( 'ScreenshotOne credentials are not configured. Set PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY and PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY constants.' );
			return;
		}

		$loader     = new Loader();
		$png_export = new PNG_Export( $loader, $service );

		$posts_per_page  = 50;
		$paged           = 1;
		$total_processed = 0;
		$generated       = 0;
		$skipped         = 0;
		$failed          = 0;

		do {
			if ( $single_id ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$posts = $wpdb->get_results(
					$wpdb->prepare(
						"SELECT ID, post_title, post_content FROM {$wpdb->posts}
						WHERE ID = %d AND post_type = %s AND post_status = 'publish'",
						$single_id,
						Content_Type::$post_type
					)
				);
			} else {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$posts = $wpdb->get_results(
					$wpdb->prepare(
						"SELECT ID, post_title, post_content FROM {$wpdb->posts}
						WHERE post_type = %s AND post_status = 'publish'
						ORDER BY ID
						LIMIT %d OFFSET %d",
						Content_Type::$post_type,
						$posts_per_page,
						( $paged - 1 ) * $posts_per_page
					)
				);
			}

			if ( empty( $posts ) ) {
				break;
			}

			foreach ( $posts as $post ) {
				++$total_processed;

				$blocks      = parse_blocks( $post->post_content );
				$chart_block = $this->find_chart_block( $blocks );

				if ( ! $chart_block ) {
					\WP_CLI::log( sprintf( '  [skip]  %d "%s" — no chart block found', $post->ID, $post->post_title ) );
					++$skipped;
					continue;
				}

				// Skip if PNG is already current, unless --force-regenerate is set.
				if ( ! $force_regenerate ) {
					$new_hash    = $png_export->compute_attributes_hash( $chart_block['attrs'] ?? array() );
					$stored_hash = get_post_meta( $post->ID, '_chart_attributes_hash', true );
					if ( $new_hash === $stored_hash ) {
						\WP_CLI::log( sprintf( '  [skip]  %d "%s" — PNG already up to date', $post->ID, $post->post_title ) );
						++$skipped;
						continue;
					}
				}

			$permalink        = get_permalink( $post->ID );
			if ( $base_url ) {
				$site_url  = untrailingslashit( get_site_url() );
				$permalink = $base_url . substr( $permalink, strlen( $site_url ) );
			}
			$display_export_url = ! empty( $export_url ) ? $export_url : trailingslashit( $permalink ) . 'export/';

			$layout = $chart_block['attrs']['layout'] ?? array();
			$width  = isset( $layout['width'] )  ? (int) $layout['width']  : Screenshot_Service::DEFAULT_CHART_WIDTH;
			$height = isset( $layout['height'] ) ? (int) $layout['height'] : Screenshot_Service::DEFAULT_CHART_HEIGHT;

			if ( $dry_run ) {
				\WP_CLI::log( sprintf(
					'  [would] %d "%s" — %s (%dpx × %dpx)',
					$post->ID,
					$post->post_title,
					$display_export_url,
					$width,
					$height
				) );
					++$generated;
					continue;
				}

			try {
				$png_export->generate_png( $post->ID, $base_url, $export_url );
				$png_url = wp_get_attachment_url( get_post_thumbnail_id( $post->ID ) );
					\WP_CLI::log( sprintf( '  [done]  %d "%s" — %s', $post->ID, $post->post_title, $png_url ) );
					++$generated;
				} catch ( \Exception $e ) {
					\WP_CLI::warning( sprintf( '  [fail]  %d "%s" — %s', $post->ID, $post->post_title, $e->getMessage() ) );
					++$failed;
				}
			}

			$paged++;

			if ( ! $single_id && count( $posts ) === $posts_per_page ) {
				\WP_CLI::log( sprintf( '  ... %d processed so far, pausing 3s ...', $total_processed ) );
				sleep( 3 );
			}

			if ( method_exists( $this, 'vip_inmemory_cleanup' ) ) {
				$this->vip_inmemory_cleanup();
			}

		} while ( ! $single_id && count( $posts ) === $posts_per_page );

		\WP_CLI::log( '' );
		\WP_CLI::log( sprintf(
			'Processed: %d | %s: %d | Skipped: %d | Failed: %d',
			$total_processed,
			$dry_run ? 'Would generate' : 'Generated',
			$generated,
			$skipped,
			$failed
		) );

		if ( $dry_run ) {
			\WP_CLI::log( 'Dry run complete. Pass --force to execute.' );
		} else {
			\WP_CLI::success( 'PNG backfill complete.' );
		}
	}

	/**
	 * Find the first prc-chart-builder/chart block in a parsed blocks array,
	 * searching one level of inner blocks (e.g. inside a controller block).
	 *
	 * @param array $blocks Parsed blocks from parse_blocks().
	 * @return array|null Block array or null.
	 */
	private function find_chart_block( array $blocks ): ?array {
		foreach ( $blocks as $block ) {
			if ( 'prc-chart-builder/chart' === ( $block['blockName'] ?? '' ) ) {
				return $block;
			}
			foreach ( $block['innerBlocks'] ?? array() as $inner ) {
				if ( 'prc-chart-builder/chart' === ( $inner['blockName'] ?? '' ) ) {
					return $inner;
				}
			}
		}
		return null;
	}

	/**
	 * Perform a dry run of the migration to show what would be changed.
	 *
	 * @since 3.0.1
	 */
	private function dry_run_migration() {
		global $wpdb;

		// Switch to blog ID 20 for the dry run.
		$switched = false;
		if ( is_multisite() ) {
			$switched = switch_to_blog( 20 );
		}

		$block_mappings = array(
			'prc-block/chart'                    => 'prc-chart-builder/synced-chart',
			'prc-block/chart-builder-controller' => 'prc-chart-builder/controller',
			'prc-block/chart-builder'            => 'prc-chart-builder/chart',
		);

		// Find posts that would be affected.
		$posts = $wpdb->get_results(
			$wpdb->prepare(
				"SELECT ID, post_title, post_type, post_content FROM {$wpdb->posts}
				WHERE post_status = 'publish'
				AND (post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s)
				ORDER BY ID",
				'%prc-block/chart%',
				'%prc-block/chart-builder-controller%',
				'%prc-block/chart-builder%'
			)
		);

		if ( empty( $posts ) ) {
			\WP_CLI::log( 'No posts found that need migration.' );
			return;
		}

		\WP_CLI::log( sprintf( 'Found %d posts that would be migrated:', count( $posts ) ) );

		foreach ( $posts as $post ) {
			$changes = array();

			foreach ( $block_mappings as $old_name => $new_name ) {
				$count = substr_count( $post->post_content, $old_name );
				if ( $count > 0 ) {
					$changes[] = sprintf( '%s → %s (%d occurrences)', $old_name, $new_name, $count );
				}
			}

			if ( ! empty( $changes ) ) {
				\WP_CLI::log(
					sprintf(
						'  Post ID %d: "%s" (%s) - %s',
						$post->ID,
						$post->post_title,
						$post->post_type,
						implode( ', ', $changes )
					)
				);
			}
		}

		// Restore original blog if we switched.
		if ( $switched ) {
			restore_current_blog();
		}
	}

	/**
	 * Seed the frozen legacy PRC chart theme when the site has no active theme.
	 *
	 * Idempotent: skips when prc_chart_builder_theme is already non-empty
	 * (including manual smoke-test values). Delete the option first to re-seed.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc chart-builder seed-theme
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 * @subcommand seed-theme
	 */
	public function seed_theme( $args, $assoc_args ) {
		unset( $args, $assoc_args );

		$result = Theme_Seeder::seed_if_empty();

		if ( is_wp_error( $result ) ) {
			\WP_CLI::error( $result->get_error_message() );
		}

		if ( false === $result ) {
			\WP_CLI::log( 'Chart theme already configured; seed skipped (idempotent no-op).' );
			return;
		}

		\WP_CLI::success( 'Seeded chart theme from chart-theme.json.' );
	}

	/**
	 * Restore chart theme data when palettes are missing or corrupt.
	 *
	 * - Empty/deleted option: seeds the full fallback theme (config + palettes) via seed_if_empty().
	 * - Partial option (config/colorNames present, colors missing): merges palette swatches only.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc chart-builder repair-theme
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 * @subcommand repair-theme
	 */
	public function repair_theme( $args, $assoc_args ) {
		unset( $args, $assoc_args );

		$raw          = get_option( Settings::OPTION_KEY, false );
		$before       = is_array( $raw ) ? $raw : array();
		$before_count = Settings::count_palette_colors( $before );

		if ( $before_count > 0 ) {
			\WP_CLI::log(
				sprintf(
					'Palette colors already valid (%d palettes).',
					$before_count
				)
			);
			return;
		}

		if ( false === $raw || array() === $before ) {
			$result = Theme_Seeder::seed_if_empty();
			if ( is_wp_error( $result ) ) {
				\WP_CLI::error( $result->get_error_message() );
			}

			$after_count = Settings::count_palette_colors( Settings::get_active_theme() );

			if ( 0 === $after_count ) {
				\WP_CLI::error(
					'Could not restore the chart theme. Confirm chart-theme.json exists on this environment.'
				);
			}

			\WP_CLI::success(
				sprintf(
					'Seeded chart theme from chart-theme.json (%d palette catalogs).',
					$after_count
				)
			);
			return;
		}

		// Partial theme (config and/or colorNames) with missing/corrupt palette swatches.
		Settings::get_active_theme();

		$after_count = Settings::count_palette_colors( Settings::get_active_theme() );

		if ( 0 === $after_count ) {
			\WP_CLI::error(
				'Could not repair palette colors. Confirm chart-theme.json exists on this environment.'
			);
		}

		\WP_CLI::success(
			sprintf(
				'Repaired palette colors (%d palette catalogs).',
				$after_count
			)
		);
	}

	/**
	 * List distinct chart block fontFamily values and the preset token map.
	 *
	 * ## OPTIONS
	 *
	 * [--post-type=<type>]
	 * : Post type to scan (default: chart).
	 *
	 * [--limit=<number>]
	 * : Maximum number of posts to scan (default: all).
	 *
	 * [--batch-size=<number>]
	 * : Posts to process per batch (default: 100).
	 *
	 * [--offset=<number>]
	 * : Skip this many matching posts before scanning.
	 *
	 * [--sleep=<seconds>]
	 * : Pause between full batches (default: 1).
	 *
	 * [--post-id=<id>]
	 * : Audit only this single post ID (ignores post-type/limit/offset).
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc chart-builder font-tokens-audit
	 *     wp prc chart-builder font-tokens-audit --post-type=post --limit=100
	 *     wp prc chart-builder font-tokens-audit --batch-size=50 --offset=200
	 *     wp prc chart-builder font-tokens-audit --post-id=12345
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 * @subcommand font-tokens-audit
	 */
	public function font_tokens_audit( $args, $assoc_args ) {
		unset( $args );

		Theme_Font_Tokens_Migration::run_cli_audit(
			array_merge(
				array( 'dry_run' => false ),
				Theme_Font_Tokens_Migration::parse_cli_batch_args( $assoc_args )
			)
		);
	}

	/**
	 * Replace known literal font stacks with preset tokens in chart block attributes.
	 *
	 * ## OPTIONS
	 *
	 * [--dry-run]
	 * : Report changes without writing to the database.
	 *
	 * [--post-type=<type>]
	 * : Post type to scan (default: chart).
	 *
	 * [--limit=<number>]
	 * : Maximum number of posts to update (default: all).
	 *
	 * [--batch-size=<number>]
	 * : Posts to process per batch (default: 100).
	 *
	 * [--offset=<number>]
	 * : Skip this many matching posts before migrating.
	 *
	 * [--sleep=<seconds>]
	 * : Pause between full batches (default: 1).
	 *
	 * [--post-id=<id>]
	 * : Migrate only this single post ID (ignores post-type/limit/offset). Useful for diagnosing one post.
	 *
	 * [--skip-probe]
	 * : Skip the pre-migration write-path safety probe (not recommended).
	 *
	 * [--probe-sample=<number>]
	 * : Posts to probe before migrating (default: 25).
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc chart-builder font-tokens-migrate --dry-run
	 *     wp prc chart-builder font-tokens-migrate
	 *     wp prc chart-builder font-tokens-migrate --batch-size=50 --sleep=2
	 *     wp prc chart-builder font-tokens-migrate --post-id=12345 --dry-run
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 * @subcommand font-tokens-migrate
	 */
	public function font_tokens_migrate( $args, $assoc_args ) {
		unset( $args );

		Theme_Font_Tokens_Migration::run_cli_migrate(
			array_merge(
				array(
					'dry_run'    => isset( $assoc_args['dry-run'] ),
					'skip_probe' => isset( $assoc_args['skip-probe'] ),
					'sample'     => isset( $assoc_args['probe-sample'] ) ? (int) $assoc_args['probe-sample'] : 25,
				),
				Theme_Font_Tokens_Migration::parse_cli_batch_args( $assoc_args )
			)
		);
	}

	/**
	 * Assign research-teams terms from chart design-slug prefixes.
	 *
	 * Defaults to dry-run mode. Pass --dry-run=false to write.
	 * Charts that already have any research-teams term are skipped unless --force
	 * is passed. Empty design slugs and unmatched prefixes are skipped.
	 *
	 * On multisite, pass --url= for the target site
	 * (https://prc-platform.vipdev.lndo.site/pewresearch-org locally).
	 *
	 * ## OPTIONS
	 *
	 * [--dry-run=<bool>]
	 * : Run without making changes. Default: true.
	 *
	 * [--batch-size=<number>]
	 * : Charts per batch. Default: 100. Capped at 100.
	 *
	 * [--start-id=<id>]
	 * : Resume after this post ID (exclusive). Default: 0.
	 *
	 * [--force]
	 * : Replace an existing research-teams assignment when it differs.
	 *
	 * ## EXAMPLES
	 *
	 *     wp prc chart-builder assign_research_teams
	 *     wp prc chart-builder assign_research_teams --dry-run=false
	 *     wp prc chart-builder assign_research_teams --dry-run=false --start-id=12345
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 * @when after_wp_load
	 */
	public function assign_research_teams( $args, $assoc_args ) {
		unset( $args );

		$dry_run    = $this->parse_dry_run( $assoc_args );
		$batch_size = max( 1, min( (int) ( $assoc_args['batch-size'] ?? 100 ), 100 ) );
		$start_id   = (int) ( $assoc_args['start-id'] ?? 0 );
		$force      = isset( $assoc_args['force'] );
		$taxonomy   = 'research-teams';

		$processed           = 0;
		$assigned            = 0;
		$skipped_no_slug     = 0;
		$skipped_no_match    = 0;
		$skipped_already_set = 0;
		$skipped_other_team  = 0;

		\WP_CLI::line( $dry_run ? 'Running in dry-run mode. Pass --dry-run=false to write.' : "We're doing it live!" );

		$this->start_bulk_operation();

		do {
			$cursor        = $start_id;
			$cursor_filter = static function ( $where ) use ( $cursor ) {
				global $wpdb;
				$where .= $wpdb->prepare( ' AND ' . $wpdb->posts . '.ID > %d', $cursor );
				return $where;
			};

			add_filter( 'posts_where', $cursor_filter );
			$posts = get_posts(
				array(
					'post_type'        => Content_Type::$post_type,
					'post_status'      => array( 'publish', 'draft', 'private', 'pending' ),
					'posts_per_page'   => $batch_size,
					'orderby'          => 'ID',
					'order'            => 'ASC',
					'no_found_rows'    => true,
					// Default true would drop the posts_where ID cursor.
					'suppress_filters' => false,
				)
			);
			remove_filter( 'posts_where', $cursor_filter );

			foreach ( $posts as $post ) {
				$id       = (int) $post->ID;
				$start_id = $id;
				++$processed;

				$slug = (string) get_post_meta( $id, 'design_slug', true );
				if ( '' === trim( $slug ) ) {
					++$skipped_no_slug;
					\WP_CLI::log( sprintf( '  [skip] %d — empty design slug', $id ) );
					continue;
				}

				$team = $this->team_slug_for_design_slug( $slug );
				if ( null === $team ) {
					++$skipped_no_match;
					\WP_CLI::log( sprintf( '  [skip] %d — unmatched prefix (%s)', $id, $slug ) );
					continue;
				}

				$terms = wp_get_object_terms( $id, $taxonomy, array( 'fields' => 'slugs' ) );
				if ( is_wp_error( $terms ) ) {
					\WP_CLI::warning( sprintf( '  [warn] %d — could not read research-teams: %s', $id, $terms->get_error_message() ) );
					continue;
				}

				if ( in_array( $team, $terms, true ) ) {
					++$skipped_already_set;
					\WP_CLI::log( sprintf( '  [skip] %d — already %s', $id, $team ) );
					continue;
				}

				if ( ! empty( $terms ) && ! $force ) {
					++$skipped_other_team;
					\WP_CLI::log( sprintf( '  [skip] %d — other team (%s), use --force to replace', $id, implode( ',', $terms ) ) );
					continue;
				}

				if ( $dry_run ) {
					++$assigned;
					\WP_CLI::log( sprintf( '  [would assign] %d — %s → %s', $id, $slug, $team ) );
					continue;
				}

				if ( ! get_term_by( 'slug', $team, $taxonomy ) ) {
					$label    = 'short-reads' === $team ? 'Short Reads' : $team;
					$inserted = wp_insert_term( $label, $taxonomy, array( 'slug' => $team ) );
					if ( is_wp_error( $inserted ) && 'term_exists' !== $inserted->get_error_code() ) {
						\WP_CLI::warning( sprintf( '  [warn] %d — could not create term %s: %s', $id, $team, $inserted->get_error_message() ) );
						continue;
					}
				}

				$result = wp_set_object_terms( $id, $team, $taxonomy, false );
				if ( is_wp_error( $result ) ) {
					\WP_CLI::warning( sprintf( '  [warn] %d — failed to assign %s: %s', $id, $team, $result->get_error_message() ) );
					continue;
				}

				++$assigned;
				\WP_CLI::log( sprintf( '  [assign] %d — %s → %s', $id, $slug, $team ) );
			}

			\WP_CLI::line( sprintf( 'Batch done. Last ID: %d | Processed so far: %d', $start_id, $processed ) );

			sleep( 2 );
			$this->vip_inmemory_cleanup();

		} while ( count( $posts ) === $batch_size );

		$this->end_bulk_operation();

		\WP_CLI::line( '' );
		\WP_CLI::line(
			sprintf(
				'Processed: %d | %s: %d | skipped_no_slug: %d | skipped_no_match: %d | skipped_already_set: %d | skipped_other_team: %d',
				$processed,
				$dry_run ? 'would-assign' : 'assigned',
				$assigned,
				$skipped_no_slug,
				$skipped_no_match,
				$skipped_already_set,
				$skipped_other_team
			)
		);

		if ( $dry_run ) {
			\WP_CLI::success( 'Dry run complete. Pass --dry-run=false to write.' );
		} else {
			\WP_CLI::success( 'Research team assignment complete.' );
		}
	}

	/**
	 * Parse --dry-run from $assoc_args safely.
	 *
	 * WP-CLI passes flag values as strings. Casting (bool) 'false' === true,
	 * so we must compare the string value explicitly.
	 *
	 * @param array $assoc_args Associative arguments.
	 * @return bool
	 */
	private function parse_dry_run( $assoc_args ) {
		if ( ! isset( $assoc_args['dry-run'] ) ) {
			return true;
		}
		return 'false' !== $assoc_args['dry-run'];
	}

	/**
	 * Design-slug prefixes mapped to research-teams term slugs.
	 *
	 * PJ maps to the existing Journalism term (News and Info).
	 * PL maps to Data Labs. SR and FT map to Short Reads.
	 *
	 * @return array<string, string>
	 */
	private function design_slug_prefixes(): array {
		return array(
			'PP' => 'politics',
			'PF' => 'religion',
			'SR' => 'short-reads',
			'FT' => 'short-reads',
			'ST' => 'social-trends',
			'MB' => 'decoded',
			'RE' => 'race-and-ethnicity',
			'PG' => 'global',
			'PM' => 'methods',
			'PL' => 'data-labs',
			'PI' => 'internet',
			'PJ' => 'journalism',
		);
	}

	/**
	 * Resolve a research-teams term slug from a chart design slug.
	 *
	 * Longest prefix wins. Matching is case-insensitive.
	 *
	 * @param string $design_slug Chart design slug (e.g. PP_26.06.10_typology).
	 * @return string|null Term slug, or null when the design slug is empty or unmatched.
	 */
	private function team_slug_for_design_slug( string $design_slug ): ?string {
		$design_slug = trim( $design_slug );
		if ( '' === $design_slug ) {
			return null;
		}

		$prefixes = $this->design_slug_prefixes();
		uksort(
			$prefixes,
			static function ( $left, $right ) {
				return strlen( (string) $right ) <=> strlen( (string) $left );
			}
		);

		$haystack = strtolower( $design_slug );
		foreach ( $prefixes as $prefix => $team_slug ) {
			if ( str_starts_with( $haystack, strtolower( (string) $prefix ) ) ) {
				return $team_slug;
			}
		}

		return null;
	}
}

// Register the WP-CLI commands.
\WP_CLI::add_command( 'prc chart-builder', 'PRC\Platform\Chart_Builder\WP_CLI_Commands' );
