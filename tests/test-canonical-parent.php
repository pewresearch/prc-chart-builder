<?php
/**
 * Tests for chart canonical parent resolution.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

/**
 * Canonical parent tests.
 */
class Test_Canonical_Parent extends WP_UnitTestCase {

	/**
	 * Create a published post.
	 *
	 * @param string $title Post title.
	 * @return int Post ID.
	 */
	private function create_published_post( string $title ): int {
		return self::factory()->post->create(
			array(
				'post_title'  => $title,
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);
	}

	/**
	 * Create a chart post with usage meta.
	 *
	 * @param array $usage_post_ids Referencing post IDs.
	 * @return int Chart post ID.
	 */
	private function create_chart_with_usage( array $usage_post_ids ): int {
		$chart_id = self::factory()->post->create(
			array(
				'post_title'  => 'Test Chart',
				'post_status' => 'publish',
				'post_type'   => 'chart',
			)
		);

		update_post_meta(
			$chart_id,
			\PRC\Platform\Chart_Builder\Synced_Chart::$synced_chart_usage_meta_key,
			$usage_post_ids
		);

		return $chart_id;
	}

	/**
	 * Defaults to the first published referencing post.
	 */
	public function test_resolve_parent_id_defaults_to_first_published_reference(): void {
		$first  = $this->create_published_post( 'First Article' );
		$second = $this->create_published_post( 'Second Article' );
		$chart  = $this->create_chart_with_usage( array( $first, $second ) );

		$this->assertSame(
			$first,
			\PRC\Platform\Chart_Builder\Canonical_Parent::resolve_parent_id( $chart )
		);
	}

	/**
	 * Uses explicit selection when valid.
	 */
	public function test_resolve_parent_id_uses_explicit_selection(): void {
		$first  = $this->create_published_post( 'First Article' );
		$second = $this->create_published_post( 'Second Article' );
		$chart  = $this->create_chart_with_usage( array( $first, $second ) );

		update_post_meta( $chart, \PRC\Platform\Chart_Builder\Canonical_Parent::$meta_key, $second );

		$this->assertSame(
			$second,
			\PRC\Platform\Chart_Builder\Canonical_Parent::resolve_parent_id( $chart )
		);
	}

	/**
	 * Ignores explicit selection when the post is not a referencing parent.
	 */
	public function test_resolve_parent_id_ignores_invalid_explicit_selection(): void {
		$first   = $this->create_published_post( 'First Article' );
		$unrelated = $this->create_published_post( 'Unrelated Article' );
		$chart   = $this->create_chart_with_usage( array( $first ) );

		update_post_meta( $chart, \PRC\Platform\Chart_Builder\Canonical_Parent::$meta_key, $unrelated );

		$this->assertSame(
			$first,
			\PRC\Platform\Chart_Builder\Canonical_Parent::resolve_parent_id( $chart )
		);
	}

	/**
	 * Skips draft referencing posts when resolving the default parent.
	 */
	public function test_resolve_parent_id_skips_unpublished_references(): void {
		$draft_id = self::factory()->post->create(
			array(
				'post_title'  => 'Draft Article',
				'post_status' => 'draft',
				'post_type'   => 'post',
			)
		);
		$published_id = $this->create_published_post( 'Published Article' );
		$chart        = $this->create_chart_with_usage( array( $draft_id, $published_id ) );

		$this->assertSame(
			$published_id,
			\PRC\Platform\Chart_Builder\Canonical_Parent::resolve_parent_id( $chart )
		);
	}

	/**
	 * Canonical URL filter points chart posts at the parent article.
	 */
	public function test_seo_filter_sets_chart_canonical_to_parent_url(): void {
		$parent_id = $this->create_published_post( 'Parent Article' );
		$chart_id  = $this->create_chart_with_usage( array( $parent_id ) );

		$seo      = new \PRC\Platform\Chart_Builder\SEO( new \PRC\Platform\Chart_Builder\Loader() );
		$filtered = $seo->filter_chart_canonical_url(
			get_permalink( $chart_id ),
			$chart_id,
			array()
		);

		$this->assertSame( get_permalink( $parent_id ), $filtered );
	}

	/**
	 * Content_Type registers the canonical parent sanitizer on save_post_chart.
	 */
	public function test_content_type_registers_sanitize_meta_on_save_hook(): void {
		$loader = new \PRC\Platform\Chart_Builder\Loader();
		new \PRC\Platform\Chart_Builder\Content_Type( $loader );
		$loader->run();

		$this->assertNotFalse(
			has_action(
				'save_post_chart',
				array( \PRC\Platform\Chart_Builder\Canonical_Parent::class, 'sanitize_meta_on_save' )
			)
		);
	}

	/**
	 * Invalid explicit selections are cleared on save.
	 */
	public function test_sanitize_meta_on_save_clears_invalid_selection(): void {
		$parent_id = $this->create_published_post( 'Parent Article' );
		$chart_id  = $this->create_chart_with_usage( array( $parent_id ) );
		$other_id  = $this->create_published_post( 'Other Article' );

		update_post_meta( $chart_id, \PRC\Platform\Chart_Builder\Canonical_Parent::$meta_key, $other_id );

		$post = get_post( $chart_id );
		\PRC\Platform\Chart_Builder\Canonical_Parent::sanitize_meta_on_save( $chart_id, $post, true );

		$this->assertSame(
			0,
			\PRC\Platform\Chart_Builder\Canonical_Parent::get_selected_parent_id( $chart_id )
		);
	}
}
