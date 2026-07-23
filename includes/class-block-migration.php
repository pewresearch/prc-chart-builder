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

		// Check if we're resuming from a previous run.
		$resume_offset = get_option( 'prc_chart_builder_migration_offset', 0 );
		if ( $resume_offset > 0 && $args['offset'] === 0 ) {
			$paged = floor( $resume_offset / $args['posts_per_page'] ) + 1;
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

			// Pause between batches for cache re-validation and data replication.
			if ( count( $posts ) === $args['posts_per_page'] ) {
				sleep( 3 );
			}

			// Free up memory after each batch (only in CLI context).
			if ( defined( 'WP_CLI' ) && WP_CLI && method_exists( $this, 'vip_inmemory_cleanup' ) ) {
				$this->vip_inmemory_cleanup();
			}

			// Check if we've hit our limit.
			if ( $args['limit'] > 0 && $total_processed >= $args['limit'] ) {
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
		// Reset migration status to allow re-running (unless resuming).
		if ( ! isset( $args['resume'] ) || ! $args['resume'] ) {
			delete_option( 'prc_chart_builder_block_migration_completed' );
			delete_option( 'prc_chart_builder_block_migration_status' );
			delete_option( 'prc_chart_builder_block_migration_stats' );
			delete_option( 'prc_chart_builder_migration_offset' );
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
		$status = array(
			'completed' => get_option( 'prc_chart_builder_block_migration_completed', false ),
			'status'    => get_option( 'prc_chart_builder_block_migration_status', 'not_started' ),
			'stats'     => get_option( 'prc_chart_builder_block_migration_stats', array() ),
		);

		return $status;
	}

	/**
	 * Reset migration status to allow re-running.
	 *
	 * @since 3.0.1
	 * @return bool True if reset was successful.
	 */
	public function reset_migration_status() {
		// Reset migration status options.
		delete_option( 'prc_chart_builder_block_migration_completed' );
		delete_option( 'prc_chart_builder_block_migration_status' );
		delete_option( 'prc_chart_builder_block_migration_stats' );

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
			return $result;
		}

		$result['found'] = true;
		$result['post_title'] = $post->post_title;
		$result['post_type'] = $post->post_type;

		// Check if post contains any of the old block names (Phase 1: name migration).
		$has_old_blocks = false;
		foreach ( $this->block_mappings as $old_name => $new_name ) {
			if ( strpos( $post->post_content, $old_name ) !== false ) {
				$has_old_blocks = true;
				break;
			}
		}

		$original_content = $post->post_content;
		$updated_content  = $original_content;

		if ( $has_old_blocks ) {
			// Phase 1: rename old block names to new ones.
			$updated_content = $this->update_block_names_in_content( $original_content );
		}

		// Phase 2: attribute migration (v1 flat → v2 nested).
		// Runs whether or not Phase 1 was needed — posts may already have new names
		// but still carry v1-style flat attributes without a "_version":"v2" marker.
		$has_chart_blocks = strpos( $updated_content, 'prc-chart-builder/chart' ) !== false;

		if ( $has_chart_blocks ) {
			$updated_content = $this->migrate_block_attributes_in_content( $updated_content );
		}

		if ( ! $has_old_blocks && ! $has_chart_blocks ) {
			$result['error'] = 'Post does not contain any blocks that need migration';
			return $result;
		}

		if ( $original_content !== $updated_content ) {
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

				clean_post_cache( $post->ID );
			} else {
				$result['error'] = 'Failed to update post content in database';
			}
		} else {
			$result['migrated'] = true;
			$result['error'] = 'No changes needed - post content already up to date';
		}

		return $result;
	}

	/**
	 * Walk parsed blocks recursively and run attribute migration on each
	 * prc-chart-builder/chart block that is not yet at v2.
	 *
	 * @since 3.1.1
	 * @param string $content Serialized block content.
	 * @return string Updated serialized block content.
	 */
	private function migrate_block_attributes_in_content( $content ) {
		// Cheap string check before any block parsing: if every chart block already
		// carries the v2 marker we can skip all further work entirely. Count only
		// opening block delimiters (which also covers self-closing `/-->` form) so
		// we get one hit per block rather than two (open + close).
		$chart_count = substr_count( $content, '<!-- wp:prc-chart-builder/chart' );
		$v2_count    = substr_count( $content, '"_version":"v2"' )
			+ substr_count( $content, '"_version": "v2"' );

		if ( $chart_count > 0 && $v2_count >= $chart_count ) {
			return $content;
		}

		$blocks  = parse_blocks( $content );
		$changed = false;

		$walk = function( &$blocks ) use ( &$walk, &$changed ) {
			foreach ( $blocks as &$block ) {
				if ( 'prc-chart-builder/chart' === $block['blockName'] ) {
					$attrs = $block['attrs'];
					// Skip blocks already at v2 (no _v1Original re-migration needed).
					$already_v2 = ! isset( $attrs['_v1Original'] )
						&& isset( $attrs['_version'] )
						&& 'v2' === $attrs['_version'];

					if ( ! $already_v2 ) {
						$block['attrs'] = self::migrate_attributes_v1_to_v2( $attrs );
						$changed = true;
					}
				}

				if ( ! empty( $block['innerBlocks'] ) ) {
					$walk( $block['innerBlocks'] );
				}
			}
		};

		$walk( $blocks );

		return $changed ? serialize_blocks( $blocks ) : $content;
	}

	/**
	 * Migrate chart block attributes from v1 (flat) to v2 (nested) structure.
	 *
	 * This migration mirrors the JavaScript migration in src/chart/deprecations/v1.js
	 * to ensure consistent behavior on both frontend and in the editor.
	 *
	 * Uses _version flag as cache: v2 blocks skip migration entirely.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 flat attributes.
	 * @return array The v2 nested attributes.
	 */
	public static function migrate_attributes_v1_to_v2( $attributes ) {
		// Use isset() instead of !empty() because _v1Original might be an empty array
		$has_v1_original = isset( $attributes['_v1Original'] );

		// Early return if already migrated and no re-migration needed
		if ( ! $has_v1_original && isset( $attributes['_version'] ) && 'v2' === $attributes['_version'] ) {
			return $attributes;
		}

		// WordPress object cache to prevent double migration in same request
		// (e.g., when controller and chart block both migrate same attributes)
		// Uses 'prc-chart-migration' group for request-scoped caching
		if ( ! $has_v1_original ) {
			$cache_key = 'v1_to_v2_' . md5( wp_json_encode( $attributes ) );
			$cached = wp_cache_get( $cache_key, 'prc-chart-migration' );

			if ( false !== $cached ) {
				return $cached;
			}
		}

		try {

			// Preserve original v1 attributes for testing/comparison
			// Only preserve if not already preserved (to avoid nested copies on re-migration)
			$v1_original = isset( $attributes['_v1Original'] ) ? $attributes['_v1Original'] : $attributes;

			// Remove migration metadata from original snapshot to avoid recursion
			unset( $v1_original['_v1Original'] );
			unset( $v1_original['_migrationMeta'] );
			unset( $v1_original['_legacy'] );

			// Prepare values for migration
			$layout_padding = array(
				'top'    => $attributes['paddingTop'] ?? 20,
				'right'  => $attributes['paddingRight'] ?? 0,
				'bottom' => $attributes['paddingBottom'] ?? 25,
				'left'   => $attributes['paddingLeft'] ?? 60,
			);
			$metadata_active = $attributes['metaTextActive'] ?? true;

			$migrated = array(
				'_version' => 'v2',

				// Preserve original v1 attributes for testing/comparison
				'_v1Original' => $v1_original,

				// Track migration metadata
			'_migrationMeta' => array(
				'migratedAt'      => gmdate( 'c' ), // ISO 8601 format
				'migrationVersion' => '1.0.0',
				'forceRemigrate'  => false, // Reset flag after migration
			),

			'id' => $attributes['id'] ?? '',

			// Layout object
			'layout' => array(
				'name'             => 'wp-block-prc-block-chart-builder-controller',
				'parentClass'      => $attributes['parentClass'] ?? 'wp-chart-builder-wrapper',
				'type'             => $attributes['chartType'] ?? 'bar',
				'orientation'      => $attributes['chartOrientation'] ?? 'horizontal', // Match block.json default
				'width'            => $attributes['width'] ?? 640,
				'height'           => $attributes['height'] ?? 400,
				'padding'          => $layout_padding,
				'overflowX'        => $attributes['overflowX'] ?? 'responsive',
				'horizontalRules'  => $attributes['horizontalRules'] ?? true,
			'mobileBreakpoint' => $attributes['mobileBreakpoint'] ?? 480,
		),

		// Metadata object
			'metadata' => array(
					'active'   => $metadata_active,
					'title'    => $attributes['metaTitle'] ?? 'Title',
					'subtitle' => $attributes['metaSubtitle'] ?? 'Subtitle',
					'note'     => $attributes['metaNote'] ?? 'Note: This is a note.',
					'source'   => $attributes['metaSource'] ?? 'Source: This is your source.',
					'tag'      => $attributes['metaTag'] ?? 'PEW RESEARCH CENTER',
					'alt'      => $attributes['metaAlt'] ?? '',
				),

				// Colors array
				'colors' => ( isset( $attributes['customColors'] ) && is_array( $attributes['customColors'] ) && count( $attributes['customColors'] ) > 0 )
					? $attributes['customColors']
					: array( '#436983', '#bf3927', '#756a7e', '#ea9e2c', '#bc7b2b', '#eeece4' ),

				// Plot bands object
				'plotBands' => array(
					'active'      => $attributes['plotBandsActive'] ?? false,
					'allowDrag'   => false,
					'allowResize' => false,
					'dimension'   => 'x',
					'bands'       => $attributes['plotBands'] ?? array(),
				),

				// Independent axis (X-axis)
				'independentAxis' => self::migrate_independent_axis( $attributes ),

				// Dependent axis (Y-axis)
				'dependentAxis' => self::migrate_dependent_axis( $attributes ),

				// Tooltip object
				'tooltip' => self::migrate_tooltip( $attributes ),

				// Legend object
				'legend' => self::migrate_legend( $attributes ),

				// Labels object
				'labels' => self::migrate_labels( $attributes ),

				// Bar object
				'bar' => array(
					'barPadding'      => $attributes['barPadding'] ?? 0.2,
					'barGroupPadding' => $attributes['barGroupPadding'] ?? 0.2,
					'hasRectStroke'   => $attributes['elementHasStroke'] ?? false,
					'stackOffset'     => 'none',
				),

				// Line object
				'line' => array(
					'interpolation'   => $attributes['lineInterpolation'] ?? 'curveLinear',
					'strokeWidth'     => $attributes['lineStrokeWidth'] ?? 3,
					'strokeDasharray' => $attributes['lineStrokeDashArray'] ?? '',
					'showPoints'      => $attributes['lineNodes'] ?? true,
					'showArea'        => ( isset( $attributes['chartType'] ) && 'area' === $attributes['chartType'] ),
					'areaFillOpacity' => $attributes['areaFillOpacity'] ?? 0.4,
				),

				// Dot plot object
				'dotPlot' => array(
					'connectPoints'   => $attributes['dotPlotConnectPoints'] ?? true,
					'connectingLine'  => array(
						'stroke'          => $attributes['dotPlotConnectPointsStroke'] ?? '#E6E7E8',
						'strokeWidth'     => $attributes['dotPlotConnectPointsStrokeWidth'] ?? 6,
						'strokeDasharray' => $attributes['dotPlotConnectPointsStrokeDasharray'] ?? '',
						'strokeOpacity'   => 1,
					),
				),

				// Exploded bar object
				'explodedBar' => array(
					'columnGap' => $attributes['explodedBarColumnGap'] ?? 16,
				),

				// Pie object
				'pie' => array(
					'hasPathStroke'      => $attributes['elementHasStroke'] ?? false,
					'pathStrokeColor'    => 'white',
					'pathStrokeWidth'    => 1,
					'showCategoryLabels' => $attributes['pieCategoryLabelsActive'] ?? true,
					'innerRadius'        => 0,
					'padAngle'           => 0,
					'cornerRadius'       => 0,
					'sortByValue'        => false,
				),

				// Nodes object
				'nodes' => array(
					'pointSize'        => $attributes['nodeSize'] ?? 3,
					'pointFill'        => $attributes['nodeFill'] ?? 'inherit',
					'pointStrokeWidth' => $attributes['nodeStrokeWidth'] ?? 3,
					'pointShape'       => 'circle',
				),

				// Map object
				'map' => self::migrate_map( $attributes ),

				// Diverging bar object
				'divergingBar' => self::migrate_diverging_bar( $attributes ),

				// Diff column object
				'diffColumn' => self::migrate_diff_column( $attributes ),

				// Annotations object
				'annotations' => array(
					'active' => $attributes['annotationsActive'] ?? false,
					'items'  => $attributes['annotations'] ?? array(),
				),

				// Data render object
				'dataRender' => self::migrate_data_render( $attributes ),

				// Animate object
				'animate' => array(
					'active'              => false,
					'animationWhitelist'  => array(),
					'duration'            => 2000,
				),

				// IO object (WordPress-specific)
				'io' => self::migrate_io( $attributes ),

				// Legacy object for unmapped attributes
				'_legacy' => array(),
			);

			// Cache successful migration using WordPress object cache
			// Request-scoped: prevents double migration when controller and chart block both migrate
			if ( ! $has_v1_original ) {
				$cache_key = 'v1_to_v2_' . md5( wp_json_encode( $attributes ) );
				wp_cache_set( $cache_key, $migrated, 'prc-chart-migration', 0 );
			}

			$mobile = array();

			if (
				isset( $attributes['barLabelCutoffMobile'] ) &&
				( $attributes['barLabelCutoff'] ?? 5 ) !== $attributes['barLabelCutoffMobile']
			) {
				$mobile['labels'] = array(
					'labelCutoff' => $attributes['barLabelCutoffMobile'],
				);
			}

			if (
				( $attributes['tooltipActive'] ?? true ) &&
				( $attributes['tooltipActiveOnMobile'] ?? true ) === false
			) {
				$mobile['tooltip'] = array(
					'active' => false,
				);
			}

			if ( ! empty( $mobile ) ) {
				$migrated['mobile'] = $mobile;
			}

			return $migrated;

		} catch ( \Exception $e ) {
			// Show admin notice if user can see it
			if ( current_user_can( 'manage_options' ) ) {
				add_action(
					'admin_notices',
					function() use ( $e ) {
						echo '<div class="notice notice-warning"><p>';
						echo '<strong>Chart Block Migration Warning:</strong> ';
						echo esc_html( $e->getMessage() );
						echo '</p></div>';
					}
				);
			}

			// Return original attributes as fallback
			return $attributes;
		}
	}

	/**
	 * Migrate independent axis (X-axis) attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated independentAxis object.
	 */
	private static function migrate_independent_axis( $attributes ) {
		$tick_marks_active = ( $attributes['xTickMarksActive'] ?? false ) ? true : false;
		$padding = $attributes['xLabelPadding'] ?? 30;
		$date_format = $attributes['xDateFormat'] ?? '%Y';
		$show_zero = $attributes['showXMinDomainLabel'] ?? true;

		return array(
			'active'              => $attributes['xAxisActive'] ?? true,
			'label'               => $attributes['xLabel'] ?? '',
			'scale'               => $attributes['xScale'] ?? 'linear',
			'dateFormat'          => $date_format,
			'domain'              => array(
				$attributes['xMinDomain'] ?? 0,
				$attributes['xMaxDomain'] ?? 100,
			),
			'domainPadding'       => 20,
			'showZero'            => $show_zero,
			'padding'             => $padding,
			'tickMarksActive'     => $tick_marks_active,
			'tickAngle'           => $attributes['xTickLabelAngle'] ?? 0,
			'tickCount'           => $attributes['xTickNum'] ?? 5,
			'tickValues'          => self::parse_tick_values( $attributes['xTickExact'] ?? null ),
			'tickFormat'          => null,
			'ticksToLocaleString' => $attributes['xTicksToLocaleString'] ?? false,
			'abbreviateTicks'     => $attributes['xAbbreviateTicks'] ?? false,
			'abbreviateTicksDecimals' => $attributes['xAbbreviateTicksDecimals'] ?? 0,
			'tickUnit'            => $attributes['xTickUnit'] ?? '',
			'tickUnitPosition'    => $attributes['xTickUnitPosition'] ?? 'end',
			'tickLabels'          => array(
				'fontSize'        => $attributes['xLabelFontSize'] ?? 12,
				'padding'         => 0,
				'angle'           => $attributes['xTickLabelAngle'] ?? 0,
				'dx'              => $attributes['xTickLabelDX'] ?? 0,
				'dy'              => $attributes['xTickLabelDY'] ?? 0,
				'textAnchor'      => $attributes['xTickLabelTextAnchor'] ?? 'middle',
				'verticalAnchor'  => $attributes['xTickLabelVerticalAnchor'] ?? 'end',
				'fill'            => $attributes['xLabelTextFill'] ?? '#231F20',
				'fontFamily'      => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				'maxWidth'        => $attributes['xTickLabelMaxWidth'] ?? 50,
			),
			'axisLabel'           => array(
				'fontSize'        => $attributes['xLabelFontSize'] ?? 12,
				'fill'            => $attributes['xLabelTextFill'] ?? '#231F20',
				'padding'         => 15,
				'angle'           => 0,
				'dx'              => 0,
				'dy'              => 0,
				'textAnchor'      => 'end',
				'verticalAnchor'  => 'middle',
				'fontFamily'      => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				'maxWidth'        => $attributes['xLabelMaxWidth'] ?? 100,
			),
			'axis'                => array(
				'stroke'      => $attributes['xAxisStroke'] ?? '#756f6a',
				'strokeWidth' => 1,
			),
			'ticks'               => array(
				'stroke'      => $attributes['xAxisStroke'] ?? '#756f6a',
				'size'        => $tick_marks_active ? 5 : 0,
				'strokeWidth' => 0, // Match block.json default
			),
			'grid'                => array(
				// Use empty string as default (old flat default was "")
				'stroke'          => $attributes['xGridStroke'] ?? '',
				'strokeOpacity'   => $attributes['xGridOpacity'] ?? 0.2,
				'strokeWidth'     => 2, // Match block.json default
				'strokeDasharray' => $attributes['xGridStrokeDasharray'] ?? '',
			),
		);
	}

	/**
	 * Migrate dependent axis (Y-axis) attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated dependentAxis object.
	 */
	private static function migrate_dependent_axis( $attributes ) {
		$grid_opacity = $attributes['yGridOpacity'] ?? 0.2;
		$axis_stroke = $attributes['yAxisStroke'] ?? '';

		return array(
			'active'              => $attributes['yAxisActive'] ?? true,
			'label'               => $attributes['yLabel'] ?? '',
			'scale'               => $attributes['yScale'] ?? 'linear',
			'domain'              => array(
				$attributes['yMinDomain'] ?? 0,
				$attributes['yMaxDomain'] ?? 100,
			),
			'showZero'            => $attributes['showYMinDomainLabel'] ?? false,
			'tickMarksActive'     => $attributes['yTickMarksActive'] ?? true,
			'tickCount'           => $attributes['yTickNum'] ?? 5,
			'tickValues'          => self::parse_tick_values( $attributes['yTickExact'] ?? null ),
			'tickFormat'          => null,
			'tickAngle'           => $attributes['yTickLabelAngle'] ?? 0,
			'ticksToLocaleString' => $attributes['yTicksToLocaleString'] ?? false,
			'abbreviateTicks'     => $attributes['yAbbreviateTicks'] ?? true,
			'abbreviateTicksDecimals' => $attributes['yAbbreviateTicksDecimals'] ?? 0,
			'tickUnit'            => $attributes['yTickUnit'] ?? '',
			'tickUnitPosition'    => $attributes['yTickUnitPosition'] ?? 'end',
			'tickLabels'          => array(
				'fontSize'        => $attributes['yLabelFontSize'] ?? 12,
				'padding'         => 15,
				'angle'           => $attributes['yTickLabelAngle'] ?? 0,
				'dx'              => $attributes['yTickLabelDX'] ?? 0,
				'dy'              => $attributes['yTickLabelDY'] ?? 0,
				'textAnchor'      => $attributes['yTickLabelTextAnchor'] ?? 'end',
				'verticalAnchor'  => $attributes['yTickLabelVerticalAnchor'] ?? 'middle',
				'fill'            => $attributes['yLabelTextFill'] ?? 'rgba(35, 31, 32, 0.7)',
				'fontFamily'      => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				'maxWidth'        => $attributes['yTickLabelMaxWidth'] ?? 50,
			),
			'axisLabel'           => array(
				'fontSize'        => $attributes['yLabelFontSize'] ?? 12,
				'fill'            => $attributes['yLabelTextFill'] ?? 'rgba(35, 31, 32, 0.7)',
				'padding'         => $attributes['yLabelPadding'] ?? 30,
				'angle'           => 270,
				'dx'              => 0,
				'dy'              => 0,
				'textAnchor'      => 'middle',
				'verticalAnchor'  => 'middle',
				'fontFamily'      => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				'maxWidth'        => $attributes['yLabelMaxWidth'] ?? 200,
			),
			'axis'                => array(
				'stroke'      => $axis_stroke,
				'strokeWidth' => 1,
			),
			'ticks'               => array(
				'stroke'      => $axis_stroke,
				'size'        => ( $attributes['yTickMarksActive'] ?? true ) ? 5 : 0, // Default to true if not set (match block.json default)
				'strokeWidth' => 0, // Match block.json default
			),
			'grid'                => array(
				// Use empty string as default (old flat default was "")
				'stroke'          => $attributes['yGridStroke'] ?? '',
				'strokeOpacity'   => $grid_opacity,
				'strokeWidth'     => 1,
				'strokeDasharray' => $attributes['yGridStrokeDasharray'] ?? '',
			),
		);
	}

	/**
	 * Parse tick values string or array into array.
	 * Mirrors JavaScript parseTickValues function in v1.js
	 *
	 * @since 3.1.0
	 * @param mixed $tick_input Comma-separated string or array of tick values.
	 * @return array|null Array of tick values or null.
	 */
	private static function parse_tick_values( $tick_input ) {
		// Handle null/undefined
		if ( empty( $tick_input ) ) {
			return null;
		}

		// If already an array, return it
		if ( is_array( $tick_input ) ) {
			return count( $tick_input ) > 0 ? $tick_input : null;
		}

		// If it's a string, parse it
		if ( is_string( $tick_input ) ) {
			$trimmed = trim( $tick_input );
			if ( '' === $trimmed ) {
				return null;
			}

			// Split by comma and process each value
			$values = array_map( 'trim', explode( ',', $trimmed ) );
			$values = array_filter(
				$values,
				function( $v ) {
					return strlen( $v ) > 0;
				}
			);

			// Try to convert to numbers
			$values = array_map(
				function( $v ) {
					if ( is_numeric( $v ) ) {
						return strpos( $v, '.' ) !== false ? (float) $v : (int) $v;
					}
					return $v;
				},
				$values
			);

			return count( $values ) > 0 ? array_values( $values ) : null;
		}

		return null;
	}

	/**
	 * Migrate tooltip attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated tooltip object.
	 */
	private static function migrate_tooltip( $attributes ) {
		$font_size = isset( $attributes['tooltipFontSize'] ) ? $attributes['tooltipFontSize'] . 'px' : '13px';

		return array(
			'active'                => $attributes['tooltipActive'] ?? true,
			'headerActive'          => $attributes['tooltipHeaderActive'] ?? true,
			'headerValue'           => $attributes['tooltipHeaderValue'] ?? 'independentValue',
			'format'                => $attributes['tooltipFormat'] ?? '{{row}}: {{value}}',
			'offsetX'               => $attributes['tooltipOffsetX'] ?? 10,
			'offsetY'               => $attributes['tooltipOffsetY'] ?? 10,
			'abbreviateValue'       => false,
			'absoluteValue'         => $attributes['tooltipAbsoluteValue'] ?? false,
			'toFixedDecimal'        => 0,
			'toLocaleString'        => $attributes['tooltipFormatValue'] ?? true,
			'customFormat'          => null,
			'rlsFormat'             => false,
			'dateFormat'            => $attributes['tooltipDateFormat'] ?? '%-m/%Y',
			'caretPosition'         => $attributes['tooltipCaretPosition'] ?? null, // No default - let charting library decide
			'deemphasizeSiblings'   => $attributes['deemphasizeSiblings'] ?? false,
			'deemphasizeOpacity'    => $attributes['deemphasizeOpacity'] ?? 0.5,
			'emphasizeStrokeActive' => $attributes['emphasizeStrokeActive'] ?? false,
			'emphasizeStrokeColor'  => $attributes['emphasizeStrokeColor'] ?? 'black',
			'emphasizeStrokeWidth'  => $attributes['emphasizeStrokeWidth'] ?? 1,
			'style'                 => array(
				'minWidth'     => $attributes['tooltipMinWidth'] ?? 50,
				'maxWidth'     => $attributes['tooltipMaxWidth'] ?? 150,
				'maxHeight'    => $attributes['tooltipMaxHeight'] ?? 400,
				'minHeight'    => $attributes['tooltipMinHeight'] ?? 20,
				'width'        => 'auto',
				'height'       => 'auto',
				'fontSize'     => $font_size,
				'fontFamily'   => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
				'background'   => 'white',
				'border'       => '1px solid #CBCBCB',
				'padding'      => '10px',
				'borderRadius' => '0px',
				'color'        => 'black',
			),
		);
	}

	/**
	 * Migrate legend attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated legend object.
	 */
	private static function migrate_legend( $attributes ) {
		return array(
			'active'         => $attributes['legendActive'] ?? false,
			'orientation'    => $attributes['legendOrientation'] ?? 'row',
			'title'          => $attributes['legendTitle'] ?? '',
			'alignment'      => $attributes['legendAlignment'] ?? 'center',
			'offsetX'        => $attributes['legendOffsetX'] ?? 0,
			'offsetY'        => $attributes['legendOffsetY'] ?? 0,
			'markerStyle'    => $attributes['legendMarkerStyle'] ?? 'rect',
			'borderStroke'   => $attributes['legendBorderStroke'] ?? null, // No default - let charting library decide
			'fill'           => $attributes['legendFill'] ?? null, // No default - let charting library decide
			'categories'     => $attributes['legendCategories'] ?? array(),
			'labelDelimiter' => $attributes['legendLabelDelimiter'] ?? 'to',
			'labelLower'     => $attributes['legendLabelLower'] ?? 'Less than ',
			'labelUpper'     => $attributes['legendLabelUpper'] ?? 'More than ',
			'fontSize'       => $attributes['legendFontSize'] ?? 12,
			'margin'         => $attributes['legendMargin'] ?? array(
				'top'    => 0,
				'right'  => 5,
				'bottom' => 0,
				'left'   => 0,
			),
		);
	}

	/**
	 * Migrate labels attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated labels object.
	 */
	private static function migrate_labels( $attributes ) {
			return array(
			'active'                   => $attributes['labelsActive'] ?? false,
			'showFirstLastPointsOnly'  => $attributes['showFirstLastPointsOnly'] ?? false,
			'color'                    => $attributes['labelColor'] ?? 'inherit',
			'fontWeight'               => $attributes['labelFontWeight'] ?? 200,
			'fontSize'                 => $attributes['labelFontSize'] ?? 12,
			'fontFamily'               => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
			'labelPositionBar'         => $attributes['barLabelPosition'] ?? 'inside',
			'labelCutoff'              => $attributes['barLabelCutoff'] ?? 5,
			'labelPositionDX'          => $attributes['labelPositionDX'] ?? 0,
			'labelPositionDY'          => $attributes['labelPositionDY'] ?? 0,
			'pieLabelRadius'           => 60,
			'abbreviateValue'          => false,
			'absoluteValue'            => $attributes['labelAbsoluteValue'] ?? false,
			'toLocaleString'           => $attributes['labelFormatValue'] ?? true,
			'truncateDecimal'          => $attributes['labelTruncateDecimal'] ?? true,
			'toFixedDecimal'           => $attributes['labelToFixedDecimal'] ?? 0,
			'labelUnit'                => $attributes['labelUnit'] ?? '',
			'labelUnitPosition'        => $attributes['labelUnitPosition'] ?? 'end',
			'textAnchor'               => 'middle',
			'customLabelFormat'        => null,
		);
	}

	/**
	 * Migrate map attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated map object.
	 */
	private static function migrate_map( $attributes ) {
		return array(
			'ignoreSmallStateLabels' => $attributes['mapIgnoreSmallStateLabels'] ?? true,
			'ignoredLabels'          => $attributes['mapIgnoredLabels'] ?? array(),
			'abbreviateLabels'       => $attributes['mapAbbreviateLabels'] ?? true,
			'pathBackgroundFill'     => $attributes['mapPathBackgroundFill'] ?? '#f7f7f7',
			'pathStroke'             => $attributes['mapPathStroke'] ?? '#d3d3d3',
			'pathStrokeWidth'        => 0.5,
			'blockRectSize'          => $attributes['mapBlockRectSize'] ?? 44,
			'showCountyBoundaries'   => $attributes['showCountyBoundaries'] ?? true,
			'showStateBoundaries'    => $attributes['mapShowStateBoundaries'] ?? true,
			'projectionPreset'       => $attributes['mapProjectionPreset'] ?? 'default',
			'topologyRegion'         => $attributes['mapTopologyRegion'] ?? 'default',
			'centerLongitude'        => $attributes['mapCenterLongitude'] ?? 0,
			'centerLatitude'         => $attributes['mapCenterLatitude'] ?? 0,
			'rotateLambda'           => $attributes['mapRotateLambda'] ?? 0,
			'rotatePhi'              => $attributes['mapRotatePhi'] ?? 0,
			'rotateGamma'            => $attributes['mapRotateGamma'] ?? 0,
			'customScale'            => $attributes['mapCustomScale'] ?? 1,
			'zoomActive'             => $attributes['mapZoomActive'] ?? false,
		);
	}

	/**
	 * Migrate diverging bar attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated divergingBar object.
	 */
	private static function migrate_diverging_bar( $attributes ) {
		$percent = isset( $attributes['divergingBarPercentOfInnerWidth'] )
			? $attributes['divergingBarPercentOfInnerWidth'] / 100
			: 0.7;

		return array(
			'positiveCategories'  => $attributes['positiveCategories'] ?? array(),
			'negativeCategories'  => $attributes['negativeCategories'] ?? array(),
			'percentOfInnerWidth' => $percent,
			'neutralBar'          => array(
				'active'           => $attributes['neutralBarActive'] ?? true,
				'category'         => $attributes['neutralCategory'] ?? '',
				'offsetX'          => $attributes['neutralBarOffsetX'] ?? 0,
				'separator'        => $attributes['neutralBarSeparator'] ?? true,
				'separatorOffsetX' => $attributes['neutralBarSeparatorOffsetX'] ?? -1,
			),
		);
	}

	/**
	 * Migrate diff column attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated diffColumn object.
	 */
	private static function migrate_diff_column( $attributes ) {
		$appearance  = $attributes['diffColumnAppearance'] ?? 'normal';
		$font_weight = in_array( $appearance, array( 'bold', 'bold-italic' ), true ) ? 'bold' : 'normal';
		$font_style  = in_array( $appearance, array( 'italic', 'bold-italic' ), true ) ? 'italic' : 'normal';

		return array(
			'active'       => $attributes['diffColumnActive'] ?? false,
			'category'     => $attributes['diffColumnCategory'] ?? '',
			'columnHeader' => $attributes['diffColumnHeader'] ?? '',
			'style'        => array(
				'marginLeft'      => $attributes['diffColumnMarginLeft'] ?? 10,
				'width'           => $attributes['diffColumnWidth'] ?? 30,
				'heightOffset'    => $attributes['diffColumnHeightOffset'] ?? 0,
				'rectStrokeWidth' => 0,
				'rectStrokeColor' => 'white',
				'rectFill'        => $attributes['diffColumnBackgroundColor'] ?? '',
				'fontWeight'      => $font_weight,
				'fontStyle'       => $font_style,
				'headerFontSize'  => '12px',
			),
		);
	}

	/**
	 * Migrate data render attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated dataRender object.
	 */
	private static function migrate_data_render( $attributes ) {
		return array(
			'x'                        => $attributes['dataRenderX'] ?? 'x',
			'y'                        => $attributes['dataRenderY'] ?? 'y',
			'sortKey'                  => $attributes['sortKey'] ?? 'x',
			'sortOrder'                => $attributes['sortOrder'] ?? 'none',
			'categories'               => $attributes['categories'] ?? array(),
			'scales'                   => array(
				'x' => $attributes['xScale'] ?? 'linear',
				'y' => $attributes['yScale'] ?? 'linear',
			),
			'xFormat'                  => $attributes['dateInputFormat'] ?? null,
			'yFormat'                  => $attributes['yFormat'] ?? null,
			'numberFormat'             => $attributes['numberFormat'] ?? 'en-US',
			'isHighlightedColor'       => $attributes['isHighlightedColor'] ?? '#ECDBAC',
			'mapScale'                 => $attributes['mapScale'] ?? 'threshold',
			'mapScaleDomain'           => $attributes['mapScaleDomain'] ?? array( 10, 20, 30, 40, 50 ),
			'groupBreaksActive'        => $attributes['groupBreaksActive'] ?? false,
			'groupBreaksCategory'      => $attributes['groupBreaksCategory'] ?? '',
			'groupBreaksCategoryValues' => $attributes['groupBreaksCategoryValues'] ?? array(),
			'groupBreaks'              => $attributes['groupBreaks'] ?? false,
		);
	}

	/**
	 * Migrate IO (WordPress-specific) attributes.
	 *
	 * @since 3.1.0
	 * @param array $attributes The v1 attributes.
	 * @return array The migrated io object.
	 */
	private static function migrate_io( $attributes ) {
		return array(
			'isConvertedChart'      => $attributes['isConvertedChart'] ?? false,
			'isStaticChart'         => $attributes['isStaticChart'] ?? false,
			'isFreeformChart'       => $attributes['isFreeformChart'] ?? false,
			'staticImageId'         => $attributes['staticImageId'] ?? '',
			'staticImageUrl'        => $attributes['staticImageUrl'] ?? '',
			'staticImageInnerHTML'  => $attributes['staticImageInnerHTML'] ?? '',
			'chartConverted'        => $attributes['chartConverted'] ?? array(
				'converted' => false,
				'requester' => '',
				'timestamp' => '',
			),
			'defaultShouldRender'   => $attributes['defaultShouldRender'] ?? true,
			'lock'                  => $attributes['lock'] ?? array(
				'move'   => true,
				'remove' => false,
			),
			'colorValue'            => $attributes['colorValue'] ?? 'general',
			'customColors'          => $attributes['customColors'] ?? array(),
			'chartFamily'           => $attributes['chartFamily'] ?? 'chart',
			'chartData'             => $attributes['chartData'] ?? array(),
			'tableData'             => $attributes['tableData'] ?? '',
			'hasPreformattedData'   => $attributes['hasPreformattedData'] ?? false,
			'preformattedData'      => $attributes['preformattedData'] ?? array(),
			'tabsActive'            => $attributes['tabsActive'] ?? false,
			'allowDataDownload'     => $attributes['allowDataDownload'] ?? true,
			'elementHasStroke'      => $attributes['elementHasStroke'] ?? false,
			'isCustomChart'         => $attributes['isCustomChart'] ?? false,
			'customAttributes'      => $attributes['customAttributes'] ?? array(),
			'independentVariable'   => $attributes['independentVariable'] ?? '',
			'availableCategories'   => $attributes['availableCategories'] ?? array(),
			'questionWordingActive' => $attributes['questionWordingActive'] ?? false,
			'questionWording'       => $attributes['questionWording'] ?? '',
		);
	}
}

