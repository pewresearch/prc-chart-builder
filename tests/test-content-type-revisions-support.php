<?php
/**
 * Tests for chart post type revisions support.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Content_Type;

/**
 * Chart post type prc-revisions support tests.
 */
class Test_Content_Type_Revisions_Support extends WP_UnitTestCase {

	/**
	 * Chart CPT should opt into prc-revisions after init.
	 */
	public function test_chart_post_type_supports_prc_revisions(): void {
		$this->assertTrue( post_type_exists( Content_Type::$post_type ) );
		$this->assertTrue(
			post_type_supports( Content_Type::$post_type, 'prc-revisions' ),
			'Chart post type should support prc-revisions for future revision workflow.'
		);
	}
}
