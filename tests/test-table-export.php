<?php
/**
 * Tests for Table_Export CSV utilities.
 *
 * @package PRC\Platform\Chart_Builder
 */

use PRC\Platform\Chart_Builder\Table_Export;

/**
 * Unit tests for hidden-column filtering and UTF-8 BOM constant.
 */
class TableExportTest extends WP_UnitTestCase {

	/**
	 * UTF8_BOM is exactly the three-byte UTF-8 signature.
	 */
	public function test_utf8_bom_constant() {
		$this->assertSame( "\xEF\xBB\xBF", Table_Export::UTF8_BOM );
		$this->assertSame( 3, strlen( Table_Export::UTF8_BOM ) );
	}

	/**
	 * columnMeta hidden flags remove columns from header and rows.
	 */
	public function test_filter_hidden_columns_uses_column_meta() {
		$table_data = array(
			'header' => array( 'Year', 'Hidden', 'Value' ),
			'rows'   => array(
				array( '2020', 'skip', '10' ),
				array( '2021', 'skip', '20' ),
			),
		);

		$filtered = Table_Export::filter_hidden_columns(
			$table_data,
			array(
				'columnMeta' => array(
					array( 'dataType' => 'auto' ),
					array( 'dataType' => 'auto', 'hidden' => true ),
					array( 'dataType' => 'auto' ),
				),
			)
		);

		$this->assertSame( array( 'Year', 'Value' ), $filtered['header'] );
		$this->assertSame(
			array(
				array( '2020', '10' ),
				array( '2021', '20' ),
			),
			$filtered['rows']
		);
	}

	/**
	 * Legacy hiddenColumns array is used when columnMeta has no entry.
	 */
	public function test_filter_hidden_columns_falls_back_to_legacy_hidden_columns() {
		$table_data = array(
			'header' => array( 'A', 'B', 'C' ),
			'rows'   => array(
				array( '1', '2', '3' ),
			),
		);

		$filtered = Table_Export::filter_hidden_columns(
			$table_data,
			array(
				'columnMeta'    => array(),
				'hiddenColumns' => array( 1 ),
			)
		);

		$this->assertSame( array( 'A', 'C' ), $filtered['header'] );
		$this->assertSame( array( array( '1', '3' ) ), $filtered['rows'] );
	}

	/**
	 * columnMeta takes precedence over legacy hiddenColumns for the same index.
	 */
	public function test_column_meta_takes_precedence_over_legacy_hidden_columns() {
		$table_data = array(
			'header' => array( 'A', 'B' ),
			'rows'   => array(
				array( '1', '2' ),
			),
		);

		// columnMeta explicitly not hidden at index 1; legacy says hidden.
		$filtered = Table_Export::filter_hidden_columns(
			$table_data,
			array(
				'columnMeta'    => array(
					array( 'dataType' => 'auto' ),
					array( 'dataType' => 'auto', 'hidden' => false ),
				),
				'hiddenColumns' => array( 1 ),
			)
		);

		$this->assertSame( array( 'A', 'B' ), $filtered['header'] );
		$this->assertSame( array( array( '1', '2' ) ), $filtered['rows'] );
	}

	/**
	 * No-op when no columns are hidden.
	 */
	public function test_filter_hidden_columns_noop_when_nothing_hidden() {
		$table_data = array(
			'header' => array( 'X', 'Y' ),
			'rows'   => array(
				array( 'a', 'b' ),
			),
		);

		$filtered = Table_Export::filter_hidden_columns( $table_data, array() );

		$this->assertSame( $table_data, $filtered );
	}

	/**
	 * Null and empty inputs pass through unchanged.
	 */
	public function test_filter_hidden_columns_handles_null_and_empty() {
		$this->assertNull( Table_Export::filter_hidden_columns( null, array() ) );
		$this->assertSame(
			array( 'header' => array(), 'rows' => array() ),
			Table_Export::filter_hidden_columns(
				array( 'header' => array(), 'rows' => array() ),
				array( 'hiddenColumns' => array( 0 ) )
			)
		);
	}

	/**
	 * get_hidden_column_indices returns sorted indices for multiple hidden columns.
	 */
	public function test_get_hidden_column_indices() {
		$indices = Table_Export::get_hidden_column_indices(
			array(
				'columnMeta' => array(
					array( 'hidden' => true ),
					array(),
					array( 'hidden' => true ),
				),
			),
			3
		);

		$this->assertSame( array( 0, 2 ), $indices );
	}
}
