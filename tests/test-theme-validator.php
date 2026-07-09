<?php
/**
 * Chart theme validator tests (PRC-528 slice 8).
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Theme_Validator;
use PRC\Platform\Chart_Builder\Theme_Seeder;

/**
 * Theme_Validator shape checks.
 */
class Test_Theme_Validator extends WP_UnitTestCase {

	public function test_validate_accepts_config_and_palettes(): void {
		$input = array(
			'config'   => array(
				'layout' => array( 'padding' => array( 'top' => 40 ) ),
			),
			'palettes' => array(
				'colors' => array(
					'general' => array( '#111111', '#222222' ),
				),
				'colorNames' => array(
					array(
						'label' => 'General',
						'value' => 'general',
					),
				),
			),
		);

		$result = Theme_Validator::validate( $input );

		$this->assertIsArray( $result );
		$this->assertSame( 40, $result['config']['layout']['padding']['top'] );
		$this->assertSame( array( '#111111', '#222222' ), $result['palettes']['colors']['general'] );
		$this->assertSame( 'General', $result['palettes']['colorNames'][0]['label'] );
	}

	public function test_validate_preserves_legacy_theme_palette_catalog(): void {
		$legacy = Theme_Seeder::load_legacy_theme();

		$this->assertIsArray( $legacy );

		$result = Theme_Validator::validate( $legacy );

		$this->assertIsArray( $result );
		$this->assertArrayHasKey( 'politics-main', $result['palettes']['colors'] );
		$this->assertNotEmpty( $result['palettes']['colors']['politics-main'] );
		$this->assertNotEmpty( $result['palettes']['colorNames'] );
	}

	public function test_validate_rejects_non_object_payload(): void {
		$result = Theme_Validator::validate( 'not-an-array' );

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_theme_payload', $result->get_error_code() );
		$this->assertSame( 400, $result->get_error_data()['status'] );
	}

	public function test_validate_rejects_list_payload(): void {
		$result = Theme_Validator::validate( array( 'config' ) );

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_theme_payload', $result->get_error_code() );
	}

	public function test_validate_rejects_unknown_root_key(): void {
		$result = Theme_Validator::validate(
			array(
				'typography' => array( 'fontFamily' => 'Arial' ),
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_theme_key', $result->get_error_code() );
	}

	public function test_validate_rejects_list_config(): void {
		$result = Theme_Validator::validate(
			array(
				'config' => array( 'layout' ),
			)
		);

		$this->assertWPError( $result );
		$this->assertSame( 'invalid_theme_config', $result->get_error_code() );
	}

	public function test_validate_accepts_empty_object_to_clear_theme(): void {
		$result = Theme_Validator::validate( array() );

		$this->assertSame( array(), $result );
	}
}
