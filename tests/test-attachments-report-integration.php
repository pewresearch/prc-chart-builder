<?php
/**
 * Tests for attachments report chart integration.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Attachments_Report_Integration;

/**
 * Attachments report integration tests.
 */
class Test_Attachments_Report_Integration extends WP_UnitTestCase {

	/**
	 * Integration under test.
	 *
	 * @var Attachments_Report_Integration
	 */
	private Attachments_Report_Integration $integration;

	/**
	 * Set up each test.
	 */
	public function set_up(): void {
		parent::set_up();
		$this->integration = new Attachments_Report_Integration();
	}

	/**
	 * Build chart CPT content with a static PNG URL.
	 *
	 * @param string $png_url Static image URL.
	 * @return string
	 */
	private function make_chart_content( string $png_url ): string {
		$attrs = wp_json_encode(
			array(
				'layout'    => array(
					'width'  => 640,
					'height' => 400,
				),
				'chartData' => array(
					array(
						'x' => 1,
						'y' => 2,
					),
				),
				'io'        => array(
					'pngUrl' => $png_url,
				),
			)
		);

		return "<!-- wp:prc-chart-builder/chart {$attrs} /-->";
	}

	/**
	 * Build parent post content embedding a synced chart ref.
	 *
	 * @param int $chart_id Chart post ID.
	 * @return string
	 */
	private function make_synced_chart_content( int $chart_id ): string {
		$attrs = wp_json_encode( array( 'ref' => $chart_id ) );

		return "<!-- wp:prc-chart-builder/synced-chart {$attrs} /-->";
	}

	/**
	 * Create a chart post with exportable static image metadata.
	 *
	 * @param string $title       Chart title.
	 * @param string $post_status Post status.
	 * @return int Chart post ID.
	 */
	private function create_chart( string $title, string $post_status ): int {
		return self::factory()->post->create(
			array(
				'post_title'   => $title,
				'post_status'  => $post_status,
				'post_type'    => 'chart',
				'post_content' => $this->make_chart_content( 'https://example.com/chart.png' ),
			)
		);
	}

	/**
	 * Unauthenticated callers must not receive draft chart metadata.
	 */
	public function test_append_chart_items_skips_draft_charts_for_anonymous_users(): void {
		wp_set_current_user( 0 );

		$chart_id = $this->create_chart( 'Draft Chart Title', 'draft' );
		$parent_id = self::factory()->post->create(
			array(
				'post_title'   => 'Published Article',
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'post_content' => $this->make_synced_chart_content( $chart_id ),
			)
		);

		$items = $this->integration->append_chart_items( array(), $parent_id, 'all' );

		$this->assertSame( array(), $items );
	}

	/**
	 * Published charts remain visible to unauthenticated callers.
	 */
	public function test_append_chart_items_includes_published_charts_for_anonymous_users(): void {
		wp_set_current_user( 0 );

		$chart_id = $this->create_chart( 'Published Chart Title', 'publish' );
		$parent_id = self::factory()->post->create(
			array(
				'post_title'   => 'Published Article',
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'post_content' => $this->make_synced_chart_content( $chart_id ),
			)
		);

		$items = $this->integration->append_chart_items( array(), $parent_id, 'all' );

		$this->assertCount( 1, $items );
		$this->assertSame( $chart_id, $items[0]['id'] );
		$this->assertSame( 'Published Chart Title', $items[0]['title'] );
		$this->assertSame( '', $items[0]['editUrl'] );
	}

	/**
	 * Authors can read their own draft charts through the report.
	 */
	public function test_append_chart_items_includes_draft_charts_for_author(): void {
		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author_id );

		$chart_id = self::factory()->post->create(
			array(
				'post_title'   => 'Author Draft Chart',
				'post_status'  => 'draft',
				'post_type'    => 'chart',
				'post_author'  => $author_id,
				'post_content' => $this->make_chart_content( 'https://example.com/author-chart.png' ),
			)
		);
		$parent_id = self::factory()->post->create(
			array(
				'post_title'   => 'Author Article',
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'post_author'  => $author_id,
				'post_content' => $this->make_synced_chart_content( $chart_id ),
			)
		);

		$items = $this->integration->append_chart_items( array(), $parent_id, 'all' );

		$this->assertCount( 1, $items );
		$this->assertSame( 'Author Draft Chart', $items[0]['title'] );
		$this->assertNotEmpty( $items[0]['editUrl'] );
	}
}
