<?php
/**
 * Integration with prc-print-engine.
 *
 * Registers chart builder block print callbacks so that charts render as
 * static PNG images (email parity) with table fallback instead of interactive SVG.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use PRC\Platform\Print_Engine\Block_Print_Registry;

/**
 * Connects prc-chart-builder with the print engine.
 *
 * @package PRC\Platform\Chart_Builder
 */
class Print_Engine_Integration {

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader instance.
	 */
	public function __construct( $loader ) {
		$loader->add_action(
			'prc_print_engine_register_block_callbacks',
			$this,
			'register_block_callbacks'
		);
	}

	/**
	 * Register print callbacks for chart builder blocks.
	 *
	 * @hook prc_print_engine_register_block_callbacks
	 */
	public function register_block_callbacks() {
		if ( ! class_exists( Block_Print_Registry::class ) ) {
			return;
		}

		Block_Print_Registry::register(
			'prc-chart-builder/synced-chart',
			array( $this, 'synced_chart_to_print_html' )
		);

		Block_Print_Registry::register(
			'prc-chart-builder/controller',
			array( $this, 'controller_to_print_html' )
		);

		// Print-engine web view styles — layout for the ?pdf=true page.
		Block_Print_Registry::register_style(
			'prc-chart-builder/controller',
			'.print-engine-chart { margin: 1em 0; }
			.print-engine-chart figcaption { font-weight: bold; margin-bottom: 0.5em; }
			.print-engine-chart .print-engine-chart__subtitle { font-style: italic; font-weight: normal; }
			.print-engine-chart img { display: block; max-width: 100%; height: auto; }
			.print-engine-chart table { width: 100%; border-collapse: collapse; }
			.print-engine-chart th, .print-engine-chart td { border: 1px solid #000; padding: 0.25em 0.5em; text-align: left; }
			.print-engine-chart .print-engine-chart__note,
			.print-engine-chart .print-engine-chart__source { font-size: 0.9em; margin-top: 0.5em; color: #333; }
			.print-engine-chart.alignleft { float: left; max-width: 50%; margin: 0 1em 1em 0; }
			.print-engine-chart.alignright { float: right; max-width: 50%; margin: 0 0 1em 1em; }
			.print-engine-chart.aligncenter { display: block; width: fit-content; max-width: 100%; margin-left: auto; margin-right: auto; }'
		);

		// @media print styles — applied during browser print dialog / html2pdf.
		Block_Print_Registry::register_print_style(
			'prc-chart-builder/controller',
			'.print-engine-chart { page-break-inside: avoid; }'
		);
	}

	/**
	 * Convert a synced-chart block to print-friendly HTML.
	 *
	 * Fetches the referenced chart CPT post, finds its controller block,
	 * and delegates to controller_to_print_html_from_block().
	 *
	 * @param string   $block_content Rendered block HTML (ignored; we replace it).
	 * @param array    $block         Parsed block array (contains attrs.ref).
	 * @param \WP_Post $_post The article post being rendered.
	 * @return string Print-friendly HTML.
	 */
	public function synced_chart_to_print_html( string $block_content, array $block, \WP_Post $_post ): string {
		$ref   = $block['attrs']['ref'] ?? null;
		$align = sanitize_key( (string) ( $block['attrs']['align'] ?? '' ) );
		if ( ! $ref ) {
			return '';
		}

		$chart_post = get_post( (int) $ref );
		if ( ! $chart_post || Content_Type::$post_type !== $chart_post->post_type ) {
			return '';
		}

		$allowed_statuses = array( 'publish' );
		if ( is_user_logged_in() || is_preview() ) {
			$allowed_statuses[] = 'draft';
			$allowed_statuses[] = 'future';
			$allowed_statuses[] = 'private';
		}
		if ( ! in_array( $chart_post->post_status, $allowed_statuses, true ) ) {
			return '';
		}

		$controller_block = null;
		foreach ( parse_blocks( $chart_post->post_content ) as $chart_block ) {
			if ( 'prc-chart-builder/controller' === ( $chart_block['blockName'] ?? '' ) ) {
				$controller_block = $chart_block;
				break;
			}
		}

		// Declared chart layout width (e.g. 420) so the print figure matches editor sizing.
		$width = $controller_block ? $this->resolve_chart_layout_width( $controller_block ) : 0;

		$thumbnail_id = get_post_thumbnail_id( $chart_post->ID );
		if ( $thumbnail_id ) {
			$png_url = wp_get_attachment_url( $thumbnail_id );
			if ( $png_url ) {
				$title = get_the_title( $chart_post ) ?: 'Chart';
				return $this->chart_image_figure( $png_url, wp_strip_all_tags( $title ), '', '', '', $align, $width );
			}
		}

		if ( $controller_block ) {
			// Prefer the synced-chart's align over the inner controller's.
			return $this->controller_to_print_html_from_block( $controller_block, $align );
		}

		return '';
	}

	/**
	 * Resolve the declared layout width from a controller block's chart inner block.
	 *
	 * @param array $controller_block Parsed controller block.
	 * @return int Width in px, or 0 when unknown.
	 */
	private function resolve_chart_layout_width( array $controller_block ): int {
		foreach ( $controller_block['innerBlocks'] ?? array() as $inner ) {
			if ( 'prc-chart-builder/chart' !== ( $inner['blockName'] ?? '' ) ) {
				continue;
			}
			$attrs = $inner['attrs'] ?? array();
			if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
				$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
			}
			return (int) ( $attrs['layout']['width'] ?? 0 );
		}
		return 0;
	}

	/**
	 * Convert a controller block to print-friendly HTML.
	 *
	 * @param string   $block_content Rendered block HTML (ignored; we replace it).
	 * @param array    $block         Parsed block array.
	 * @param \WP_Post $_post The article post (unused; block has all data).
	 * @return string Print-friendly HTML.
	 */
	public function controller_to_print_html( string $block_content, array $block, \WP_Post $_post ): string {
		$align = sanitize_key( (string) ( $block['attrs']['align'] ?? '' ) );
		return $this->controller_to_print_html_from_block( $block, $align );
	}

	/**
	 * Build print-friendly HTML from a controller block array.
	 *
	 * Prefers static PNG (thumbnail / io.pngUrl) like email; falls back to data table.
	 *
	 * @param array  $block Parsed controller block.
	 * @param string $align Optional align override (e.g. from synced-chart).
	 * @return string HTML figure with image or table and metadata.
	 */
	private function controller_to_print_html_from_block( array $block, string $align = '' ): string {
		if ( '' === $align ) {
			$align = sanitize_key( (string) ( $block['attrs']['align'] ?? '' ) );
		}

		$inner_blocks = $block['innerBlocks'] ?? array();
		$chart_block  = null;
		$table_block  = null;

		foreach ( $inner_blocks as $inner ) {
			$name = $inner['blockName'] ?? '';
			if ( 'prc-chart-builder/chart' === $name ) {
				$chart_block = $inner;
			}
			if ( 'core/table' === $name || 'prc-block/table' === $name ) {
				$table_block = $inner;
			}
		}

		if ( ! $chart_block ) {
			return '';
		}

		$attrs = $chart_block['attrs'] ?? array();
		if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
			$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
		}

		$metadata = $attrs['metadata'] ?? array();
		$io       = $attrs['io'] ?? array();

		$title    = $metadata['title'] ?? '';
		$subtitle = $metadata['subtitle'] ?? '';
		$note     = $metadata['note'] ?? '';
		$source   = $metadata['source'] ?? '';
		$width    = (int) ( $attrs['layout']['width'] ?? 0 );

		$png_url = $this->resolve_chart_png_url( $attrs );
		if ( '' !== $png_url ) {
			return $this->chart_image_figure( $png_url, wp_strip_all_tags( $title ?: 'Chart' ), $subtitle, $note, $source, $align, $width );
		}

		$caption = '';
		if ( $title ) {
			$caption .= '<span class="print-engine-chart__title">' . esc_html( wp_strip_all_tags( $title ) ) . '</span>';
		}
		if ( $subtitle ) {
			$caption .= ' <span class="print-engine-chart__subtitle">' . esc_html( wp_strip_all_tags( $subtitle ) ) . '</span>';
		}

		$table_html = '';
		if ( $table_block ) {
			$table_html = $this->table_block_to_html( $table_block );
		}
		if ( ! $table_html && ! empty( $io['chartData'] ) ) {
			$table_html = $this->chart_data_to_html_table( $io['chartData'], $attrs );
		}

		$classes = $this->chart_figure_classes( $align, false );
		$output  = '<figure class="' . esc_attr( $classes ) . '"' . $this->chart_figure_style( $width ) . '>';
		if ( $caption ) {
			$output .= '<figcaption>' . $caption . '</figcaption>';
		}
		if ( $table_html ) {
			$output .= $table_html;
		}
		if ( $note ) {
			$output .= '<p class="print-engine-chart__note">' . esc_html( wp_strip_all_tags( $note ) ) . '</p>';
		}
		if ( $source ) {
			$output .= '<p class="print-engine-chart__source">' . esc_html( wp_strip_all_tags( $source ) ) . '</p>';
		}
		$output .= '</figure>';

		return $output;
	}

