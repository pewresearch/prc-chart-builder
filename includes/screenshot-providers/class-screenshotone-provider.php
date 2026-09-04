<?php
/**
 * ScreenshotOne screenshot provider.
 *
 * @package PRC\Platform\Chart_Builder\Screenshot_Providers
 */

namespace PRC\Platform\Chart_Builder\Screenshot_Providers;

use ScreenshotOne\Sdk\Client;
use ScreenshotOne\Sdk\TakeOptions;

/**
 * ScreenshotOne SDK adapter.
 */
class Screenshotone_Provider implements Screenshot_Provider {

	/**
	 * The ScreenshotOne API client.
	 *
	 * @var Client|null
	 */
	private ?Client $client = null;

	/**
	 * {@inheritDoc}
	 */
	public function get_slug(): string {
		return 'screenshotone';
	}

	/**
	 * {@inheritDoc}
	 *
	 * Also requires the ScreenshotOne SDK class. Plugin bootstrap constructs
	 * this provider on every request, including wp-admin/upgrade.php where
	 * WP_INSTALLING is true and the Composer autoloader may not have registered
	 * the SDK. Instantiating Client in the constructor would fatal WordPress.
	 */
	public function is_configured(): bool {
		return class_exists( Client::class )
			&& defined( 'PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY' )
			&& defined( 'PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY' )
			&& ! empty( constant( 'PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY' ) )
			&& ! empty( constant( 'PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY' ) );
	}

	/**
	 * Lazy-create the ScreenshotOne client.
	 *
	 * @return Client|null
	 */
	private function get_client(): ?Client {
		if ( $this->client instanceof Client ) {
			return $this->client;
		}

		if ( ! $this->is_configured() ) {
			return null;
		}

		$this->client = new Client(
			constant( 'PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY' ),
			constant( 'PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY' )
		);

		return $this->client;
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
				'screenshotone_not_configured',
				__( 'ScreenshotOne credentials are not configured. Set PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY and PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY constants, and ensure screenshotone/sdk is autoloaded.', 'prc-chart-builder' )
			);
		}

		$client = $this->get_client();
		if ( ! $client instanceof Client ) {
			return new \WP_Error(
				'screenshotone_sdk_missing',
				__( 'ScreenshotOne SDK client could not be created.', 'prc-chart-builder' )
			);
		}

		$options = $this->build_take_options( $url, $spec );

		try {
			$png_binary = $client->take( $options );

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
					/* translators: %s: sanitized error detail from ScreenshotOne API */
					__( 'ScreenshotOne API error: %s', 'prc-chart-builder' ),
					self::format_api_error_detail( $e )
				)
			);
		}
	}

	/**
	 * Build a credential-safe detail string for ScreenshotOne / Guzzle failures.
	 *
	 * Guzzle RequestException messages embed the full request URI, including
	 * `access_key` and HMAC `signature` query parameters. Those must never
	 * propagate into WP_Error, Action Scheduler RuntimeException, VIP logs,
	 * or Sentry.
	 *
	 * @param \Throwable $exception Exception from the ScreenshotOne SDK or HTTP client.
	 * @return string Sanitized detail suitable for logs and exception messages.
	 */
	public static function format_api_error_detail( \Throwable $exception ): string {
		if (
			$exception instanceof \GuzzleHttp\Exception\RequestException
			&& $exception->hasResponse()
		) {
			$status = (int) $exception->getResponse()->getStatusCode();
			return sprintf( 'HTTP %d from api.screenshotone.com/take', $status );
		}

		return self::sanitize_api_error_message( $exception->getMessage() );
	}

	/**
	 * Redact ScreenshotOne credential query params and known secret values.
	 *
	 * @param string $message Raw exception or HTTP client message.
	 * @return string Message with credentials replaced by [REDACTED].
	 */
	public static function sanitize_api_error_message( string $message ): string {
		$redacted = preg_replace(
			'/\b(access_key|signature|secret_key)=[^&\s\'"]+/i',
			'$1=[REDACTED]',
			$message
		);

		if ( ! is_string( $redacted ) ) {
			$redacted = '[redacted error]';
		}

		foreach (
			array(
				'PRC_PLATFORM_SCREENSHOTONE_ACCESS_KEY',
				'PRC_PLATFORM_SCREENSHOTONE_SECRET_KEY',
			) as $constant
		) {
			if ( ! defined( $constant ) ) {
				continue;
			}
			$value = (string) constant( $constant );
			if ( '' !== $value ) {
				$redacted = str_replace( $value, '[REDACTED]', $redacted );
			}
		}

		return $redacted;
	}

	/**
	 * Map a capture spec onto ScreenshotOne take options.
	 *
	 * @param string                  $url  Export URL to capture.
	 * @param Screenshot_Capture_Spec $spec Capture parameters.
	 * @return TakeOptions
	 */
	protected function build_take_options( string $url, Screenshot_Capture_Spec $spec ): TakeOptions {
		return TakeOptions::url( $url )
			->selector( $spec->selector )
			->delay( $spec->delay_seconds )
			->viewportWidth( $spec->viewport_width )
			->viewportHeight( $spec->viewport_height )
			->format( 'png' )
			->fullPage( false )
			->deviceScaleFactor( $spec->device_scale_factor );
	}
}
