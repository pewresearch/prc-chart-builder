<?php
/**
 * Block Migration Class
 *
 * Handles migration of block names in existing posts when block names change.
 *
 * @package    PRC_CHART_BUILDER
 * @subpackage PRC_CHART_BUILDER/includes
 * @since      3.0.1
 */

namespace PRC\Platform\Chart_Builder;

use WPCOM_VIP_CLI_Command;
use WP_CLI;

/**
 * Block Migration Class
 *
 * @since 3.0.1
 */
class Block_Migration {

	/**
	 * The loader that's responsible for maintaining and registering all hooks that power
	 * the plugin.
	 *
	 * @since    3.0.1
	 * @access   protected
	 * @var      Loader    $loader    Maintains and registers all hooks for the plugin.
	 */
	protected $loader;

	/**
	 * Block name mappings for migration.
	 *
	 * @since 3.0.1
	 * @var array
	 */
	private $block_mappings = array(
		'prc-block/chart'                    => 'prc-chart-builder/synced-chart',
		'prc-block/chart-builder-controller' => 'prc-chart-builder/controller',
		'prc-block/chart-builder'            => 'prc-chart-builder/chart',
	);

	/**
	 * Initialize the class and set its properties.
	 *
	 * @since 3.0.1
	 * @param Loader $loader The loader that's responsible for maintaining and registering all hooks.
	 */
	public function __construct( $loader ) {
		$this->loader = $loader;
		$this->define_admin_hooks();
	}

	/**
	 * Register all of the admin-related hooks of the plugin.
	 *
	 * @since 3.0.1
	 * @access private
	 */
	private function define_admin_hooks() {
		// Only run in admin area.
		if ( ! is_admin() ) {
			return;
		}

		// Hook into admin_init to check if migration is needed.
		$this->loader->add_action( 'admin_init', $this, 'maybe_run_migration' );

		// Add admin notice for migration status.
		$this->loader->add_action( 'admin_notices', $this, 'migration_admin_notice' );
	}

	/**
	 * Check if migration is needed and run it if necessary.
	 *
	 * @since 3.0.1
	 */
	public function maybe_run_migration() {
		// Check if migration has already been completed.
		$migration_completed = get_option( 'prc_chart_builder_block_migration_completed', false );

		if ( $migration_completed ) {
			return;
		}

		// Check if we're in the right context to run migration.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Run the migration.
		$this->run_migration();
	}

