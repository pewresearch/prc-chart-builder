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
 * Hooks: prc_platform_on_publish, prc_platform_on_update
 */
class Synced_Chart_Auto_Publish {

	/**
	 * Fully-qualified block type for the synced-chart block.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'prc-chart-builder/synced-chart';

	/**
	 * Register pipeline hooks.
	 *
	 * @param mixed $loader The plugin loader instance.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'prc_platform_on_publish', $this, 'maybe_publish_referenced_charts', 10, 2 );
		$loader->add_action( 'prc_platform_on_update', $this, 'maybe_publish_referenced_charts', 10, 2 );
	}

	/**
	 * Scan the published/updated post for synced-chart blocks and publish any
	 * referenced charts that are still in draft status.
	 *
	 * @hook prc_platform_on_publish 10
	 * @hook prc_platform_on_update  10
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

		$refs = $this->extract_synced_chart_refs( $post->post_content );

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

			if ( 'publish' === $chart->post_status ) {
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
	 * Use WP_Block_Processor to scan raw post content for synced-chart blocks
	 * and collect the `ref` attribute (chart CPT post ID) from each one.
	 *
	 * @param string $content Raw post content.
	 * @return int[] Array of chart post IDs (may contain duplicates; caller deduplicates).
	 */
	private function extract_synced_chart_refs( string $content ): array {
		// Fast-path: bail immediately if the block name doesn't appear in the content.
		if ( false === strpos( $content, self::BLOCK_NAME ) ) {
			return array();
		}

		$refs      = array();
		$processor = new \WP_Block_Processor( $content );

		while ( $processor->next_block() ) {
			if ( ! $processor->is_block_type( self::BLOCK_NAME ) ) {
				continue;
			}

			$attrs = $processor->allocate_and_return_parsed_attributes();

			if ( ! empty( $attrs['ref'] ) ) {
				$refs[] = (int) $attrs['ref'];
			}
		}

		return $refs;
	}
}
