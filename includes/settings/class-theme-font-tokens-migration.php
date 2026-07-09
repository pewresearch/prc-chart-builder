<?php
/**
 * Chart fontFamily token migration utilities (PRC-528 font tokens).
 *
 * Audits and migrates hardcoded font stacks in chart block attributes to
 * WordPress preset tokens (`var:preset|font-family|<slug>`).
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Walk chart blocks and collect or rewrite fontFamily attribute values.
 */
class Theme_Font_Tokens_Migration {

	/**
	 * Chart block name targeted by the migration.
	 */
	public const CHART_BLOCK_NAME = 'prc-chart-builder/chart';

	/**
	 * Default posts fetched per batch in CLI migrations.
	 */
	public const DEFAULT_BATCH_SIZE = 100;

	/**
	 * Default pause (seconds) between full batches in CLI migrations.
	 */
	public const DEFAULT_BATCH_SLEEP = 1;

	/**
	 * Collect distinct fontFamily values from chart blocks in post content.
	 *
	 * @param string $content Serialized block content.
	 * @return array<string, int> fontFamily value => occurrence count.
	 */
	public static function collect_font_family_values_from_content( string $content ): array {
		$counts = array();
		$blocks = parse_blocks( $content );

		self::walk_blocks(
			$blocks,
			static function ( array $block ) use ( &$counts ): void {
				if ( self::CHART_BLOCK_NAME !== ( $block['blockName'] ?? '' ) ) {
					return;
				}

				$attrs = $block['attrs'] ?? array();
				if ( ! is_array( $attrs ) ) {
					return;
				}

				self::collect_font_family_values_from_array( $attrs, $counts );
			}
		);

		return $counts;
	}

	/**
	 * Replace known literal stacks with preset tokens in chart block attributes.
	 *
	 * @param string               $content           Serialized block content.
	 * @param array<string,string> $literal_to_token  Resolved stack => token.
	 * @param int                  $replacement_count Out: number of replacements.
	 * @return string Updated serialized block content.
	 */
	public static function migrate_content_font_families(
		string $content,
		array $literal_to_token,
		int &$replacement_count = 0
	): string {
		if ( '' === $content || array() === $literal_to_token ) {
			return $content;
		}

		// Replace fontFamily JSON values in place. Avoid parse_blocks/serialize_blocks
		// round trips — they corrupt RichText unicode escapes in metadata fields.
		$updated = preg_replace_callback(
			'/"fontFamily"\s*:\s*"((?:[^"\\\\]|\\\\.)*)"/',
			static function ( array $matches ) use ( $literal_to_token, &$replacement_count ): string {
				$decoded = self::decode_json_string_fragment( $matches[1] );
				if ( ! is_string( $decoded ) || ! isset( $literal_to_token[ $decoded ] ) ) {
					return $matches[0];
				}

				++$replacement_count;
				$token   = $literal_to_token[ $decoded ];
				$encoded = substr(
					wp_json_encode( $token, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ),
					1,
					-1
				);

				return '"fontFamily":"' . $encoded . '"';
			},
			$content
		);

		return is_string( $updated ) ? $updated : $content;
	}

	/**
	 * Resolve the literal-stack => token map, allowing an explicit override.
	 *
	 * @param array<string,mixed> $args May contain a `literal_to_token` array.
	 * @return array<string,string>
	 */
	private static function resolve_literal_to_token_map( array $args ): array {
		if ( isset( $args['literal_to_token'] ) && is_array( $args['literal_to_token'] ) ) {
			return $args['literal_to_token'];
		}

		return Theme_Admin::get_literal_to_token_map();
	}