	/**
	 * Run the block name migration with VIP-optimized batching.
	 *
	 * @since 3.0.1
	 * @param array $args Optional arguments for migration control.
	 * @return bool True if migration was successful, false otherwise.
	 */
	public function run_migration( $args = array() ) {
		global $wpdb;

		// Default arguments.
		$defaults = array(
			'posts_per_page' => 100,
			'dry_run'        => false,
			'offset'         => 0,
			'limit'          => 0, // 0 means no limit.
		);
		$args = wp_parse_args( $args, $defaults );

		$migrated_posts = 0;
		$migrated_meta  = 0;
		$total_processed = 0;
		$batch_count = 0;

		// Switch to blog ID 20 for the migration.
		$switched = false;
		if ( is_multisite() ) {
			$switched = switch_to_blog( 20 );
		}

		// Check if we're resuming from a previous run.
		$resume_offset = get_option( 'prc_chart_builder_migration_offset', 0 );
		if ( $resume_offset > 0 && $args['offset'] === 0 ) {
			$paged = floor( $resume_offset / $args['posts_per_page'] ) + 1;
			error_log( sprintf( 'PRC Chart Builder: Resuming migration from page %d (offset %d)', $paged, $resume_offset ) );
		} else {
			$paged = 1;
		}

		// Start bulk operations for performance optimization (only in CLI context).
		if ( defined( 'WP_CLI' ) && WP_CLI && method_exists( $this, 'start_bulk_operation' ) ) {
			$this->start_bulk_operation();
		}

		do {
			$batch_count++;

			// Get posts in batches to avoid memory exhaustion.
			$posts = $wpdb->get_results(
				$wpdb->prepare(
					"SELECT ID, post_content, post_type FROM {$wpdb->posts}
					WHERE post_status = 'publish'
					AND (post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s)
					ORDER BY ID
					LIMIT %d OFFSET %d",
					'%prc-block/chart%',
					'%prc-block/chart-builder-controller%',
					'%prc-block/chart-builder%',
					$args['posts_per_page'],
					($paged - 1) * $args['posts_per_page']
				)
			);

			if ( empty( $posts ) ) {
				// No more posts to process.
				break;
			}

			$batch_migrated = 0;

			foreach ( $posts as $post ) {
				$original_content = $post->post_content;
				$updated_content  = $this->update_block_names_in_content( $original_content );

				if ( $original_content !== $updated_content ) {
					if ( ! $args['dry_run'] ) {
						// Update the post content.
						$result = $wpdb->update(
							$wpdb->posts,
							array( 'post_content' => $updated_content ),
							array( 'ID' => $post->ID ),
							array( '%s' ),
							array( '%d' )
						);

						if ( false !== $result ) {
							$batch_migrated++;
							$migrated_posts++;

							// Clear any caches for this post.
							clean_post_cache( $post->ID );

							// Log the migration.
							error_log(
								sprintf(
									'PRC Chart Builder: Migrated block names in post ID %d (%s)',
									$post->ID,
									$post->post_type
								)
							);
						}
					} else {
						// Dry run - just count what would be migrated.
						$batch_migrated++;
						$migrated_posts++;
					}
				}

				$total_processed++;
			}

			// Update progress tracking.
			$paged++;
			update_option( 'prc_chart_builder_migration_offset', ($paged - 1) * $args['posts_per_page'] );

			// Log batch progress.
			error_log(
				sprintf(
					'PRC Chart Builder: Batch %d completed. %d posts processed, %d migrated. Total processed: %d',
					$batch_count,
					count( $posts ),
					$batch_migrated,
					$total_processed
				)
			);

			// Pause between batches for cache re-validation and data replication.
			if ( count( $posts ) === $args['posts_per_page'] ) {
				error_log( 'PRC Chart Builder: Pausing between batches...' );
				sleep( 3 );
			}

			// Free up memory after each batch (only in CLI context).
			if ( defined( 'WP_CLI' ) && WP_CLI && method_exists( $this, 'vip_inmemory_cleanup' ) ) {
				$this->vip_inmemory_cleanup();
			}

			// Check if we've hit our limit.
			if ( $args['limit'] > 0 && $total_processed >= $args['limit'] ) {
				error_log( sprintf( 'PRC Chart Builder: Reached processing limit of %d posts', $args['limit'] ) );
				break;
			}

		} while ( count( $posts ) === $args['posts_per_page'] );

		// End bulk operations (only in CLI context).
		if ( defined( 'WP_CLI' ) && WP_CLI && method_exists( $this, 'end_bulk_operation' ) ) {
			$this->end_bulk_operation();
		}

		// Also check post meta for any block references (in batches).
		if ( ! $args['dry_run'] ) {
			$meta_results = $this->migrate_post_meta_blocks_batched();
		} else {
			$meta_results = 0; // Skip meta migration in dry run for now.
		}

		// Mark migration as completed if we processed all posts.
		if ( count( $posts ) < $args['posts_per_page'] ) {
			update_option( 'prc_chart_builder_block_migration_completed', true );
			update_option( 'prc_chart_builder_block_migration_status', 'completed' );
			delete_option( 'prc_chart_builder_migration_offset' ); // Clear resume offset.
		} else {
			update_option( 'prc_chart_builder_block_migration_status', 'in_progress' );
		}

		update_option(
			'prc_chart_builder_block_migration_stats',
			array(
				'posts_migrated'    => $migrated_posts,
				'meta_migrated'     => $meta_results,
				'total_processed'   => $total_processed,
				'batches_completed' => $batch_count,
				'current_offset'    => $args['offset'],
				'dry_run'           => $args['dry_run'],
				'timestamp'         => current_time( 'mysql' ),
			)
		);

		// Log completion.
		error_log(
			sprintf(
				'PRC Chart Builder: Block migration batch completed. %d posts migrated, %d meta entries migrated, %d total processed in %d batches.',
				$migrated_posts,
				$meta_results,
				$total_processed,
				$batch_count
			)
		);

		// Restore original blog if we switched.
		if ( $switched ) {
			restore_current_blog();
		}

		return true;
	}

