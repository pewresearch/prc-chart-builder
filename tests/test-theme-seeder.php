<?php
/**
 * Chart theme seeder tests (PRC-528 slice 9).
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Settings;
use PRC\Platform\Chart_Builder\Theme_Seeder;

/**
 * Theme_Seeder idempotent legacy theme seeding.
 */
class Test_Theme_Seeder extends WP_UnitTestCase {

	public function tear_down(): void {
		delete_option( Settings::OPTION_KEY );
		parent::tear_down();
	}

	public function test_legacy_theme_file_loads_and_contains_prc_defaults(): void {
		$legacy = Theme_Seeder::load_legacy_theme();

		$this->assertIsArray( $legacy );
		$this->assertSame( 'PEW RESEARCH CENTER', $legacy['config']['metadata']['tag'] );
		$this->assertSame(
			"'franklin-gothic-urw', Verdana, Geneva, sans-serif",
			$legacy['config']['legend']['fontFamily']
		);
		$this->assertArrayHasKey( 'general', $legacy['palettes']['colors'] );
		$this->assertNotEmpty( $legacy['palettes']['colorNames'] );
	}

	public function test_seed_if_empty_writes_legacy_theme(): void {
		$this->assertFalse( Theme_Seeder::has_active_theme() );

		$result = Theme_Seeder::seed_if_empty();

		$this->assertTrue( $result );
		$this->assertTrue( Theme_Seeder::has_active_theme() );
		$this->assertSame( 'PEW RESEARCH CENTER', Settings::get_active_theme()['config']['metadata']['tag'] );
		$this->assertNotEmpty( Settings::get_active_theme()['palettes']['colors']['politics-main'] );
	}

	public function test_seed_if_empty_is_no_op_when_theme_exists(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config' => array(
					'metadata' => array( 'tag' => 'EXISTING THEME' ),
				),
			)
		);

		$result = Theme_Seeder::seed_if_empty();

		$this->assertFalse( $result );
		$this->assertSame( 'EXISTING THEME', Settings::get_active_theme()['config']['metadata']['tag'] );
	}

	public function test_seed_if_empty_is_no_op_after_first_seed(): void {
		Theme_Seeder::seed_if_empty();

		$before = Settings::get_active_theme();

		$this->assertFalse( Theme_Seeder::seed_if_empty() );
		$this->assertSame( $before, Settings::get_active_theme() );
	}

	public function test_seed_if_empty_seeds_when_option_is_corrupt_list_array(): void {
		update_option( Settings::OPTION_KEY, array( 'corrupt', 'list' ) );

		$this->assertFalse( Theme_Seeder::has_active_theme() );

		$result = Theme_Seeder::seed_if_empty();

		$this->assertTrue( $result );
		$this->assertSame( 'PEW RESEARCH CENTER', Settings::get_active_theme()['config']['metadata']['tag'] );
	}
}
