<?php
/**
 * Screenshot capture specification.
 *
 * @package PRC\Platform\Chart_Builder\Screenshot_Providers
 */

namespace PRC\Platform\Chart_Builder\Screenshot_Providers;

use PRC\Platform\Chart_Builder\Screenshot_Settings;

/**
 * Immutable capture input shared by all screenshot providers.
 */
final class Screenshot_Capture_Spec {

	/**
	 * CSS selector targeting the chart wrapper element.
	 *
	 * @var string
	 */
	public const DEFAULT_SELECTOR = '.wp-chart-builder-chart';

	/**
	 * Delay in seconds before capture.
	 *
	 * @var int
	 */
	public const DEFAULT_DELAY_SECONDS = 5;

	/**
	 * Maximum CSS viewport size in pixels.
	 *
	 * Matches firebase/functions-render MAX_VIEWPORT_PX so take_spec()
	 * reflow and capture stay on the same size.
	 *
	 * @var int
	 */
	public const MAX_VIEWPORT_PX = 2000;

	/**
	 * Padding (px) added to each side of the layout width and height.
	 *
	 * @var int
	 */
	public const DEFAULT_VIEWPORT_SIDE_PADDING = 48;

	/**
	 * Default device scale factor for featured-image capture.
	 *
	 * @var int
	 */
	public const DEFAULT_DEVICE_SCALE_FACTOR = 2;

	/**
	 * CSS viewport width in pixels.
	 *
	 * @var int
	 */
	public readonly int $viewport_width;

	/**
	 * CSS viewport height in pixels.
	 *
	 * @var int
	 */
	public readonly int $viewport_height;

	/**
	 * Device scale factor (1, 2, or 3 for most providers).
	 *
	 * @var int
	 */
	public readonly int $device_scale_factor;

	/**
	 * CSS selector to capture.
	 *
	 * @var string
	 */
	public readonly string $selector;

	/**
	 * Delay in seconds before capture.
	 *
	 * @var int
	 */
	public readonly int $delay_seconds;

	/**
	 * Side padding applied when building from layout dimensions.
	 *
	 * @var int
	 */
	public readonly int $viewport_side_padding;

	/**
	 * Constructor.
	 *
	 * @param int    $viewport_width         CSS viewport width in pixels.
	 * @param int    $viewport_height        CSS viewport height in pixels.
	 * @param int    $device_scale_factor    Device scale factor.
	 * @param string $selector               CSS selector to capture.
	 * @param int    $delay_seconds          Delay before capture.
	 * @param int    $viewport_side_padding  Side padding used for layout builds.
	 *
	 * @throws \InvalidArgumentException When device_scale_factor is less than 1.
	 */
	public function __construct(
		int $viewport_width,
		int $viewport_height,
		int $device_scale_factor,
		string $selector = self::DEFAULT_SELECTOR,
		int $delay_seconds = self::DEFAULT_DELAY_SECONDS,
		int $viewport_side_padding = 0
	) {
		if ( $device_scale_factor < 1 ) {
			throw new \InvalidArgumentException(
				__( 'Screenshot device_scale_factor must be at least 1.', 'prc-chart-builder' )
			);
		}

		$this->viewport_width        = $viewport_width;
		$this->viewport_height       = $viewport_height;
		$this->device_scale_factor   = $device_scale_factor;
		$this->selector              = $selector;
		$this->delay_seconds         = $delay_seconds;
		$this->viewport_side_padding = $viewport_side_padding;
	}

