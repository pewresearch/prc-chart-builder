<?php
/**
 * Signed HTTP endpoint screenshot provider.
 *
 * @package PRC\Platform\Chart_Builder\Screenshot_Providers
 */

namespace PRC\Platform\Chart_Builder\Screenshot_Providers;

/**
 * Generic signed HTTP screenshot adapter for Cloud Run, Lambda, or self-hosted backends.
 */
class Endpoint_Provider implements Screenshot_Provider {

	/**
	 * Request timeout in seconds.
	 *
	 * @var int
	 */
	private const REQUEST_TIMEOUT = 60;

	/**
	 * Shared-secret request header.
	 *
	 * @var string
	 */
	private const API_KEY_HEADER = 'X-Api-Key';

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'endpoint';
	}

	/**
	 * {@inheritDoc}
	 */
	public function is_configured(): bool {
		return '' !== $this->get_endpoint_url() && '' !== $this->get_endpoint_key();
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
				'endpoint_not_configured',
				__( 'Chart screenshot endpoint is not configured. Set PRC_PLATFORM_CHART_SCREENSHOT_ENDPOINT_URL and PRC_PLATFORM_CHART_SCREENSHOT_ENDPOINT_KEY constants.', 'prc-chart-builder' )
			);
		}

		$response = wp_remote_post(
			$this->get_endpoint_url(),
			array(
				'timeout' => self::REQUEST_TIMEOUT,
				'headers' => array(
					self::API_KEY_HEADER => $this->get_endpoint_key(),
					'Content-Type'       => 'application/json',
					'Accept'             => 'image/png',
				),
				'body'    => wp_json_encode( $this->build_request_body( $url, $spec ) ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'endpoint_http_error',
				sprintf(
					/* translators: %s: error message from the HTTP layer */
					__( 'Chart screenshot endpoint HTTP error: %s', 'prc-chart-builder' ),
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
	 * Map a capture spec onto the signed endpoint request body.
	 *
	 * @param string                  $url  Export URL to capture.
	 * @param Screenshot_Capture_Spec $spec Capture parameters.
	 * @return array<string, int|string>
	 */
	protected function build_request_body( string $url, Screenshot_Capture_Spec $spec ): array {
		return array(
			'url'               => $url,
			'selector'          => $spec->selector,
			'viewportWidth'     => $spec->viewport_width,
			'viewportHeight'    => $spec->viewport_height,
			'delaySeconds'      => $spec->delay_seconds,
			'deviceScaleFactor' => $spec->device_scale_factor,
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
				'endpoint_empty_response',
				__( 'Chart screenshot endpoint returned an empty response.', 'prc-chart-builder' )
			);
		}

		if ( ! str_starts_with( $body, "\x89PNG" ) ) {
			return $this->parse_error_body( $body, 200 );
		}

		return $body;
	}

	/**
	 * Parse an HTTP or non-PNG error response.
	 *
	 * @param string $body        Raw response body.
	 * @param int    $status_code HTTP status code.
	 * @return \WP_Error
	 */
	protected function parse_error_body( string $body, int $status_code ): \WP_Error {
		$message = __( 'Chart screenshot endpoint request failed.', 'prc-chart-builder' );
		$data    = json_decode( $body, true );

		if ( is_array( $data ) ) {
			if ( ! empty( $data['error'] ) && is_string( $data['error'] ) ) {
				$message = $data['error'];
			} elseif ( ! empty( $data['message'] ) && is_string( $data['message'] ) ) {
				$message = $data['message'];
			}
		} elseif ( ! str_starts_with( ltrim( $body ), '{' ) && '' !== trim( $body ) ) {
			$message = trim( $body );
		}

		return new \WP_Error(
			'endpoint_api_error',
			$message,
			array(
				'status' => $status_code,
			)
		);
	}

	/**
	 * Read the signed endpoint URL constant.
	 *
	 * @return string
	 */
	protected function get_endpoint_url(): string {
		if ( ! defined( 'PRC_PLATFORM_CHART_SCREENSHOT_ENDPOINT_URL' ) ) {
			return '';
		}

		$value = constant( 'PRC_PLATFORM_CHART_SCREENSHOT_ENDPOINT_URL' );

		return is_string( $value ) ? $value : '';
	}

	/**
	 * Read the signed endpoint API key constant.
	 *
	 * @return string
	 */
	protected function get_endpoint_key(): string {
		if ( ! defined( 'PRC_PLATFORM_CHART_SCREENSHOT_ENDPOINT_KEY' ) ) {
			return '';
		}

		$value = constant( 'PRC_PLATFORM_CHART_SCREENSHOT_ENDPOINT_KEY' );

		return is_string( $value ) ? $value : '';
	}
}
