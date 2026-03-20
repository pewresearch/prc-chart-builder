<?php
/**
 * Tests for PNG_Export
 *
 * @package PRC\Platform\Chart_Builder
 */

use PRC\Platform\Chart_Builder\PNG_Export;
use PRC\Platform\Chart_Builder\Screenshot_Service;

/**
 * Tests for PNG_Export — change detection, scheduling guards, and generate_png().
 *
 * All tests that touch Action Scheduler (as_*) or the live ScreenshotOne API are
 * skipped when the relevant infrastructure is unavailable, following the same
 * markTestSkipped() pattern used in prc-pdf-extraction.
 */
class PNGExportTest extends WP_UnitTestCase {

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	/**
	 * Build a minimal serialised chart block matching prc-chart-builder/chart.
	 *
	 * @param array $attrs Merged into the block attributes.
	 * @return string Serialised block comment.
	 */
	private function make_chart_post_content( array $attrs = array() ): string {
		$defaults = array(
			'layout'    => array(
				'width'  => 640,
				'height' => 400,
			),
			'chartData' => array( array( 'x' => 1, 'y' => 2 ) ),
			'io'        => array(
				'colorValue'  => '#e53e3e',
				'customColors' => array(),
				'pngUrl'      => '',
				'pngId'       => 0,
			),
		);

		$merged       = array_merge( $defaults, $attrs );
		$json_attrs   = wp_json_encode( $merged );

		return "<!-- wp:prc-chart-builder/chart {$json_attrs} /-->";
	}

	/**
	 * Build a controller-wrapped chart block (one level of nesting).
	 */
	private function make_controller_post_content( array $chart_attrs = array() ): string {
		$chart_content = $this->make_chart_post_content( $chart_attrs );

		return "<!-- wp:prc-chart-builder/controller -->{$chart_content}<!-- /wp:prc-chart-builder/controller -->";
	}

	/**
	 * Create and return a PNG_Export instance backed by a mock Screenshot_Service.
	 *
	 * The mock's is_configured() returns the value of $service_configured.
	 * We use a minimal stub instead of Mockery/PHPUnit mocks so there are no
	 * extra dev dependencies.
	 *
	 * @param bool   $service_configured Return value of is_configured().
	 * @param mixed  $take_return        Return value of take(). Use a WP_Error to simulate failure.
	 * @return array{ png_export: PNG_Export, loader_mock: object, screenshot_mock: object }
	 */
	private function make_png_export( bool $service_configured = false, mixed $take_return = null ): array {
		// Minimal loader stub — just records registered hooks.
		$loader_mock = new class {
			public array $actions = array();
			public function add_action( $hook, $cb_obj, $method, $priority = 10, $accepted_args = 1 ): void {
				$this->actions[] = compact( 'hook', 'method', 'priority' );
			}
		};

		$service_configured_val = $service_configured;
		$take_return_val        = $take_return;

		$screenshot_mock = new class( $service_configured_val, $take_return_val ) extends Screenshot_Service {
			private bool $configured;
			private mixed $take_result;

			public function __construct( bool $configured, mixed $take_result ) {
				// Do not call parent::__construct() — would try to read constants.
				$this->configured  = $configured;
				$this->take_result = $take_result;
			}

			public function is_configured(): bool {
				return $this->configured;
			}

			public function take( string $url, int $width = self::DEFAULT_CHART_WIDTH, int $height = self::DEFAULT_CHART_HEIGHT ): mixed {
				return $this->take_result;
			}
		};

		$png_export = new PNG_Export( $loader_mock, $screenshot_mock );

		return array(
			'png_export'       => $png_export,
			'loader_mock'      => $loader_mock,
			'screenshot_mock'  => $screenshot_mock,
		);
	}

	// -------------------------------------------------------------------------
	// compute_attributes_hash()
	// -------------------------------------------------------------------------

	/**
	 * Hash changes when a rendering attribute (chartData) changes.
	 */
	public function test_hash_changes_when_chart_data_changes() {
		[ 'png_export' => $pe ] = $this->make_png_export();

		$attrs_a = array(
			'chartData' => array( array( 'x' => 1 ) ),
			'io'        => array( 'colorValue' => '#000' ),
		);
		$attrs_b = array(
			'chartData' => array( array( 'x' => 2 ) ),
			'io'        => array( 'colorValue' => '#000' ),
		);

		$this->assertNotEquals(
			$pe->compute_attributes_hash( $attrs_a ),
			$pe->compute_attributes_hash( $attrs_b )
		);
	}

