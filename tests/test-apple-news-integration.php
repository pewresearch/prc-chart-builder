<?php
/**
 * Tests for Apple News synced-chart status gating.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Apple_News_Integration;
use PRC\Platform\Chart_Builder\Content_Type;

/**
 * Apple News integration tests.
 */
class Test_Apple_News_Integration extends WP_UnitTestCase {

	/**
	 * @var Apple_News_Integration
	 */
	private Apple_News_Integration $integration;

	/**
	 * Set up test fixtures.
	 */
	public function set_up(): void {
		parent::set_up();
		require_once dirname( __DIR__, 2 ) . '/prc-apple-news/includes/anf/class-anf-alignment.php';
		$this->integration = new Apple_News_Integration( null );
	}

	/**
	 * Create a chart post with a featured PNG attachment.
	 *
	 * @param string $status Chart post status.
	 * @return array{chart_id:int,article_id:int}
	 */
	private function create_article_with_synced_chart( string $status ): array {
		$attachment_id = self::factory()->attachment->create_upload_object(
			DIR_TESTDATA . '/images/test-image.jpg'
		);

		$chart_id = self::factory()->post->create(
			array(
				'post_type'    => Content_Type::$post_type,
				'post_status'  => $status,
				'post_title'   => 'Draft Chart',
				'post_content' => '<!-- wp:prc-chart-builder/controller /-->',
			)
		);
		set_post_thumbnail( $chart_id, $attachment_id );

		$article_id = self::factory()->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Published Article',
			)
		);

		return array(
			'chart_id'   => $chart_id,
			'article_id' => $article_id,
		);
	}

	/**
	 * Published articles must not export draft chart content to Apple News.
	 */
	public function test_synced_chart_to_anf_rejects_non_public_chart_for_published_article(): void {
		$fixtures = $this->create_article_with_synced_chart( 'draft' );
		$article    = get_post( $fixtures['article_id'] );
		$block      = array(
			'blockName' => 'prc-chart-builder/synced-chart',
			'attrs'     => array(
				'ref' => $fixtures['chart_id'],
			),
		);

		$this->assertSame( array(), $this->integration->synced_chart_to_anf( $block, $article ) );
	}

	/**
	 * Published charts referenced from published articles export to Apple News.
	 */
	public function test_synced_chart_to_anf_exports_published_chart_for_published_article(): void {
		$fixtures = $this->create_article_with_synced_chart( 'publish' );
		$article    = get_post( $fixtures['article_id'] );
		$block      = array(
			'blockName' => 'prc-chart-builder/synced-chart',
			'attrs'     => array(
				'ref' => $fixtures['chart_id'],
			),
		);

		$components = $this->integration->synced_chart_to_anf( $block, $article );

		$this->assertNotEmpty( $components );
		$this->assertSame( 'container', $components[0]['role'] ?? null );
	}

	/**
	 * Right-aligned synced charts export as photo-only anchor components.
	 */
	public function test_synced_chart_to_anf_honors_right_alignment(): void {
		$fixtures = $this->create_article_with_synced_chart( 'publish' );
		$article  = get_post( $fixtures['article_id'] );
		$block    = array(
			'blockName' => 'prc-chart-builder/synced-chart',
			'attrs'     => array(
				'ref'   => $fixtures['chart_id'],
				'align' => 'right',
			),
		);

		$components = $this->integration->synced_chart_to_anf( $block, $article );

		$this->assertCount( 1, $components );
		$this->assertSame( 'photo', $components[0]['role'] ?? null );
		$this->assertSame( 'anchor-layout-right', $components[0]['layout'] ?? null );
	}
}
