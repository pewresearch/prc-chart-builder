<?php
/**
 * JSON-LD structured data for charts.
 *
 * Adds schema.org Dataset markup to the page-level JSON-LD graph
 * produced by prc-schema-seo, and provides a public REST endpoint
 * for downloading chart data as CSV.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WP_Error;
use WP_REST_Request;

/**
 * Emits Dataset schema objects into prc-schema-seo's @graph and
 * serves chart data as CSV via a public REST endpoint.
 */
class JSON_LD {

	const REST_NAMESPACE = 'prc-chart-builder/v1';
	const REST_ROUTE     = '/charts/(?P<id>\d+)/data.csv';

	/**
	 * Pending CSV payload set by serve_chart_csv() and consumed by the
	 * rest_pre_serve_request filter registered in the constructor.
	 *
	 * @var array{csv: string, filename: string}|null
	 */
	private $pending_csv = null;

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader instance.
	 */
	public function __construct( $loader ) {
		$loader->add_action( 'init', $this, 'register_post_type_support' );
		$loader->add_filter(
			'prc_schema_seo_schema_data',
			$this,
			'add_chart_datasets',
			10,
			3
		);
		$loader->add_action( 'rest_api_init', $this, 'register_rest_routes' );
		// Must be registered before WP_REST_Server::serve_request() dispatches,
		// so we hook early on rest_api_init rather than inside the callback.
		$loader->add_filter( 'rest_pre_serve_request', $this, 'maybe_serve_csv_response', 10, 1 );
	}

	/**
	 * Opt the chart CPT into prc-schema-seo so JSON-LD is output on chart pages.
	 *
	 * @hook init
	 */
	public function register_post_type_support() {
		add_post_type_support( Content_Type::$post_type, 'prc-schema-seo' );
	}

	/**
	 * Output a pending CSV response before WP_REST_Server JSON-encodes it.
	 *
	 * serve_chart_csv() stores the CSV on $this->pending_csv; this filter —
	 * registered early enough that it is in place before WP_REST_Server::
	 * serve_request() reaches the serialisation step — emits raw output and
	 * returns true to short-circuit wp_send_json(), while still allowing the
	 * full REST lifecycle (shutdown hooks, object-cache flushes, VIP monitoring)
	 * to complete normally.
	 *
	 * @hook rest_pre_serve_request
	 *
	 * @param bool $served Whether the request has already been served.
	 * @return bool True if the CSV was output, original value otherwise.
	 */
	public function maybe_serve_csv_response( bool $served ): bool {
		if ( $served || null === $this->pending_csv ) {
			return $served;
		}

		$payload           = $this->pending_csv;
		$this->pending_csv = null;

		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'Content-Disposition: attachment; filename="' . rawurlencode( $payload['filename'] ) . '"' );
		header( 'Cache-Control: public, max-age=86400' );
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- raw CSV output
		echo Table_Export::UTF8_BOM . $payload['csv'];