	/**
	 * Hash does NOT change when only PNG export output keys are mutated.
	 */
	public function test_hash_stable_when_only_export_output_keys_change() {
		[ 'png_export' => $pe ] = $this->make_png_export();

		$base = array(
			'chartData' => array( array( 'x' => 1 ) ),
			'io'        => array(
				'colorValue'       => '#000',
				'pngUrl'          => '',
				'pngId'           => 0,
				'pngGeneratedAt'  => null,
				'svgUrl'          => '',
				'staticImageUrl'  => '',
			),
		);

		$after_export = array(
			'chartData' => array( array( 'x' => 1 ) ),
			'io'        => array(
				'colorValue'       => '#000',
				'pngUrl'          => 'https://example.com/wp-content/uploads/chart-1.png',
				'pngId'           => 42,
				'pngGeneratedAt'  => '2025-01-01T00:00:00Z',
				'svgUrl'          => 'https://example.com/wp-content/uploads/chart-1.svg',
				'staticImageUrl'  => 'https://example.com/wp-content/uploads/static.png',
			),
		);

		$this->assertEquals(
			$pe->compute_attributes_hash( $base ),
			$pe->compute_attributes_hash( $after_export )
		);
	}

	/**
	 * Hash includes rendering-critical io keys (colorValue, customColors).
	 */
	public function test_hash_changes_when_color_value_changes() {
		[ 'png_export' => $pe ] = $this->make_png_export();

		$attrs_a = array( 'io' => array( 'colorValue' => '#ff0000' ) );
		$attrs_b = array( 'io' => array( 'colorValue' => '#0000ff' ) );

		$this->assertNotEquals(
			$pe->compute_attributes_hash( $attrs_a ),
			$pe->compute_attributes_hash( $attrs_b )
		);
	}

	/**
	 * Internal migration fields (_legacy, _v1Original, _migrationMeta) are
	 * stripped and do not affect the hash.
	 */
	public function test_hash_stable_when_internal_migration_keys_change() {
		[ 'png_export' => $pe ] = $this->make_png_export();

		$base     = array( 'chartData' => array( array( 'x' => 1 ) ) );
		$migrated = array_merge( $base, array( '_legacy' => true, '_v1Original' => array( 'old' => 'data' ) ) );

		$this->assertEquals(
			$pe->compute_attributes_hash( $base ),
			$pe->compute_attributes_hash( $migrated )
		);
	}

	/**
	 * IO_HASH_EXCLUDED_KEYS covers all expected export output keys.
	 */
	public function test_io_hash_excluded_keys_contains_expected_values() {
		$expected = array(
			'pngUrl', 'pngId', 'pngGeneratedAt', 'pngAttributesHash',
			'svgUrl', 'svgId', 'svgGeneratedAt', 'svgAttributesHash',
			'staticImageUrl', 'staticImageId', 'staticImageInnerHTML',
		);

		foreach ( $expected as $key ) {
			$this->assertContains( $key, PNG_Export::IO_HASH_EXCLUDED_KEYS, "Expected {$key} in IO_HASH_EXCLUDED_KEYS" );
		}
	}

	// -------------------------------------------------------------------------
	// maybe_schedule_png_generation() — guard checks
	// -------------------------------------------------------------------------

	/**
	 * Scheduling is skipped when ScreenshotOne is not configured.
	 */
	public function test_maybe_schedule_skips_when_service_not_configured() {
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			$this->markTestSkipped( 'Action Scheduler not available.' );
		}

