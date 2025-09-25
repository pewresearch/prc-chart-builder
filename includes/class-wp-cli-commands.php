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

/**
 * WP-CLI Commands for PRC Chart Builder
 *
 * @since 3.0.1
 */
class WP_CLI_Commands {

	/**
	 * Migrate block names in existing posts on blog ID 20.
	 *
	 * ## EXAMPLES
	 *
	 *     # Run the block migration
	 *     wp prc-chart-builder migrate-blocks
	 *
	 *     # Run migration with dry-run to see what would be changed
	 *     wp prc-chart-builder migrate-blocks --dry-run
	 *
	 *     # Force re-run migration (reset and run again)
	 *     wp prc-chart-builder migrate-blocks --force
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
	 *     wp prc-chart-builder migrate-single-post 12345
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
	 *     wp prc-chart-builder test-migration
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
	 *     wp prc-chart-builder reset-migration
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
	 *     wp prc-chart-builder migration-status
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
}

// Register the WP-CLI commands.
\WP_CLI::add_command( 'prc-chart-builder', 'PRC\Platform\Chart_Builder\WP_CLI_Commands' );
