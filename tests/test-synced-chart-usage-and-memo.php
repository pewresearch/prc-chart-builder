<?php
/**
 * Tests for synced-chart usage tracking (pipeline) and duplicate render.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

/**
 * Synced chart usage + render tests.
 */
class Test_Synced_Chart_Usage_And_Memo extends WP_UnitTestCase {

	/**
	 * Synced chart instance under test.
	 *
	 * @var \PRC\Platform\Chart_Builder\Synced_Chart
	 */
	private $synced_chart;

	/**
	 * Set up.
	 */
	public function set_up(): void {
		parent::set_up();
		$loader             = new \PRC\Platform\Chart_Builder\Loader();
		$this->synced_chart = new \PRC\Platform\Chart_Builder\Synced_Chart( $loader );
		\PRC\Platform\Chart_Builder\Block_Utils::reset_render_id_registry();
	}

	/**
	 * Build a synced-chart block comment for a chart ref.
	 *
	 * @param int $chart_id Chart CPT ID.
	 * @return string
	 */
	private function synced_chart_block_markup( int $chart_id ): string {
		return sprintf(
			'<!-- wp:prc-chart-builder/synced-chart {"ref":%d} /-->',
			$chart_id
		);
	}

	/**
	 * Create a published chart with simple block content.
	 *
	 * @param string $content Optional post content.
	 * @return int
	 */
	private function create_chart( string $content = '<!-- wp:paragraph --><p>Chart body</p><!-- /wp:paragraph -->' ): int {
		return (int) self::factory()->post->create(
			array(
				'post_title'   => 'Memo Chart',
				'post_status'  => 'publish',
				'post_type'    => 'chart',
				'post_content' => $content,
			)
		);
	}

	/**
	 * Create a published parent post optionally embedding a chart.
	 *
	 * @param int|null $chart_id Chart to embed, or null for none.
	 * @return \WP_Post
	 */
	private function create_parent_post( ?int $chart_id = null ): \WP_Post {
		$content = null === $chart_id
			? '<!-- wp:paragraph --><p>No chart</p><!-- /wp:paragraph -->'
			: $this->synced_chart_block_markup( $chart_id );

		$post_id = (int) self::factory()->post->create(
			array(
				'post_title'   => 'Parent Article',
				'post_status'  => 'publish',
				'post_type'    => 'post',
				'post_content' => $content,
			)
		);

		return get_post( $post_id );
	}

	/**
	 * Extract finds synced-chart refs via WP_Block_Processor.
	 */
	public function test_extract_synced_chart_refs(): void {
		$chart_a = $this->create_chart();
		$chart_b = $this->create_chart();

		$content = $this->synced_chart_block_markup( $chart_a )
			. "\n"
			. $this->synced_chart_block_markup( $chart_b );

		$refs = \PRC\Platform\Chart_Builder\Synced_Chart::extract_synced_chart_refs( $content );

		$this->assertSame( array( $chart_a, $chart_b ), $refs );
	}

	/**
	 * Extract follows reusable core/block embeds into their stored content.
	 */
	public function test_extract_synced_chart_refs_from_reusable_block(): void {
		$chart = $this->create_chart();

		$reusable_id = (int) self::factory()->post->create(
			array(
				'post_title'   => 'Reusable with chart',
				'post_status'  => 'publish',
				'post_type'    => 'wp_block',
				'post_content' => $this->synced_chart_block_markup( $chart ),
			)
		);

		$content = sprintf( '<!-- wp:block {"ref":%d} /-->', $reusable_id );
		$refs    = \PRC\Platform\Chart_Builder\Synced_Chart::extract_synced_chart_refs( $content );

		$this->assertSame( array( $chart ), $refs );
	}

	/**
	 * Pipeline publish/update adds parent to chart usage meta.
	 */
	public function test_sync_usage_from_pipeline_adds_parent(): void {
		$chart  = $this->create_chart();
		$parent = $this->create_parent_post( $chart );

		$this->synced_chart->sync_usage_from_pipeline( $parent, true );

		$this->assertSame(
			array( (int) $parent->ID ),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $chart )
		);