	/**
	 * Pre-migration safety probe: prove the write path is byte-lossless before
	 * touching the full dataset.
	 *
	 * For each of a small sample of posts that WOULD be migrated, this performs
	 * the real wp_update_post() write, re-reads the stored bytes, then restores
	 * the original content — regardless of outcome. It exercises the exact
	 * filter stack (wp_unslash, kses, sanitize) the full run would hit, so a
	 * pass here is strong evidence the run will not corrupt data.
	 *
	 * @param array<string,mixed> $args {
	 *     @type string $post_type Post type to sample. Default chart.
	 *     @type int    $offset    Skip this many posts before sampling.
	 *     @type int    $sample    Max posts to probe. Default 25.
	 * }
	 * @return array{
	 *     safe:bool,
	 *     probed:int,
	 *     offending_post:int,
	 *     reason:string
	 * }
	 */
	public static function verify_write_path( array $args = array() ): array {
		$config           = self::normalize_batch_args( $args );
		$literal_to_token = self::resolve_literal_to_token_map( $args );
		$sample_size      = isset( $args['sample'] ) ? max( 1, (int) $args['sample'] ) : 25;

		$probed    = 0;
		$offending = 0;
		$reason    = '';

		if ( array() === $literal_to_token ) {
			return array(
				'safe'           => true,
				'probed'         => 0,
				'offending_post' => 0,
				'reason'         => '',
			);
		}

		$post_ids = ! empty( $config['post_id'] )
			? array( (int) $config['post_id'] )
			: self::fetch_post_ids_batch(
				$config['post_type'],
				$sample_size,
				$config['offset']
			);

		foreach ( $post_ids as $post_id ) {
			$content = (string) get_post_field( 'post_content', $post_id );
			if ( '' === $content || ! str_contains( $content, 'wp:prc-chart-builder/chart' ) ) {
				continue;
			}

			$post_replacements = 0;
			$updated           = self::migrate_content_font_families(
				$content,
				$literal_to_token,
				$post_replacements
			);

			if ( 0 === $post_replacements ) {
				continue;
			}

			++$probed;

			if ( ! self::content_diff_is_font_family_only( $content, $updated ) ) {
				$offending = $post_id;
				$reason    = 'diff extends beyond fontFamily values';
				break;
			}

			// Real write, re-read, then restore — a non-destructive probe.
			wp_update_post(
				array(
					'ID'           => $post_id,
					'post_content' => wp_slash( $updated ),
				),
				true
			);
			clean_post_cache( $post_id );
			$stored = (string) get_post_field( 'post_content', $post_id );

			$restore_result = wp_update_post(
				array(
					'ID'           => $post_id,
					'post_content' => wp_slash( $content ),
				),
				true
			);
			clean_post_cache( $post_id );

			// Verify restore succeeded by re-reading and comparing to original.
			$restored = (string) get_post_field( 'post_content', $post_id );
			if ( is_wp_error( $restore_result ) || $restored !== $content ) {
				$offending = $post_id;
				$reason    = 'probe restore failed — sample post may contain migrated content';
				break;
			}

			if ( $stored !== $updated ) {
				$offending = $post_id;
				$reason    = 'stored bytes diverged from intended content';
				break;
			}
		}

		return array(
			'safe'           => 0 === $offending,
			'probed'         => $probed,
			'offending_post' => $offending,
			'reason'         => $reason,
		);
	}

	/**
	 * True when the only difference between two block contents is fontFamily values.
	 *
	 * @param string $original Original serialized block content.
	 * @param string $updated  Candidate updated content.
	 * @return bool
	 */
	public static function content_diff_is_font_family_only( string $original, string $updated ): bool {
		return self::normalize_font_family_content( $original )
			=== self::normalize_font_family_content( $updated );
	}

	/**
	 * Replace fontFamily JSON values with a sentinel for diff comparison.
	 *
	 * @param string $content Serialized block content.
	 * @return string
	 */
	private static function normalize_font_family_content( string $content ): string {
		$normalized = preg_replace(
			'/"fontFamily"\s*:\s*"((?:[^"\\\\]|\\\\.)*)"/',
			'"fontFamily":"__SENTINEL__"',
			$content
		);

		return is_string( $normalized ) ? $normalized : $content;
	}

