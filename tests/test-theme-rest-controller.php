<?php
/**
 * Chart theme REST controller tests (PRC-528 slices 7–8).
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Settings;
use PRC\Platform\Chart_Builder\Theme_REST_Controller;
use PRC\Platform\Chart_Builder\Loader;

/**
 * GET /prc-chart-builder/v1/theme
 */
class Test_Theme_REST_Controller extends WP_UnitTestCase {

	private const ROUTE = '/prc-chart-builder/v1/theme';

	public function set_up(): void {
		parent::set_up();

		new Theme_REST_Controller( new Loader() );
		do_action( 'rest_api_init' );
	}

	public function tear_down(): void {
		delete_option( Settings::OPTION_KEY );
		parent::tear_down();
	}

	public function test_get_theme_returns_active_theme_for_admin(): void {
		$theme = array(
			'config' => array(
				'metadata' => array( 'tag' => 'CUSTOM INSTITUTION' ),
			),
		);
		update_option( Settings::OPTION_KEY, $theme );

		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $theme, $response->get_data() );
	}

	public function test_get_theme_returns_empty_array_when_unset(): void {
		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	public function test_get_theme_forbidden_for_author(): void {
		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 403, $response->get_status() );
	}

	public function test_get_theme_forbidden_for_editor(): void {
		$editor_id = self::factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 403, $response->get_status() );
	}

	public function test_get_theme_allowed_for_edit_theme_options_capability(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config' => array(
					'layout' => array( 'width' => 720 ),
				),
			)
		);

		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$user    = new WP_User( $user_id );
		$user->add_cap( 'edit_theme_options' );
		wp_set_current_user( $user_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 720, $response->get_data()['config']['layout']['width'] );
	}

	public function test_post_theme_persists_for_admin(): void {
		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$payload = array(
			'config' => array(
				'metadata' => array( 'tag' => 'REST SAVED TAG' ),
				'layout'   => array( 'padding' => array( 'top' => 32 ) ),
			),
		);

		$response = $this->post_theme( $payload );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $payload, $response->get_data() );
		$this->assertSame( $payload, Settings::get_active_theme() );
	}

	public function test_post_theme_allowed_for_edit_theme_options_capability(): void {
		$user_id = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		$user    = new WP_User( $user_id );
		$user->add_cap( 'edit_theme_options' );
		wp_set_current_user( $user_id );

		$response = $this->post_theme(
			array(
				'config' => array(
					'legend' => array( 'fontFamily' => 'Georgia, serif' ),
				),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Georgia, serif', Settings::get_active_theme()['config']['legend']['fontFamily'] );
	}

	public function test_post_theme_forbidden_for_author(): void {
		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author_id );

		$response = $this->post_theme(
			array(
				'config' => array(
					'metadata' => array( 'tag' => 'SHOULD NOT SAVE' ),
				),
			)
		);

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( array(), Settings::get_active_theme() );
	}

	public function test_post_theme_rejects_invalid_payload(): void {
		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$response = $this->post_theme(
			array(
				'typography' => array( 'fontFamily' => 'Arial' ),
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$error = $response->as_error();
		$this->assertInstanceOf( WP_Error::class, $error );
		$this->assertSame( 'invalid_theme_key', $error->get_error_code() );
	}

	public function test_post_theme_triggers_cache_purge_action(): void {
		$admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );

		$purge_count = 0;
		add_action(
			'prc_chart_builder_purge_theme_cache',
			static function () use ( &$purge_count ): void {
				++$purge_count;
			}
		);

		$response = $this->post_theme(
			array(
				'config' => array(
					'metadata' => array( 'tag' => 'PURGE TEST' ),
				),
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 1, $purge_count );
	}

	/**
	 * @param array<string, mixed> $body Request JSON body.
	 */
	private function post_theme( array $body ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );

		return rest_do_request( $request );
	}
}
