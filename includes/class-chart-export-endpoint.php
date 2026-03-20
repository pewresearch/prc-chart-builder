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

/**
 * Chart Export Endpoint
 */
class Chart_Export_Endpoint {

	/**
	 * The loader.
	 *
	 * @var Loader
	 */
	protected $loader;

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
		if ( ! $post || Content_Type::$post_type !== get_post_type( $post ) ) {
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
		<body>
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