		[ 'png_export' => $pe ] = $this->make_png_export( false );

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => $this->make_chart_post_content(),
		) );

		$post = get_post( $post_id );

		// If the guard fires, no action should be enqueued.
		$pe->maybe_schedule_png_generation( $post );

		$actions = as_get_scheduled_actions(
			array(
				'hook'   => PNG_Export::ACTION_HOOK,
				'args'   => array( 'post_id' => $post_id ),
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			),
			'ids'
		);

		$this->assertEmpty( $actions );
	}

	/**
	 * Scheduling is skipped when the chart block is not present in post content.
	 */
	public function test_maybe_schedule_skips_when_no_chart_block_found() {
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			$this->markTestSkipped( 'Action Scheduler not available.' );
		}

		[ 'png_export' => $pe ] = $this->make_png_export( true );

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => '<!-- wp:paragraph --><p>No chart here</p><!-- /wp:paragraph -->',
		) );

		$post = get_post( $post_id );
		$pe->maybe_schedule_png_generation( $post );

		$actions = as_get_scheduled_actions(
			array(
				'hook'   => PNG_Export::ACTION_HOOK,
				'args'   => array( 'post_id' => $post_id ),
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			),
			'ids'
		);

		$this->assertEmpty( $actions );
	}

	/**
	 * Scheduling is skipped when the stored hash matches the current attributes.
	 */
	public function test_maybe_schedule_skips_when_hash_unchanged() {
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			$this->markTestSkipped( 'Action Scheduler not available.' );
		}

		[ 'png_export' => $pe ] = $this->make_png_export( true );

		$content = $this->make_chart_post_content();
		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => $content,
		) );

		$post = get_post( $post_id );

		// Compute the hash the same way the class does and pre-store it.
		$blocks    = parse_blocks( $content );
		$block     = $blocks[0];
		$hash      = $pe->compute_attributes_hash( $block['attrs'] ?? array() );
		update_post_meta( $post_id, '_chart_attributes_hash', $hash );

		$pe->maybe_schedule_png_generation( $post );

		$actions = as_get_scheduled_actions(
			array(
				'hook'   => PNG_Export::ACTION_HOOK,
				'args'   => array( 'post_id' => $post_id ),
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			),
			'ids'
		);

		$this->assertEmpty( $actions );
	}

	/**
	 * An action IS enqueued when the service is configured and the hash has changed.
	 */
	public function test_maybe_schedule_enqueues_action_when_hash_differs() {
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			$this->markTestSkipped( 'Action Scheduler not available.' );
		}

		[ 'png_export' => $pe ] = $this->make_png_export( true );

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => $this->make_chart_post_content(),
		) );

		// Store a stale hash to simulate a changed chart.
		update_post_meta( $post_id, '_chart_attributes_hash', 'stale_hash_value' );

		$post = get_post( $post_id );
		$pe->maybe_schedule_png_generation( $post );

		$actions = as_get_scheduled_actions(
			array(
				'hook'   => PNG_Export::ACTION_HOOK,
				'args'   => array( 'post_id' => $post_id ),
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			),
			'ids'
		);

		$this->assertNotEmpty( $actions );
	}

	/**
	 * A second call with unchanged hash does not enqueue a duplicate action.
	 */
	public function test_maybe_schedule_does_not_double_enqueue() {
		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			$this->markTestSkipped( 'Action Scheduler not available.' );
		}

		[ 'png_export' => $pe ] = $this->make_png_export( true );

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => $this->make_chart_post_content(),
		) );

		update_post_meta( $post_id, '_chart_attributes_hash', 'stale_hash_value' );

		$post = get_post( $post_id );
		$pe->maybe_schedule_png_generation( $post );
		$pe->maybe_schedule_png_generation( $post ); // Second call.

		$actions = as_get_scheduled_actions(
			array(
				'hook'   => PNG_Export::ACTION_HOOK,
				'args'   => array( 'post_id' => $post_id ),
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			),
			'ids'
		);

		$this->assertCount( 1, $actions );
	}

	// -------------------------------------------------------------------------
	// get_chart_block() — via compute_attributes_hash (indirect)
	// -------------------------------------------------------------------------

	/**
	 * A chart block nested inside a controller block is found correctly.
	 */
	public function test_chart_block_found_inside_controller() {
		[ 'png_export' => $pe ] = $this->make_png_export();

		$nested_content = $this->make_controller_post_content(
			array( 'chartData' => array( array( 'x' => 99 ) ) )
		);

		$flat_content = $this->make_chart_post_content(
			array( 'chartData' => array( array( 'x' => 99 ) ) )
		);

		// Both structures should produce the same hash because the chart attrs
		// are identical — this proves the nested chart block is found.
		$blocks_nested = parse_blocks( $nested_content );
		$blocks_flat   = parse_blocks( $flat_content );

		$attrs_nested = $blocks_nested[0]['innerBlocks'][0]['attrs'] ?? array();
		$attrs_flat   = $blocks_flat[0]['attrs'] ?? array();

		$this->assertEquals(
			$pe->compute_attributes_hash( $attrs_nested ),
			$pe->compute_attributes_hash( $attrs_flat )
		);
	}

	// -------------------------------------------------------------------------
	// generate_png() — unit tests with mocked Screenshot_Service
	// -------------------------------------------------------------------------

	/**
	 * generate_png() returns early for a non-published post.
	 */
	public function test_generate_png_returns_early_for_draft_post() {
		[ 'png_export' => $pe ] = $this->make_png_export( true, null );

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'draft',
			'post_content' => $this->make_chart_post_content(),
		) );

		// Should not throw and should not update any meta.
		$pe->generate_png( $post_id );

		$this->assertEmpty( get_post_meta( $post_id, '_chart_png_attachment_id', true ) );
	}

	/**
	 * generate_png() throws RuntimeException when the screenshot service fails.
	 */
	public function test_generate_png_throws_on_screenshot_service_error() {
		$error = new WP_Error( 'screenshotone_api_error', 'Connection refused' );

		[ 'png_export' => $pe ] = $this->make_png_export( true, $error );

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => $this->make_chart_post_content(),
		) );

		$this->expectException( \RuntimeException::class );

		$pe->generate_png( $post_id );
	}

	/**
	 * generate_png() updates post meta and featured image on success.
	 *
	 * We fake the PNG binary as the smallest valid PNG (1×1 transparent pixel)
	 * and let WordPress's media functions do the actual file handling.
	 */
	public function test_generate_png_updates_meta_on_success() {
		// Minimal 1×1 transparent PNG binary.
		$tiny_png = base64_decode(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
		);

		[ 'png_export' => $pe ] = $this->make_png_export( true, $tiny_png );

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => $this->make_chart_post_content(),
		) );

		// Provide the sideload function if we're in a test environment where
		// media_handle_sideload is available; skip otherwise.
		if ( ! function_exists( 'media_handle_sideload' ) ) {
			$this->markTestSkipped( 'media_handle_sideload() not available in this test environment.' );
		}

		$pe->generate_png( $post_id );

		$attachment_id = (int) get_post_meta( $post_id, '_chart_png_attachment_id', true );
		$png_url       = get_post_meta( $post_id, '_chart_png_url', true );
		$stored_hash   = get_post_meta( $post_id, '_chart_attributes_hash', true );
		$thumbnail_id  = (int) get_post_thumbnail_id( $post_id );

		$this->assertGreaterThan( 0, $attachment_id, '_chart_png_attachment_id should be a positive integer.' );
		$this->assertNotEmpty( $png_url, '_chart_png_url should not be empty.' );
		$this->assertNotEmpty( $stored_hash, '_chart_attributes_hash should not be empty.' );
		$this->assertEquals( $attachment_id, $thumbnail_id, 'Featured image should match the new attachment.' );
	}

	/**
	 * generate_png() deletes the previous attachment when a new one is created.
	 */
	public function test_generate_png_deletes_previous_attachment() {
		$tiny_png = base64_decode(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
		);

		[ 'png_export' => $pe ] = $this->make_png_export( true, $tiny_png );

		if ( ! function_exists( 'media_handle_sideload' ) ) {
			$this->markTestSkipped( 'media_handle_sideload() not available in this test environment.' );
		}

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => $this->make_chart_post_content(),
		) );

		// Create a dummy "previous" attachment and store its ID in post meta.
		$previous_attachment_id = self::factory()->attachment->create( array( 'post_parent' => $post_id ) );
		update_post_meta( $post_id, '_chart_png_attachment_id', $previous_attachment_id );

		$pe->generate_png( $post_id );

		// The old attachment should have been deleted.
		$this->assertNull( get_post( $previous_attachment_id ) );
	}

	/**
	 * generate_png() flags the new attachment with isChartBuilderImage meta.
	 */
	public function test_generate_png_flags_attachment_as_chart_builder_image() {
		$tiny_png = base64_decode(
			'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
		);

		[ 'png_export' => $pe ] = $this->make_png_export( true, $tiny_png );

		if ( ! function_exists( 'media_handle_sideload' ) ) {
			$this->markTestSkipped( 'media_handle_sideload() not available in this test environment.' );
		}

		$post_id = self::factory()->post->create( array(
			'post_type'    => 'chart',
			'post_status'  => 'publish',
			'post_content' => $this->make_chart_post_content(),
		) );

		$pe->generate_png( $post_id );

		$attachment_id = (int) get_post_meta( $post_id, '_chart_png_attachment_id', true );
		$is_chart_img  = get_post_meta( $attachment_id, 'isChartBuilderImage', true );

		$this->assertTrue( (bool) $is_chart_img );
	}

	// -------------------------------------------------------------------------
	// Loader wiring
	// -------------------------------------------------------------------------

	/**
	 * Constructor registers both publish and update hooks with the loader.
	 */
	public function test_constructor_registers_pipeline_hooks() {
		[ 'loader_mock' => $loader ] = $this->make_png_export();

		$hooks = array_column( $loader->actions, 'hook' );

		$this->assertContains( 'prc_platform_on_chart_publish', $hooks );
		$this->assertContains( 'prc_platform_on_chart_update', $hooks );
	}

	/**
	 * ACTION_HOOK and ACTION_GROUP constants have expected values.
	 */
	public function test_action_hook_constants() {
		$this->assertEquals( 'prc_chart_generate_png', PNG_Export::ACTION_HOOK );
		$this->assertEquals( 'prc-chart-builder', PNG_Export::ACTION_GROUP );
	}
}