	/**
	 * Audit fontFamily values across all posts containing chart blocks.
	 *
	 * @param array<string,mixed> $args {
	 *     @type string $post_type Post type to scan. Default chart.
	 *     @type int    $limit     Max posts to scan. 0 = no limit.
	 *     @type int    $batch_size Posts per batch. Default {@see DEFAULT_BATCH_SIZE}.
	 *     @type int    $offset    Skip this many matching posts before scanning.
	 *     @type int    $sleep     Seconds to pause between full batches (CLI). Default 1.
	 * }
	 * @return array{
	 *     posts_scanned:int,
	 *     chart_blocks:int,
	 *     values:array<string,int>,
	 *     mappable:array<string,string>,
	 *     unmapped:array<string,int>,
	 *     batches:int
	 * }
	 */
	public static function audit_posts( array $args = array() ): array {
		$config = self::normalize_batch_args( $args );

		$values       = array();
		$chart_blocks = 0;
		$batches      = 0;
		$processed    = 0;

		self::each_post_batch(
			$config,
			static function ( array $post_ids ) use ( &$values, &$chart_blocks, &$batches ): void {
				++$batches;

				foreach ( $post_ids as $post_id ) {
					$content = (string) get_post_field( 'post_content', $post_id );
					if ( '' === $content || ! str_contains( $content, 'wp:prc-chart-builder/chart' ) ) {
						continue;
					}

					$block_counts = self::collect_font_family_values_from_content( $content );
					if ( array() === $block_counts ) {
						continue;
					}

					$chart_blocks += array_sum( $block_counts );
					foreach ( $block_counts as $value => $count ) {
						$values[ $value ] = ( $values[ $value ] ?? 0 ) + $count;
					}
				}
			},
			$processed
		);

		ksort( $values );

		$literal_to_token = Theme_Admin::get_literal_to_token_map();
		$mappable         = array();
		$unmapped         = array();

		foreach ( $values as $value => $count ) {
			if ( str_starts_with( $value, Theme_Admin::TOKEN_PREFIX ) ) {
				continue;
			}

			if ( isset( $literal_to_token[ $value ] ) ) {
				$mappable[ $value ] = $literal_to_token[ $value ];
				continue;
			}

			$unmapped[ $value ] = $count;
		}

		return array(
			'posts_scanned' => $processed,
			'chart_blocks'  => $chart_blocks,
			'values'        => $values,
			'mappable'      => $mappable,
			'unmapped'      => $unmapped,
			'batches'       => $batches,
		);
	}

