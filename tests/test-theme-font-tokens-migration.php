<?php
/**
 * Chart fontFamily token migration tests (PRC-528 font tokens).
 *
 * @package PRC\Platform\Chart_Builder
 */

use PRC\Platform\Chart_Builder\Theme_Admin;
use PRC\Platform\Chart_Builder\Theme_Font_Tokens_Migration;

/**
 * Font token audit/migrate utilities.
 */
class Test_Theme_Font_Tokens_Migration extends WP_UnitTestCase {

	/**
	 * Replaces a literal stack with a preset token in chart block attrs.
	 */
	public function test_migrate_content_font_families_replaces_known_literal(): void {
		$literal = "'franklin-gothic-urw', Verdana, Geneva, sans-serif";
		$token   = Theme_Admin::TOKEN_PREFIX . 'sans-serif';

		$content = '<!-- wp:prc-chart-builder/chart {"legend":{"fontFamily":"'
			. addslashes( $literal )
			. '"},"_version":"v2"} /-->';

		$replacements = 0;
		$updated      = Theme_Font_Tokens_Migration::migrate_content_font_families(
			$content,
			array( $literal => $token ),
			$replacements
		);

		$this->assertSame( 1, $replacements );
		$this->assertStringContainsString( $token, $updated );
		$this->assertStringNotContainsString( $literal, $updated );
	}

	/**
	 * Leaves custom literals untouched when they are not in the map.
	 */
	public function test_migrate_content_font_families_passthrough_custom_literal(): void {
		$custom  = 'Comic Sans MS, cursive';
		$content = '<!-- wp:prc-chart-builder/chart {"legend":{"fontFamily":"'
			. addslashes( $custom )
			. '"},"_version":"v2"} /-->';

		$replacements = 0;
		$updated      = Theme_Font_Tokens_Migration::migrate_content_font_families(
			$content,
			array( "'franklin-gothic-urw', Verdana, Geneva, sans-serif" => Theme_Admin::TOKEN_PREFIX . 'sans-serif' ),
			$replacements
		);

		$this->assertSame( 0, $replacements );
		$this->assertSame( $content, $updated );
	}

	/**
	 * Leaves RichText unicode escapes intact when only fontFamily changes.
	 */
	public function test_migrate_content_font_families_preserves_richtext_metadata(): void {
		$literal = "'franklin-gothic-urw', Verdana, Geneva, sans-serif";
		$token   = Theme_Admin::TOKEN_PREFIX . 'sans-serif';
		$subtitle = '% of u003cstrongu003eall adultsu003c/strongu003e in each country';

		$content = '<!-- wp:prc-chart-builder/chart {"metadata":{"subtitle":"'
			. $subtitle
			. '"},"legend":{"fontFamily":"'
			. addslashes( $literal )
			. '"},"_version":"v2"} /-->';

		$replacements = 0;
		$updated      = Theme_Font_Tokens_Migration::migrate_content_font_families(
			$content,
			array( $literal => $token ),
			$replacements
		);

		$this->assertSame( 1, $replacements );
		$this->assertStringContainsString( $token, $updated );
		$this->assertStringContainsString( $subtitle, $updated );
	}

	/**
	 * Collects nested fontFamily values from chart attributes.
	 */
	public function test_collect_font_family_values_from_content(): void {
		$content = '<!-- wp:prc-chart-builder/chart {"legend":{"fontFamily":"Georgia, serif"},"tooltip":{"style":{"fontFamily":"Arial"}},"_version":"v2"} /-->';

		$values = Theme_Font_Tokens_Migration::collect_font_family_values_from_content( $content );

		$this->assertSame(
			array(
				'Georgia, serif' => 1,
				'Arial'          => 1,
			),
			$values
		);
	}

	/**
	 * Normalizes batch CLI args with defaults and bounds.
	 */
	public function test_normalize_batch_args_applies_defaults_and_bounds(): void {
		$config = Theme_Font_Tokens_Migration::normalize_batch_args(
			array(
				'batch_size' => 0,
				'offset'     => -5,
				'sleep'      => -1,
			)
		);

		$this->assertSame( 'chart', $config['post_type'] );
		$this->assertSame( 100, $config['batch_size'] );
		$this->assertSame( 0, $config['offset'] );
		$this->assertSame( 0, $config['sleep'] );
	}

