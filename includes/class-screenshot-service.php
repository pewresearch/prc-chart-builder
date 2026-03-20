<?php
/**
 * Screenshot Service
 *
 * Thin wrapper around the ScreenshotOne PHP SDK. Responsible for building
 * the API options for chart screenshot capture and returning the raw PNG
 * binary. Callers (PNG_Export) handle saving to the media library.
 *
 * Credentials are read from PHP constants:
 *   - PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY
 *   - PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use ScreenshotOne\Sdk\Client;
use ScreenshotOne\Sdk\TakeOptions;

/**
 * Screenshot Service
 */
class Screenshot_Service {

	/**
	 * The ScreenshotOne API client.
	 *
	 * @var Client|null
	 */
	private $client = null;

	/**
	 * CSS selector targeting the chart wrapper element.
	 * Scopes the screenshot to just the chart and its text elements
	 * (title, subtitle, note, source, tag).
	 *
	 * @var string
	 */
	const CHART_SELECTOR = '.wp-chart-builder-chart';

	/**
	 * Delay in seconds to allow the charting library JS to fully render
	 * before ScreenshotOne captures the page.
	 *
	 * @var int
	 */
	const RENDER_DELAY_SECONDS = 5;

	/**
	 * Device scale factor for retina-quality output.
	 *
	 * @var int
	 */
	const DEVICE_SCALE_FACTOR = 2;

	/**
	 * Padding (px) added to each side of the viewport width to account for
	 * the social media whitespace the chart JS adds during PNG export.
	 *
	 * @var int
	 */
	const VIEWPORT_SIDE_PADDING = 48;

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
	 * Constructor. Initializes the ScreenshotOne client if credentials exist.
	 */
	public function __construct() {
		if ( $this->is_configured() ) {
			$this->client = new Client(
				constant( 'PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY' ),
				constant( 'PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY' )
			);
		}
	}

	/**
	 * Check whether the ScreenshotOne credentials are configured.
	 *
	 * @return bool
	 */
	public function is_configured(): bool {
		return defined( 'PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY' )
			&& defined( 'PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY' )
			&& ! empty( constant( 'PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY' ) )
			&& ! empty( constant( 'PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY' ) );
	}

	/**
	 * Take a screenshot of the chart at the given export URL.
	 *
	 * Width and height are read from the chart block's layout.width and
	 * layout.height attributes so the viewport matches the chart exactly.
	 * Side padding is added to the viewport width to account for the social
	 * media whitespace the chart renders with.
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
		if ( ! $this->is_configured() ) {
			return new \WP_Error(
				'screenshotone_not_configured',
				__( 'ScreenshotOne credentials are not configured. Set PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY and PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY constants.', 'prc-chart-builder' )
			);
		}

		// Add side padding to the viewport width so the chart's own padding
		// (applied during render) is fully captured.
		$viewport_width  = $chart_width + ( self::VIEWPORT_SIDE_PADDING * 2 );
		// Add vertical padding to account for chart title, subtitle, note,
		// source, and tag text which render above/below the chart area.
		$viewport_height = $chart_height + ( self::VIEWPORT_SIDE_PADDING * 2 );

		$options = TakeOptions::url( $export_url )
			->selector( self::CHART_SELECTOR )
			->delay( self::RENDER_DELAY_SECONDS )
			->viewportWidth( $viewport_width )
			->viewportHeight( $viewport_height )
			->format( 'png' )
			->fullPage( false )
			->deviceScaleFactor( self::DEVICE_SCALE_FACTOR );

		try {
			$png_binary = $this->client->take( $options );

			if ( empty( $png_binary ) ) {
				return new \WP_Error(
					'screenshotone_empty_response',
					__( 'ScreenshotOne returned an empty response.', 'prc-chart-builder' )
				);
			}

			return $png_binary;
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'screenshotone_api_error',
				sprintf(
					/* translators: %s: error message from ScreenshotOne API */
					__( 'ScreenshotOne API error: %s', 'prc-chart-builder' ),
					$e->getMessage()
				)
			);
		}
	}
}