	/**
	 * Build a print figure wrapping a static chart image.
	 *
	 * Chart PNG exports already include the title, subtitle, note, source, and
	 * tag — so the figure is just the image (metadata kept in alt text).
	 * Duplicating them as HTML also made figures too tall to fit page space.
	 *
	 * @param string $url      Image URL.
	 * @param string $title    Chart title / alt.
	 * @param string $subtitle Unused (baked into the PNG).
	 * @param string $note     Unused (baked into the PNG).
	 * @param string $source   Unused (baked into the PNG).
	 * @param string $align    Optional Gutenberg align (left|right|center).
	 * @param int    $width    Declared layout width in px (0 = natural sizing).
	 * @return string
	 */
	private function chart_image_figure( string $url, string $title, string $subtitle, string $note, string $source, string $align = '', int $width = 0 ): string {
		unset( $subtitle, $note, $source );

		$classes = $this->chart_figure_classes( $align, true );
		$output  = '<figure class="' . esc_attr( $classes ) . '"' . $this->chart_figure_style( $width ) . '>';
		$output .= sprintf(
			'<img src="%s" alt="%s" loading="lazy" />',
			esc_url( $url ),
			esc_attr( $title )
		);
		$output .= '</figure>';

		return $output;
	}

	/**
	 * Build the style attribute for a print chart figure from its declared width.
	 *
	 * Uses min() so a declared width larger than the page content area still
	 * caps at 100%.
	 *
	 * @param int $width Declared layout width in px.
	 * @return string Style attribute (with leading space), or empty string.
	 */
	private function chart_figure_style( int $width ): string {
		if ( $width <= 0 ) {
			return '';
		}
		return sprintf( ' style="max-width:min(%dpx,100%%)"', $width );
	}