	/**
	 * Build the default featured-image spec from chart layout dimensions.
	 *
	 * Adds side padding to both axes and uses the configured scale factor.
	 * Optional arguments fall back to site screenshot settings, then class defaults.
	 *
	 * @param int         $width                  Chart layout width in pixels.
	 * @param int         $height                 Chart layout height in pixels.
	 * @param int|null    $device_scale_factor    Optional device scale override.
	 * @param string|null $selector               Optional selector override.
	 * @param int|null    $delay_seconds          Optional delay override.
	 * @param int|null    $viewport_side_padding  Optional padding override.
	 * @return self
	 */
	public static function from_layout(
		int $width,
		int $height,
		?int $device_scale_factor = null,
		?string $selector = null,
		?int $delay_seconds = null,
		?int $viewport_side_padding = null
	): self {
		$settings = class_exists( Screenshot_Settings::class )
			? Screenshot_Settings::get_settings()
			: array();

		$padding = $viewport_side_padding ?? ( $settings['viewport_side_padding'] ?? self::DEFAULT_VIEWPORT_SIDE_PADDING );
		$scale   = $device_scale_factor ?? ( $settings['device_scale_factor'] ?? self::DEFAULT_DEVICE_SCALE_FACTOR );
		$sel     = $selector ?? ( $settings['selector'] ?? self::DEFAULT_SELECTOR );
		$delay   = $delay_seconds ?? ( $settings['delay_seconds'] ?? self::DEFAULT_DELAY_SECONDS );

		return new self(
			$width + ( $padding * 2 ),
			$height + ( $padding * 2 ),
			$scale,
			$sel,
			$delay,
			$padding
		);
	}

	/**
	 * Get the chart layout width represented by this capture.
	 *
	 * @return int
	 */
	public function get_layout_width(): int {
		return max( 1, $this->viewport_width - ( $this->viewport_side_padding * 2 ) );
	}

	/**
	 * Get the chart layout height represented by this capture.
	 *
	 * @return int
	 */
	public function get_layout_height(): int {
		return max( 1, $this->viewport_height - ( $this->viewport_side_padding * 2 ) );
	}

	/**
	 * Build a capture spec from a named variant.
	 *
	 * The plugin provides only `default`. Consumers can register additional
	 * variants through `prc_chart_builder_screenshot_variants`.
	 *
	 * @param string $slug         Variant slug.
	 * @param int    $chart_width  Saved chart layout width.
	 * @param int    $chart_height Saved chart layout height.
	 * @return self|\WP_Error
	 */
	public static function from_alias( string $slug, int $chart_width, int $chart_height ) {
		if ( 'default' === $slug ) {
			return self::from_layout( $chart_width, $chart_height );
		}

		/**
		 * Filter named chart screenshot variants.
		 *
		 * @param array<string, array<string, int>> $variants Variants keyed by slug.
		 */
		$variants = apply_filters( 'prc_chart_builder_screenshot_variants', array() );
		$variant  = is_array( $variants ) ? ( $variants[ $slug ] ?? null ) : null;

		if ( ! is_array( $variant ) ) {
			return new \WP_Error(
				'screenshot_variant_not_found',
				sprintf(
					/* translators: %s: screenshot variant slug */
					__( 'Screenshot variant "%s" is not registered.', 'prc-chart-builder' ),
					$slug
				)
			);
		}

		$has_required_fields = isset( $variant['width'], $variant['height'], $variant['scale'], $variant['padding'] );
		$has_integer_fields  = $has_required_fields
			&& is_int( $variant['width'] )
			&& is_int( $variant['height'] )
			&& is_int( $variant['scale'] )
			&& is_int( $variant['padding'] );

		if (
			! $has_integer_fields
			|| $variant['width'] < 1
			|| $variant['height'] < 1
			|| $variant['scale'] < 1
			|| $variant['padding'] < 0
		) {
			return new \WP_Error(
				'screenshot_variant_invalid',
				sprintf(
					/* translators: %s: screenshot variant slug */
					__( 'Screenshot variant "%s" must have positive width, height, and scale values, with non-negative padding.', 'prc-chart-builder' ),
					$slug
				)
			);
		}

		$width    = $variant['width'];
		$height   = $variant['height'];
		$scale    = $variant['scale'];
		$padding  = $variant['padding'];
		$settings = class_exists( Screenshot_Settings::class )
			? Screenshot_Settings::get_settings()
			: array();

		return new self(
			$width + ( $padding * 2 ),
			$height + ( $padding * 2 ),
			$scale,
			$settings['selector'] ?? self::DEFAULT_SELECTOR,
			$settings['delay_seconds'] ?? self::DEFAULT_DELAY_SECONDS,
			$padding
		);
	}
}
