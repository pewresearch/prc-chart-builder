<?php
/**
 * Synced Chart Auto-Publish class for Chart Builder.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Listens to the platform post-publish pipeline and automatically publishes
 * any chart CPT posts referenced by `prc-chart-builder/synced-chart` blocks
 * found in the triggering post's content.
 *
 * Hooks: prc_platform_async_on_publish, prc_platform_async_on_update
 */
class Synced_Chart_Auto_Publish {

	/**
	 * Register pipeline hooks.
	 *
	 * @param mixed $loader The plugin loader instance.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'prc_platform_async_on_publish', $this, 'maybe_publish_referenced_charts', 10, 2 );
		$loader->add_action( 'prc_platform_async_on_update', $this, 'maybe_publish_referenced_charts', 10, 2 );
	}

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
	 * Scan the published/updated post for synced-chart blocks and publish any
	 * referenced charts that are still in draft/future status when the acting
	 * user may edit and publish that chart.
	 *
	 * @hook prc_platform_async_on_publish 10
	 * @hook prc_platform_async_on_update  10
	 *
	 * @param object $post       Extended WP_Post-like object provided by the pipeline.
	 * @param bool   $has_blocks Whether the post contains block markup.
	 */
	public function maybe_publish_referenced_charts( $post, bool $has_blocks ): void {
		if ( ! $has_blocks ) {
			return;
		}

		// Avoid recursion — skip if the post being published is itself a chart.
		if ( Content_Type::$post_type === $post->post_type ) {
			return;
		}

		$acting_user_id = self::resolve_acting_user_id();
		if ( $acting_user_id <= 0 ) {
			return;
		}

		$refs = Synced_Chart::extract_synced_chart_refs( (string) $post->post_content );

		if ( empty( $refs ) ) {
			return;
		}

		foreach ( array_unique( $refs ) as $ref_id ) {
			$chart = get_post( $ref_id );

			if ( ! $chart instanceof \WP_Post ) {
				continue;
			}

			if ( Content_Type::$post_type !== $chart->post_type ) {
				continue;
			}

			if ( ! in_array( $chart->post_status, self::AUTO_PUBLISHABLE_STATUSES, true ) ) {
				continue;
			}

			// edit_post enforces ownership (or edit_others_posts); publish_post alone does not.
			if ( ! user_can( $acting_user_id, 'edit_post', $ref_id ) || ! user_can( $acting_user_id, 'publish_post', $ref_id ) ) {
				continue;
			}

			wp_update_post(
				array(
					'ID'          => $ref_id,
					'post_status' => 'publish',
				)
			);
		}
	}

	/**
	 * Resolve the editor who triggered the publish pipeline.
	 *
	 * Action Scheduler workers typically run as user 0; the pipeline stores the
	 * original editor via get_async_editor_id() for capability checks.
	 *
	 * @return int
	 */
	private static function resolve_acting_user_id(): int {
		if ( class_exists( '\PRC\Platform\Post_Publish_Pipeline\Bootstrap' ) ) {
			$async_editor_id = \PRC\Platform\Post_Publish_Pipeline\Bootstrap::get_async_editor_id();
			if ( $async_editor_id > 0 ) {
				return $async_editor_id;
			}
		}

		return (int) get_current_user_id();
	}
}