	/**
	 * Build class list for a print chart figure, including alignment.
	 *
	 * @param string $align      Gutenberg align value.
	 * @param bool   $is_image   Whether this is an image figure.
	 * @return string
	 */
	private function chart_figure_classes( string $align, bool $is_image ): string {
		$classes = array( 'print-engine-chart' );
		if ( $is_image ) {
			$classes[] = 'print-engine-chart--image';
		}
		if ( in_array( $align, array( 'left', 'right', 'center' ), true ) ) {
			$classes[] = 'align' . $align;
		}
		return implode( ' ', $classes );
	}

	/**
	 * Resolve chart PNG URL from block attrs (io.pngUrl / pngId).
	 *
	 * @param array $attrs Chart block attributes.
	 * @return string
	 */
	private function resolve_chart_png_url( array $attrs ): string {
		$io = $attrs['io'] ?? array();
		if ( is_string( $io['pngUrl'] ?? null ) && '' !== $io['pngUrl'] ) {
			return (string) $io['pngUrl'];
		}
		if ( ! empty( $io['pngId'] ) ) {
			$url = wp_get_attachment_url( (int) $io['pngId'] );
			if ( $url ) {
				return $url;
			}
		}
		return '';
	}

	/**
	 * Convert a table block's innerHTML to a simple HTML table.
	 *
	 * @param array $table_block Parsed block array for core/table or prc-block/table.
	 * @return string HTML table, or empty string.
	 */
	private function table_block_to_html( array $table_block ): string {
		$html = $table_block['innerHTML'] ?? '';
		if ( '' === trim( $html ) ) {
			return '';
		}

		$rows = $this->parse_html_table( $html );
		if ( empty( $rows ) ) {
			return '';
		}

		return $this->array_to_html_table( $rows );
	}

