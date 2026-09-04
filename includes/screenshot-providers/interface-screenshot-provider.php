<?php
/**
 * Screenshot provider interface.
 *
 * @package PRC\Platform\Chart_Builder\Screenshot_Providers
 */

namespace PRC\Platform\Chart_Builder\Screenshot_Providers;

/**
 * Contract for chart screenshot backends.
 */
interface Screenshot_Provider {

	/**
	 * URL-safe provider identifier.
	 *
	 * @return string
	 */
	public function get_slug(): string;

	/**
	 * Whether this provider is configured and ready to capture.
	 *
	 * @return bool
	 */
	public function is_configured(): bool;

	/**
	 * Capture a PNG screenshot for the given URL and spec.
	 *
	 * @param string                  $url  Export URL to capture.
	 * @param Screenshot_Capture_Spec $spec Capture parameters.
	 * @return string|\WP_Error Raw PNG binary, or WP_Error on failure.
	 */
	public function capture( string $url, Screenshot_Capture_Spec $spec );
}
