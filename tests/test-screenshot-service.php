<?php
/**
 * Tests for Screenshot_Service
 *
 * @package PRC\Platform\Chart_Builder
 */

use PRC\Platform\Chart_Builder\Screenshot_Service;

/**
 * Tests for the Screenshot_Service class.
 *
 * The live API call path (actually hitting ScreenshotOne) is skipped unless
 * PRC_SCREENSHOTONE_ACCESS_KEY and PRC_SCREENSHOTONE_SECRET_KEY are defined,
 * mirroring the pattern used for live OCR tests in prc-pdf-extraction.
 */
class ScreenshotServiceTest extends WP_UnitTestCase {

	// -------------------------------------------------------------------------
	// is_configured()
	// -------------------------------------------------------------------------

	/**
	 * is_configured() returns false when neither credential constant is defined.
	 */
	public function test_is_configured_returns_false_when_no_credentials() {
		if ( defined( 'PRC_SCREENSHOTONE_ACCESS_KEY' ) || defined( 'PRC_SCREENSHOTONE_SECRET_KEY' ) ) {
			$this->markTestSkipped( 'Credential constants are defined in this environment.' );
		}

		$service = new Screenshot_Service();

		$this->assertFalse( $service->is_configured() );
	}

	/**
	 * is_configured() returns true when both credential constants are defined
	 * with non-empty values.
	 */
	public function test_is_configured_returns_true_when_credentials_present() {
		if ( ! defined( 'PRC_SCREENSHOTONE_ACCESS_KEY' ) ) {
			$this->markTestSkipped( 'PRC_SCREENSHOTONE_ACCESS_KEY is not defined in this environment.' );
		}
		if ( ! defined( 'PRC_SCREENSHOTONE_SECRET_KEY' ) ) {
			$this->markTestSkipped( 'PRC_SCREENSHOTONE_SECRET_KEY is not defined in this environment.' );
		}

		$service = new Screenshot_Service();

		$this->assertTrue( $service->is_configured() );
	}

	// -------------------------------------------------------------------------
	// take() — unconfigured guard
	// -------------------------------------------------------------------------

	/**
	 * take() returns WP_Error when credentials are not configured.
	 */
	public function test_take_returns_wp_error_when_not_configured() {
		if ( defined( 'PRC_SCREENSHOTONE_ACCESS_KEY' ) || defined( 'PRC_SCREENSHOTONE_SECRET_KEY' ) ) {
			$this->markTestSkipped( 'Credential constants are defined; guard branch cannot be tested.' );
		}

		$service = new Screenshot_Service();
		$result  = $service->take( 'https://example.com/chart/test/export/' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertEquals( 'screenshotone_not_configured', $result->get_error_code() );
	}

	// -------------------------------------------------------------------------
	// Constants
	// -------------------------------------------------------------------------

	/**
	 * Class constants have the expected values used in API option building.
	 */
	public function test_constants_have_expected_values() {
		$this->assertEquals( '.wp-chart-builder-chart', Screenshot_Service::CHART_SELECTOR );
		$this->assertEquals( 5, Screenshot_Service::RENDER_DELAY_SECONDS );
		$this->assertEquals( 2, Screenshot_Service::DEVICE_SCALE_FACTOR );
		$this->assertEquals( 48, Screenshot_Service::VIEWPORT_SIDE_PADDING );
		$this->assertEquals( 640, Screenshot_Service::DEFAULT_CHART_WIDTH );
		$this->assertEquals( 400, Screenshot_Service::DEFAULT_CHART_HEIGHT );
	}

	// -------------------------------------------------------------------------
	// take() — live API (requires credentials)
	// -------------------------------------------------------------------------

	/**
	 * take() returns a non-empty PNG binary when credentials are present and
	 * the export URL resolves to a real chart.
	 *
	 * This test is skipped in all environments where credentials are absent.
	 * Run it against the VIP dev-env with credentials set in wp-config.
	 */
	public function test_take_returns_png_binary_with_valid_url() {
		if ( ! defined( 'PRC_SCREENSHOTONE_ACCESS_KEY' ) || ! defined( 'PRC_SCREENSHOTONE_SECRET_KEY' ) ) {
			$this->markTestSkipped( 'ScreenshotOne credentials not set; skipping live API test.' );
		}

		// Use a known publicly accessible chart export URL for integration testing.
		$test_url = getenv( 'SCREENSHOTONE_TEST_URL' );
		if ( ! $test_url ) {
			$this->markTestSkipped( 'SCREENSHOTONE_TEST_URL env var not set; skipping live API test.' );
		}

		$service = new Screenshot_Service();
		$result  = $service->take( $test_url, 640, 400 );

		$this->assertIsString( $result );
		$this->assertNotEmpty( $result );

		// Verify it's a valid PNG by checking the PNG magic bytes.
		$this->assertEquals( "\x89PNG", substr( $result, 0, 4 ) );
	}
}
