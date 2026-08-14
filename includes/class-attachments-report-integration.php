<?php
/**
 * Attachments Report integration for Chart Builder.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Appends synced-chart references from post content to the attachments report.
 */
class Attachments_Report_Integration {

	/**
	 * Fully-qualified block type for the synced-chart block.
	 *
	 * @var string
	 */
	private const BLOCK_NAME = 'prc-chart-builder/synced-chart';

	/**
	 * Maximum child posts to scan, matching the attachments report limit.
	 *
	 * @var int
	 */
	private const CHILD_LIMIT = 25;

	/**
	 * Register the report filter.
	 */
	public function __construct() {
		add_filter( 'prc_attachments_report_items', array( $this, 'append_chart_items' ), 10, 3 );
	}

	/**
	 * Append chart items for synced-chart blocks found in the post and its children.
	 *
	 * @param array  $items     Existing report items.
	 * @param int    $post_id   Resolved parent post ID.
	 * @param string $mime_type Requested mime type filter.
	 * @return array
	 */
	public function append_chart_items( array $items, int $post_id, string $mime_type ): array {
		if ( 'all' !== $mime_type ) {
			return $items;
		}

		$refs = $this->collect_synced_chart_refs_for_post_tree( $post_id );

		foreach ( $refs as $ref_id ) {
			$chart_item = $this->build_chart_item( $ref_id, $post_id );
			if ( null !== $chart_item ) {
				$items[] = $chart_item;
			}
		}

		return $items;
	}

	/**
	 * Collect synced-chart refs from a post and its children.
	 *
	 * @param int $post_id Parent post ID.
	 * @return int[]
	 */
	private function collect_synced_chart_refs_for_post_tree( int $post_id ): array {
		$refs = $this->extract_synced_chart_refs_from_content(
			(string) get_post_field( 'post_content', $post_id )
		);

		$post_type = get_post_type( $post_id );
		if ( ! $post_type ) {
			return array_values( array_unique( $refs ) );
		}

		$children = get_children(
			array(
				'post_parent' => $post_id,
				'post_type'   => $post_type,
				'numberposts' => self::CHILD_LIMIT,
				'post_status' => array( 'publish', 'draft' ),
			)
		);

		foreach ( $children as $child ) {
			$refs = array_merge(
				$refs,
				$this->extract_synced_chart_refs_from_content( $child->post_content )
			);
		}

		return array_values( array_unique( $refs ) );
	}

	/**
	 * Scan raw post content for synced-chart blocks and collect ref attributes.
	 *
	 * @param string $content Raw post content.
	 * @return int[]
	 */
	private function extract_synced_chart_refs_from_content( string $content ): array {
		if ( '' === $content || false === strpos( $content, self::BLOCK_NAME ) ) {
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

	/**
	 * Build a report item for a chart CPT post.
	 *
	 * @param int $ref_id  Chart post ID.
	 * @param int $post_id Parent post ID that owns the report.
	 * @return array|null
	 */
	private function build_chart_item( int $ref_id, int $post_id ): ?array {
		$chart = get_post( $ref_id );
		if ( ! $chart instanceof \WP_Post || Content_Type::$post_type !== $chart->post_type ) {
			return null;
		}

		if ( ! current_user_can( 'read_post', $ref_id ) ) {
			return null;
		}

		$static_urls = Chart_Static_Images::resolve_static_image_urls( $ref_id );
		if ( empty( $static_urls['url'] ) ) {
			return null;
		}

		return array(
			'id'           => $ref_id,
			'type'         => 'chart',
			'title'        => get_the_title( $ref_id ),
			'caption'      => '',
			'description'  => '',
			'alt'          => get_the_title( $ref_id ),
			'mimeType'     => 'chart',
			'url'          => $static_urls['url'],
			'thumbnailUrl' => $static_urls['thumbnailUrl'],
			'squareUrl'    => $static_urls['squareUrl'],
			'editUrl'      => current_user_can( 'edit_post', $ref_id )
				? get_edit_post_link( $ref_id, 'raw' )
				: '',
			'chartUrl'     => get_permalink( $ref_id ),
			'owner'        => $post_id,
		);
	}

}