/**
 * WP-CLI command for block migration.
 *
 * @since 3.0.1
 */
if ( defined( 'WP_CLI' ) && WP_CLI && class_exists( 'WPCOM_VIP_CLI_Command' ) ) {
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
		 *     wp prc chart-builder migrate --dry-run
		 *
		 *     # Run the actual migration
		 *     wp prc chart-builder migrate
		 *
		 *     # Process only 500 posts starting from offset 1000
		 *     wp prc chart-builder migrate --offset=1000 --limit=500
		 *
		 *     # Resume from where the last run left off
		 *     wp prc chart-builder migrate --resume
		 *
		 *     # Migrate single post by ID
		 *     wp prc chart-builder migrate --post-id=123
		 *
		 *     # Target a specific site (use WP-CLI --url parameter)
		 *     wp prc chart-builder migrate --url=https://example.com
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
		 *     wp prc chart-builder status
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
		 *     wp prc chart-builder reset
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
		 *     wp prc chart-builder test "<!-- wp:prc-block/chart -->"
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

		/**
		 * Debug command to see what posts and blocks exist.
		 *
		 * ## OPTIONS
		 *
		 * [--limit=<number>]
		 * : Limit the number of posts to show. Default: 10
		 *
		 * ## EXAMPLES
		 *
		 *     # Show posts with chart-related blocks
		 *     wp prc chart-builder debug
		 *
		 * @subcommand debug
		 * @synopsis [--limit=<number>]
		 */
		public function debug( $args, $assoc_args ) {
			global $wpdb;

			$limit = isset( $assoc_args['limit'] ) ? intval( $assoc_args['limit'] ) : 10;

			WP_CLI::line( 'Debug: Searching for posts with chart-related blocks...' );
			WP_CLI::line( '' );

			// Search for posts with old block names
			$old_blocks_query = $wpdb->prepare(
				"SELECT ID, post_title, post_type, post_content FROM {$wpdb->posts}
				WHERE post_status = 'publish'
				AND (post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s)
				ORDER BY ID
				LIMIT %d",
				'%prc-block/chart%',
				'%prc-block/chart-builder-controller%',
				'%prc-block/chart-builder%',
				$limit
			);

			$old_blocks_posts = $wpdb->get_results( $old_blocks_query );

			WP_CLI::line( sprintf( 'Found %d posts with OLD block names:', count( $old_blocks_posts ) ) );
			foreach ( $old_blocks_posts as $post ) {
				WP_CLI::line( sprintf( '  ID: %d, Title: %s, Type: %s', $post->ID, $post->post_title, $post->post_type ) );
			}

			WP_CLI::line( '' );

			// Search for posts with new block names
			$new_blocks_query = $wpdb->prepare(
				"SELECT ID, post_title, post_type, post_content FROM {$wpdb->posts}
				WHERE post_status = 'publish'
				AND (post_content LIKE %s OR post_content LIKE %s OR post_content LIKE %s)
				ORDER BY ID
				LIMIT %d",
				'%prc-chart-builder/synced-chart%',
				'%prc-chart-builder/controller%',
				'%prc-chart-builder/chart%',
				$limit
			);

			$new_blocks_posts = $wpdb->get_results( $new_blocks_query );

			WP_CLI::line( sprintf( 'Found %d posts with NEW block names:', count( $new_blocks_posts ) ) );
			foreach ( $new_blocks_posts as $post ) {
				WP_CLI::line( sprintf( '  ID: %d, Title: %s, Type: %s', $post->ID, $post->post_title, $post->post_type ) );
			}

			WP_CLI::line( '' );

			// Search for any posts with "chart" in the content
			$any_chart_query = $wpdb->prepare(
				"SELECT ID, post_title, post_type FROM {$wpdb->posts}
				WHERE post_status = 'publish'
				AND post_content LIKE %s
				ORDER BY ID
				LIMIT %d",
				'%chart%',
				$limit
			);

			$any_chart_posts = $wpdb->get_results( $any_chart_query );

			WP_CLI::line( sprintf( 'Found %d posts with "chart" in content:', count( $any_chart_posts ) ) );
			foreach ( $any_chart_posts as $post ) {
				WP_CLI::line( sprintf( '  ID: %d, Title: %s, Type: %s', $post->ID, $post->post_title, $post->post_type ) );
			}

			WP_CLI::line( '' );
			WP_CLI::line( 'Total posts in database: ' . $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_status = 'publish'" ) );
		}

	}


	WP_CLI::add_command( 'prc chart-builder', '\PRC\Platform\Chart_Builder\PRC_Chart_Builder_Migration_CLI_Command' );
}