		return true;
	}

	/**
	 * Register the public CSV download endpoint.
	 *
	 * @hook rest_api_init
	 */
	public function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'serve_chart_csv' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'id' => array(
						'required'          => true,
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
				),
			)
		);
	}

	/**
	 * Filter callback: append Dataset schemas to the page's @graph.
	 *
	 * @hook prc_schema_seo_schema_data
	 *
	 * @param array $schemas  Array of schema objects/arrays.
	 * @param int   $post_id  Current post ID.
	 * @param array $seo_data SEO metadata from prc-schema-seo.
	 * @return array Modified schemas array.
	 */
	public function add_chart_datasets( $schemas, $post_id, $seo_data ) {
		// Standalone chart CPT — the post IS the chart.
		if ( is_singular( Content_Type::$post_type ) ) {
			$chart_data = $this->extract_chart_from_post( $post_id );
			if ( $chart_data ) {
				$schemas[] = $this->build_dataset_schema( $chart_data );
			}
			return $schemas;
		}

		$article_url = get_permalink( $post_id );
		$context     = array(
			'is_embedded' => true,
			'article_url' => $article_url,
			'article_id'  => $post_id,
		);

		// Fetch and parse post content once; share the result between inline-chart
		// extraction and synced-chart ref collection to avoid calling
		// get_post_field() + parse_blocks() twice on the same request.
		$content = get_post_field( 'post_content', $post_id );
		if ( empty( $content ) ) {
			return $schemas;
		}
		$blocks = parse_blocks( $content );

		// Inline charts — controller blocks embedded directly in the post content.
		$inline_datasets = $this->extract_inline_charts_from_blocks( $blocks, $post_id );
		foreach ( $inline_datasets as $chart_data ) {
			$schemas[] = $this->build_dataset_schema( $chart_data, $context );
		}

		// Synced charts — prc-chart-builder/synced-chart blocks referencing chart CPT posts.
		if ( false !== strpos( $content, 'prc-chart-builder/synced-chart' ) ) {
			$refs = array();
			$this->collect_synced_chart_refs( $blocks, $refs );
			foreach ( array_unique( array_filter( $refs ) ) as $ref_id ) {
				$chart_data = $this->extract_chart_from_post( (int) $ref_id );
				if ( ! $chart_data ) {
					continue;
				}
				$schemas[] = $this->build_dataset_schema( $chart_data, $context );
			}
		}

		return $schemas;
	}

	/**
	 * REST callback: serve chart data as CSV.
	 *
	 * Stores the CSV payload on $this->pending_csv so that the
	 * maybe_serve_csv_response() filter — registered at construction time,
	 * before WP_REST_Server::serve_request() runs — can emit it as raw output
	 * and short-circuit JSON serialisation. This preserves the full REST API
	 * lifecycle (shutdown hooks, object-cache flushes, VIP monitoring).
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function serve_chart_csv( WP_REST_Request $request ) {
		$chart_id   = $request->get_param( 'id' );
		$chart_post = get_post( $chart_id );

		if ( ! $chart_post || Content_Type::$post_type !== $chart_post->post_type ) {
			return new WP_Error(
				'not_found',
				__( 'Chart not found.', 'prc-chart-builder' ),
				array( 'status' => 404 )
			);
		}

		if ( 'publish' !== $chart_post->post_status ) {
			return new WP_Error(
				'not_published',
				__( 'Chart is not published.', 'prc-chart-builder' ),
				array( 'status' => 403 )
			);
		}

		$chart_data = $this->extract_chart_from_post( $chart_id );
		if ( ! $chart_data || empty( $chart_data['table_data'] ) ) {
			return new WP_Error(
				'no_data',
				__( 'No chart data available.', 'prc-chart-builder' ),
				array( 'status' => 404 )
			);
		}

		$csv      = $this->build_csv( $chart_data );
		$slug     = sanitize_title( $chart_data['title'] ?: 'chart' );
		$pub_date = $chart_data['date_published'] ?? gmdate( 'Y-m-d' );
		$filename = $slug . '_data_' . $pub_date . '.csv';

		$this->pending_csv = array(
			'csv'      => $csv,
			'filename' => $filename,
		);

		return new \WP_REST_Response( null, 200 );
	}

	// ------------------------------------------------------------------
	// Data extraction helpers
	// ------------------------------------------------------------------

	/**
	 * Extract chart metadata and table data from a chart CPT post.
	 *
	 * All data comes directly from the chart block's stored attributes:
	 * - io.tableData  — JSON string of {header, rows} already used by the JS download action
	 * - metadata.*    — title, subtitle, note, source, tag
	 * - io.pngUrl/pngId — chart image
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return array|null Associative array of chart data, or null on failure.
	 */
	private function extract_chart_from_post( int $chart_post_id ) {
		$post = get_post( $chart_post_id );
		if ( ! $post || empty( $post->post_content ) ) {
			return null;
		}

		$blocks = parse_blocks( $post->post_content );

		$controller_block = $this->find_controller_block( $blocks );
		if ( ! $controller_block ) {
			return null;
		}

		// Respect the opt-out flag; default true if not set (missing key = opted in).
		// When false, extract_chart_from_post returns null, which also suppresses the
		// REST CSV endpoint — intentional, since the endpoint URL is only ever surfaced
		// via the schema distribution link.
		if ( isset( $controller_block['attrs']['enableSchemaOutput'] ) && false === $controller_block['attrs']['enableSchemaOutput'] ) {
			return null;
		}

		$is_freeform = ! empty( $controller_block['attrs']['isFreeform'] );
		$chart_block = null;
		foreach ( $controller_block['innerBlocks'] ?? array() as $inner ) {
			if ( 'prc-chart-builder/chart' === ( $inner['blockName'] ?? '' ) ) {
				$chart_block = $inner;
				break;
			}
		}
		if ( ! $chart_block ) {
			return null;
		}

		$attrs = $chart_block['attrs'] ?? array();
		if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
			$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
		}

		$metadata   = $attrs['metadata'] ?? array();
		$io         = $attrs['io'] ?? array();
		$chart_type = $is_freeform ? 'freeform' : ( $attrs['layout']['type'] ?? '' );

		// Table data lives in the core/table block's HTML, parsed the same way the
		// controller render callback does it — not in io.tableData.
		$table_block = $this->find_table_block( $controller_block );
		$table_data  = null;
		if ( $table_block && ! empty( $table_block['innerHTML'] ) ) {
			$table_data = Table_Export::filter_hidden_columns(
				\PRC\Html\parse_table_block_into_array( $table_block['innerHTML'] ),
				$table_block['attrs'] ?? array()
			);
		}

		$image_url = $io['pngUrl'] ?? '';
		if ( ! $image_url && ! empty( $io['pngId'] ) ) {
			$image_url = wp_get_attachment_url( $io['pngId'] ) ?: '';
		}

		return array(
			'post_id'        => $chart_post_id,
			'title'          => wp_strip_all_tags( $metadata['title'] ?? '' ),
			'subtitle'       => wp_strip_all_tags( $metadata['subtitle'] ?? '' ),
			'note'           => wp_strip_all_tags( $metadata['note'] ?? '' ),
			'source'         => wp_strip_all_tags( $metadata['source'] ?? '' ),
			'tag'            => wp_strip_all_tags( $metadata['tag'] ?? '' ),
			'alt_text'       => wp_strip_all_tags( $metadata['alt'] ?? '' ),
			'chart_type'     => $chart_type,
			'image_url'      => $image_url,
			'table_data'     => $table_data,
			'permalink'      => get_permalink( $chart_post_id ),
			'date_published' => get_the_date( 'Y-m-d', $chart_post_id ),
			'date_modified'  => get_the_modified_date( 'Y-m-d', $chart_post_id ),
		);
	}

	/**
	 * Extract chart data from all inline controller blocks in a pre-parsed block tree.
	 *
	 * Accepts already-parsed blocks so callers that have already called parse_blocks()
	 * (e.g. add_chart_datasets) can avoid parsing the same content twice.
	 *
	 * @param array $blocks  Parsed block tree.
	 * @param int   $post_id Post ID (used for dates and permalink).
	 * @return array[] Array of chart data arrays.
	 */
	private function extract_inline_charts_from_blocks( array $blocks, int $post_id ): array {
		$results   = array();
		$pub_date  = get_the_date( 'Y-m-d', $post_id );
		$mod_date  = get_the_modified_date( 'Y-m-d', $post_id );
		$permalink = get_permalink( $post_id );

		$this->collect_inline_chart_data( $blocks, $results, $pub_date, $mod_date, $permalink );

		return $results;
	}

	/**
	 * Recursively collect chart data from all controller blocks in a block tree.
	 *
	 * @param array  $blocks    Parsed blocks.
	 * @param array  &$results  Collected chart data arrays.
	 * @param string $pub_date  Publication date (Y-m-d).
	 * @param string $mod_date  Modified date (Y-m-d).
	 * @param string $permalink Post permalink.
	 */
	private function collect_inline_chart_data( array $blocks, array &$results, string $pub_date, string $mod_date, string $permalink ) {
		foreach ( $blocks as $block ) {
			if ( 'prc-chart-builder/controller' === ( $block['blockName'] ?? '' ) ) {
				// Respect the opt-out flag; default true if not set.
				if ( isset( $block['attrs']['enableSchemaOutput'] ) && false === $block['attrs']['enableSchemaOutput'] ) {
					continue;
				}

				// isFreeform is on the controller attrs, not the chart block.
				$is_freeform = ! empty( $block['attrs']['isFreeform'] );

				$chart_block = null;
				$table_block = null;
				foreach ( $block['innerBlocks'] ?? array() as $inner ) {
					if ( 'prc-chart-builder/chart' === ( $inner['blockName'] ?? '' ) ) {
						$chart_block = $inner;
					} elseif ( in_array( $inner['blockName'] ?? '', array( 'core/table', 'prc-block/table' ), true ) ) {
						$table_block = $inner;
					}
				}

				if ( ! $chart_block ) {
					continue;
				}

				$attrs = $chart_block['attrs'] ?? array();
				if ( ! isset( $attrs['_version'] ) || 'v2' !== $attrs['_version'] ) {
					$attrs = Block_Migration::migrate_attributes_v1_to_v2( $attrs );
				}

				$metadata = $attrs['metadata'] ?? array();
				$io       = $attrs['io'] ?? array();

				// For freeform charts, use "freeform" as the type since layout.type
				// reflects the sub-chart type, not the overall visualization.
				$chart_type = $is_freeform ? 'freeform' : ( $attrs['layout']['type'] ?? '' );

				$table_data = null;
				if ( $table_block && ! empty( $table_block['innerHTML'] ) ) {
					$table_data = Table_Export::filter_hidden_columns(
						\PRC\Html\parse_table_block_into_array( $table_block['innerHTML'] ),
						$table_block['attrs'] ?? array()
					);
				}

				$image_url = $io['pngUrl'] ?? '';
				if ( ! $image_url && ! empty( $io['pngId'] ) ) {
					$image_url = wp_get_attachment_url( $io['pngId'] ) ?: '';
				}

			$results[] = array(
				'post_id'        => 0,
				'title'          => wp_strip_all_tags( $metadata['title'] ?? '' ),
				'subtitle'       => wp_strip_all_tags( $metadata['subtitle'] ?? '' ),
				'note'           => wp_strip_all_tags( $metadata['note'] ?? '' ),
				'source'         => wp_strip_all_tags( $metadata['source'] ?? '' ),
				'tag'            => wp_strip_all_tags( $metadata['tag'] ?? '' ),
				'alt_text'       => wp_strip_all_tags( $metadata['alt'] ?? '' ),
				'chart_type'     => $chart_type,
				'image_url'      => $image_url,
				'table_data'     => $table_data,
				'permalink'      => $permalink,
				'date_published' => $pub_date,
				'date_modified'  => $mod_date,
			);
				// Never recurse into a controller's children — freeform sub-charts
				// are implementation details of the parent, not separate datasets.
				continue;
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				$this->collect_inline_chart_data( $block['innerBlocks'], $results, $pub_date, $mod_date, $permalink );
			}
		}
	}

	/**
	 * Find the first prc-chart-builder/controller block in a parsed block tree.
	 *
	 * Returns the whole controller so callers can read isFreeform and inner blocks.
	 *
	 * @param array $blocks Parsed blocks.
	 * @return array|null The controller block, or null if not found.
	 */
	private function find_controller_block( array $blocks ) {
		foreach ( $blocks as $block ) {
			if ( 'prc-chart-builder/controller' === ( $block['blockName'] ?? '' ) ) {
				return $block;
			}
			if ( ! empty( $block['innerBlocks'] ) ) {
				$found = $this->find_controller_block( $block['innerBlocks'] );
				if ( $found ) {
					return $found;
				}
			}
		}
		return null;
	}

	/**
	 * Find the first core/table (or prc-block/table) block inside a controller block.
	 *
	 * Accepts a controller block directly (not a full block tree) since callers
	 * already have the controller from find_controller_block().
	 *
	 * @param array $controller_block A parsed controller block.
	 * @return array|null The table block, or null if not found.
	 */
	private function find_table_block( array $controller_block ) {
		foreach ( $controller_block['innerBlocks'] ?? array() as $inner ) {
			if ( in_array( $inner['blockName'] ?? '', array( 'core/table', 'prc-block/table' ), true ) ) {
				return $inner;
			}
		}
		return null;
	}

	/**
	 * Recursively collect synced-chart ref IDs from parsed blocks.
	 *
	 * @param array $blocks Parsed blocks.
	 * @param int[] &$refs  Collected ref IDs.
	 */
	private function collect_synced_chart_refs( array $blocks, array &$refs ) {
		foreach ( $blocks as $block ) {
			if ( 'prc-chart-builder/synced-chart' === ( $block['blockName'] ?? '' ) ) {
				$ref = $block['attrs']['ref'] ?? null;
				if ( $ref ) {
					$refs[] = (int) $ref;
				}
			}
			if ( ! empty( $block['innerBlocks'] ) ) {
				$this->collect_synced_chart_refs( $block['innerBlocks'], $refs );
			}
		}
	}

	// ------------------------------------------------------------------
	// CSV builder
	// ------------------------------------------------------------------

	/**
	 * Build a CSV string matching the client-side arrayToCSV format.
	 *
	 * Mirrors arrayToCSV([tableData.header, ...tableData.rows], metadata) in view.js:
	 *   title
	 *   subtitle
	 *   (blank line)
	 *   header1,header2,...
	 *   val1,val2,...
	 *   ...
	 *   (blank line)
	 *   note
	 *   source
	 *   tag
	 *
	 * @see plugins/prc-chart-builder/src/controller/view.js arrayToCSV()
	 *
	 * @param array $chart_data Chart data from extract_chart_from_post().
	 * @return string CSV content.
	 */
	private function build_csv( array $chart_data ): string {
		$table_data = $chart_data['table_data'];
		$str        = '';

		$str .= $this->csv_sanitize_value( $chart_data['title'] ?? '' ) . "\n";
		$str .= $this->csv_sanitize_value( $chart_data['subtitle'] ?? '' ) . "\n";
		$str .= "\n";

		$all_rows = array_merge(
			array( $table_data['header'] ?? array() ),
			$table_data['rows'] ?? array()
		);

		foreach ( $all_rows as $row ) {
			$line = '';
			foreach ( $row as $j => $cell ) {
				if ( $j > 0 ) {
					$line .= ',';
				}
				$line .= $this->csv_sanitize_value( wp_strip_all_tags( (string) $cell ) );
			}
			$str .= $line . "\n";
		}

		$str .= "\n";
		$str .= $this->csv_sanitize_value( $chart_data['note'] ?? '' ) . "\n";
		$str .= $this->csv_sanitize_value( $chart_data['source'] ?? '' ) . "\n";
		$str .= $this->csv_sanitize_value( $chart_data['tag'] ?? '' );

		return $str;
	}

	/**
	 * Strip HTML tags and RFC 4180-encode a CSV field value.
	 *
	 * A field is wrapped in double quotes whenever it contains a comma,
	 * double-quote character, or newline. Any embedded double quotes are
	 * escaped by doubling them, per RFC 4180 §2.7.
	 *
	 * Mirrors the client-side checkIfEmptyAndSanitize() function.
	 *
	 * @param string $value Raw value.
	 * @return string Sanitized, RFC 4180-encoded value.
	 */
	private function csv_sanitize_value( string $value ): string {
		$value = wp_strip_all_tags( $value );
		if (
			false !== strpos( $value, ',' ) ||
			false !== strpos( $value, '"' ) ||
			false !== strpos( $value, "\n" ) ||
			false !== strpos( $value, "\r" )
		) {
			return '"' . str_replace( '"', '""', $value ) . '"';
		}
		return $value;
	}

	// ------------------------------------------------------------------
	// Schema builder
	// ------------------------------------------------------------------

	/**
	 * Get permalinks of all published posts that reference a chart CPT.
	 *
	 * Uses the same synced-chart usage meta that powers the editor's
	 * "Referencing Posts" sidebar panel, filtered to published posts only.
	 *
	 * @param int $chart_post_id Chart post ID.
	 * @return string[] Array of permalink URLs (may be empty).
	 */
	private function get_published_referencing_urls( int $chart_post_id ): array {
		if ( ! class_exists( __NAMESPACE__ . '\Synced_Chart' ) ) {
			return array();
		}
		$post_ids = Synced_Chart::get_chart_usage_post_ids( $chart_post_id );
		if ( empty( $post_ids ) ) {
			return array();
		}

		$urls = array();
		foreach ( $post_ids as $ref_id ) {
			if ( 'publish' === get_post_status( $ref_id ) ) {
				$url = get_permalink( $ref_id );
				if ( $url ) {
					$urls[] = $url;
				}
			}
		}

		return $urls;
	}

	/**
	 * Build a schema.org Dataset array for a single chart.
	 *
	 * @param array $chart_data Chart metadata from extract_chart_from_post().
	 * @param array $context    Optional context for embedded charts.
	 * @return array Schema.org Dataset associative array.
	 */
	private function build_dataset_schema( array $chart_data, array $context = array() ): array {
		$is_embedded = $context['is_embedded'] ?? false;
		$post_id     = $chart_data['post_id'] ?? 0;
		$has_cpt     = $post_id > 0;

		// Mirror the ARIA label pattern: "A {type} chart that shows {subtitle}".
		// Falls back gracefully when either piece is missing.
		$chart_type = $chart_data['chart_type'] ?? '';
		$title      = $chart_data['title'] ?? '';
		$subtitle   = $chart_data['subtitle'];
		$alt_text   = $chart_data['alt_text'] ?? '';
		$tag        = $chart_data['tag'] ?: 'Pew Research Center';
		if ( $alt_text ) {
			$description = $alt_text;
		} else {
			if ( $chart_type && $subtitle ) {
				$description = sprintf( 'A %s chart that shows %s', $chart_type, $subtitle );
			} elseif ( $subtitle ) {
				$description = $subtitle;
			} else {
				$description = $title . ' – data.';
			}
		}

		$dataset = array(
			'@type'               => 'Dataset',
			'name'                => $title ?: ( $has_cpt ? get_the_title( $post_id ) : '' ),
			'description'         => trim( $description . ' Copyright ' . $tag . '.' ),
			'url'                 => $chart_data['permalink'],
			'datePublished'       => $chart_data['date_published'],
			'dateModified'        => $chart_data['date_modified'],
			'isAccessibleForFree' => true,
			'creator'             => array(
				'@type' => 'Organization',
				'name'  => 'Pew Research Center',
				'url'   => home_url( '/' ),
			),
			'publisher'           => array(
				'@type' => 'Organization',
				'name'  => 'Pew Research Center',
				'url'   => home_url( '/' ),
			),
			'license'             => home_url( '/terms-and-conditions/' ),
		);

		if ( $has_cpt ) {
			$csv_url                = rest_url( self::REST_NAMESPACE . '/charts/' . $post_id . '/data.csv' );
			$dataset['distribution'] = array(
				'@type'          => 'DataDownload',
				'encodingFormat' => 'text/csv',
				'contentUrl'     => $csv_url,
			);
		}

		if ( ! empty( $chart_data['image_url'] ) ) {
			$dataset['image'] = $chart_data['image_url'];
		}


		// todo: when available, add funder attribution to the dataset. this should be powered by the funder metadata field.

		// Build isPartOf from all published posts that embed this chart.
		// For synced chart CPTs, query the usage meta. For the embedded context
		// (inline charts with no CPT), fall back to the current article URL.
		$is_part_of = array();

		if ( $has_cpt ) {
			$parent_id = Canonical_Parent::resolve_parent_id( $post_id );
			if ( $parent_id > 0 ) {
				$parent_url = get_permalink( $parent_id );
				if ( $parent_url ) {
					$is_part_of[] = array(
						'@type' => 'WebPage',
						'url'   => $parent_url,
					);
				}
			} else {
				$referencing_urls = $this->get_published_referencing_urls( $post_id );
				foreach ( $referencing_urls as $url ) {
					$is_part_of[] = array(
						'@type' => 'WebPage',
						'url'   => $url,
					);
				}
			}
		}

		if ( $is_embedded ) {
			$article_url = $context['article_url'] ?? '';
			if ( $article_url ) {
				$already_listed = false;
				foreach ( $is_part_of as $entry ) {
					if ( $entry['url'] === $article_url ) {
						$already_listed = true;
						break;
					}
				}
				if ( ! $already_listed ) {
					$is_part_of[] = array(
						'@type' => 'WebPage',
						'url'   => $article_url,
					);
				}
			}
		}

		if ( 1 === count( $is_part_of ) ) {
			$dataset['isPartOf'] = $is_part_of[0];
		} elseif ( count( $is_part_of ) > 1 ) {
			$dataset['isPartOf'] = $is_part_of;
		}

		return $dataset;
	}
}
