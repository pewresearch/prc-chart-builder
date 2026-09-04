<?php
/**
 * Cloudflare Browser Rendering screenshot provider.
 *
 * @package PRC\Platform\Chart_Builder\Screenshot_Providers
 */

namespace PRC\Platform\Chart_Builder\Screenshot_Providers;

/**
 * Cloudflare Browser Rendering REST adapter.
 */
class Cloudflare_Provider implements Screenshot_Provider {

	/**
	 * Cloudflare API base URL.
	 *
	 * @var string
	 */
	private const API_BASE = 'https://api.cloudflare.com/client/v4';

	/**
	 * Request timeout in seconds.
	 *
	 * @var int
	 */
	private const REQUEST_TIMEOUT = 60;

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'cloudflare';
	}

	/**
	 * {@inheritDoc}
	 */
	public function is_configured(): bool {
		return '' !== $this->get_account_id() && '' !== $this->get_api_token();
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string                  $url  Export URL to capture.
	 * @param Screenshot_Capture_Spec $spec Capture parameters.
	 * @return string|\WP_Error Raw PNG binary, or WP_Error on failure.
	 */
	public function capture( string $url, Screenshot_Capture_Spec $spec ) {
		if ( ! $this->is_configured() ) {
			return new \WP_Error(
				'cloudflare_not_configured',
				__( 'Cloudflare Browser Rendering is not configured. Set PRC_PLATFORM_CLOUDFLARE_ACCOUNT_ID and PRC_PLATFORM_CLOUDFLARE_BROWSER_RENDERING_API_TOKEN constants.', 'prc-chart-builder' )
			);
		}

		$response = wp_remote_post(
			$this->build_api_url(),
			array(
				'timeout' => self::REQUEST_TIMEOUT,
				'headers' => array(
					'Authorization' => 'Bearer ' . $this->get_api_token(),
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode( $this->build_request_body( $url, $spec ) ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'cloudflare_http_error',
				sprintf(
					/* translators: %s: error message from the HTTP layer */
					__( 'Cloudflare Browser Rendering HTTP error: %s', 'prc-chart-builder' ),
					$response->get_error_message()
				)
			);
		}

		$status_code = (int) wp_remote_retrieve_response_code( $response );
		$body        = wp_remote_retrieve_body( $response );

		if ( $status_code >= 200 && $status_code < 300 ) {
			return $this->parse_success_body( $body );
		}

		return $this->parse_error_body( $body, $status_code );
	}

	/**
	 * Build the Cloudflare screenshot API URL.
	 *
	 * @return string
	 */
	protected function build_api_url(): string {
		return sprintf(
			'%s/accounts/%s/browser-rendering/screenshot',
			self::API_BASE,
			rawurlencode( $this->get_account_id() )
		);
	}

	/**
	 * Map a capture spec onto the Cloudflare screenshot request body.
	 *
	 * @param string                  $url  Export URL to capture.
	 * @param Screenshot_Capture_Spec $spec Capture parameters.
	 * @return array<string, mixed>
	 */
	protected function build_request_body( string $url, Screenshot_Capture_Spec $spec ): array {
		return array(
			'url'               => $url,
			'selector'          => $spec->selector,
			'viewport'          => array(
				'width'             => $spec->viewport_width,
				'height'            => $spec->viewport_height,
				'deviceScaleFactor' => $spec->device_scale_factor,
			),
			'waitForTimeout'    => $spec->delay_seconds * 1000,
			'gotoOptions'       => array(
				'waitUntil' => 'networkidle0',
			),
			'screenshotOptions' => array(
				'type'     => 'png',
				'fullPage' => false,
			),
		);
	}

	/**
	 * Parse a successful PNG response body.
	 *
	 * @param string $body Raw response body.
	 * @return string|\WP_Error
	 */
	protected function parse_success_body( string $body ) {
		if ( '' === $body ) {
			return new \WP_Error(
				'cloudflare_empty_response',
				__( 'Cloudflare Browser Rendering returned an empty response.', 'prc-chart-builder' )
			);
		}

		if ( str_starts_with( ltrim( $body ), '{' ) ) {
			return $this->parse_error_body( $body, 200 );
		}

		return $body;
	}

	/**
	 * Parse a Cloudflare JSON error envelope.
	 *
	 * @param string $body        Raw response body.
	 * @param int    $status_code HTTP status code.
	 * @return \WP_Error
	 */
	protected function parse_error_body( string $body, int $status_code ): \WP_Error {
		$data    = json_decode( $body, true );
		$message = __( 'Cloudflare Browser Rendering request failed.', 'prc-chart-builder' );

		if ( is_array( $data ) && ! empty( $data['errors'] ) && is_array( $data['errors'] ) ) {
			$messages = array();
			foreach ( $data['errors'] as $error ) {
				if ( is_array( $error ) && ! empty( $error['message'] ) ) {
					$messages[] = (string) $error['message'];
				}
			}
			if ( ! empty( $messages ) ) {
				$message = implode( ' ', $messages );
			}
		}

		return new \WP_Error(
			'cloudflare_api_error',
			$message,
			array(
				'status' => $status_code,
			)
		);
	}

	/**
	 * Read the Cloudflare account ID constant.
	 *
	 * @return string
	 */
	protected function get_account_id(): string {
		if ( ! defined( 'PRC_PLATFORM_CLOUDFLARE_ACCOUNT_ID' ) ) {
			return '';
		}

		$value = constant( 'PRC_PLATFORM_CLOUDFLARE_ACCOUNT_ID' );

		return is_string( $value ) ? $value : '';
	}

	/**
	 * Read the Cloudflare Browser Rendering API token constant.
	 *
	 * @return string
	 */
	protected function get_api_token(): string {
		if ( ! defined( 'PRC_PLATFORM_CLOUDFLARE_BROWSER_RENDERING_API_TOKEN' ) ) {
			return '';
		}

		$value = constant( 'PRC_PLATFORM_CLOUDFLARE_BROWSER_RENDERING_API_TOKEN' );

		return is_string( $value ) ? $value : '';
	}
}
