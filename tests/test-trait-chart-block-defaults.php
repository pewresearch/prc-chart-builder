<?php
/**
 * Chart block defaults trait tests (PRC-528 slice 6: de-Pew-ify + theme parity).
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Chart_Block_Defaults;
use PRC\Platform\Chart_Builder\Settings;

/**
 * Exposes private trait helpers for PHPUnit.
 */
class Chart_Block_Defaults_Test_Harness {
	use Chart_Block_Defaults;

	/**
	 * @return array<string, mixed>
	 */
	public function get_defaults(): array {
		return $this->get_chart_block_defaults();
	}

	/**
	 * @param string $chart_type Chart type slug.
	 * @return array<string, mixed>
	 */
	public function get_variation( string $chart_type ): array {
		return $this->get_variation_template_defaults( $chart_type );
	}

	/**
	 * @param string $chart_type Chart type slug.
	 * @return array<string, mixed>
	 */
	public function build_defaults_for_type( string $chart_type ): array {
		return $this->deep_merge(
			$this->get_chart_block_defaults(),
			$this->get_variation_template_defaults( $chart_type )
		);
	}
}

/**
 * AI / PCH import default pipeline — active theme, no Pew override in variation layer.
 */
class Test_Trait_Chart_Block_Defaults extends WP_UnitTestCase {

	private Chart_Block_Defaults_Test_Harness $harness;

	public function set_up(): void {
		parent::set_up();
		$this->harness = new Chart_Block_Defaults_Test_Harness();
	}

	public function tear_down(): void {
		delete_option( Settings::OPTION_KEY );
		parent::tear_down();
	}

	public function test_variation_templates_do_not_hardcode_metadata_tag(): void {
		foreach ( array( 'bar', 'column', 'line', 'sankey', 'unknown-type' ) as $chart_type ) {
			$variation = $this->harness->get_variation( $chart_type );
			$this->assertArrayNotHasKey(
				'tag',
				$variation['metadata'] ?? array(),
				"Variation {$chart_type} must not override metadata.tag"
			);
		}
	}

	public function test_themed_metadata_tag_flows_into_merged_defaults(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config' => array(
					'metadata' => array(
						'tag' => 'CUSTOM INSTITUTION',
					),
				),
			)
		);

		$merged = $this->harness->build_defaults_for_type( 'bar' );

		$this->assertSame( 'CUSTOM INSTITUTION', $merged['metadata']['tag'] );
	}

	public function test_themed_layout_merges_before_variation_width_override(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config' => array(
					'layout' => array(
						'padding' => array( 'top' => 40 ),
						'width'   => 720,
					),
				),
			)
		);

		$merged = $this->harness->build_defaults_for_type( 'bar' );

		$this->assertSame( 40, $merged['layout']['padding']['top'] );
		// Variation template width wins over theme (chart-type opinionated default).
		$this->assertSame( 420, $merged['layout']['width'] );
	}

	public function test_themed_legend_font_family_flows_into_defaults(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config' => array(
					'legend' => array(
						'fontFamily' => 'Georgia, serif',
					),
				),
			)
		);

		$defaults = $this->harness->get_defaults();

		$this->assertSame( 'Georgia, serif', $defaults['legend']['fontFamily'] );
	}
}