	/**
	 * Update block names in post content.
	 *
	 * @since 3.0.1
	 * @param string $content The post content to update.
	 * @return string Updated content.
	 */
	private function update_block_names_in_content( $content ) {
		$updated_content = $content;

		foreach ( $this->block_mappings as $old_name => $new_name ) {
			// Update block names in various formats.
			$patterns = array(
				// Standard block format: <!-- wp:block-name -->.
				'/(<!--\s*wp:)' . preg_quote( $old_name, '/' ) . '(\s*-->)/',
				// Block with attributes: <!-- wp:block-name {"attr":"value"} -->.
				'/(<!--\s*wp:)' . preg_quote( $old_name, '/' ) . '(\s+\{.*?\}\s*-->)/',
				// Self-closing block with attributes: <!-- wp:block-name {"attr":"value"} /-->.
				'/(<!--\s*wp:)' . preg_quote( $old_name, '/' ) . '(\s+\{.*?\}\s*\/-->)/',
				// Closing block: <!-- /wp:block-name -->.
				'/(<!--\s*\/wp:)' . preg_quote( $old_name, '/' ) . '(\s*-->)/',
			);

			foreach ( $patterns as $pattern ) {
				$updated_content = preg_replace( $pattern, '$1' . $new_name . '$2', $updated_content );
			}
		}

		return $updated_content;
	}

	/**
	 * Migrate block names in post meta with batching.
	 *
	 * @since 3.0.1
	 * @return int Number of meta entries migrated.
	 */
	private function migrate_post_meta_blocks_batched() {
		global $wpdb;

		$migrated_count = 0;
		$posts_per_page = 100;
		$offset = 0;

		// Check for block references in post meta.
		$meta_keys_to_check = array(
			'_wp_page_template',
			'_wp_attachment_metadata',
			'_edit_last',
			'_edit_lock',
		);

		foreach ( $meta_keys_to_check as $meta_key ) {
			$meta_offset = 0;

			do {
				$meta_results = $wpdb->get_results(
					$wpdb->prepare(
						"SELECT post_id, meta_value FROM {$wpdb->postmeta}
						WHERE meta_key = %s
						AND (meta_value LIKE %s OR meta_value LIKE %s OR meta_value LIKE %s)
						LIMIT %d OFFSET %d",
						$meta_key,
						'%prc-block/chart%',
						'%prc-block/chart-builder-controller%',
						'%prc-block/chart-builder%',
						$posts_per_page,
						$meta_offset
					)
				);

				if ( empty( $meta_results ) ) {
					break;
				}

				foreach ( $meta_results as $meta ) {
					$original_value = $meta->meta_value;
					$updated_value  = $this->update_block_names_in_content( $original_value );

					if ( $original_value !== $updated_value ) {
						$result = $wpdb->update(
							$wpdb->postmeta,
							array( 'meta_value' => $updated_value ),
							array(
								'post_id'  => $meta->post_id,
								'meta_key' => $meta_key,
							),
							array( '%s' ),
							array( '%d', '%s' )
						);

						if ( false !== $result ) {
							$migrated_count++;
						}
					}
				}

				$meta_offset += $posts_per_page;

				// Free up memory after each batch (only in CLI context).
				if ( defined( 'WP_CLI' ) && WP_CLI && method_exists( $this, 'vip_inmemory_cleanup' ) ) {
					$this->vip_inmemory_cleanup();
				}

				// Pause between meta batches.
				if ( count( $meta_results ) === $posts_per_page ) {
					sleep( 1 );
				}

			} while ( count( $meta_results ) === $posts_per_page );
		}

		return $migrated_count;
	}


