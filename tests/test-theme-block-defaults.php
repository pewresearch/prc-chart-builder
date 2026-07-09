<?php
/**
 * Chart theme block default injection tests (PRC-528 slice 4: server parity).
 *
 * @package PRC\Platform\Chart_Builder
 */

declare(strict_types=1);

use PRC\Platform\Chart_Builder\Settings;
use PRC\Platform\Chart_Builder\Theme_Block_Defaults;

/**
 * register_block_type_args filter — theme.config.layout into chart defaults.
 */
class Test_Theme_Block_Defaults extends WP_UnitTestCase {

	private const BLOCK_LAYOUT_DEFAULT = array(
		'type'    => 'bar',
		'width'   => 640,
		'height'  => 400,
		'padding' => array(
			'top'    => 20,
			'bottom' => 25,
			'left'   => 60,
			'right'  => 0,
		),
	);

	public function tear_down(): void {
		delete_option( Settings::OPTION_KEY );
		parent::tear_down();
	}

	/**
	 * @return array<string, mixed>
	 */
	private function chart_block_args(): array {
		return array(
			'attributes' => array(
				'layout' => array(
					'type'    => 'object',
					'default' => self::BLOCK_LAYOUT_DEFAULT,
				),
			),
		);
	}

	public function test_apply_theme_layout_default_deep_merges_theme_over_block_json(): void {
		$merged = Theme_Block_Defaults::apply_theme_layout_default(
			self::BLOCK_LAYOUT_DEFAULT,
			array(
				'padding' => array( 'top' => 40 ),
				'width'   => 720,
			)
		);

		$this->assertSame( 720, $merged['width'] );
		$this->assertSame( 40, $merged['padding']['top'] );
		$this->assertSame( 25, $merged['padding']['bottom'] );
		$this->assertSame( 'bar', $merged['type'] );
	}

	public function test_apply_theme_layout_default_returns_block_default_when_theme_absent(): void {
		$this->assertSame(
			self::BLOCK_LAYOUT_DEFAULT,
			Theme_Block_Defaults::apply_theme_layout_default(
				self::BLOCK_LAYOUT_DEFAULT,
				null
			)
		);
	}

	public function test_filter_leaves_non_chart_blocks_unchanged(): void {
		$args = array( 'attributes' => array() );

		$this->assertSame(
			$args,
			Theme_Block_Defaults::filter_register_block_type_args(
				$args,
				'core/paragraph'
			)
		);
	}

	public function test_filter_leaves_chart_block_unchanged_when_theme_unset(): void {
		$args = $this->chart_block_args();

		$this->assertSame(
			$args,
			Theme_Block_Defaults::filter_register_block_type_args(
				$args,
				Theme_Block_Defaults::CHART_BLOCK_NAME
			)
		);
	}

	public function test_filter_injects_theme_layout_into_chart_block_args(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config' => array(
					'layout' => array(
						'padding' => array( 'top' => 40 ),
						'width'   => 800,
					),
				),
			)
		);

		$result = Theme_Block_Defaults::filter_register_block_type_args(
			$this->chart_block_args(),
			Theme_Block_Defaults::CHART_BLOCK_NAME
		);

		$this->assertSame( 800, $result['attributes']['layout']['default']['width'] );
		$this->assertSame( 40, $result['attributes']['layout']['default']['padding']['top'] );
		$this->assertSame( 60, $result['attributes']['layout']['default']['padding']['left'] );
	}

	public function test_filter_injects_theme_legend_font_family(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config' => array(
					'legend' => array(
						'fontFamily' => 'Georgia, serif',
						'fontSize'   => 14,
					),
				),
			)
		);

		$args = array(
			'attributes' => array(
				'legend' => array(
					'type'    => 'object',
					'default' => array(
						'active'     => false,
						'fontSize'   => 12,
						'fontFamily' => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
					),
				),
			),
		);

		$result = Theme_Block_Defaults::filter_register_block_type_args(
			$args,
			Theme_Block_Defaults::CHART_BLOCK_NAME
		);

		$this->assertSame(
			'Georgia, serif',
			$result['attributes']['legend']['default']['fontFamily']
		);
		$this->assertSame( 14, $result['attributes']['legend']['default']['fontSize'] );
	}

	public function test_curated_groups_match_editor_list(): void {
		$this->assertContains( 'legend', Theme_Block_Defaults::CURATED_THEME_CONFIG_GROUPS );
		$this->assertNotContains( 'io', Theme_Block_Defaults::CURATED_THEME_CONFIG_GROUPS );
		$this->assertNotContains( 'dataRender', Theme_Block_Defaults::CURATED_THEME_CONFIG_GROUPS );
	}

	public function test_registered_chart_block_reflects_active_theme_layout(): void {
		update_option(
			Settings::OPTION_KEY,
			array(
				'config' => array(
					'layout' => array(
						'mobileBreakpoint' => 600,
					),
				),
			)
		);

		$registry   = WP_Block_Type_Registry::get_instance();
		$block_name = Theme_Block_Defaults::CHART_BLOCK_NAME;

		if ( $registry->is_registered( $block_name ) ) {
			$registry->unregister( $block_name );
		}

		$metadata_dir = PRC_CHART_BUILDER_DIR . '/build/chart';
		if ( ! file_exists( $metadata_dir . '/block.json' ) ) {
			$metadata_dir = PRC_CHART_BUILDER_DIR . '/src/chart';
		}

		register_block_type_from_metadata(
			$metadata_dir,
			array(
				'render_callback' => '__return_empty_string',
			)
		);

		$block_type = $registry->get_registered( $block_name );

		$this->assertNotNull( $block_type );
		$this->assertSame(
			600,
			$block_type->attributes['layout']['default']['mobileBreakpoint'] ?? null
		);
	}
}
