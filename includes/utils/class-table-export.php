<?php
/**
 * Table export utilities for CSV downloads.
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

namespace PRC\Platform\Chart_Builder;

/**
 * Resolves hidden Power Table columns and provides CSV encoding helpers.
 */
class Table_Export {

	/**
	 * UTF-8 byte order mark for Excel CSV compatibility.
	 */
	public const UTF8_BOM = "\xEF\xBB\xBF";

	/**
	 * Resolve hidden virtual column indices from table block attributes.
	 *
	 * Mirrors getEffectiveColumnMeta() in prc-block-library: prefer columnMeta,
	 * fall back to legacy hiddenColumns.
	 *
	 * @param array $table_attrs   Table block attributes.
	 * @param int   $column_count  Number of columns in parsed table data.
	 * @return int[] Hidden column indices.
	 */
	public static function get_hidden_column_indices( array $table_attrs, int $column_count ): array {
		$column_meta    = $table_attrs['columnMeta'] ?? array();
		$hidden_columns = $table_attrs['hiddenColumns'] ?? array();

		if ( ! is_array( $column_meta ) ) {
			$column_meta = array();
		}
		if ( ! is_array( $hidden_columns ) ) {
			$hidden_columns = array();
		}

		$hidden = array();
		for ( $i = 0; $i < $column_count; $i++ ) {
			if ( self::is_column_hidden( $i, $column_meta, $hidden_columns ) ) {
				$hidden[] = $i;
			}
		}

		return $hidden;
	}

	/**
	 * Remove hidden columns from parsed table data before CSV export.
	 *
	 * @param array|null $table_data  Parsed { header, rows } from parse_table_block_into_array().
	 * @param array      $table_attrs Table block attributes.
	 * @return array|null Filtered table data, or null when input is null/empty.
	 */
	public static function filter_hidden_columns( ?array $table_data, array $table_attrs ): ?array {
		if ( null === $table_data || empty( $table_data['header'] ) ) {
			return $table_data;
		}

		$column_count = count( $table_data['header'] );
		$hidden       = self::get_hidden_column_indices( $table_attrs, $column_count );

		if ( empty( $hidden ) ) {
			return $table_data;
		}

		$hidden_lookup = array_flip( $hidden );

		$filter_row = static function ( array $row ) use ( $hidden_lookup ): array {
			$filtered = array();
			foreach ( $row as $index => $cell ) {
				if ( ! isset( $hidden_lookup[ $index ] ) ) {
					$filtered[] = $cell;
				}
			}
			return $filtered;
		};

		return array(
			'header' => $filter_row( $table_data['header'] ),
			'rows'   => array_map( $filter_row, $table_data['rows'] ?? array() ),
		);
	}

	/**
	 * Whether a column at the given index is hidden.
	 *
	 * @param int   $col_index       Virtual column index.
	 * @param array $column_meta     columnMeta array.
	 * @param array $hidden_columns  Legacy hiddenColumns array.
	 * @return bool
	 */
	private static function is_column_hidden( int $col_index, array $column_meta, array $hidden_columns ): bool {
		if ( isset( $column_meta[ $col_index ] ) && is_array( $column_meta[ $col_index ] ) ) {
			return ! empty( $column_meta[ $col_index ]['hidden'] );
		}

		return in_array( $col_index, $hidden_columns, true );
	}
}
