<?php
/**
 * Chart Export Endpoint
 *
 * Registers a /export/ endpoint on chart post permalinks and renders a
 * minimal HTML page containing only the chart block output -- no theme
 * header, footer, navigation, or any other page chrome. This gives
 * ScreenshotOne a clean URL to screenshot that produces a pixel-perfect
 * chart image without having to fight theme layouts.
 *
 * URL pattern: /chart/{slug}/export/
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use PRC\Platform\Chart_Builder\Screenshot_Providers\Screenshot_Capture_Spec;

/**
 * Chart Export Endpoint
 */
class Chart_Export_Endpoint {

	/**
	 * Maximum requested chart dimension in CSS pixels.
	 *
	 * @var int
	 */
	public const MAX_SCREENSHOT_DIMENSION = Screenshot_Capture_Spec::MAX_VIEWPORT_PX;

	/**
	 * Body class on the standalone /export/ document.
	 *
	 * Chart view JS treats this as a desktop lock so layout.width of 640px
	 * does not fall into the Gutenberg tablet band (< 782px).
	 *
	 * @var string
	 */
	public const BODY_CLASS = 'wp-chart-builder-export';

	/**
	 * Padded wrapper that screenshot providers capture on /export/.
	 *
	 * @var string
	 */
	public const FRAME_CLASS = 'wp-chart-builder-export__frame';

	/**
	 * The loader.
	 *
	 * @var Loader
	 */
	protected $loader;

	/**
	 * Whether the current request is a chart /export/ page.
	 *
	 * @return bool
	 */
	public static function is_export_request(): bool {
		global $wp_query;

		return isset( $wp_query->query_vars['export'] );
	}

	/**
	 * Apply requested screenshot dimensions to chart layout attributes.
	 *
	 * Both dimensions are required. Invalid or incomplete requests retain the
	 * saved chart layout.
	 *
	 * @param array $attributes Chart block attributes.
	 * @return array
	 */
	public static function apply_requested_dimensions( array $attributes ): array {
		$dimensions = self::get_requested_dimensions();
		if ( null === $dimensions ) {
			return $attributes;
		}

		$attributes['layout']['width']  = $dimensions['width'];
		$attributes['layout']['height'] = $dimensions['height'];

		return $attributes;
	}