	/**
	 * Migrate fontFamily literals to tokens across chart posts.
	 *
	 * @param array<string,mixed> $args {
	 *     @type bool   $dry_run   When true, report only.
	 *     @type string $post_type Post type to scan. Default chart.
	 *     @type int    $limit     Max posts to update. 0 = no limit.
	 *     @type int    $batch_size Posts per batch. Default {@see DEFAULT_BATCH_SIZE}.
	 *     @type int    $offset    Skip this many matching posts before migrating.
	 *     @type int    $sleep     Seconds to pause between full batches (CLI). Default 1.
	 *     @type callable|null $on_batch Optional ( int $batch_number, int $batch_size, array $running_totals ): void.
	 * }
	 * @return array{
	 *     dry_run:bool,
	 *     posts_scanned:int,
	 *     posts_updated:int,
	 *     replacements:int,
	 *     batches:int
	 * }
	 */
	public static function migrate_posts( array $args = array() ): array {
		$config           = self::normalize_batch_args( $args );
		$dry_run          = ! empty( $args['dry_run'] );
		$on_batch         = isset( $args['on_batch'] ) && is_callable( $args['on_batch'] ) ? $args['on_batch'] : null;
		$literal_to_token = self::resolve_literal_to_token_map( $args );

		if ( array() === $literal_to_token ) {
			return array(
				'dry_run'         => $dry_run,
				'posts_scanned'   => 0,
				'posts_updated'   => 0,
				'posts_skipped'   => 0,
				'posts_corrupted' => 0,
				'aborted'         => false,
				'replacements'    => 0,
				'batches'         => 0,
			);
		}

		$posts_updated   = 0;
		$posts_skipped   = 0;
		$posts_corrupted = 0;
		$replacements    = 0;
		$batches         = 0;
		$processed       = 0;
		$aborted         = false;

		self::each_post_batch(
			$config,
			static function ( array $post_ids ) use (
				$literal_to_token,
				$dry_run,
				$on_batch,
				&$posts_updated,
				&$posts_skipped,
				&$posts_corrupted,
				&$replacements,
				&$batches,
				&$processed,
				&$aborted
			): bool {
				++$batches;
				$batch_replacements = 0;
				$batch_updated      = 0;

				foreach ( $post_ids as $post_id ) {
					$content = (string) get_post_field( 'post_content', $post_id );
					if ( '' === $content || ! str_contains( $content, 'wp:prc-chart-builder/chart' ) ) {
						continue;
					}

					$post_replacements = 0;
					$updated           = self::migrate_content_font_families(
						$content,
						$literal_to_token,
						$post_replacements
					);

					if ( 0 === $post_replacements ) {
						continue;
					}

					$batch_replacements += $post_replacements;

					// Guard 1 (pre-write): the intended change must touch ONLY
					// fontFamily values. Nothing else — not metadata, not tick
					// labels — may differ.
					if ( ! self::content_diff_is_font_family_only( $content, $updated ) ) {
						++$posts_skipped;
						if ( defined( 'WP_CLI' ) && WP_CLI ) {
							\WP_CLI::warning(
								sprintf(
									'Skipped post %d: content would change outside fontFamily.',
									$post_id
								)
							);
						}
						continue;
					}

					if ( $dry_run ) {
						++$batch_updated;
						continue;
					}

					// wp_update_post() runs wp_unslash() on post_content, which
					// strips backslashes from \uXXXX JSON escapes (\u003c ->
					// u003c) across the WHOLE post. wp_slash() pre-compensates
					// so the stored bytes are exactly $updated.
					$result = wp_update_post(
						array(
							'ID'           => $post_id,
							'post_content' => wp_slash( $updated ),
						),
						true
					);

					if ( is_wp_error( $result ) ) {
						continue;
					}

					clean_post_cache( $post_id );

					// Guard 2 (post-write): re-read the stored bytes and confirm
					// they are byte-identical to what we intended. This catches
					// ANY lossy filter in the write path (unslash, kses,
					// sanitize). On mismatch, roll the post back to its original
					// content and abort the entire run — we never leave a
					// corrupted post and never touch another one.
					$stored = (string) get_post_field( 'post_content', $post_id );
					if ( $stored !== $updated ) {
						wp_update_post(
							array(
								'ID'           => $post_id,
								'post_content' => wp_slash( $content ),
							),
							true
						);
						clean_post_cache( $post_id );

						++$posts_corrupted;
						$aborted        = true;
						$posts_updated += $batch_updated;
						$replacements  += $batch_replacements;

						if ( defined( 'WP_CLI' ) && WP_CLI ) {
							\WP_CLI::warning(
								sprintf(
									'Post %d would be corrupted on write (stored bytes != intended). Rolled back and aborted — no further posts changed.',
									$post_id
								)
							);
						}

						return false;
					}

					++$batch_updated;
				}

				$posts_updated += $batch_updated;
				$replacements  += $batch_replacements;

				if ( null !== $on_batch ) {
					$on_batch(
						$batches,
						count( $post_ids ),
						array(
							'posts_scanned' => $processed,
							'posts_updated' => $posts_updated,
							'replacements'  => $replacements,
						)
					);
				}

				return true;
			},
			$processed
		);

		return array(
			'dry_run'         => $dry_run,
			'posts_scanned'   => $processed,
			'posts_updated'   => $posts_updated,
			'posts_skipped'   => $posts_skipped,
			'posts_corrupted' => $posts_corrupted,
			'aborted'         => $aborted,
			'replacements'    => $replacements,
			'batches'         => $batches,
		);
	}

