<?php
/**
 * Table HTML processor built on WP_HTML_Tag_Processor.
 *
 * @package pewresearch/wp-html-processors
 */

declare(strict_types=1);

namespace PRC\Html;

/**
 * Pass in a table and get back an array of the header, rows, and footer cells.
 *
 * The WP_HTML_Tag_Processor bookmark tree navigation is heavily cribbed from
 * WP_Directive_Processor (WordPress Interactivity API).
 */
class TableProcessor extends \WP_HTML_Tag_Processor {

	/**
	 * Finds the matching closing tag for an opening tag.
	 *
	 * When called while the processor is on an open tag, it traverses the HTML
	 * until it finds the matching closer tag, respecting any in-between content,
	 * including nested tags of the same name. Returns false when called on a
	 * closer tag, a tag that doesn't have a closer tag (void), a tag that
	 * doesn't visit the closer tag, or if no matching closing tag was found.
	 *
	 * @return bool Whether a matching closing tag was found.
	 */
	public function next_balanced_tag_closer_tag(): bool {
		$depth    = 0;
		$tag_name = $this->get_tag();

		while ( $this->next_tag(
			array(
				'tag_name'    => $tag_name,
				'tag_closers' => 'visit',
			)
		) ) {
			if ( ! $this->is_tag_closer() ) {
				++$depth;
				continue;
			}

			if ( 0 === $depth ) {
				return true;
			}

			--$depth;
		}

		return false;
	}

	/**
	 * Returns a pair of bookmarks for the current opener tag and the matching
	 * closer tag.
	 *
	 * It positions the cursor in the closer tag of the balanced tag, if it
	 * exists.
	 *
	 * @return array|null A pair of bookmarks, or null if there's no matching closing tag.
	 */
	public function get_balanced_tag_bookmarks() {
		static $i   = 0;
		$opener_tag = 'opener_tag_of_balanced_tag_' . ( ++$i );

		$this->set_bookmark( $opener_tag );
		if ( ! $this->next_balanced_tag_closer_tag() ) {
			$this->release_bookmark( $opener_tag );
			return null;
		}

		$closer_tag = 'closer_tag_of_balanced_tag_' . ( ++$i );
		$this->set_bookmark( $closer_tag );

		return array( $opener_tag, $closer_tag );
	}

	/**
	 * Gets the positions right after the opener tag and right before the closer
	 * tag in a balanced tag.
	 *
	 * By default, it positions the cursor in the closer tag of the balanced tag.
	 * If $rewind is true, it seeks back to the opener tag.
	 *
	 * @param bool $rewind Optional. Whether to seek back to the opener tag after finding the positions. Defaults to false.
	 * @return array|null Start and end byte position, or null when no balanced tag bookmarks.
	 */
	public function get_after_opener_tag_and_before_closer_tag_positions( bool $rewind = false ) {
		// Flushes any changes.
		$this->get_updated_html();

		$bookmarks = $this->get_balanced_tag_bookmarks();
		if ( ! $bookmarks ) {
			return null;
		}
		list( $opener_tag, $closer_tag ) = $bookmarks;

		$after_opener_tag  = $this->bookmarks[ $opener_tag ]->start + $this->bookmarks[ $opener_tag ]->length;
		$before_closer_tag = $this->bookmarks[ $closer_tag ]->start;

		if ( $rewind ) {
			$this->seek( $opener_tag );
		}

		$this->release_bookmark( $opener_tag );
		$this->release_bookmark( $closer_tag );

		return array( $after_opener_tag, $before_closer_tag );
	}

	/**
	 * Returns the content between two balanced template tags.
	 *
	 * It positions the cursor in the closer tag of the balanced template tag,
	 * if it exists.
	 *
	 * @return string|null The content between the current opener template tag and its matching closer tag or null if it
	 *                     doesn't find the matching closing tag or the current tag is not a template opener tag.
	 */
	public function get_content_between_balanced_template_tags() {

		$positions = $this->get_after_opener_tag_and_before_closer_tag_positions();
		if ( ! $positions ) {
			return null;
		}
		list( $after_opener_tag, $before_closer_tag ) = $positions;

		return substr( $this->html, $after_opener_tag, $before_closer_tag - $after_opener_tag );
	}

	/**
	 * Returns the data from the table as an array.
	 *
	 * @return array<string, mixed>|\WP_Error
	 */
	public function get_data() {
		$table_headers = array();
		$table_rows    = array();
		$table_footer  = array();

		$this->next_tag( 'table' );

		if ( $this->next_tag( 'thead' ) ) {
			$this->set_bookmark( 'thead' );
			while ( $this->next_tag( 'tr' ) ) {
				while ( $this->next_tag( 'th' ) ) {
					$table_headers[] = $this->get_content_between_balanced_template_tags();
				}
			}
			// Cleaning the tree as we go.
			$this->seek( 'thead' );
		}

		if ( empty( $table_headers ) ) {
			return new \WP_Error(
				'no_table_headers',
				'No table headers found.'
			);
		}

		if ( $this->next_tag( 'tbody' ) ) {
			$this->set_bookmark( 'tbody' );
			while ( $this->next_tag( 'tr' ) ) {
				while ( $this->next_tag( 'td' ) ) {
					$table_rows[] = $this->get_content_between_balanced_template_tags();
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
				while ( $this->next_tag( 'td' ) ) {
					$table_footer[] = $this->get_content_between_balanced_template_tags();
				}
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