	/**
	 * Validated `screenshot_width` / `screenshot_height` on an export request.
	 *
	 * @return array{width: int, height: int}|null Null when absent or invalid.
	 */
	private static function get_requested_dimensions(): ?array {
		if ( ! self::is_export_request() ) {
			return null;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public display-only export dimensions.
		if ( ! isset( $_GET['screenshot_width'], $_GET['screenshot_height'] ) ) {
			return null;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Validated as digits below.
		$width_param = wp_unslash( $_GET['screenshot_width'] );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Validated as digits below.
		$height_param = wp_unslash( $_GET['screenshot_height'] );
		if ( ! is_string( $width_param ) || ! is_string( $height_param ) ) {
			return null;
		}

		$width_value  = sanitize_text_field( $width_param );
		$height_value = sanitize_text_field( $height_param );

		if ( ! ctype_digit( $width_value ) || ! ctype_digit( $height_value ) ) {
			return null;
		}

		$width  = (int) $width_value;
		$height = (int) $height_value;
		if ( 0 === $width || 0 === $height ) {
			return null;
		}

		return array(
			'width'  => min( $width, self::MAX_SCREENSHOT_DIMENSION ),
			'height' => min( $height, self::MAX_SCREENSHOT_DIMENSION ),
		);
	}

	/**
	 * Chart width the export frame is sized around.
	 *
	 * @param string $post_content Chart post content.
	 * @return int Requested reflow width, else saved layout width, else the site default.
	 */
	public static function get_frame_chart_width( string $post_content ): int {
		$dimensions = self::get_requested_dimensions();
		if ( null !== $dimensions ) {
			return $dimensions['width'];
		}

		$chart_block = PNG_Export::get_chart_block( $post_content );
		if ( isset( $chart_block['attrs']['layout']['width'] ) ) {
			return (int) $chart_block['attrs']['layout']['width'];
		}

		return (int) Screenshot_Settings::get_settings()['default_chart_width'];
	}

	/**
	 * Wrap export content in the padded capture frame.
	 *
	 * @param string $content     Rendered chart content.
	 * @param int    $chart_width Chart layout width in px.
	 * @param int    $padding     Padding on every side in px.
	 * @return string
	 */
	public static function get_frame_markup( string $content, int $chart_width, int $padding ): string {
		return sprintf(
			'<div class="%1$s" style="max-width:%2$dpx;padding:%3$dpx;">%4$s</div>',
			esc_attr( self::FRAME_CLASS ),
			$chart_width + ( $padding * 2 ),
			$padding,
			$content
		);
	}

	/**
	 * Padding (px) around the chart inside the export frame.
	 *
	 * Reads `screenshot_padding`; falls back to the site screenshot setting.
	 *
	 * @return int
	 */
	public static function get_requested_padding(): int {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Validated as digits below.
		$param = isset( $_GET['screenshot_padding'] ) ? wp_unslash( $_GET['screenshot_padding'] ) : null;
		if ( is_string( $param ) ) {
			$value = sanitize_text_field( $param );
			if ( ctype_digit( $value ) ) {
				return min( (int) $value, Screenshot_Settings::MAX_SIDE_PADDING );
			}
		}

		return (int) Screenshot_Settings::get_settings()['viewport_side_padding'];
	}

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader instance.
	 */
	public function __construct( $loader ) {
		$this->loader = $loader;
		$loader->add_action( 'template_redirect', $this, 'render_export_template', 0 );
	}

	/**
	 * Render a minimal HTML export page when the /export/ endpoint is requested
	 * on a chart post.
	 *
	 * Fires at priority 0 on template_redirect so it runs before any theme
	 * template resolution. Outputs a standalone HTML document and exits,
	 * preventing WordPress from loading any theme templates.
	 *
	 * @hook template_redirect
	 */
	public function render_export_template() {
		global $post, $wp_query;

		// Only act when the export endpoint query var is present.
		if ( ! isset( $wp_query->query_vars['export'] ) ) {
			return;
		}

		// Only act on chart posts.
		if ( ! $post || get_post_type( $post ) !== Content_Type::$post_type ) {
			return;
		}

		// Require the post to be publicly viewable (published, or draft/private
		// for logged-in users). This is a safety check -- ScreenshotOne will
		// always screenshot published charts.
		if ( ! is_user_logged_in() && 'publish' !== $post->post_status ) {
			wp_die( esc_html__( 'This chart is not publicly available.', 'prc-chart-builder' ), '', array( 'response' => 403 ) );
		}

		// Render block content through the standard WordPress content pipeline
		// so all block hooks, filters, and asset enqueueing fires normally.
		$content = self::get_frame_markup(
			apply_filters( 'the_content', $post->post_content ),
			self::get_frame_chart_width( $post->post_content ),
			self::get_requested_padding()
		);

		// Output the minimal HTML shell and exit before any theme template loads.
		// wp_head() and wp_footer() are called so all enqueued scripts/styles
		// (including prc-charting-library) are output correctly.
		?>
		<!DOCTYPE html>
		<html <?php language_attributes(); ?>>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta name="robots" content="noindex, nofollow">
			<?php wp_head(); ?>
			<style>
				*, *::before, *::after { box-sizing: border-box; }
				html, body { margin: 0; padding: 0; background: #ffffff; }
				html { margin-top: 0 !important; }
				#wpadminbar { display: none !important; }
				.<?php echo esc_html( self::FRAME_CLASS ); ?> { margin: 0 auto; background: #ffffff; }
				.<?php echo esc_html( self::BODY_CLASS ); ?> .wp-chart-builder-view-buttons { display: none !important; }
			</style>
		</head>
		<body class="<?php echo esc_attr( self::BODY_CLASS ); ?>">
			<?php
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Content is processed through the_content filter with standard WP escaping.
			echo $content;
			?>
			<?php wp_footer(); ?>
		</body>
		</html>
		<?php
		exit;
	}
}
