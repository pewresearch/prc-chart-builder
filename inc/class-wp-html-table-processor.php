<?php
/**
 * WP_HTML_Table_Processor
 * @author Seth Rubenstein
 */

/**
 * Pass in a table and get back an array of the header, rows, and footer cells quickly and effeciently.
 *
 * The WP_HTML_Tag_Processor bookmark tree navigation is heavily cribbed from WP_Directive_Processor class https://github.com/WordPress/block-interactivity-experiments/pull/169/files#diff-ad36045951e27010af027ae380350ae4b07b56a659a3127b40b7967b2308d5bc
 * @package
 */
class WP_HTML_Table_Processor extends WP_HTML_Tag_Processor {
	/**
	 *
	 * Find the matching closing tag for an opening tag.
	 *
	 * When called while on an open tag, traverse the HTML until we find
	 * the matching closing tag, respecting any in-between content, including
	 * nested tags of the same name. Return false when called on a closing or
	 * void tag, or if no matching closing tag was found.
	 *
	 * @return bool True if a matching closing tag was found.
	 */
	public function next_balanced_closer() {
		$depth = 0;

		$tag_name = $this->get_tag();

		while ( $this->next_tag(
			array(
				'tag_name'    => $tag_name,
				'tag_closers' => 'visit',
			)
		) ) {
			if ( ! $this->is_tag_closer() ) {
				$depth++;
				continue;
			}

			if ( 0 === $depth ) {
				return true;
			}

			$depth--;
		}

		return false;
	}

	public function get_matching_tag_bookmarks() {
		$i = 0;
		while ( array_key_exists( 'start-' . $i, $this->bookmarks ) ) {
			++$i;
		}
		$start_name = 'start-' . $i;

		$this->set_bookmark( $start_name );
		if ( ! $this->next_balanced_closer() ) {
			$this->release_bookmark( $start_name );
			return false;
		}

		$i = 0;
		while ( array_key_exists( 'end-' . $i, $this->bookmarks ) ) {
			++$i;
		}
		$end_name = 'end-' . $i;
		$this->set_bookmark( $end_name );

		return array( $start_name, $end_name );
	}

	/**
	 * Return the content between two matching tags.
	 *
	 * When called on an opening tag, return the HTML content found between
	 * that opening tag and its matching closing tag.
	 *
	 * @return string The content between the current opening and its matching closing tag.
	 */
	public function get_inner_html() {
		$bookmarks = $this->get_matching_tag_bookmarks();

		if ( ! $bookmarks ) {
			return false;
		}
		list( $start_name, $end_name ) = $bookmarks;

		$start = $this->bookmarks[ $start_name ]->end + 1;
		$end   = $this->bookmarks[ $end_name ]->start;

		$this->seek( $start_name ); // Return to original position.
		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		return substr( $this->html, $start, $end - $start );
	}

	/**
	 * Returns the data from the table as an array.
	 *
	 * @return array
	 */
	public function get_data() {
		$table_headers = array();
		$table_rows = array();
		$table_footer = array();

		$this->next_tag( 'table' );

		$this->next_tag( 'thead' );
		$this->set_bookmark( 'thead' );
		$this->next_tag( 'tr' );
		while ( $this->next_tag( 'th' ) ) {
			$table_headers[] = $this->get_inner_html();
		}
		// Cleaning the tree as we go
		$this->seek( 'thead' );

		if ( empty( $table_headers ) ) {
			return new WP_Error(
				'no_table_headers',
				__( 'No table headers found.', 'prc-chart-builder' )
			);
		}

		if ( $this->next_tag('tbody') ) {
			$this->set_bookmark( 'tbody' );
			while ( $this->next_tag( 'tr' ) ) {
				while ( $this->next_tag( 'td' ) ) {
					$table_rows[] = $this->get_inner_html();
				}
			}
			// Cleaning the tree as we go
			$this->seek( 'tbody' );
			// Split table rows into cells by the number of headers, quicker and easier than trying to compute and iterate over columns/cells in WP_HTML_Tag_Processor.
			$table_rows = array_chunk( $table_rows, count( $table_headers ) );
		}

		if ( $this->next_tag( 'tfoot' ) ) {
			$this->set_bookmark( 'tfoot' );
			while ( $this->next_tag( 'tr' ) ) {
				$table_footer[] = $this->get_inner_html();
			}
			// Cleaning the tree as we go
			$this->seek( 'tfoot' );
			// Split table rows into cells by the number of headers
			$table_footer = array_chunk( $table_footer, count( $table_headers ) );
		}

		return array(
			'header' => $table_headers,
			'rows'   => $table_rows,
			'footer' => $table_footer,
		);
	}
}

/**
 * Processes a table block into an array of data. All HTML is stripped from the table.
 *
 * Tested with the core/table block and flexible-table/table block.
 *
 * @param mixed $table_content
 * @return array
 */
function parse_table_block_into_array( $table_content ) {
	// strip $table_content of any <!-- comments -->, which can interfer with the parser below
	$table_content = preg_replace( '/<!--(.|\s)*?-->/', '', $table_content );
	$processor = new WP_HTML_Table_Processor( $table_content );
	return $processor->get_data();
}