	/**
	 * Parse an HTML table into a 2-D array of cell strings.
	 *
	 * @param string $html Raw HTML containing a table.
	 * @return array<int, array<int, string>> Rows × cells.
	 */
	private function parse_html_table( string $html ): array {
		$processor = new \PRC\Html\TableProcessor( $html );
		$data      = $processor->get_data();

		if ( is_wp_error( $data ) || empty( $data['header'] ) ) {
			return array();
		}

		$strip = static function ( $cell ) {
			return trim( wp_strip_all_tags( (string) $cell ) );
		};

		$rows   = array();
		$rows[] = array_map( $strip, $data['header'] );

		foreach ( $data['rows'] as $row ) {
			$rows[] = array_map( $strip, $row );
		}

		foreach ( $data['footer'] as $row ) {
			$rows[] = array_map( $strip, $row );
		}

		return $rows;
	}

	/**
	 * Convert chartData to an HTML table.
	 *
	 * @param array $chart_data Array of row objects from io.chartData.
	 * @param array $attrs      Chart block attributes.
	 * @return string HTML table.
	 */
	private function chart_data_to_html_table( array $chart_data, array $attrs ): string {
		if ( empty( $chart_data ) ) {
			return '';
		}

		$categories = $attrs['dataRender']['categories'] ?? array();
		$x_key      = $attrs['dataRender']['x'] ?? 'x';

		if ( ! empty( $categories ) ) {
			$headers = array_merge( array( $x_key ), $categories );
		} else {
			$all_keys = array();
			foreach ( $chart_data as $row ) {
				if ( is_array( $row ) ) {
					$all_keys = array_merge( $all_keys, array_keys( $row ) );
				}
			}
			$headers = array_values( array_unique( $all_keys ) );
		}

		$rows = array( $headers );
		foreach ( $chart_data as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}
			$cells = array();
			foreach ( $headers as $key ) {
				$cells[] = (string) ( $row[ $key ] ?? '' );
			}
			$rows[] = $cells;
		}

		return $this->array_to_html_table( $rows );
	}

	/**
	 * Convert a 2-D array to an HTML table.
	 *
	 * @param array $table_data First row is header.
	 * @return string HTML table.
	 */
	private function array_to_html_table( array $table_data ): string {
		if ( empty( $table_data ) ) {
			return '';
		}

		$html = '<table><thead><tr>';
		foreach ( $table_data[0] as $cell ) {
			$html .= '<th>' . esc_html( (string) $cell ) . '</th>';
		}
		$html .= '</tr></thead><tbody>';

		$row_count = count( $table_data );
		for ( $i = 1; $i < $row_count; $i++ ) {
			$html .= '<tr>';
			foreach ( $table_data[ $i ] as $cell ) {
				$html .= '<td>' . esc_html( (string) $cell ) . '</td>';
			}
			$html .= '</tr>';
		}

		$html .= '</tbody></table>';
		return $html;
	}
}
