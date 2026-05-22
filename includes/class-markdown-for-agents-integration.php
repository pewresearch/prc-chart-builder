<?php
/**
 * Integration with prc-markdown-for-agents plugin.
 *
 * Registers chart builder block markdown callbacks so that charts render as
 * a metadata header + data table instead of the SVG and interactive widget
 * HTML that results from standard block rendering.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use PRC\Platform\Markdown_For_Agents\Block_Markdown_Registry;

/**
 * Connects prc-chart-builder with prc-markdown-for-agents.
 *
 * @package PRC\Platform\Chart_Builder
 */
class Markdown_For_Agents_Integration {

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader instance.
	 */
	public function __construct( $loader ) {
		$loader->add_action(
			'prc_markdown_for_agents_register_block_callbacks',
			$this,
			'register_block_callbacks'
		);
	}

	/**
	 * Register markdown callbacks for chart builder blocks.
	 *
	 * @hook prc_markdown_for_agents_register_block_callbacks
	 */
	public function register_block_callbacks() {
		if ( ! class_exists( Block_Markdown_Registry::class ) ) {
			return;
		}

		// Articles embed charts via synced-chart (a ref to a chart CPT post).
		// That block is what parse_blocks() sees — not the controller block — so
		// we handle the indirection here and delegate to controller_to_markdown().
		Block_Markdown_Registry::register(
			'prc-chart-builder/synced-chart',
			array( $this, 'synced_chart_to_markdown' )
		);

		// Inline (non-synced) controller blocks are handled directly.
		Block_Markdown_Registry::register(
			'prc-chart-builder/controller',
			array( $this, 'controller_to_markdown' )
		);

		// The inner chart block produces nothing on its own — the controller handles it.
		Block_Markdown_Registry::register(
			'prc-chart-builder/chart',
			'__return_empty_string'
		);
	}

	/**
	 * Convert a synced-chart block to markdown.
	 *
	 * In email context, resolves the chart CPT's server-generated PNG (featured
	 * image) and returns a markdown image so the AI emits an email-safe <img>
	 * rather than a data table. Falls through to the table path when no PNG exists.
	 *
	 * @param array    $block Parsed block array (contains attrs.ref).
	 * @param \WP_Post $post  The article post being converted.
	 * @return string Markdown representation, or empty string on failure.
	 */
	public function synced_chart_to_markdown( array $block, \WP_Post $post ): string {

		$ref = $block['attrs']['ref'] ?? null;
		if ( ! $ref ) {
			return '';
		}

		$chart_post = get_post( (int) $ref );
		if ( ! $chart_post || Content_Type::$post_type !== $chart_post->post_type ) {
			return 'No chart post found';
		}

		// Respect publish status (same rules as render_block_callback).
		$allowed_statuses = array( 'publish' );
		if ( is_user_logged_in() || is_preview() ) {
			$allowed_statuses[] = 'draft';
			$allowed_statuses[] = 'future';
			$allowed_statuses[] = 'private';
		}
		if ( ! in_array( $chart_post->post_status, $allowed_statuses, true ) ) {
			return 'Chart post not published';
		}

		// Email context: prefer the server-generated PNG (featured image) over a
		// data table so the AI renders an <img> instead of approximating the chart
		// as tabular HTML.
		if ( 'email' === Block_Markdown_Registry::get_context() ) {
			$thumbnail_id = get_post_thumbnail_id( $chart_post->ID );
			if ( $thumbnail_id ) {
				$png_url = wp_get_attachment_url( $thumbnail_id );
				if ( $png_url ) {
					$title = get_the_title( $chart_post ) ?: 'Chart';
					return sprintf( '![%s](%s)', wp_strip_all_tags( $title ), esc_url( $png_url ) );
				}
			}
			// No PNG yet — fall through to table so the AI has something to work with.
		}

		// Find the controller block inside the chart post's content.
		$chart_blocks = parse_blocks( $chart_post->post_content );
		foreach ( $chart_blocks as $chart_block ) {
			if ( 'prc-chart-builder/controller' === ( $chart_block['blockName'] ?? '' ) ) {
				return $this->controller_to_markdown( $chart_block, $post );
			}
		}

		return 'No controller block found';
	}

	/**
	 * Convert a chart controller block to markdown.
	 *
	 * In email context, emits a markdown image pointing at the chart's PNG if
	 * one exists (so the AI produces an email-safe <img>). Falls back to the
	 * standard title + data-table output for all other contexts or when no PNG
	 * is stored on the block.
	 *
	 * Outputs (non-email / no-PNG path): title heading, subtitle, data table, note, source.
	 *
	 * @param array    $block Parsed block array from parse_blocks().
	 * @param \WP_Post $post  The post being converted.
	 * @return string Markdown representation of the chart.
	 */
	public function controller_to_markdown( array $block, \WP_Post $post ): string {
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
			return 'No chart block found';
		}

		$attrs = $chart_block['attrs'] ?? array();

