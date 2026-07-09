<?php
/**
 * Tests for Block_Utils request-scoped render-id deduplication.
 *
 * @package PRC\Platform\Chart_Builder
 */

use PRC\Platform\Chart_Builder\Block_Utils;

/**
 * Unit tests for Block_Utils::claim_unique_render_id().
 *
 * These guard the fix for copy/pasted chart blocks that share ids: duplicate
 * controller/chart ids on one rendered page must be rewritten to unique values
 * so DOM ids, wp_interactivity_state() keys and data-prc-chart-id lookups don't
 * collide.
 */
class BlockUtilsRenderIdsTest extends WP_UnitTestCase {

	/**
	 * Each test starts with an empty registry (production scopes it per request).
	 */
	public function set_up() {
		parent::set_up();
		Block_Utils::reset_render_id_registry();
	}

	/**
	 * The first block to claim an id keeps it verbatim.
	 */
	public function test_first_claim_returns_id_unchanged() {
		$this->assertSame(
			'chart-abc',
			Block_Utils::claim_unique_render_id( 'chart-abc' )
		);
	}

	/**
	 * A second (and third) claim of the same id receives a deterministic suffix.
	 */
	public function test_duplicate_claims_receive_incrementing_suffixes() {
		$this->assertSame( 'dupe', Block_Utils::claim_unique_render_id( 'dupe' ) );
		$this->assertSame( 'dupe-2', Block_Utils::claim_unique_render_id( 'dupe' ) );
		$this->assertSame( 'dupe-3', Block_Utils::claim_unique_render_id( 'dupe' ) );
	}

	/**
	 * Distinct ids never interfere with each other.
	 */
	public function test_distinct_ids_are_independent() {
		$this->assertSame( 'one', Block_Utils::claim_unique_render_id( 'one' ) );
		$this->assertSame( 'two', Block_Utils::claim_unique_render_id( 'two' ) );
		$this->assertSame( 'one-2', Block_Utils::claim_unique_render_id( 'one' ) );
	}

	/**
	 * A generated suffix that would itself collide is skipped.
	 */
	public function test_suffix_skips_ids_that_already_exist() {
		// Pre-claim the value the suffixer would naively pick next.
		Block_Utils::claim_unique_render_id( 'x' );
		Block_Utils::claim_unique_render_id( 'x-2' );

		// The next claim of "x" must jump past the already-claimed "x-2".
		$this->assertSame( 'x-3', Block_Utils::claim_unique_render_id( 'x' ) );
	}

	/**
	 * Empty and non-string ids pass through unchanged so the chart render
	 * callback's own missing-id fallback can handle them.
	 */
	public function test_empty_and_non_string_ids_pass_through() {
		$this->assertSame( '', Block_Utils::claim_unique_render_id( '' ) );
		$this->assertNull( Block_Utils::claim_unique_render_id( null ) );
		$this->assertFalse( Block_Utils::claim_unique_render_id( false ) );
	}

	/**
	 * Resetting the registry lets an id be claimed verbatim again.
	 */
	public function test_reset_clears_the_registry() {
		Block_Utils::claim_unique_render_id( 'reset-me' );
		Block_Utils::reset_render_id_registry();
		$this->assertSame(
			'reset-me',
			Block_Utils::claim_unique_render_id( 'reset-me' )
		);
	}

	/**
	 * The controller render contract: two controllers that share a saved id
	 * (a copy/paste) produce unique controller ids AND unique derived chart ids.
	 */
	public function test_duplicate_controller_pair_yields_unique_chart_ids() {
		// First controller/chart pair keeps its saved ids.
		$controller_a = Block_Utils::claim_unique_render_id( 'ctrl' );
		$chart_a      = Block_Utils::claim_unique_render_id( 'ctrl-chart' );
		$this->assertSame( 'ctrl', $controller_a );
		$this->assertSame( 'ctrl-chart', $chart_a );

		// Second pair with the same saved controller id: controller id is
		// rewritten, so the chart id follows the new controller id.
		$controller_b = Block_Utils::claim_unique_render_id( 'ctrl' );
		$this->assertSame( 'ctrl-2', $controller_b );
		$chart_b = Block_Utils::claim_unique_render_id( $controller_b . '-chart' );
		$this->assertSame( 'ctrl-2-chart', $chart_b );

		// All four ids are unique.
		$this->assertSame(
			4,
			count( array_unique( array( $controller_a, $chart_a, $controller_b, $chart_b ) ) )
		);
	}
}