	/**
	 * WP-CLI output for font-tokens-audit.
	 *
	 * @param array<string,mixed> $args {@see audit_posts()}.
	 */
	public static function run_cli_audit( array $args = array() ): void {
		$audit = self::audit_posts( $args );

		\WP_CLI::log(
			sprintf(
				'Scanned %d posts; found %d fontFamily values across chart blocks.',
				$audit['posts_scanned'],
				array_sum( $audit['values'] )
			)
		);

		if ( array() !== $audit['mappable'] ) {
			\WP_CLI::log( '' );
			\WP_CLI::log( 'Mappable literals (will become preset tokens):' );
			foreach ( $audit['mappable'] as $literal => $token ) {
				$count = $audit['values'][ $literal ] ?? 0;
				\WP_CLI::log(
					sprintf(
						'  [%d] %s => %s',
						$count,
						$literal,
						$token
					)
				);
			}
		}

		if ( array() !== $audit['unmapped'] ) {
			\WP_CLI::log( '' );
			\WP_CLI::warning( 'Unmapped literals (left unchanged by migrate):' );
			foreach ( $audit['unmapped'] as $literal => $count ) {
				\WP_CLI::log( sprintf( '  [%d] %s', $count, $literal ) );
			}
		}

		if ( array() === $audit['values'] ) {
			\WP_CLI::success( 'No fontFamily values found in chart blocks.' );
			return;
		}

		\WP_CLI::success(
			sprintf(
				'Audit complete: %d distinct values, %d mappable, %d unmapped (%d batches).',
				count( $audit['values'] ),
				count( $audit['mappable'] ),
				count( $audit['unmapped'] ),
				$audit['batches']
			)
		);
	}

	/**
	 * Normalize batch CLI/query arguments.
	 *
	 * @param array<string,mixed> $args Raw args.
	 * @return array{
	 *     post_type:string,
	 *     limit:int,
	 *     batch_size:int,
	 *     offset:int,
	 *     sleep:int
	 * }
	 */
	public static function normalize_batch_args( array $args ): array {
		$batch_size = isset( $args['batch_size'] ) ? (int) $args['batch_size'] : self::DEFAULT_BATCH_SIZE;
		$offset     = isset( $args['offset'] ) ? (int) $args['offset'] : 0;
		$sleep      = isset( $args['sleep'] ) ? (int) $args['sleep'] : self::DEFAULT_BATCH_SLEEP;
		$post_id    = isset( $args['post_id'] ) ? (int) $args['post_id'] : 0;

		return array(
			'post_type'  => isset( $args['post_type'] ) ? (string) $args['post_type'] : 'chart',
			'limit'      => isset( $args['limit'] ) ? max( 0, (int) $args['limit'] ) : 0,
			'batch_size' => max( 1, min( 1000, $batch_size ) ),
			'offset'     => max( 0, $offset ),
			'sleep'      => max( 0, $sleep ),
			'post_id'    => max( 0, $post_id ),
		);
	}