	/**
	 * Display admin notice about migration status.
	 *
	 * @since 3.0.1
	 */
	public function migration_admin_notice() {
		// Only show to administrators.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$migration_completed = get_option( 'prc_chart_builder_block_migration_completed', false );
		$migration_stats     = get_option( 'prc_chart_builder_block_migration_stats', array() );

		if ( $migration_completed && ! empty( $migration_stats ) ) {
			$posts_migrated = isset( $migration_stats['posts_migrated'] ) ? $migration_stats['posts_migrated'] : 0;
			$meta_migrated  = isset( $migration_stats['meta_migrated'] ) ? $migration_stats['meta_migrated'] : 0;
			$timestamp      = isset( $migration_stats['timestamp'] ) ? $migration_stats['timestamp'] : '';

			if ( $posts_migrated > 0 || $meta_migrated > 0 ) {
				?>
				<div class="notice notice-success is-dismissible">
					<p>
						<strong><?php esc_html_e( 'PRC Chart Builder:', 'prc-chart-builder' ); ?></strong>
						<?php
						printf(
							/* translators: %1$d: number of posts migrated, %2$d: number of meta entries migrated */
							esc_html__( 'Block name migration completed successfully. %1$d posts and %2$d meta entries were updated.', 'prc-chart-builder' ),
							esc_html( $posts_migrated ),
							esc_html( $meta_migrated )
						);
						?>
						<?php if ( $timestamp ) : ?>
							<br>
							<small>
							<?php
							/* translators: %s: completion timestamp */
							printf( esc_html__( 'Completed on: %s', 'prc-chart-builder' ), esc_html( $timestamp ) );
							?>
							</small>
						<?php endif; ?>
					</p>
				</div>
				<?php
			}
		}
	}

	/**
	 * Manually trigger migration (for testing or manual execution).
	 *
	 * @since 3.0.1
	 * @param array $args Optional arguments for migration control.
	 * @return bool True if migration was successful, false otherwise.
	 */
	public function manual_migration( $args = array() ) {
		// Switch to blog ID 20 for option handling.
		$switched = false;
		if ( is_multisite() ) {
			$switched = switch_to_blog( 20 );
		}

		// Reset migration status to allow re-running (unless resuming).
		if ( ! isset( $args['resume'] ) || ! $args['resume'] ) {
			delete_option( 'prc_chart_builder_block_migration_completed' );
			delete_option( 'prc_chart_builder_block_migration_status' );
			delete_option( 'prc_chart_builder_block_migration_stats' );
			delete_option( 'prc_chart_builder_migration_offset' );
		}

		// Restore blog before running migration (run_migration will handle blog switching).
		if ( $switched ) {
			restore_current_blog();
		}

		return $this->run_migration( $args );
	}

	/**
	 * Get migration status.
	 *
	 * @since 3.0.1
	 * @return array Migration status information.
	 */
	public function get_migration_status() {
		// Switch to blog ID 20 to check status.
		$switched = false;
		if ( is_multisite() ) {
			$switched = switch_to_blog( 20 );
		}

		$status = array(
			'completed' => get_option( 'prc_chart_builder_block_migration_completed', false ),
			'status'    => get_option( 'prc_chart_builder_block_migration_status', 'not_started' ),
			'stats'     => get_option( 'prc_chart_builder_block_migration_stats', array() ),
		);

		// Restore original blog if we switched.
		if ( $switched ) {
			restore_current_blog();
		}

		return $status;
	}

	/**
	 * Reset migration status to allow re-running.
	 *
	 * @since 3.0.1
	 * @return bool True if reset was successful.
	 */
	public function reset_migration_status() {
		// Switch to blog ID 20 for option handling.
		$switched = false;
		if ( is_multisite() ) {
			$switched = switch_to_blog( 20 );
		}

		// Reset migration status options.
		delete_option( 'prc_chart_builder_block_migration_completed' );
		delete_option( 'prc_chart_builder_block_migration_status' );
		delete_option( 'prc_chart_builder_block_migration_stats' );

		// Restore original blog if we switched.
		if ( $switched ) {
			restore_current_blog();
		}

		// Log the reset.
		error_log( 'PRC Chart Builder: Migration status reset, ready for re-run.' );

		return true;
	}

	/**
	 * Test migration on a sample content string.
	 *
	 * @since 3.0.1
	 * @param string $content The content to test migration on.
	 * @return array Test result with original and updated content.
	 */
	public function test_migration_on_content( $content ) {
		$original_content = $content;
		$updated_content  = $this->update_block_names_in_content( $original_content );

		return array(
			'original_content' => $original_content,
			'updated_content'  => $updated_content,
			'changes_made'     => $original_content !== $updated_content,
			'blocks_found'     => $this->get_blocks_in_content( $original_content ),
			'blocks_after'     => $this->get_blocks_in_content( $updated_content ),
		);
	}

