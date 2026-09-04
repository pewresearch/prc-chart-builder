<?php
/**
 * Firebase screenshotElement Cloud Function provider.
 *
 * @package PRC\Platform\Chart_Builder\Screenshot_Providers
 */

namespace PRC\Platform\Chart_Builder\Screenshot_Providers;

/**
 * Firebase OIDC adapter for the shared screenshotElement render function.
 */
class Firebase_Provider implements Screenshot_Provider {

	/**
	 * Request timeout in seconds.
	 *
	 * @var int
	 */
	private const REQUEST_TIMEOUT = 120;

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'firebase';
	}

	/**
	 * {@inheritDoc}
	 */
	public function is_configured(): bool {
		return '' !== $this->get_screenshot_endpoint() && class_exists( '\\PRC\\Platform\\Firebase' );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string                  $url  Export URL to capture.
	 * @param Screenshot_Capture_Spec $spec Capture parameters.
	 * @return string|\WP_Error Raw PNG binary, or WP_Error on failure.
	 */
	public function capture( string $url, Screenshot_Capture_Spec $spec ) {
		$endpoint = $this->get_screenshot_endpoint();

		if ( ! $this->is_configured() ) {
			return new \WP_Error(
				'firebase_not_configured',
				__( 'Firebase screenshotElement is not configured. Ensure prc-firebase is active and prc_platform_firebase_render_endpoints includes screenshot_element.', 'prc-chart-builder' )
			);
		}

		$id_token = $this->get_id_token( $endpoint );
		if ( is_wp_error( $id_token ) ) {
			return new \WP_Error(
				'firebase_auth_error',
				sprintf(
					/* translators: %s: error message from Firebase auth */
					__( 'Firebase screenshot auth failed: %s', 'prc-chart-builder' ),
					$id_token->get_error_message()
				)
			);
		}

		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => self::REQUEST_TIMEOUT,
				'headers' => array(
					'Authorization' => 'Bearer ' . $id_token,
					'Content-Type'  => 'application/json',
					'Accept'        => 'image/png',
				),
				'body'    => wp_json_encode( $this->build_request_body( $url, $spec ) ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'firebase_http_error',
				sprintf(
					/* translators: %s: error message from the HTTP layer */
					__( 'Firebase screenshotElement HTTP error: %s', 'prc-chart-builder' ),
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
	 * Map a capture spec onto the screenshotElement request body.
	 *
	 * @param string                  $url  Export URL to capture.
	 * @param Screenshot_Capture_Spec $spec Capture parameters.
	 * @return array<string, int|string>
	 */
	protected function build_request_body( string $url, Screenshot_Capture_Spec $spec ): array {
		return array(
			'url'               => $url,
			'selector'          => $spec->selector,
			'waitMs'            => $spec->delay_seconds * 1000,
			'viewportWidth'     => min( $spec->viewport_width, Screenshot_Capture_Spec::MAX_VIEWPORT_PX ),
			'viewportHeight'    => min( $spec->viewport_height, Screenshot_Capture_Spec::MAX_VIEWPORT_PX ),
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
				'firebase_empty_response',
				__( 'Firebase screenshotElement returned an empty response.', 'prc-chart-builder' )
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
		$message = __( 'Firebase screenshotElement request failed.', 'prc-chart-builder' );
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
			'firebase_api_error',
			$message,
			array(
				'status' => $status_code,
			)
		);
	}

	/**
	 * Resolve Firebase render endpoint URLs.
	 *
	 * @return array<string, string>
	 */
	protected function get_endpoints(): array {
		$endpoints = apply_filters( 'prc_platform_firebase_render_endpoints', array() );

		return is_array( $endpoints ) ? $endpoints : array();
	}

	/**
	 * Read the screenshotElement Cloud Function URL.
	 *
	 * @return string
	 */
	protected function get_screenshot_endpoint(): string {
		$endpoint = $this->get_endpoints()['screenshot_element'] ?? '';

		return is_string( $endpoint ) ? $endpoint : '';
	}

	/**
	 * Fetch an OIDC ID token for the screenshotElement endpoint.
	 *
	 * @param string $endpoint Cloud Function URL used as the token audience.
	 * @return string|\WP_Error
	 */
	protected function get_id_token( string $endpoint ) {
		$firebase = new \PRC\Platform\Firebase();

		return $firebase->get_id_token( $endpoint );
	}
}