	/**
	 * Skips saves when content would change outside fontFamily.
	 */
	public function test_content_diff_is_font_family_only_rejects_non_font_changes(): void {
		$original = '<!-- wp:prc-chart-builder/chart {"metadata":{"note":"ok"},"legend":{"fontFamily":"Georgia, serif"},"_version":"v2"} /-->';
		$updated  = '<!-- wp:prc-chart-builder/chart {"metadata":{"note":"changed"},"legend":{"fontFamily":"var:preset|font-family|serif"},"_version":"v2"} /-->';

		$this->assertFalse(
			Theme_Font_Tokens_Migration::content_diff_is_font_family_only(
				$original,
				$updated
			)
		);
	}

	/**
	 * Accepts saves when only fontFamily values differ.
	 */
	public function test_content_diff_is_font_family_only_allows_font_family_only_changes(): void {
		$original = '<!-- wp:prc-chart-builder/chart {"legend":{"fontFamily":"Georgia, serif"},"_version":"v2"} /-->';
		$updated  = '<!-- wp:prc-chart-builder/chart {"legend":{"fontFamily":"var:preset|font-family|serif"},"_version":"v2"} /-->';

		$this->assertTrue(
			Theme_Font_Tokens_Migration::content_diff_is_font_family_only(
				$original,
				$updated
			)
		);
	}

	/**
	 * REGRESSION (PRC-528): a real migrate_posts() run must NOT corrupt \uXXXX
	 * escapes elsewhere in the post. wp_update_post() unslashes post_content, so
	 * without wp_slash() the backslashes in metadata escapes are stripped
	 * (\u003c -> u003c). This test writes a post with escaped RichText, migrates
	 * a fontFamily, then re-reads the stored content from the DB and asserts the
	 * escapes survived byte-for-byte.
	 */
	public function test_migrate_posts_preserves_unicode_escapes_in_stored_content(): void {
		$literal = "'franklin-gothic-urw', Verdana, Geneva, sans-serif";
		$token   = Theme_Admin::TOKEN_PREFIX . 'sans-serif';

		// \u003c etc. are how Gutenberg serializes <, ", - in block attribute JSON.
		$note_json = '% of \u003cstrong\u003eall adults\u003c/strong\u003e in \u002d\u002d';

		$content = '<!-- wp:prc-chart-builder/chart {"metadata":{"note":"'
			. $note_json
			. '"},"legend":{"fontFamily":"'
			. addslashes( $literal )
			. '"},"_version":"v2"} /-->';

		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'post',
				'post_content' => wp_slash( $content ),
			)
		);

		$result = Theme_Font_Tokens_Migration::migrate_posts(
			array(
				'post_type'        => 'post',
				'literal_to_token' => array( $literal => $token ),
			)
		);

		$this->assertSame( 1, $result['posts_updated'] );
		$this->assertFalse( $result['aborted'] );
		$this->assertSame( 0, $result['posts_corrupted'] );

		$stored = get_post_field( 'post_content', $post_id );

		// fontFamily migrated to the token.
		$this->assertStringContainsString( $token, $stored );
		// Unicode escapes preserved with their backslashes intact.
		$this->assertStringContainsString( '\u003cstrong\u003e', $stored );
		$this->assertStringContainsString( '\u002d\u002d', $stored );
		// Corruption signature: a `u003c` NOT preceded by a backslash. Must be absent.
		$this->assertDoesNotMatchRegularExpression( '/(?<!\\\\)u003c/', $stored );
	}

	/**
	 * The pre-migration probe reports the write path as safe for well-formed
	 * content that only needs a fontFamily change.
	 */
	public function test_verify_write_path_reports_safe_for_font_only_change(): void {
		$literal = "'franklin-gothic-urw', Verdana, Geneva, sans-serif";
		$token   = Theme_Admin::TOKEN_PREFIX . 'sans-serif';

		$content = '<!-- wp:prc-chart-builder/chart {"metadata":{"note":"% of \u003cstrong\u003eall\u003c/strong\u003e"},"legend":{"fontFamily":"'
			. addslashes( $literal )
			. '"},"_version":"v2"} /-->';

		self::factory()->post->create(
			array(
				'post_type'    => 'post',
				'post_content' => wp_slash( $content ),
			)
		);

		$probe = Theme_Font_Tokens_Migration::verify_write_path(
			array(
				'post_type'        => 'post',
				'literal_to_token' => array( $literal => $token ),
			)
		);

		$this->assertTrue( $probe['safe'], $probe['reason'] );
		$this->assertSame( 1, $probe['probed'] );
	}
}
