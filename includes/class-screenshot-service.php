<?php
/**
 * Screenshot Service
 *
 * Facade for chart screenshot capture. Builds capture specs and delegates
 * to the configured screenshot provider. Callers (PNG_Export) handle saving
 * to the media library.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use PRC\Platform\Chart_Builder\Screenshot_Providers\Screenshot_Capture_Spec;
use PRC\Platform\Chart_Builder\Screenshot_Providers\Screenshot_Provider;
use PRC\Platform\Chart_Builder\Screenshot_Providers\Screenshot_Provider_Registry;

/**
 * Screenshot Service
 */
class Screenshot_Service {

	/**
	 * CSS selector targeting the chart wrapper element.
	 *
	 * @var string
	 */
	const CHART_SELECTOR = Screenshot_Capture_Spec::DEFAULT_SELECTOR;

	/**
	 * Delay in seconds to allow the charting library JS to fully render
	 * before capture.
	 *
	 * @var int
	 */
	const RENDER_DELAY_SECONDS = Screenshot_Capture_Spec::DEFAULT_DELAY_SECONDS;

	/**
	 * Device scale factor for retina-quality output.
	 *
	 * @var int
	 */
	const DEVICE_SCALE_FACTOR = Screenshot_Capture_Spec::DEFAULT_DEVICE_SCALE_FACTOR;

	/**
	 * Padding (px) added to each side of the viewport width and height.
	 *
	 * @var int
	 */
	const VIEWPORT_SIDE_PADDING = Screenshot_Capture_Spec::DEFAULT_VIEWPORT_SIDE_PADDING;

	/**
	 * Default chart width when layout.width is not available.
	 *
	 * @var int
	 */
	const DEFAULT_CHART_WIDTH = 640;

	/**
	 * Default chart height when layout.height is not available.
	 *
	 * @var int
	 */
	const DEFAULT_CHART_HEIGHT = 400;

	/**
	 * Active screenshot provider, when one resolves and is configured.
	 *
	 * @var Screenshot_Provider|null
	 */
	private ?Screenshot_Provider $provider;

	/**
	 * Provider slug from the most recent successful capture.
	 *
	 * @var array{provider: string}|null
	 */
	private ?array $last_capture_meta = null;

	/**
	 * Constructor.
	 *
	 * @param Screenshot_Provider|null $provider Optional provider override for tests.
	 */
	public function __construct( ?Screenshot_Provider $provider = null ) {
		$this->provider = $provider ?? Screenshot_Provider_Registry::resolve();
	}

	/**
	 * Check whether screenshot capture is configured.
	 *
	 * @return bool
	 */
	public function is_configured(): bool {
		return null !== $this->provider && $this->provider->is_configured();
	}

	/**
	 * Metadata from the most recent successful take() / take_spec() call.
	 *
	 * @return array{provider: string}|null
	 */
	public function get_last_capture_meta(): ?array {
		return $this->last_capture_meta;
	}

	/**
	 * Take a screenshot of the chart at the given export URL.
	 *
	 * Width and height are read from the chart block's layout.width and
	 * layout.height attributes so the viewport matches the chart exactly.
	 * Side padding is added to both axes to account for the social media
	 * whitespace the chart renders with.
	 *
	 * Returns the raw PNG binary on success, or WP_Error on failure.
	 *
	 * @param string $export_url   The chart export URL (permalink + /export/).
	 * @param int    $chart_width  The chart's layout.width value in pixels.
	 * @param int    $chart_height The chart's layout.height value in pixels.
	 * @return string|\WP_Error Raw PNG binary, or WP_Error on failure.
	 */
	public function take(
		string $export_url,
		int $chart_width = self::DEFAULT_CHART_WIDTH,
		int $chart_height = self::DEFAULT_CHART_HEIGHT
	) {
		return $this->capture(
			$export_url,
			Screenshot_Capture_Spec::from_layout( $chart_width, $chart_height )
		);
	}

	/**
	 * Take a screenshot using an explicit capture spec.
	 *
	 * @param string                  $export_url The chart export URL.
	 * @param Screenshot_Capture_Spec $spec       Capture parameters.
	 * @return string|\WP_Error Raw PNG binary, or WP_Error on failure.
	 */
	public function take_spec( string $export_url, Screenshot_Capture_Spec $spec ) {
		$export_url = add_query_arg(
			array(
				'screenshot_width'  => $spec->get_layout_width(),
				'screenshot_height' => $spec->get_layout_height(),
			),
			$export_url
		);

		return $this->capture( $export_url, $spec );
	}

	/**
	 * Delegate a normalized request to the configured provider.
	 *
	 * @param string                  $export_url The chart export URL.
	 * @param Screenshot_Capture_Spec $spec       Capture parameters.
	 * @return string|\WP_Error Raw PNG binary, or WP_Error on failure.
	 */
	private function capture( string $export_url, Screenshot_Capture_Spec $spec ) {
		$this->last_capture_meta = null;

		if ( ! $this->is_configured() ) {
			return new \WP_Error(
				'screenshot_service_not_configured',
				__( 'No screenshot provider is configured. Set PRC_PLATFORM_CHART_SCREENSHOT_PROVIDER or configure credentials for an available provider.', 'prc-chart-builder' )
			);
		}

		$result = $this->provider->capture( $export_url, $spec );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$this->last_capture_meta = array(
			'provider' => $this->provider->get_slug(),
		);

		return $result;
	}
}