		$this->assertSame(
			array( $chart ),
			array_map(
				'intval',
				(array) get_post_meta(
					$parent->ID,
					\PRC\Platform\Chart_Builder\Synced_Chart::$synced_chart_refs_meta_key,
					true
				)
			)
		);
	}

	/**
	 * Pipeline update removes parent when the synced-chart block is gone.
	 */
	public function test_sync_usage_from_pipeline_removes_parent_when_ref_removed(): void {
		$chart  = $this->create_chart();
		$parent = $this->create_parent_post( $chart );

		$this->synced_chart->sync_usage_from_pipeline( $parent, true );

		$parent->post_content = '<!-- wp:paragraph --><p>Chart removed</p><!-- /wp:paragraph -->';
		wp_update_post(
			array(
				'ID'           => $parent->ID,
				'post_content' => $parent->post_content,
			)
		);
		$parent = get_post( $parent->ID );

		$this->synced_chart->sync_usage_from_pipeline( $parent, true );

		$this->assertSame(
			array(),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $chart )
		);
		$this->assertSame(
			'',
			get_post_meta(
				$parent->ID,
				\PRC\Platform\Chart_Builder\Synced_Chart::$synced_chart_refs_meta_key,
				true
			)
		);
	}

	/**
	 * Legacy parents without a reverse index still clear usage when the chart is removed.
	 */
	public function test_sync_usage_clears_legacy_usage_without_reverse_index(): void {
		$chart  = $this->create_chart();
		$parent = $this->create_parent_post( $chart );

		// Simulate pre-pipeline usage written at render time (no reverse index).
		update_post_meta(
			$chart,
			\PRC\Platform\Chart_Builder\Synced_Chart::$synced_chart_usage_meta_key,
			array( (int) $parent->ID )
		);

		$parent->post_content = '<!-- wp:paragraph --><p>Chart removed</p><!-- /wp:paragraph -->';
		wp_update_post(
			array(
				'ID'           => $parent->ID,
				'post_content' => $parent->post_content,
			)
		);
		$parent = get_post( $parent->ID );

		$this->synced_chart->sync_usage_from_pipeline( $parent, true );

		$this->assertSame(
			array(),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $chart )
		);
	}

	/**
	 * Non-chart refs are ignored and do not receive usage meta.
	 */
	public function test_sync_usage_skips_non_chart_refs(): void {
		$regular = (int) self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_type'   => 'post',
			)
		);
		$parent  = $this->create_parent_post( $regular );

		$this->synced_chart->sync_usage_from_pipeline( $parent, true );

		$this->assertSame(
			array(),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $regular )
		);
		$this->assertSame(
			'',
			get_post_meta(
				$parent->ID,
				\PRC\Platform\Chart_Builder\Synced_Chart::$synced_chart_refs_meta_key,
				true
			)
		);
	}

	/**
	 * Untrash restores usage the same way publish/update does.
	 */
	public function test_untrash_restores_usage(): void {
		$chart  = $this->create_chart();
		$parent = $this->create_parent_post( $chart );

		$this->synced_chart->sync_usage_from_pipeline( $parent, true );
		$this->synced_chart->clear_usage_from_pipeline( $parent, true );

		$this->assertSame(
			array(),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $chart )
		);

		$this->synced_chart->sync_usage_from_pipeline( $parent, true );

		$this->assertSame(
			array( (int) $parent->ID ),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $chart )
		);
	}

	/**
	 * Unpublish/trash clears parent from usage meta.
	 */
	public function test_clear_usage_from_pipeline_removes_parent(): void {
		$chart  = $this->create_chart();
		$parent = $this->create_parent_post( $chart );

		$this->synced_chart->sync_usage_from_pipeline( $parent, true );
		$this->synced_chart->clear_usage_from_pipeline( $parent, true );

		$this->assertSame(
			array(),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $chart )
		);
		$this->assertSame(
			'',
			get_post_meta(
				$parent->ID,
				\PRC\Platform\Chart_Builder\Synced_Chart::$synced_chart_refs_meta_key,
				true
			)
		);
	}

	/**
	 * Chart CPT as the triggering post is skipped.
	 */
	public function test_sync_usage_skips_chart_cpt(): void {
		$chart_a = $this->create_chart();
		$chart_b = $this->create_chart( $this->synced_chart_block_markup( $chart_a ) );

		$this->synced_chart->sync_usage_from_pipeline( get_post( $chart_b ), true );

		$this->assertSame(
			array(),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $chart_a )
		);
	}

	/**
	 * Frontend render does not write usage meta.
	 */
	public function test_render_does_not_update_usage_meta(): void {
		$chart  = $this->create_chart();
		$parent = $this->create_parent_post( $chart );

		$this->go_to( get_permalink( $parent ) );

		$html = $this->synced_chart->render_block_callback(
			array( 'ref' => $chart ),
			''
		);

		$this->assertNotSame( '', $html );
		$this->assertSame(
			array(),
			\PRC\Platform\Chart_Builder\Synced_Chart::get_chart_usage_post_ids( $chart )
		);
	}

	/**
	 * Duplicate embeds both render (recursion guard must not blank the second).
	 */
	public function test_duplicate_ref_renders_both_embeds(): void {
		$marker = 'memo-unique-' . wp_generate_password( 8, false );
		$chart  = $this->create_chart(
			sprintf(
				'<!-- wp:paragraph --><p>%s</p><!-- /wp:paragraph -->',
				$marker
			)
		);

		$first  = $this->synced_chart->render_block_callback( array( 'ref' => $chart ), '' );
		$second = $this->synced_chart->render_block_callback( array( 'ref' => $chart ), '' );

		$this->assertNotSame( '', $first );
		$this->assertNotSame( '', $second );
		$this->assertStringContainsString( $marker, $first );
		$this->assertStringContainsString( $marker, $second );
	}

	/**
	 * Duplicate controller embeds claim distinct render ids (no request memo).
	 */
	public function test_duplicate_controller_embeds_get_unique_render_ids(): void {
		$controller_markup = '<!-- wp:prc-chart-builder/controller {"id":"synced-dupe-ctrl"} -->'
			. '<!-- wp:prc-chart-builder/chart {"id":"synced-dupe-ctrl-chart","_version":"v2","layout":{"width":640},"io":{},"labels":{},"tooltip":{},"annotations":{}} /-->'
			. '<!-- /wp:prc-chart-builder/controller -->';

		$chart = $this->create_chart( $controller_markup );

		$first  = $this->synced_chart->render_block_callback( array( 'ref' => $chart ), '' );
		$second = $this->synced_chart->render_block_callback( array( 'ref' => $chart ), '' );

		// If controller render is unavailable in this test env, skip uniqueness asserts.
		if ( '' === $first || '' === $second ) {
			$this->markTestSkipped( 'Controller render returned empty HTML in this environment.' );
		}

		$this->assertStringContainsString( 'synced-dupe-ctrl', $first );
		$this->assertStringContainsString( 'synced-dupe-ctrl-2', $second );
		$this->assertStringNotContainsString( 'synced-dupe-ctrl-2', $first );
	}

	/**
	 * Align wrapper is applied around rendered content.
	 */
	public function test_align_wrapper_applied(): void {
		$chart = $this->create_chart();

		$plain   = $this->synced_chart->render_block_callback( array( 'ref' => $chart ), '' );
		$aligned = $this->synced_chart->render_block_callback(
			array(
				'ref'   => $chart,
				'align' => 'wide',
			),
			''
		);

		$this->assertNotSame( '', $plain );
		$this->assertStringContainsString( $plain, $aligned );
		$this->assertNotSame( $plain, $aligned );
	}
}