	/**
	 * Get list of blocks found in content.
	 *
	 * @since 3.0.1
	 * @param string $content The content to analyze.
	 * @return array List of blocks found.
	 */
	private function get_blocks_in_content( $content ) {
		$blocks = array();

		// Find all WordPress blocks.
		preg_match_all( '/<!--\s*wp:([a-zA-Z0-9\-\/]+)(?:\s+\{.*?\})?\s*\/?-->/', $content, $matches );

		if ( ! empty( $matches[1] ) ) {
			$blocks = array_unique( $matches[1] );
		}

		return $blocks;
	}

	/**
	 * Migrate a single post by ID.
	 *
	 * @since 3.0.1
	 * @param int $post_id The post ID to migrate.
	 * @return array Migration result with post info and success status.
	 */
	public function migrate_single_post( $post_id ) {
		global $wpdb;

		// Switch to blog ID 20 for the migration.
		$switched = false;
		if ( is_multisite() ) {
			$switched = switch_to_blog( 20 );
		}

		// Get the specific post.
		$post = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT ID, post_content, post_type, post_title FROM {$wpdb->posts}
				WHERE ID = %d
				AND post_status = 'publish'",
				$post_id
			)
		);

		$result = array(
			'post_id' => $post_id,
			'found' => false,
			'migrated' => false,
			'changes_made' => false,
			'error' => null,
		);

		if ( ! $post ) {
			$result['error'] = 'Post not found or not published';

			// Restore original blog if we switched.
			if ( $switched ) {
				restore_current_blog();
			}

			return $result;
		}

		$result['found'] = true;
		$result['post_title'] = $post->post_title;
		$result['post_type'] = $post->post_type;

		// Check if post contains any of the old block names.
		$has_old_blocks = false;
		foreach ( $this->block_mappings as $old_name => $new_name ) {
			if ( strpos( $post->post_content, $old_name ) !== false ) {
				$has_old_blocks = true;
				break;
			}
		}

		if ( ! $has_old_blocks ) {
			$result['error'] = 'Post does not contain any blocks that need migration';

			// Restore original blog if we switched.
			if ( $switched ) {
				restore_current_blog();
			}

			return $result;
		}

		// Update block names in the post content.
		$original_content = $post->post_content;
		$updated_content  = $this->update_block_names_in_content( $original_content );

		if ( $original_content !== $updated_content ) {
			// Update the post content.
			$update_result = $wpdb->update(
				$wpdb->posts,
				array( 'post_content' => $updated_content ),
				array( 'ID' => $post->ID ),
				array( '%s' ),
				array( '%d' )
			);

			if ( false !== $update_result ) {
				$result['migrated'] = true;
				$result['changes_made'] = true;

				// Clear any caches for this post.
				clean_post_cache( $post->ID );

				// Log the migration.
				error_log(
					sprintf(
						'PRC Chart Builder: Migrated block names in single post ID %d (%s) - "%s"',
						$post->ID,
						$post->post_type,
						$post->post_title
					)
				);
			} else {
				$result['error'] = 'Failed to update post content in database';
			}
		} else {
			$result['migrated'] = true;
			$result['error'] = 'No changes needed - post content already up to date';
		}

		// Restore original blog if we switched.
		if ( $switched ) {
			restore_current_blog();
		}

		return $result;
	}
}

