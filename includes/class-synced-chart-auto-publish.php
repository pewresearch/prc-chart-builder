<?php
/**
 * Synced Chart Auto-Publish class for Chart Builder.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Publishes chart CPT posts referenced by `prc-chart-builder/synced-chart`
 * blocks when their parent post publishes or updates, and purges the edge
 * cache of parent posts so visitors see chart changes.
 *
 * Hooks: prc_platform_post_publish_pipeline_async_event_enqueued,
 * prc_platform_post_publish_pipeline_should_enqueue_async,
 * prc_platform_on_chart_publish, prc_platform_on_chart_update,
 * prc_platform_on_chart_unpublish, prc_platform_on_chart_trash
 */
class Synced_Chart_Auto_Publish {

	/**
	 * Action Scheduler hook that publishes a parent's referenced charts.
	 *
	 * @var string
	 */
	const ACTION_HOOK = 'prc_chart_builder_auto_publish_synced_charts';

	/**
	 * Action Scheduler hook that purges a parent post's edge cache.
	 *
	 * @var string
	 */
	const PURGE_HOOK = 'prc_chart_builder_purge_synced_chart_parent';

	/**
	 * Action Scheduler group name.
	 *
	 * @var string
	 */
	const ACTION_GROUP = 'prc-chart-builder';

	/**
	 * Action Scheduler priority (lower runs sooner; default is 10).
	 *
	 * Visitors see the parent without its charts until these jobs run.
	 *
	 * @var int
	 */
	const ACTION_PRIORITY = 1;

	/**
	 * Seconds to wait before purging a parent after a manual chart change, so
	 * repeated chart saves collapse into one purge per parent.
	 *
	 * @var int
	 */
	const PURGE_DELAY = MINUTE_IN_SECONDS;

	/**
	 * Parent lifecycle events that trigger auto-publish.
	 *
	 * @var string[]
	 */
	const AUTO_PUBLISH_EVENTS = array( 'publish', 'update' );

	/**
	 * Statuses eligible for automatic publication when a parent post publishes.
	 *
	 * Private/pending charts are intentionally excluded so auto-publish cannot
	 * escalate restricted chart statuses.
	 *
	 * @var string[]
	 */
	const AUTO_PUBLISHABLE_STATUSES = array( 'draft', 'future' );

	/**
	 * Parent post whose charts are being auto-published in this request, or 0.
	 *
	 * @var int
	 */
	private static $auto_publishing_parent_id = 0;

	/**
	 * Register hooks.
	 *
	 * @param mixed $loader The plugin loader instance.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'prc_platform_post_publish_pipeline_async_event_enqueued', $this, 'enqueue_auto_publish', 10, 3 );
		$loader->add_filter( 'prc_platform_post_publish_pipeline_should_enqueue_async', $this, 'skip_async_tier_while_auto_publishing', 10, 4 );
		$loader->add_action( self::ACTION_HOOK, $this, 'publish_referenced_charts', 10, 2 );
		$loader->add_action( 'prc_platform_on_chart_publish', $this, 'schedule_parent_purges', 10, 1 );
		$loader->add_action( 'prc_platform_on_chart_update', $this, 'schedule_parent_purges', 10, 1 );
		$loader->add_action( 'prc_platform_on_chart_unpublish', $this, 'schedule_parent_purges', 10, 1 );
		$loader->add_action( 'prc_platform_on_chart_trash', $this, 'schedule_parent_purges', 10, 1 );
		$loader->add_action( self::PURGE_HOOK, $this, 'purge_parent', 10, 1 );
	}

	/**
	 * Queue a dedicated, high-priority auto-publish job when a post with synced
	 * charts publishes or updates, instead of waiting behind the shared async job.
	 *
	 * @hook prc_platform_post_publish_pipeline_async_event_enqueued
	 *
	 * @param mixed $post_id   Post ID.
	 * @param mixed $event     Lifecycle event slug.
	 * @param mixed $editor_id User ID of the acting editor.
	 */
	public function enqueue_auto_publish( $post_id, $event, $editor_id ): void {
		$post_id   = (int) $post_id;
		$editor_id = (int) $editor_id;

		if ( $editor_id <= 0 || ! in_array( $event, self::AUTO_PUBLISH_EVENTS, true ) ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof \WP_Post || Content_Type::$post_type === $post->post_type ) {
			return;
		}

		if ( empty( Synced_Chart::extract_synced_chart_refs( (string) $post->post_content ) ) ) {
			return;
		}

		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			$this->publish_referenced_charts( $post_id, $editor_id );
			return;
		}