		// Migrate v1 attributes so we always work with v2 shape.
		if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
			$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
		}

		$metadata = $attrs['metadata'] ?? array();
		$io       = $attrs['io'] ?? array();

		// Email context: emit a markdown image so the AI renders an <img> instead
		// of a table. Fall through to the table path when no PNG is available.
		if ( 'email' === Block_Markdown_Registry::get_context() ) {
			$png_url = $this->resolve_chart_png_url( $attrs );
			if ( $png_url ) {
				$title = $metadata['title'] ?? 'Chart';
				return sprintf( '![%s](%s)', wp_strip_all_tags( $title ), $png_url );
			}
		}

		$parts = array();

		$title = $metadata['title'] ?? '';
		if ( $title ) {
			$parts[] = '### ' . wp_strip_all_tags( $title );
		}

		$subtitle = $metadata['subtitle'] ?? '';
		if ( $subtitle ) {
			$parts[] = '*' . wp_strip_all_tags( $subtitle ) . '*';
		}

		// Prefer the explicit HTML table block for accuracy; fall back to chartData.
		$table_md = '';
		if ( $table_block ) {
			$table_md = $this->table_block_to_markdown( $table_block );
		}
		if ( ! $table_md && ! empty( $io['chartData'] ) ) {
			$table_md = $this->chart_data_to_markdown_table( $io['chartData'], $attrs );
		}

		if ( $table_md ) {
			$parts[] = $table_md;
		}

		$note = $metadata['note'] ?? '';
		if ( $note ) {
			$parts[] = wp_strip_all_tags( $note );
		}

		$source = $metadata['source'] ?? '';
		if ( $source ) {
			$parts[] = wp_strip_all_tags( $source );
		}

		return implode( "\n\n", array_filter( $parts ) );
	}

	/**
	 * Resolve the best available PNG URL from already-migrated chart block attributes.
	 *
	 * Uses io.pngUrl (stored on the block at export time). The synced-chart path
	 * separately resolves from the chart CPT featured image (which is the canonical
	 * server-generated PNG) before this method is reached, so this helper covers
	 * inline (non-synced) controller blocks only.
	 *
	 * @param array $attrs Migrated chart block attributes (v2 shape).
	 * @return string PNG URL, or empty string if none is available.
	 */
	private function resolve_chart_png_url( array $attrs ): string {
		$io = $attrs['io'] ?? array();

		if ( ! empty( $io['pngUrl'] ) ) {
			return (string) $io['pngUrl'];
		}

		return '';
	}

	/**
	 * Convert a core/table or prc-block/table block to a markdown table.
	 *
	 * Parses the block's innerHTML with DOMDocument so we get exactly what
	 * editors stored, including any formatted cell values.
	 *
	 * @param array $table_block Parsed block array for the table block.
	 * @return string Markdown table, or empty string if parsing fails.
	 */
	private function table_block_to_markdown( array $table_block ): string {
		$html = $table_block['innerHTML'] ?? '';
		if ( '' === trim( $html ) ) {
			return '';
		}

		$rows = $this->parse_html_table( $html );
		if ( empty( $rows ) ) {
			return '';
		}

		return $this->array_to_markdown_table( $rows );
	}

	/**
	 * Parse an HTML <table> string into a 2-D array of cell strings.
	 *
	 * Uses PRC\Html\TableProcessor (extends WP_HTML_Tag_Processor) instead of
	 * DOMDocument so we stay within the WordPress HTML API.
	 *
	 * @param string $html Raw HTML containing a <table>.
	 * @return array<int, array<int, string>> Rows × cells, or empty array on failure.
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
	 * Convert chartData (array of associative arrays) to a markdown table.
	 *
	 * @param array $chart_data Array of row objects from io.chartData.
	 * @param array $attrs      Full chart block attributes (used for column hints).
	 * @return string Markdown table, or empty string if data is empty.
	 */
	private function chart_data_to_markdown_table( array $chart_data, array $attrs ): string {
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

		$rows = array();
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

		return $this->array_to_markdown_table( array_merge( array( $headers ), $rows ) );
	}

	/**
	 * Convert a 2-D array into a markdown table string.
	 *
	 * The first row is always treated as the header row.
	 *
	 * @param array $table_data 2-D array; first row is the header.
	 * @return string Markdown table.
	 */
	private function array_to_markdown_table( array $table_data ): string {
		if ( empty( $table_data ) ) {
			return '';
		}

		$lines     = array();
		$first_row = true;

		foreach ( $table_data as $row ) {
			if ( ! is_array( $row ) ) {
				continue;
			}

			$cells = array_map(
				static function ( $cell ) {
					$value = is_array( $cell )
						? ( $cell['value'] ?? implode( ', ', $cell ) )
						: (string) $cell;
					return str_replace( '|', '\\|', trim( $value ) );
				},
				$row
			);

			$lines[] = '| ' . implode( ' | ', $cells ) . ' |';

			if ( $first_row ) {
				$lines[]   = '|' . str_repeat( ' --- |', count( $cells ) );
				$first_row = false;
			}
		}

		return implode( "\n", $lines );
	}
}