/**
 * WP-CLI command for block migration.
 *
 * @since 3.0.1
 */
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	class PRC_Chart_Builder_Migration_CLI_Command extends WPCOM_VIP_CLI_Command {

		/**
		 * Migrate block names in posts and meta.
		 *
		 * ## OPTIONS
		 *
		 * [--dry-run]
		 * : Run in dry-run mode to see what would be migrated without making changes.
		 *
		 * [--posts-per-page=<number>]
		 * : Number of posts to process per batch. Default: 100
		 *
		 * [--offset=<number>]
		 * : Start processing from this offset. Default: 0
		 *
		 * [--limit=<number>]
		 * : Limit the number of posts to process. Default: 0 (no limit)
		 *
		 * [--resume]
		 * : Resume from the last saved offset instead of starting from the beginning.
		 *
		 * [--post-id=<id>]
		 * : Migrate a single post by ID instead of running batch migration.
		 *
		 * ## EXAMPLES
		 *
		 *     # Run a dry-run to see what would be migrated
		 *     wp prc-chart-builder migrate --dry-run
		 *
		 *     # Run the actual migration
		 *     wp prc-chart-builder migrate
		 *
		 *     # Process only 500 posts starting from offset 1000
		 *     wp prc-chart-builder migrate --offset=1000 --limit=500
		 *
		 *     # Resume from where the last run left off
		 *     wp prc-chart-builder migrate --resume
		 *
		 *     # Migrate single post by ID
		 *     wp prc-chart-builder migrate --post-id=123
		 *
		 * @subcommand migrate
		 * @synopsis [--dry-run] [--posts-per-page=<number>] [--offset=<number>] [--limit=<number>] [--resume] [--post-id=<id>]
		 */
		public function migrate( $args, $assoc_args ) {
			// Parse arguments.
			$dry_run = isset( $assoc_args['dry-run'] );
			$posts_per_page = isset( $assoc_args['posts-per-page'] ) ? intval( $assoc_args['posts-per-page'] ) : 100;
			$offset = isset( $assoc_args['offset'] ) ? intval( $assoc_args['offset'] ) : 0;
			$limit = isset( $assoc_args['limit'] ) ? intval( $assoc_args['limit'] ) : 0;
			$resume = isset( $assoc_args['resume'] );
			$post_id = isset( $assoc_args['post-id'] ) ? intval( $assoc_args['post-id'] ) : 0;

			// Validate arguments.
			if ( $posts_per_page < 1 || $posts_per_page > 1000 ) {
				WP_CLI::error( 'posts-per-page must be between 1 and 1000' );
			}

			if ( $offset < 0 ) {
				WP_CLI::error( 'offset must be 0 or greater' );
			}

			if ( $limit < 0 ) {
				WP_CLI::error( 'limit must be 0 or greater' );
			}

			// Get the migration instance.
			$migration = new \PRC\Platform\Chart_Builder\Block_Migration( null );

			// Handle single post migration.
			if ( $post_id > 0 ) {
				WP_CLI::line( sprintf( 'Migrating single post ID: %d', $post_id ) );

				$result = $migration->migrate_single_post( $post_id );

				if ( $result['found'] ) {
					WP_CLI::line( sprintf( 'Post found: "%s" (%s)', $result['post_title'], $result['post_type'] ) );

					if ( $result['migrated'] ) {
						if ( $result['changes_made'] ) {
							WP_CLI::success( 'Post migrated successfully with changes made!' );
						} else {
							WP_CLI::success( 'Post processed - no changes needed.' );
						}
					} else {
						WP_CLI::warning( sprintf( 'Migration failed: %s', $result['error'] ) );
					}
				} else {
					WP_CLI::error( sprintf( 'Post not found: %s', $result['error'] ) );
				}

				return;
			}

			// Prepare migration arguments for batch migration.
			$migration_args = array(
				'dry_run'        => $dry_run,
				'posts_per_page' => $posts_per_page,
				'offset'         => $offset,
				'limit'          => $limit,
				'resume'         => $resume,
			);

			// Display what we're about to do.
			if ( $dry_run ) {
				WP_CLI::line( 'Running in dry-run mode - no changes will be made.' );
			} else {
				WP_CLI::line( 'Running live migration - changes will be made to the database.' );
			}

			WP_CLI::line( sprintf( 'Processing %d posts per batch', $posts_per_page ) );
			if ( $offset > 0 ) {
				WP_CLI::line( sprintf( 'Starting from offset %d', $offset ) );
			}
			if ( $limit > 0 ) {
				WP_CLI::line( sprintf( 'Processing maximum %d posts', $limit ) );
			}
			if ( $resume ) {
				WP_CLI::line( 'Resuming from last saved offset' );
			}

			WP_CLI::line( '' );

			// Run the migration.
			$start_time = microtime( true );
			$result = $migration->manual_migration( $migration_args );
			$end_time = microtime( true );

			if ( $result ) {
				// Get the final stats.
				$stats = $migration->get_migration_status();
				$migration_stats = $stats['stats'];

				WP_CLI::success( 'Migration completed successfully!' );
				WP_CLI::line( '' );
				WP_CLI::line( 'Migration Statistics:' );
				WP_CLI::line( sprintf( '  Posts migrated: %d', $migration_stats['posts_migrated'] ?? 0 ) );
				WP_CLI::line( sprintf( '  Meta entries migrated: %d', $migration_stats['meta_migrated'] ?? 0 ) );
				WP_CLI::line( sprintf( '  Total processed: %d', $migration_stats['total_processed'] ?? 0 ) );
				WP_CLI::line( sprintf( '  Batches completed: %d', $migration_stats['batches_completed'] ?? 0 ) );
				WP_CLI::line( sprintf( '  Execution time: %.2f seconds', $end_time - $start_time ) );

				if ( isset( $migration_stats['current_offset'] ) && $migration_stats['current_offset'] > 0 ) {
					WP_CLI::line( sprintf( '  Current offset: %d', $migration_stats['current_offset'] ) );
				}
			} else {
				WP_CLI::error( 'Migration failed!' );
			}
		}

		/**
		 * Get migration status and statistics.
		 *
		 * ## EXAMPLES
		 *
		 *     # Check migration status
		 *     wp prc-chart-builder status
		 *
		 * @subcommand status
		 */
		public function status( $args, $assoc_args ) {
			$migration = new \PRC\Platform\Chart_Builder\Block_Migration( null );
			$status = $migration->get_migration_status();

			WP_CLI::line( 'Migration Status:' );
			WP_CLI::line( sprintf( '  Completed: %s', $status['completed'] ? 'Yes' : 'No' ) );
			WP_CLI::line( sprintf( '  Status: %s', $status['status'] ) );

			if ( ! empty( $status['stats'] ) ) {
				$stats = $status['stats'];
				WP_CLI::line( '' );
				WP_CLI::line( 'Statistics:' );
				WP_CLI::line( sprintf( '  Posts migrated: %d', $stats['posts_migrated'] ?? 0 ) );
				WP_CLI::line( sprintf( '  Meta entries migrated: %d', $stats['meta_migrated'] ?? 0 ) );
				WP_CLI::line( sprintf( '  Total processed: %d', $stats['total_processed'] ?? 0 ) );
				WP_CLI::line( sprintf( '  Batches completed: %d', $stats['batches_completed'] ?? 0 ) );
				if ( isset( $stats['timestamp'] ) ) {
					WP_CLI::line( sprintf( '  Last run: %s', $stats['timestamp'] ) );
				}
				if ( isset( $stats['current_offset'] ) && $stats['current_offset'] > 0 ) {
					WP_CLI::line( sprintf( '  Current offset: %d', $stats['current_offset'] ) );
				}
			}
		}

		/**
		 * Reset migration status to allow re-running.
		 *
		 * ## EXAMPLES
		 *
		 *     # Reset migration status
		 *     wp prc-chart-builder reset
		 *
		 * @subcommand reset
		 */
		public function reset( $args, $assoc_args ) {
			$migration = new \PRC\Platform\Chart_Builder\Block_Migration( null );
			$result = $migration->reset_migration_status();

			if ( $result ) {
				WP_CLI::success( 'Migration status reset successfully!' );
			} else {
				WP_CLI::error( 'Failed to reset migration status!' );
			}
		}

		/**
		 * Test migration on sample content.
		 *
		 * ## OPTIONS
		 *
		 * <content>
		 * : The content to test migration on.
		 *
		 * ## EXAMPLES
		 *
		 *     # Test migration on sample content
		 *     wp prc-chart-builder test "<!-- wp:prc-block/chart -->"
		 *
		 * @subcommand test
		 * @synopsis <content>
		 */
		public function test( $args, $assoc_args ) {
			if ( empty( $args[0] ) ) {
				WP_CLI::error( 'Content is required for testing.' );
			}

			$migration = new \PRC\Platform\Chart_Builder\Block_Migration( null );
			$result = $migration->test_migration_on_content( $args[0] );

			WP_CLI::line( 'Migration Test Results:' );
			WP_CLI::line( sprintf( '  Changes made: %s', $result['changes_made'] ? 'Yes' : 'No' ) );
			WP_CLI::line( sprintf( '  Blocks found before: %s', implode( ', ', $result['blocks_found'] ) ) );
			WP_CLI::line( sprintf( '  Blocks found after: %s', implode( ', ', $result['blocks_after'] ) ) );
			WP_CLI::line( '' );
			WP_CLI::line( 'Original content:' );
			WP_CLI::line( $result['original_content'] );
			WP_CLI::line( '' );
			WP_CLI::line( 'Updated content:' );
			WP_CLI::line( $result['updated_content'] );
		}
	}

	WP_CLI::add_command( 'prc-chart-builder', '\PRC\Platform\Chart_Builder\PRC_Chart_Builder_Migration_CLI_Command' );
}
