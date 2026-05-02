<?php
/**
 * Integration with prc-block-library print engine.
 *
 * Registers chart builder block print callbacks so that charts render as
 * a static figure with metadata + data table instead of the interactive
 * SVG HTML in PDF/print view.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use PRC\Platform\Blocks\Block_Print_Registry;

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
			.print-engine-chart table { width: 100%; border-collapse: collapse; }
			.print-engine-chart th, .print-engine-chart td { border: 1px solid #000; padding: 0.25em 0.5em; text-align: left; }
			.print-engine-chart .print-engine-chart__note,
			.print-engine-chart .print-engine-chart__source { font-size: 0.9em; margin-top: 0.5em; color: #333; }'
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
		$ref = $block['attrs']['ref'] ?? null;
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

		$chart_blocks = parse_blocks( $chart_post->post_content );
		foreach ( $chart_blocks as $chart_block ) {
			if ( 'prc-chart-builder/controller' === ( $chart_block['blockName'] ?? '' ) ) {
				return $this->controller_to_print_html_from_block( $chart_block );
			}
		}

		return '';
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
		return $this->controller_to_print_html_from_block( $block );
	}

	/**
	 * Build print-friendly HTML from a controller block array.
	 *
	 * @param array $block Parsed controller block.
	 * @return string HTML figure with table and metadata.
	 */
	private function controller_to_print_html_from_block( array $block ): string {
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
		$caption  = '';
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

		$note   = $metadata['note'] ?? '';
		$source = $metadata['source'] ?? '';

		$output = '<figure class="print-engine-chart">';
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