		as_enqueue_async_action(
			self::ACTION_HOOK,
			array(
				'post_id'   => $post_id,
				'editor_id' => $editor_id,
			),
			self::ACTION_GROUP,
			true,
			self::ACTION_PRIORITY
		);
	}

	/**
	 * Publish draft/future charts referenced by a published parent when the
	 * editor may edit and publish each chart, then purge the parent once if this run
	 * published any referenced chart.
	 *
	 * @hook prc_chart_builder_auto_publish_synced_charts
	 *
	 * @param mixed $post_id   Parent post ID.
	 * @param mixed $editor_id User ID captured when the job was queued.
	 */
	public function publish_referenced_charts( $post_id, $editor_id ): void {
		$post_id   = (int) $post_id;
		$editor_id = (int) $editor_id;

		if ( $editor_id <= 0 ) {
			return;
		}

		$post = get_post( $post_id );
		if ( ! $post instanceof \WP_Post || Content_Type::$post_type === $post->post_type || 'publish' !== $post->post_status ) {
			return;
		}

		$published                       = 0;
		self::$auto_publishing_parent_id = $post_id;

		try {
			foreach ( array_unique( Synced_Chart::extract_synced_chart_refs( (string) $post->post_content ) ) as $ref_id ) {
				$chart = get_post( $ref_id );

				if ( ! $chart instanceof \WP_Post || Content_Type::$post_type !== $chart->post_type ) {
					continue;
				}

				// edit_post enforces ownership (or edit_others_posts); publish_post alone does not.
				if (
					in_array( $chart->post_status, self::AUTO_PUBLISHABLE_STATUSES, true )
					&& user_can( $editor_id, 'edit_post', $ref_id )
					&& user_can( $editor_id, 'publish_post', $ref_id )
				) {
					wp_update_post(
						array(
							'ID'          => $ref_id,
							'post_status' => 'publish',
						)
					);

					// wp_insert_post() keeps future-dated posts at `future`, so check the stored status.
					if ( 'publish' === get_post_status( $ref_id ) ) {
						++$published;
					}
				}
			}
		} finally {
			self::$auto_publishing_parent_id = 0;

			if ( $published > 0 ) {
				$this->purge_parent( $post_id );
			}
		}
	}

	/**
	 * Keep charts published by auto-publish out of the shared async tier.
	 *
	 * The parent's own async job already covers notifications and indexing.
	 * Sync-tier chart hooks (PNG export) still run.
	 *
	 * @hook prc_platform_post_publish_pipeline_should_enqueue_async
	 *
	 * @param mixed  $should_enqueue Whether to enqueue.
	 * @param mixed  $post_id        Post ID.
	 * @param mixed  $event          Lifecycle event slug.
	 * @param string $post_type      Post type.
	 * @return mixed
	 */
	public function skip_async_tier_while_auto_publishing( $should_enqueue, $post_id, $event, $post_type ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		if ( self::$auto_publishing_parent_id > 0 && Content_Type::$post_type === $post_type ) {
			return false;
		}

		return $should_enqueue;
	}

	/**
	 * Schedule one delayed edge purge per published parent of a changed chart.
	 *
	 * Unique jobs per parent mean repeated chart saves inside PURGE_DELAY
	 * collapse into one purge. The parent being auto-published is skipped
	 * because publish_referenced_charts() purges it after its last chart.
	 *
	 * @hook prc_platform_on_chart_publish
	 * @hook prc_platform_on_chart_update
	 * @hook prc_platform_on_chart_unpublish
	 * @hook prc_platform_on_chart_trash
	 *
	 * @param object $ref_post Chart post object from the pipeline.
	 */
	public function schedule_parent_purges( $ref_post ): void {
		if ( ! isset( $ref_post->ID ) ) {
			return;
		}

		foreach ( Synced_Chart::get_chart_usage_post_ids( (int) $ref_post->ID ) as $parent_id ) {
			$parent_id = (int) $parent_id;

			if ( self::$auto_publishing_parent_id === $parent_id || 'publish' !== get_post_status( $parent_id ) ) {
				continue;
			}

			if ( ! function_exists( 'as_schedule_single_action' ) ) {
				$this->purge_parent( $parent_id );
				continue;
			}

			as_schedule_single_action(
				time() + self::PURGE_DELAY,
				self::PURGE_HOOK,
				array( 'post_id' => $parent_id ),
				self::ACTION_GROUP,
				true,
				self::ACTION_PRIORITY
			);
		}
	}

	/**
	 * Purge a published parent post's URL from the VIP edge cache.
	 *
	 * @hook prc_chart_builder_purge_synced_chart_parent
	 *
	 * @param mixed $post_id Parent post ID.
	 */
	public function purge_parent( $post_id ): void {
		$post_id = (int) $post_id;

		if ( 'publish' !== get_post_status( $post_id ) || ! function_exists( 'wpvip_purge_edge_cache_for_url' ) ) {
			return;
		}

		wpvip_purge_edge_cache_for_url( get_permalink( $post_id ) );
	}
}
