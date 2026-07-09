<?php
/**
 * Chart theme settings tests (PRC-528 slice 1: option + delivery).
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Settings;
use PRC\Platform\Chart_Builder\Theme_Admin;
use PRC\Platform\Chart_Builder\Theme_Seeder;

/**
 * Theme option + delivery tests.
 */
class Test_Theme_Settings extends WP_UnitTestCase {

	public function tear_down(): void {
		delete_option( Settings::OPTION_KEY );
		parent::tear_down();
	}

	/**
	 * With no option stored, the active theme is an empty array (no-op == trunk).
	 */
	public function test_get_active_theme_returns_empty_array_when_unset(): void {
		$this->assertSame( array(), Settings::get_active_theme() );
		$this->assertFalse( get_option( Settings::OPTION_KEY, false ) );
	}

	public function test_get_active_theme_does_not_auto_seed_after_delete(): void {
		delete_option( Settings::OPTION_KEY );

		$this->assertSame( array(), Settings::get_active_theme() );
		$this->assertFalse( get_option( Settings::OPTION_KEY, false ) );
	}

	/**
	 * When the option holds a theme, get_active_theme() returns it verbatim.
	 */
	public function test_get_active_theme_returns_stored_option(): void {
		$theme = array(
			'config' => array(
				'layout' => array( 'padding' => array( 'top' => 24 ) ),
			),
		);
		update_option( Settings::OPTION_KEY, $theme );

		$this->assertSame( $theme, Settings::get_active_theme() );
	}

	/**
	 * A non-array option (corrupt/legacy) coerces to an empty array rather than
	 * leaking a scalar into the resolve layer.
	 */
	public function test_get_active_theme_coerces_non_array_to_empty(): void {
		update_option( Settings::OPTION_KEY, 'not-an-array' );

		$this->assertSame( array(), Settings::get_active_theme() );
	}

	/**
	 * A list-shaped array (numeric keys) is corrupt and must not reach the resolve layer.
	 */
	public function test_get_active_theme_coerces_list_array_to_empty(): void {
		update_option( Settings::OPTION_KEY, array( 'unexpected', 'list', 'shape' ) );

		$this->assertSame( array(), Settings::get_active_theme() );
	}

	public function test_get_active_theme_repairs_corrupt_empty_palette_colors(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config'   => array(
					'metadata' => array( 'tag' => 'PEW RESEARCH CENTER' ),
				),
				'palettes' => array(
					'colors'     => array(),
					'colorNames' => array(
						array(
							'label' => 'Politics Main',
							'value' => 'politics-main',
						),
					),
				),
			)
		);

		$theme = Settings::get_active_theme();

		$this->assertArrayHasKey( 'politics-main', $theme['palettes']['colors'] );
		$this->assertNotEmpty( $theme['palettes']['colors']['politics-main'] );
		$this->assertGreaterThan( 0, Settings::count_palette_colors( $theme ) );
	}

	/**
	 * Frontend delivery merges theme.json fontFamilies into the runtime global.
	 */
	public function test_get_theme_for_frontend_includes_font_families(): void {
		add_filter(
			'wp_theme_json_data_theme',
			static function ( $theme_json ) {
				return $theme_json->update_with(
					array(
						'version'  => 3,
						'settings' => array(
							'typography' => array(
								'fontFamilies' => array(
									array(
										'fontFamily' => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
										'name'       => 'Sans-Serif',
										'slug'       => 'sans-serif',
									),
								),
							),
						),
					)
				);
			}
		);

		$theme = Settings::get_theme_for_frontend();

		$this->assertArrayHasKey( 'fontFamilies', $theme );
		$this->assertNotEmpty( $theme['fontFamilies'] );
		$this->assertSame( 'sans-serif', $theme['fontFamilies'][0]['slug'] );
		$this->assertStringContainsString(
			'franklin-gothic-urw',
			$theme['fontFamilies'][0]['value']
		);
	}
}
