<?php
/**
 * Chart AI Ability.
 *
 * Registers the prc-chart-builder/generate ability with the WordPress Abilities API
 * and exposes a REST endpoint that the gallery admin calls to generate chart block
 * markup from a text description, CSV data, and/or a PNG image.
 *
 * Flow:
 *   React (POST /prc-chart-builder/v1/ai/generate)
 *     → Chart_AI_Ability::handle_rest_request()
 *     → Chart_AI_Ability::generate_chart()
 *     → wp_ai_client_prompt (claude-haiku-4-5 | claude-sonnet-4-6 | claude-opus-4-7)
 *     → JSON { tableData, chartAttributes }
 *     → PHP serializer → block markup string
 *     → { content: string, error: string } → React
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use Throwable;
use WordPress\AiClient\Files\DTO\File;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

// If this file is called directly, abort.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Chart AI Ability class.
 *
 * @since 1.0.0
 */
class Chart_AI_Ability {
	use \PRC\Platform\Chart_Builder\Chart_Block_Defaults;

	/**
	 * Ability name registered with the WordPress Abilities API.
	 *
	 * @var string
	 */
	public static $ability_name = 'prc-chart-builder/generate';

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	private const REST_NAMESPACE = 'prc-chart-builder/v1';

	/**
	 * REST route.
	 *
	 * @var string
	 */
	private const REST_ROUTE = '/ai/generate';

	// ── Block type constants ──────────────────────────────────────────────

	private const CONTROLLER_BLOCK = 'prc-chart-builder/controller';
	private const CHART_BLOCK      = 'prc-chart-builder/chart';
	private const TABLE_BLOCK      = 'prc-block/table';

	/**
	 * Default PRC brand colors.
	 *
	 * @var array<string>
	 */
	private const PRC_COLORS = array(
		'#456A83',
		'#BF3B27',
		'#756a7e',
		'#ea9e2c',
		'#BB792A',
		'#eeece4',
	);

	// ── Abilities API registration ────────────────────────────────────────

	/**
	 * Register the ability with the WordPress Abilities API.
	 *
	 * @hook wp_abilities_api_init
	 */
	public function register_ability(): void {
		wp_register_ability(
			self::$ability_name,
			array(
				'label'               => __( 'Generate Chart', 'prc-chart-builder' ),
				'description'         => __( 'Generates chart block markup from a text description, CSV data, and/or a reference image using a selectable Claude model (Haiku, Sonnet, or Opus).', 'prc-chart-builder' ),
				'category'            => 'data-retrieval',
				'input_schema'        => array(
					'type'                 => 'object',
					'properties'           => array(
						'chartType'   => array(
							'type'        => 'string',
							'description' => 'The chart type slug (e.g. bar, line, pie, sankey).',
						),
						'description' => array(
							'type'        => 'string',
							'description' => 'Free-text description of the desired chart.',
						),
						'image'       => array(
							'type'        => 'string',
							'description' => 'Base64-encoded PNG or JPEG image of a chart to recreate.',
						),
						'csvData'     => array(
							'type'        => 'string',
							'description' => 'Raw CSV text containing the chart data.',
						),
						'model'       => array(
							'type'        => 'string',
							'description' => 'Claude model to use: claude-haiku-4-5, claude-sonnet-4-6 (default), or claude-opus-4-7.',
							'enum'        => array( 'claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-7' ),
						),
					),
					'required'             => array( 'chartType' ),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'content' => array(
							'type'        => 'string',
							'description' => 'Serialized WordPress block markup ready to POST to /wp/v2/chart.',
						),
						'error'   => array(
							'type'        => 'string',
							'description' => 'Error message if generation failed.',
						),
					),
				),
				'execute_callback'    => array( $this, 'generate_chart' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'meta'                => array(
					'annotations'  => array(
						'instructions' => 'Generates WordPress block markup for PRC Chart Builder blocks from a description, CSV data, and/or a chart image.',
						'readonly'     => false,
						'destructive'  => false,
						'idempotent'   => false,
					),
					'show_in_rest' => true,
				),
			)
		);
	}

	// ── REST endpoint ─────────────────────────────────────────────────────