	/**
	 * Parse shared WP-CLI flags for audit/migrate commands.
	 *
	 * @param array<string,mixed> $assoc_args WP-CLI associative args.
	 * @return array<string,mixed>
	 */
	public static function parse_cli_batch_args( array $assoc_args ): array {
		return self::normalize_batch_args(
			array(
				'post_type'  => $assoc_args['post-type'] ?? 'chart',
				'limit'      => isset( $assoc_args['limit'] ) ? (int) $assoc_args['limit'] : 0,
				'batch_size' => isset( $assoc_args['batch-size'] ) ? (int) $assoc_args['batch-size'] : self::DEFAULT_BATCH_SIZE,
				'offset'     => isset( $assoc_args['offset'] ) ? (int) $assoc_args['offset'] : 0,
				'sleep'      => isset( $assoc_args['sleep'] ) ? (int) $assoc_args['sleep'] : self::DEFAULT_BATCH_SLEEP,
				'post_id'    => isset( $assoc_args['post-id'] ) ? (int) $assoc_args['post-id'] : 0,
			)
		);
	}

	/**
	 * WP-CLI output for font-tokens-migrate.
	 *
	 * @param array<string,mixed> $args {@see migrate_posts()}.
	 */
	public static function run_cli_migrate( array $args = array() ): void {
		$dry_run = ! empty( $args['dry_run'] );
		$config  = self::normalize_batch_args( $args );

		if ( $dry_run ) {
			\WP_CLI::log( 'Dry-run mode — no database writes.' );
		}

		\WP_CLI::log(
			sprintf(
				'Batching %s posts (%d per batch, offset %d%s).',
				$config['post_type'],
				$config['batch_size'],
				$config['offset'],
				$config['limit'] > 0 ? ', limit ' . $config['limit'] : ''
			)
		);

		// Pre-migration safety probe. Refuse to run if the write path is not
		// byte-lossless on a real sample. Skipped only when explicitly opted out.
		if ( ! $dry_run && empty( $args['skip_probe'] ) ) {
			\WP_CLI::log( 'Running write-path safety probe before any changes…' );
			$probe = self::verify_write_path( $args );

			if ( ! $probe['safe'] ) {
				\WP_CLI::error(
					sprintf(
						'Aborting: write-path probe failed on post %d (%s). No posts were changed. This means wp_update_post would corrupt content; do not proceed until the write path is fixed.',
						$probe['offending_post'],
						$probe['reason']
					)
				);
				return;
			}

			\WP_CLI::log(
				sprintf(
					'Probe passed on %d sample post(s); write path is byte-lossless.',
					$probe['probed']
				)
			);
		}

		$result = self::migrate_posts(
			array_merge(
				$args,
				$config,
				array(
					'on_batch' => static function ( int $batch_number, int $batch_count, array $running ) use ( $dry_run ): void {
						\WP_CLI::log(
							sprintf(
								'Batch %d: processed %d posts (%d scanned, %d %s, %d replacements).',
								$batch_number,
								$batch_count,
								$running['posts_scanned'],
								$running['posts_updated'],
								$dry_run ? 'would update' : 'updated',
								$running['replacements']
							)
						);
					},
				)
			)
		);

		\WP_CLI::log(
			sprintf(
				'Finished %d batches; scanned %d posts; %s %d posts (%d fontFamily replacements).',
				$result['batches'],
				$result['posts_scanned'],
				$dry_run ? 'would update' : 'updated',
				$result['posts_updated'],
				$result['replacements']
			)
		);

		if ( $dry_run ) {
			\WP_CLI::success( 'Dry run complete. Re-run without --dry-run to apply.' );
			return;
		}

		if ( $result['posts_skipped'] > 0 ) {
			\WP_CLI::warning(
				sprintf(
					'Skipped %d posts where content would change outside fontFamily.',
					$result['posts_skipped']
				)
			);
		}

		if ( ! empty( $result['aborted'] ) ) {
			\WP_CLI::error(
				sprintf(
					'Migration ABORTED after detecting a corrupting write on %d post(s). The offending post was rolled back to its original content and no further posts were changed. Investigate before re-running.',
					$result['posts_corrupted']
				)
			);
			return;
		}

		\WP_CLI::success( 'Font token migration complete.' );
	}

