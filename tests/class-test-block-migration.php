<?php
/**
 * Test script for block migration functionality
 *
 * This script can be run to test the block migration without affecting the database.
 * It creates test content and verifies the migration logic works correctly.
 *
 * @package    PRC_CHART_BUILDER
 * @subpackage PRC_CHART_BUILDER/tests
 * @since      3.0.1
 */

// Prevent direct access (but allow CLI execution).
if ( ! defined( 'WPINC' ) && php_sapi_name() !== 'cli' ) {
	die;
}

/**
 * Test Block Migration
 *
 * @since 3.0.1
 */
class Test_Block_Migration {

	/**
	 * Test content with old block names
	 *
	 * @var array
	 */
	private $test_content = array(
		'prc-block/chart' => '<!-- wp:prc-block/chart {"id":"test-chart"} -->
<div class="wp-block-prc-block-chart">Test Chart</div>
<!-- /wp:prc-block/chart -->',

		'prc-block/chart-builder-controller' => '<!-- wp:prc-block/chart-builder-controller {"id":"test-controller"} -->
<div class="wp-block-prc-block-chart-builder-controller">Test Controller</div>
<!-- /wp:prc-block/chart-builder-controller -->',

		'prc-block/chart-builder' => '<!-- wp:prc-block/chart-builder {"chartType":"bar"} -->
<div class="wp-block-prc-block-chart-builder">Test Chart Builder</div>
<!-- /wp:prc-block/chart-builder -->',
	);

	/**
	 * Expected content after migration
	 *
	 * @var array
	 */
	private $expected_content = array(
		'prc-block/chart' => '<!-- wp:prc-chart-builder/synced-chart {"id":"test-chart"} -->
<div class="wp-block-prc-block-chart">Test Chart</div>
<!-- /wp:prc-chart-builder/synced-chart -->',

		'prc-block/chart-builder-controller' => '<!-- wp:prc-chart-builder/controller {"id":"test-controller"} -->
<div class="wp-block-prc-block-chart-builder-controller">Test Controller</div>
<!-- /wp:prc-chart-builder/controller -->',

		'prc-block/chart-builder' => '<!-- wp:prc-chart-builder/chart {"chartType":"bar"} -->
<div class="wp-block-prc-block-chart-builder">Test Chart Builder</div>
<!-- /wp:prc-chart-builder/chart -->',
	);

	/**
	 * Run the migration tests
	 *
	 * @since 3.0.1
	 */
	public function run_tests() {
		echo "Running PRC Chart Builder Block Migration Tests...\n\n";

		$all_passed = true;

		foreach ( $this->test_content as $old_block => $content ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CLI output, not web output.
			echo "Testing migration of: {$old_block}\n";

			$migrated_content = $this->update_block_names_in_content( $content );
			$expected = $this->expected_content[ $old_block ];

			if ( $migrated_content === $expected ) {
				echo "  ✓ PASSED\n";
			} else {
				echo "  ✗ FAILED\n";
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CLI output, not web output.
				echo "  Expected:\n{$expected}\n";
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CLI output, not web output.
				echo "  Got:\n{$migrated_content}\n";
				$all_passed = false;
			}
			echo "\n";
		}

		// Test complex content with multiple blocks.
		echo "Testing complex content with multiple blocks...\n";
		$complex_content = implode( "\n\n", $this->test_content );
		$migrated_complex = $this->update_block_names_in_content( $complex_content );

		$expected_complex = implode( "\n\n", $this->expected_content );

		if ( $migrated_complex === $expected_complex ) {
			echo "  ✓ PASSED\n";
		} else {
			echo "  ✗ FAILED\n";
			$all_passed = false;
		}

		echo "\n";
		echo $all_passed ? "All tests PASSED! ✓\n" : "Some tests FAILED! ✗\n";

		return $all_passed;
	}

	/**
	 * Update block names in content (copied from migration class for testing)
	 *
	 * @since 3.0.1
	 * @param string $content The content to update.
	 * @return string Updated content.
	 */
	private function update_block_names_in_content( $content ) {
		$block_mappings = array(
			'prc-block/chart'                    => 'prc-chart-builder/synced-chart',
			'prc-block/chart-builder-controller' => 'prc-chart-builder/controller',
			'prc-block/chart-builder'            => 'prc-chart-builder/chart',
		);

		$updated_content = $content;

		foreach ( $block_mappings as $old_name => $new_name ) {
			// Update block names in various formats.
			$patterns = array(
				// Standard block format: <!-- wp:block-name -->.
				'/(<!--\s*wp:)' . preg_quote( $old_name, '/' ) . '(\s*-->)/',
				// Block with attributes: <!-- wp:block-name {"attr":"value"} -->.
				'/(<!--\s*wp:)' . preg_quote( $old_name, '/' ) . '(\s+\{.*?\}\s*-->)/',
				// Closing block: <!-- /wp:block-name -->.
				'/(<!--\s*\/wp:)' . preg_quote( $old_name, '/' ) . '(\s*-->)/',
			);

			foreach ( $patterns as $pattern ) {
				$updated_content = preg_replace( $pattern, '$1' . $new_name . '$2', $updated_content );
			}
		}

		return $updated_content;
	}
}

// Run tests if this file is executed directly.
if ( php_sapi_name() === 'cli' ) {
	$test = new Test_Block_Migration();
	$test->run_tests();
}