	/**
	 * Register the REST route used by the gallery admin page.
	 *
	 * A direct REST endpoint is used instead of the Abilities API JS client
	 * because the gallery is not inside the block editor context.
	 *
	 * @hook rest_api_init
	 */
	public function register_rest_route(): void {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_ROUTE,
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_rest_request' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
				'args'                => array(
					'chartType'   => array(
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'description' => array(
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
						'default'           => '',
					),
					'image'       => array(
						'required'          => false,
						'type'              => 'string',
						'default'           => '',
						// Strip everything except valid base64 chars and the data URI prefix.
						'sanitize_callback' => static function ( $value ) {
							if ( empty( $value ) ) {
								return '';
							}
							// Allow optional data URI prefix then base64 payload only.
							if ( preg_match( '/^(data:image\/[a-z+]+;base64,)?([A-Za-z0-9+\/=]+)$/', $value, $m ) ) {
								return $m[1] . $m[2];
							}
							return '';
						},
					),
					'csvData'     => array(
						'required'          => false,
						'type'              => 'string',
						'default'           => '',
						'sanitize_callback' => array( $this, 'sanitize_csv_data' ),
					),
					'model'       => array(
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
						'default'           => 'claude-sonnet-4-6',
						'enum'              => array(
							'claude-haiku-4-5',
							'claude-sonnet-4-6',
							'claude-opus-4-7',
						),
					),
				),
			)
		);
	}

	/**
	 * Handle the REST request and return the generated block content.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return WP_REST_Response
	 */
	public function handle_rest_request( WP_REST_Request $request ): WP_REST_Response {
		$input = array(
			'chartType'   => $request->get_param( 'chartType' ),
			'description' => $request->get_param( 'description' ) ?? '',
			'image'       => $request->get_param( 'image' ) ?? '',
			'csvData'     => $request->get_param( 'csvData' ) ?? '',
			'model'       => $request->get_param( 'model' ) ?? 'claude-sonnet-4-6',
		);

		$result = $this->generate_chart( $input );

		return new WP_REST_Response( $result, 200 );
	}

	// ── Sanitization ─────────────────────────────────────────────────────

	/**
	 * Sanitize CSV data without stripping angle brackets.
	 *
	 * Unlike sanitize_textarea_field(), this preserves `<` and `>` characters
	 * which are valid in CSV data (e.g., "< 10", "<$50k", comparison operators).
	 * The function removes null bytes, validates UTF-8, and normalizes line endings.
	 *
	 * @param mixed $value The raw CSV string to sanitize.
	 * @return string Sanitized CSV data.
	 */
	public function sanitize_csv_data( $value ): string {
		if ( ! is_string( $value ) ) {
			return '';
		}

		// Remove null bytes which could cause issues.
		$value = str_replace( "\0", '', $value );

		// Remove other potentially dangerous control characters (except newlines/tabs).
		$value = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value );

		// Normalize line endings to \n.
		$value = str_replace( array( "\r\n", "\r" ), "\n", $value );

		// Ensure valid UTF-8 encoding.
		if ( function_exists( 'mb_convert_encoding' ) ) {
			$value = mb_convert_encoding( $value, 'UTF-8', 'UTF-8' );
		}

		return $value;
	}

	// ── Generation logic ──────────────────────────────────────────────────

	/**
	 * Allowed Claude model IDs for chart generation.
	 *
	 * @var array<string>
	 */
	private const ALLOWED_MODELS = array(
		'claude-haiku-4-5',
		'claude-sonnet-4-6',
		'claude-opus-4-7',
	);

	/**
	 * Generate chart block markup from the provided inputs.
	 *
	 * @param array{chartType: string, description: string, image: string, csvData: string, model?: string} $input
	 * @return array{content: string, error: string}
	 */
	public function generate_chart( array $input ): array {
		$chart_type  = $input['chartType'] ?? '';
		$description = $input['description'] ?? '';
		$image_b64   = $input['image'] ?? '';
		$csv_data    = $input['csvData'] ?? '';
		$model       = in_array( $input['model'] ?? '', self::ALLOWED_MODELS, true )
			? $input['model']
			: 'claude-sonnet-4-6';

		if ( empty( $chart_type ) ) {
			return array(
				'content' => '',
				'error'   => 'A chartType is required.',
			);
		}

		if ( empty( $description ) && empty( $image_b64 ) && empty( $csv_data ) ) {
			return array(
				'content' => '',
				'error'   => 'At least one of description, image, or csvData is required.',
			);
		}

		$system_instructions = self::get_system_instructions( $chart_type );
		$user_prompt         = self::build_user_prompt( $chart_type, $description, $csv_data );
		$output_schema       = self::get_output_schema();

		$builder = wp_ai_client_prompt( $user_prompt );
		if ( is_wp_error( $builder ) ) {
			return array(
				'content' => '',
				'error'   => $builder->get_error_message(),
			);
		}

		$builder = $builder
			->using_system_instruction( $system_instructions )
			->using_model_preference( $model )
			->as_json_response( $output_schema );

		// Attach image if provided.
		if ( ! empty( $image_b64 ) ) {
			$mime = 'image/png';
			if ( preg_match( '/^data:(image\/[a-z+]+);base64,/', $image_b64, $m ) ) {
				$mime = $m[1];
			}
			$clean_b64 = preg_replace( '/^data:image\/[a-z+]+;base64,/', '', $image_b64 );
			try {
				$file    = new File( $clean_b64, $mime );
				$builder = $builder->with_file( $file );
			} catch ( Throwable $e ) {
				return array(
					'content' => '',
					'error'   => 'Invalid image data: ' . $e->getMessage(),
				);
			}
		}

		$response = $builder->generate_text();

		if ( is_wp_error( $response ) ) {
			return array(
				'content' => '',
				'error'   => $response->get_error_message(),
			);
		}

		$ai_data = json_decode( (string) $response, true );

		if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $ai_data ) ) {
			return array(
				'content' => '',
				'error'   => 'Failed to parse AI response as JSON.',
			);
		}

		$content = $this->serialize_chart_blocks( $chart_type, $ai_data );

		return array(
			'content' => $content,
			'error'   => '',
		);
	}

	// ── Block serialization ───────────────────────────────────────────────

	/**
	 * Serialize the AI-provided data into WordPress block markup.
	 *
	 * The AI returns:
	 *   {
	 *     tableData: { head: [{cells:[{content,tag}]}], body: [{cells:[{content,tag}]}] },
	 *     chartAttributes: { layout: {...}, metadata: {...}, colors: [...], ... }
	 *   }
	 *
	 * We deep-merge chartAttributes with block.json defaults, then serialize.
	 *
	 * @param string               $chart_type The chart type slug.
	 * @param array<string, mixed> $ai_data    Parsed AI JSON response.
	 * @return string Serialized block markup.
	 */
	private function serialize_chart_blocks( string $chart_type, array $ai_data ): string {
		$table_data       = $ai_data['tableData'] ?? array();
		$chart_attributes = $ai_data['chartAttributes'] ?? array();
		$head_rows        = $table_data['head'] ?? array();
		$body_rows        = $table_data['body'] ?? array();

		// ── 1. Build the HTML table that the table block stores as its inner content ──

		$table_html = $this->build_table_html( $head_rows, $body_rows );

		// ── 2. Table block attributes (no head/body — data lives in the HTML) ─────────

		$table_attrs = array(
			'isScrollOnPc'     => true,
			'isScrollOnMobile' => true,
			'sticky'           => 'first-column',
			'className'        => 'chart-builder-data-table',
			'fontSize'         => 'small',
			'fontFamily'       => 'sans-serif',
		);

		// ── 3. Derive chart data arrays from the table for io.chartData ───────────────

		// Header cells tell us column names; first column = independentVariable (x).
		$header_cells    = $head_rows[0]['cells'] ?? array();
		$column_names    = array_map( fn( $c ) => $c['content'] ?? '', $header_cells );
		$independent_var = $column_names[0] ?? 'x';
		$categories      = array_slice( $column_names, 1 );

		// Build io.chartData: array of {x: val, col1: val, ...} objects.
		// Mirrors the JS editor logic: column 0 → 'x', all others keep their header name.
		$chart_data = array();
		foreach ( $body_rows as $row ) {
			$cells = $row['cells'] ?? array();
			if ( empty( $cells ) ) {
				continue;
			}
			$entry = array();
			foreach ( $cells as $i => $cell ) {
				$key           = ( 0 === $i ) ? 'x' : ( $column_names[ $i ] ?? ( 'col' . $i ) );
				$entry[ $key ] = $cell['content'] ?? '';
			}
			$chart_data[] = $entry;
		}

		// ── 4. Three-layer merge: block.json → variation template → AI overrides ────────
		//
		// Layer 1: block.json defaults (all attributes at their defaults)
		// Layer 2: variation template overrides (chart-type-specific opinionated settings)
		// Layer 3: AI-provided overrides (what the AI wants to customise)
		//
		// This ensures the chart is properly configured for its type even when the AI
		// doesn't explicitly specify every setting.

		$defaults          = $this->get_chart_block_defaults();
		$template_defaults = $this->get_variation_template_defaults( $chart_type );
		$merged            = $this->deep_merge( $defaults, $template_defaults );
		$merged            = $this->deep_merge( $merged, $chart_attributes );

		// Required fields — always set these regardless of AI output.
		$merged['_version']          = 'v2';
		$merged['layout']['type']    = $chart_type;
		$merged['metadata']['title'] = ! empty( $merged['metadata']['title'] ) && 'AI Generated Chart' !== $merged['metadata']['title']
			? $merged['metadata']['title']
			: 'AI Generated Chart';

		// ── 5. Populate runtime data fields ──────────────────────────────────────────
		//
		// These must ALWAYS be derived from the actual table data — never from the AI
		// or from block.json defaults — because they change with every dataset.

		$resolved_categories = $categories;

		if ( ! isset( $merged['io'] ) ) {
			$merged['io'] = array();
		}
		$merged['io']['chartData']           = $chart_data;
		$merged['io']['availableCategories'] = $resolved_categories;
		$merged['io']['independentVariable'] = 'x';

		if ( ! isset( $merged['dataRender'] ) ) {
			$merged['dataRender'] = array();
		}
		// Always override categories with the runtime-derived value so it's never empty.
		$merged['dataRender']['categories'] = $resolved_categories;

		// ── 6. Annotations: sanitize and activate when items are present ─────────────
		//
		// The AI may return an annotations object with an items array. We strip any
		// runtime-only callback keys (onDrag, onDragStart, onDragEnd) that cannot be
		// serialized, generate stable IDs for items that lack one, and ensure the
		// outer `active` flag is set to true whenever there are annotation items.

		$runtime_only_keys = array( 'onDrag', 'onDragStart', 'onDragEnd' );

		if (
			isset( $merged['annotations']['items'] ) &&
			is_array( $merged['annotations']['items'] ) &&
			! empty( $merged['annotations']['items'] )
		) {
			$sanitized_items = array();
			foreach ( $merged['annotations']['items'] as $idx => $item ) {
				if ( ! is_array( $item ) ) {
					continue;
				}
				// Strip runtime-only callback keys.
				foreach ( $runtime_only_keys as $runtime_key ) {
					unset( $item[ $runtime_key ] );
				}
				// Ensure every item has a stable id.
				if ( empty( $item['id'] ) ) {
					$item['id'] = 'annotation-' . ( $idx + 1 );
				}
				// Clamp x/y to 0.0–1.0.
				if ( isset( $item['x'] ) ) {
					$item['x'] = max( 0.0, min( 1.0, (float) $item['x'] ) );
				}
				if ( isset( $item['y'] ) ) {
					$item['y'] = max( 0.0, min( 1.0, (float) $item['y'] ) );
				}
				$sanitized_items[] = $item;
			}
			$merged['annotations']['items']  = $sanitized_items;
			$merged['annotations']['active'] = true;
		}

		// ── 8. Colors: AI-provided colors go into io.customColors ───────────────────
		//
		// The chart reads colors from io.customColors (custom hex array) or
		// io.colorValue (named palette key like "general", "blue"). If the AI
		// returns explicit hex colors, set them as customColors; otherwise leave
		// the default colorValue palette in place.

		$ai_colors = $chart_attributes['colors'] ?? array();
		if ( ! empty( $ai_colors ) && is_array( $ai_colors ) ) {
			$merged['io']['customColors'] = $ai_colors;
		}
		// Remove the top-level 'colors' key — it's computed at render time by get-config.js.
		unset( $merged['colors'] );

		// ── 9. Serialize ──────────────────────────────────────────────────────────────

		// Lock the chart block so editors cannot accidentally move or remove it.
		$merged['lock'] = array(
			'move'   => true,
			'remove' => true,
		);

		$table_markup = $this->serialize_block( self::TABLE_BLOCK, $table_attrs, $table_html );
		$chart_markup = $this->serialize_block( self::CHART_BLOCK, $merged );

		$controller_attrs   = array( 'chartType' => $chart_type );
		$controller_content = "\n" . $table_markup . "\n\n" . $chart_markup . "\n";
		return $this->serialize_block( self::CONTROLLER_BLOCK, $controller_attrs, $controller_content );
	}

	/**
	 * Build the inner HTML for the prc-block/table block.
	 *
	 * The table block stores its data as a rendered <figure><table> HTML string
	 * between its block comment delimiters — it does NOT use head/body attributes.
	 * This mirrors the structure produced by the block's save() function.
	 *
	 * @param array<int, array{cells: list<array{content: string, tag: string}>}> $head_rows
	 * @param array<int, array{cells: list<array{content: string, tag: string}>}> $body_rows
	 * @return string
	 */
	private function build_table_html( array $head_rows, array $body_rows ): string {
		$classes = 'wp-block-prc-block-table is-scroll-on-pc is-scroll-on-mobile chart-builder-data-table has-sans-serif-font-family has-small-font-size';

		// thead.
		$thead = '';
		foreach ( $head_rows as $row ) {
			$cells = '';
			foreach ( $row['cells'] ?? array() as $cell ) {
				$tag     = in_array( $cell['tag'] ?? 'th', array( 'th', 'td' ), true ) ? $cell['tag'] : 'th';
				$content = esc_html( $cell['content'] ?? '' );
				$cells  .= "<{$tag}>{$content}</{$tag}>";
			}
			$thead .= "<tr>{$cells}</tr>";
		}

		// tbody.
		$tbody = '';
		foreach ( $body_rows as $row ) {
			$cells = '';
			foreach ( $row['cells'] ?? array() as $cell ) {
				$tag     = in_array( $cell['tag'] ?? 'td', array( 'th', 'td' ), true ) ? $cell['tag'] : 'td';
				$content = esc_html( $cell['content'] ?? '' );
				$cells  .= "<{$tag}>{$content}</{$tag}>";
			}
			$tbody .= "<tr>{$cells}</tr>";
		}

		return "\n<figure class=\"{$classes}\"><table class=\"has-fixed-layout is-sticky-first-column\"><thead>{$thead}</thead><tbody>{$tbody}</tbody></table></figure>\n";
	}

	/**
	 * Produce WordPress block comment markup for a single block.
	 *
	 * @param string               $block_name  The block name (e.g. prc-chart-builder/chart).
	 * @param array<string, mixed> $attributes  Block attributes.
	 * @param string               $inner_html  Inner block content (for container blocks).
	 * @return string Serialized block markup.
	 */
	private function serialize_block( string $block_name, array $attributes, string $inner_html = '' ): string {
		$attrs_json = wp_json_encode( $attributes );

		if ( $inner_html === '' ) {
			return sprintf( '<!-- wp:%s %s /-->', $block_name, $attrs_json );
		}

		return sprintf(
			'<!-- wp:%s %s -->%s<!-- /wp:%s -->',
			$block_name,
			$attrs_json,
			$inner_html,
			$block_name
		);
	}

	// ── Prompts ───────────────────────────────────────────────────────────

	/**
	 * JSON Schema for `as_json_response` (root `type` required; no name/schema wrapper).
	 *
	 * Allows flexible `chartAttributes` while constraining `tableData` shape.
	 *
	 * @return array<string, mixed>
	 */
	private static function get_output_schema(): array {
		return array(
			'type'                 => 'object',
			'properties'           => array(
				'tableData'       => array(
					'type'                 => 'object',
					'properties'           => array(
						'head' => array( 'type' => 'array' ),
						'body' => array( 'type' => 'array' ),
					),
					'required'             => array( 'head', 'body' ),
					'additionalProperties' => true,
				),
				'chartAttributes' => array(
					'type'                 => 'object',
					'additionalProperties' => true,
				),
			),
			'required'             => array( 'tableData', 'chartAttributes' ),
			'additionalProperties' => false,
		);
	}

	/**
	 * Build the system instructions for the AI.
	 *
	 * @param string $chart_type The selected chart type slug.
	 * @return string
	 */
	private static function get_system_instructions( string $chart_type ): string {
		$type_label = Content_Type::$known_chart_types[ $chart_type ] ?? ucfirst( $chart_type );

		return <<<PROMPT
You are an expert data visualization engineer for Pew Research Center. Your task is to generate chart configuration JSON for the PRC Chart Builder WordPress block plugin.

## Chart Builder Architecture

Charts are composed of two WordPress blocks inside a controller:
1. **prc-block/table** — holds the raw data in an HTML table format (head/body rows/cells).
2. **prc-chart-builder/chart** — holds all chart configuration attributes.

## Your Task

Generate a JSON object with exactly two top-level keys:

```json
{
  "tableData": {
    "head": [{ "cells": [{ "content": "string", "tag": "th" }] }],
    "body": [{ "cells": [{ "content": "string", "tag": "td" }] }]
  },
  "chartAttributes": {
    "layout": { ... },
    "metadata": { ... },
    "colors": [ ... ],
    "independentAxis": { ... },
    "dependentAxis": { ... },
    "labels": { ... },
    "legend": { ... },
    "tooltip": { ... },
    "dataRender": { ... },
    "annotations": {
      "active": true,
      "activeOnMobile": false,
      "items": [
        {
          "id": "annotation-1",
          "x": 0.5,
          "y": 0.2,
          "text": "Label text",
          "fontSize": 12,
          "fontWeight": "normal",
          "fontStyle": "normal",
          "fill": "#2a2a2a",
          "textAnchor": "middle",
          "verticalAnchor": "middle",
          "positioningContext": "chart"
        }
      ]
    }
  }
}
```

## Chart Type

You are generating a **{$type_label}** chart (`{$chart_type}`).

## tableData Rules

- `head` is always a single-element array containing an object with a `cells` array.
- Each cell has `content` (string) and `tag` ("th" for header, "td" for body).
- For standard charts: use the EXACT column headers from the CSV data. The first column contains category labels, remaining columns contain numeric series. Do NOT rename columns to "x" or "y" — keep the original CSV header names (e.g., "country", "value", "revenue").
- For sankey charts: columns must be `source`, `target`, `value`.
- `body` rows each have a `cells` array matching the header structure.
- All numeric values must be strings (e.g., "42", not 42).

## chartAttributes Rules

Only return the attributes you want to override from defaults. Keep overrides minimal:

**layout** (required overrides):
- `type`: must be "{$chart_type}"
- `width`: 640 (default for most charts)
- `height`: appropriate for chart type (e.g., 300–500 for most, 160 per bar category for bar charts)
- `orientation`: "horizontal" or "vertical" (for bar/column charts)
- `padding`: object with top/bottom/left/right (integers)

**metadata** (required overrides):
- `title`: descriptive title for the chart
- `subtitle`: short subtitle if appropriate, else ""
- `source`: "Source: [inferred from data or description]"
- `note`: "Note: [any caveats]" or ""
- `tag`: omit — the site chart theme supplies the default metadata tag

**colors** (required when a color scheme is requested):
- Array of hex color strings. Default palette: ["#456A83","#BF3B27","#756a7e","#ea9e2c","#BB792A","#eeece4"]
- If the user requests a specific color scheme (e.g., "blue", "warm", "earth tones"), generate a FULL palette of 4-6 hex colors matching that scheme. Do NOT return a single color — always return at least 4 colors.
- If no color scheme is requested, omit this key entirely (do not return an empty array).

**dataRender** (required for most chart types):
- `categories`: array of the EXACT column header names (from the CSV) that represent data series — i.e., all column headers EXCEPT the first one. For example, if the CSV has columns "country,value", categories should be ["value"].
- `sortOrder`: "none", "ascending", or "descending"

**independentAxis** (override as needed):
- `active`: true/false
- `tickCount`: integer
- `tickFormat`: null or format string (e.g., "%")

**dependentAxis** (override as needed):
- `active`: true/false
- `tickCount`: integer
- `abbreviateTicks`: true for large numbers

**labels**:
- `active`: true if values should be shown on bars/segments
- `color`: "contrast" for bars, "inherit" otherwise

**legend**:
- `active`: true if multiple series
- `orientation`: "row"

**tooltip**:
- `active`: true (always)
- `format`: "{{row}}: {{value}}" (default)

**annotations** (include ONLY when non-data text is present):
- Annotations are free-floating text labels rendered on top of the chart. Use them to capture text that is NOT part of the data series: callout labels, trend annotations, reference markers, explanatory notes positioned inside the chart area, or any other text directly embedded in the chart graphic itself.
- Do NOT use annotations for: chart titles, subtitles, source lines, notes — those belong in `metadata`. Do NOT use annotations for axis tick labels or legend entries — those are produced automatically from the data.
- When to include this key:
  - An image is provided and contains visible text that is NOT a tick label, legend entry, chart title, subtitle, source, or note.
  - The user description explicitly mentions callouts, labels, or annotations to be placed on the chart.
  - If there are no such text elements, **omit the `annotations` key entirely** (do not emit an empty items array).
- Coordinate system: `x` and `y` are **percentages of the chart area** expressed as decimals (0.0–1.0). Origin (0, 0) is the **top-left** corner of the full chart including padding. (0.5, 0.5) is the center.
  - When recreating from an image: visually estimate the annotation's position relative to the full chart bounding box and express it as a fraction.
  - `positioningContext`: use "chart" (default) when the position is relative to the full chart area including padding and axes. Use "inner" when the position should be relative to the inner data plotting area only.
- Each annotation item shape (omit keys you do not need):
  - `id` (string, required): unique slug, e.g. "annotation-1"
  - `x` (number, required): horizontal position as a 0.0–1.0 decimal
  - `y` (number, required): vertical position as a 0.0–1.0 decimal
  - `text` (string, required): the label text
  - `fontSize` (number): point size, default 12
  - `fontWeight`: "normal" | "bold" | "600" | "700"
  - `fontStyle`: "normal" | "italic"
  - `fill` (string): hex color of the text, e.g. "#2a2a2a"
  - `textAnchor`: "start" | "middle" | "end"
  - `verticalAnchor`: "start" | "middle" | "end"
  - `rotation` (number): degrees clockwise
  - `backgroundColor` (string): optional background fill behind the text
  - `padding` (number): padding around the text when backgroundColor is set
  - `borderRadius` (number): corner radius when backgroundColor is set
  - `opacity` (number 0–1)
  - `maxWidth` (number): wrap text at this pixel width
  - `activeOnMobile` (boolean): default false
  - `positioningContext`: "chart" | "inner"
  - `textOutline` (boolean): renders a contrasting stroke behind the text for readability on complex backgrounds
- The outer `annotations` object must include: `"active": true` and `"activeOnMobile": false` (unless mobile display is explicitly needed).

## Type-Specific Guidance

{self::get_type_specific_guidance( $chart_type )}

## PRC Design Conventions

- Font: 'franklin-gothic-urw', Verdana, Geneva, sans-serif
- Width: 640px standard, 420px for simple bar charts
- Colors should be professional and accessible.
- If a green color scheme is requested, use: ["#2d6a4f","#52b788","#95d5b2","#d8f3dc","#1b4332","#74c69d"]
- If a blue color scheme is requested, use: ["#023e8a","#0077b6","#0096c7","#00b4d8","#48cae4","#90e0ef"]
- PRC standard palette: ["#456A83","#BF3B27","#756a7e","#ea9e2c","#BB792A","#eeece4"]

## Output Format

Return ONLY valid JSON. No markdown, no code blocks, no explanations. Raw JSON only.
The response must exactly match the structure described above.
PROMPT;
	}

	/**
	 * Return chart-type-specific prompt guidance.
	 *
	 * @param string $chart_type
	 * @return string
	 */
	private static function get_type_specific_guidance( string $chart_type ): string {
		$guidance = array(
			'bar'            => 'Horizontal bar chart. Set layout.orientation="horizontal", layout.width=420. Height = 40 * number_of_rows. dependentAxis.active=false. labels.active=true, labels.color="contrast". dataRender.sortOrder="descending".',
			'column'         => 'Vertical column chart. Set layout.orientation="vertical". dependentAxis.active=true. independentAxis.active=true. labels.active=true.',
			'line'           => 'Line chart. dataRender.categories should list all series columns. legend.active=true if multiple series. line.showPoints=true.',
			'area'           => 'Area chart. Similar to line. line.showArea=true, line.areaFillOpacity=0.4.',
			'stacked-bar'    => 'Stacked horizontal bar. layout.orientation="horizontal". bar.stackOffset="none". legend.active=true.',
			'stacked-column' => 'Stacked vertical column. legend.active=true.',
			'stacked-area'   => 'Stacked area chart. legend.active=true.',
			'pie'            => 'Pie/donut chart. Two columns: label and value. pie.innerRadius=0 for pie, >0 for donut. legend.active=true.',
			'scatter'        => 'Scatter plot. columns: x (category or numeric), y (numeric). nodes.pointSize=5.',
			'bee-swarm'      => 'Beeswarm distribution. ONE ROW PER DOT. First column = the row label identifying each observation, e.g. Respondent (maps to x) — NOT the plotted value. Second column = the numeric plotted value, e.g. Age; name that column in dataRender.categories (for example dataRender.categories=["Age"]). Optional sibling columns: Group (color category), Size (numeric radius). Do NOT use scatter-style y1/y2 series columns. dataRender.x="x". nodes.sizeCategory="Size" when a size column exists.',
			'dot-plot'       => 'Dot plot for comparison. Two value columns typically.',
			'diverging-bar'  => 'Diverging bar chart. Must have positive and negative value columns.',
			'sankey'         => 'Sankey/flow diagram. Columns MUST be: source, target, value (all strings). No axes. sankey.nodeAlign="justify".',
			'treemap'        => 'Treemap. Columns: label, value. treemap.tile="squarify".',
			'exploded-bar'   => 'Exploded bar chart for 100% comparison. Multiple value columns.',
			'heat-map-table' => 'Heat map table matrix. First column = row label (demographic/group). Remaining columns = numeric values 0–100 for each platform/category; list those column names in dataRender.categories. Use dataRender.mapScale="linear", dataRender.mapScaleDomain=[0,100], io.colorValue="blue-spectrum", labels.color="contrast". No axes. heatMapTable.showValues=true by default.',
			'freeform'       => 'General-purpose chart. Use bar layout as a sensible default.',
		);

		return $guidance[ $chart_type ] ?? "Standard {$chart_type} chart. Follow the general guidelines above.";
	}

	/**
	 * Build the user-facing prompt from description, CSV, and chart type.
	 *
	 * @param string $chart_type  Chart type slug.
	 * @param string $description User's text description.
	 * @param string $csv_data    Raw CSV text.
	 * @return string
	 */
	private static function build_user_prompt( string $chart_type, string $description, string $csv_data ): string {
		$type_label = Content_Type::$known_chart_types[ $chart_type ] ?? ucfirst( $chart_type );
		$parts      = array();

		$parts[] = "Generate a {$type_label} chart ({$chart_type}) configuration.";

		if ( ! empty( $description ) ) {
			$parts[] = "\nUser description: {$description}";
		}

		if ( ! empty( $csv_data ) ) {
			// Trim to avoid token waste, cap at ~100 rows.
			$lines   = explode( "\n", trim( $csv_data ) );
			$capped  = array_slice( $lines, 0, 101 );
			$trimmed = implode( "\n", $capped );
			$parts[] = "\nCSV data:\n```csv\n{$trimmed}\n```";
			$parts[] = 'Parse this CSV into the tableData format. The first row is the header.';
		}

		if ( empty( $csv_data ) ) {
			$parts[] = 'Since no data was provided, generate realistic sample data appropriate for this chart type (5–8 data points).';
		}

		$parts[] = "\nReturn ONLY the JSON object as specified in your system instructions.";

		return implode( ' ', $parts );
	}
}