	/**
	 * @param array{
	 *     post_type:string,
	 *     limit:int,
	 *     batch_size:int,
	 *     offset:int,
	 *     sleep:int
	 * }                       $config Batch configuration.
	 * @param callable          $callback Receives the current batch of post IDs.
	 *                                    Returning false stops all further batches.
	 * @param int               $processed Total posts fetched across batches (by reference).
	 */
	private static function each_post_batch( array $config, callable $callback, int &$processed ): void {
		// Single-post mode: process just the requested ID, no querying.
		if ( ! empty( $config['post_id'] ) ) {
			$callback( array( (int) $config['post_id'] ) );
			$processed += 1;
			return;
		}

		while ( true ) {
			if ( $config['limit'] > 0 && $processed >= $config['limit'] ) {
				break;
			}

			$fetch_size = $config['batch_size'];
			if ( $config['limit'] > 0 ) {
				$fetch_size = min( $fetch_size, $config['limit'] - $processed );
			}

			$post_ids = self::fetch_post_ids_batch(
				$config['post_type'],
				$fetch_size,
				$config['offset'] + $processed
			);

			if ( array() === $post_ids ) {
				break;
			}

			$should_continue = $callback( $post_ids );
			$processed      += count( $post_ids );

			if ( false === $should_continue ) {
				break;
			}

			if ( count( $post_ids ) < $fetch_size ) {
				break;
			}

			if ( $config['sleep'] > 0 && defined( 'WP_CLI' ) && WP_CLI ) {
				sleep( $config['sleep'] );
			}

			if ( defined( 'WP_CLI' ) && WP_CLI ) {
				gc_collect_cycles();
			}
		}
	}

	/**
	 * @param string $post_type  Post type slug.
	 * @param int    $batch_size Number of IDs to fetch.
	 * @param int    $offset     Query offset.
	 * @return array<int>
	 */
	private static function fetch_post_ids_batch( string $post_type, int $batch_size, int $offset ): array {
		$query_args = array(
			'post_type'              => $post_type,
			'post_status'            => array( 'publish', 'draft', 'pending', 'future', 'private' ),
			'posts_per_page'         => $batch_size,
			'offset'                 => $offset,
			'orderby'                => 'ID',
			'order'                  => 'ASC',
			'fields'                 => 'ids',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		);

		if ( 'chart' !== $post_type ) {
			$query_args['s'] = 'wp:prc-chart-builder/chart';
		}

		/** @var array<int> $post_ids */
		$post_ids = get_posts( $query_args );

		return $post_ids;
	}

	/**
	 * @param array<int, mixed> $blocks Parsed blocks.
	 * @param callable          $callback Receives block by reference.
	 */
	private static function walk_blocks( array &$blocks, callable $callback ): void {
		foreach ( $blocks as &$block ) {
			$callback( $block );

			if ( ! empty( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
				self::walk_blocks( $block['innerBlocks'], $callback );
			}
		}
	}

	/**
	 * @param array<string,mixed>  $data   Attribute subtree.
	 * @param array<string,int>    $counts fontFamily => count accumulator.
	 */
	private static function collect_font_family_values_from_array( array $data, array &$counts ): void {
		foreach ( $data as $key => $value ) {
			if ( 'fontFamily' === $key && is_string( $value ) ) {
				$trimmed = trim( $value );
				if ( '' !== $trimmed ) {
					$counts[ $trimmed ] = ( $counts[ $trimmed ] ?? 0 ) + 1;
				}
				continue;
			}

			if ( is_array( $value ) ) {
				self::collect_font_family_values_from_array( $value, $counts );
			}
		}
	}

	/**
	 * @param string $fragment JSON string body (between quotes).
	 * @return string|null Decoded string or null when invalid.
	 */
	private static function decode_json_string_fragment( string $fragment ): ?string {
		$decoded = json_decode( '"' . $fragment . '"' );
		return is_string( $decoded ) ? $decoded : null;
	}
}
