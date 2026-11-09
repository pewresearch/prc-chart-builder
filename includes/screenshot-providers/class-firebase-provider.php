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
		if ( ! $this->is_configured() ) {
			return new \WP_Error(
				'firebase_not_configured',
				__( 'Firebase screenshotElement is not configured. Ensure prc-firebase is active and prc_platform_firebase_render_endpoints includes screenshot_element.', 'prc-chart-builder' )
			);
		}

		return $this->firebase()->screenshot_element( $this->build_request_body( $url, $spec ) );
	}

	/**
	 * Map a capture spec onto the screenshotElement request body.
	 *
	 * @param string                  $url  Export URL to capture.
	 * @param Screenshot_Capture_Spec $spec Capture parameters.
	 * @return array<string, mixed>
	 */
	protected function build_request_body( string $url, Screenshot_Capture_Spec $spec ): array {
		return array(
			'url'               => $url,
			'selector'          => $spec->selector,
			'waitMs'            => $spec->delay_seconds * 1000,
			'viewportWidth'     => min( $spec->viewport_width, Screenshot_Capture_Spec::MAX_VIEWPORT_PX ),
			'viewportHeight'    => min( $spec->viewport_height, Screenshot_Capture_Spec::MAX_VIEWPORT_PX ),
			'captureElement'    => true,
			'deviceScaleFactor' => $spec->device_scale_factor,
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
	 * The prc-firebase client that calls screenshotElement.
	 *
	 * @return \PRC\Platform\Firebase
	 */
	protected function firebase(): \PRC\Platform\Firebase {
		return new \PRC\Platform\Firebase();
	}
}
