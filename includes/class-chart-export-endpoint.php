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
		if ( ! self::is_export_request() ) {
			return $attributes;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public display-only export dimensions.
		if ( ! isset( $_GET['screenshot_width'], $_GET['screenshot_height'] ) ) {
			return $attributes;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Validated as digits below.
		$width_param = wp_unslash( $_GET['screenshot_width'] );
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Validated as digits below.
		$height_param = wp_unslash( $_GET['screenshot_height'] );
		if ( ! is_string( $width_param ) || ! is_string( $height_param ) ) {
			return $attributes;
		}

		$width_value  = sanitize_text_field( $width_param );
		$height_value = sanitize_text_field( $height_param );

		if ( ! ctype_digit( $width_value ) || ! ctype_digit( $height_value ) ) {
			return $attributes;
		}

		$width  = (int) $width_value;
		$height = (int) $height_value;
		if ( 0 === $width || 0 === $height ) {
			return $attributes;
		}

		$attributes['layout']['width']  = min( $width, self::MAX_SCREENSHOT_DIMENSION );
		$attributes['layout']['height'] = min( $height, self::MAX_SCREENSHOT_DIMENSION );

		return $attributes;
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
		$content = apply_filters( 'the_content', $post->post_content );

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
