<?php
/**
 * Theme admin page registration (PRC-528 slice 11).
 *
 * @package PRC\Platform\Chart_Builder
 */

use PRC\Platform\Chart_Builder\Theme_Admin;

/**
 * Charts > Chart Theme admin page.
 */
class Test_Theme_Admin extends WP_UnitTestCase {

	/**
	 * Admin user.
	 *
	 * @var int
	 */
	private int $admin_id;

	/**
	 * Editor without edit_theme_options.
	 *
	 * @var int
	 */
	private int $editor_id;

	/**
	 * Set up users and register hooks.
	 */
	public function set_up(): void {
		parent::set_up();

		$this->admin_id = self::factory()->user->create(
			array(
				'role' => 'administrator',
			)
		);

		$this->editor_id = self::factory()->user->create(
			array(
				'role' => 'editor',
			)
		);

		new Theme_Admin( new Loader() );
		do_action( 'admin_menu' );
	}

	/**
	 * Chart Theme submenu is registered under Charts.
	 */
	public function test_submenu_registered_for_edit_theme_options(): void {
		global $submenu;

		$this->assertArrayHasKey( 'edit.php?post_type=chart', $submenu );

		$entries = wp_list_pluck( $submenu['edit.php?post_type=chart'], 2 );
		$this->assertContains( Theme_Admin::ADMIN_PAGE_SLUG, $entries );

		$theme_entry = null;
		foreach ( $submenu['edit.php?post_type=chart'] as $item ) {
			if ( Theme_Admin::ADMIN_PAGE_SLUG === $item[2] ) {
				$theme_entry = $item;
				break;
			}
		}

		$this->assertNotNull( $theme_entry );
		$this->assertSame( 'edit_theme_options', $theme_entry[1] );
	}

	/**
	 * Administrators can render the page container.
	 */
	public function test_admin_can_render_page(): void {
		wp_set_current_user( $this->admin_id );

		$this->expectOutputRegex(
			'/<div id="prc-chart-builder-theme-settings-admin"><\/div>/'
		);

		$admin = new Theme_Admin( new Loader() );
		$admin->render_admin_page();
	}

	/**
	 * Editors cannot render the page (direct navigation guard).
	 */
	public function test_editor_cannot_render_page(): void {
		wp_set_current_user( $this->editor_id );

		$this->expectException( 'WPDieException' );

		$admin = new Theme_Admin( new Loader() );
		$admin->render_admin_page();
	}

	/**
	 * Resolves nested theme.json font-family CSS vars to concrete stacks.
	 */
	public function test_resolve_theme_font_family_stack_replaces_preset_var(): void {
		$slug_to_stack = array(
			'serif'   => "'abril-text', var(--wp--preset--font-family--georgia)",
			'georgia' => "Georgia, 'Times New Roman', Times, serif",
		);

		$result = Theme_Admin::resolve_theme_font_family_stack(
			"'abril-text', var(--wp--preset--font-family--georgia)",
			$slug_to_stack
		);

		$this->assertSame(
			"'abril-text', Georgia, 'Times New Roman', Times, serif",
			$result
		);
	}

	/**
	 * Font families delivered to the settings app are var-free and slug-keyed.
	 */
	public function test_get_theme_font_families_resolves_vars(): void {
		add_filter(
			'wp_theme_json_data_theme',
			static function ( $theme_json ) {
				return $theme_json->update_with(
					array(
						'version'  => 3,
						'settings' => array(
							'typography' => array(
								'fontFamilies' => array(
									array(
										'fontFamily' => "'franklin-gothic-urw', Verdana, Geneva, sans-serif",
										'name'       => 'Sans-Serif',
										'slug'       => 'sans-serif',
									),
									array(
										'fontFamily' => "'abril-text', var(--wp--preset--font-family--georgia)",
										'name'       => 'Serif',
										'slug'       => 'serif',
									),
									array(
										'fontFamily' => "Georgia, 'Times New Roman', Times, serif",
										'name'       => 'Georgia',
										'slug'       => 'georgia',
									),
								),
							),
						),
					)
				);
			}
		);

		$families = Theme_Admin::get_theme_font_families();

		$this->assertNotEmpty( $families );

		$by_slug = array();
		foreach ( $families as $family ) {
			$by_slug[ $family['slug'] ] = $family;
		}

		$this->assertArrayHasKey( 'serif', $by_slug );
		$this->assertStringNotContainsString( 'var(--wp--preset--font-family--', $by_slug['serif']['value'] );
		$this->assertSame(
			"'abril-text', Georgia, 'Times New Roman', Times, serif",
			$by_slug['serif']['value']
		);
	}
}
