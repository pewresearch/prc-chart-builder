<?php
/**
 * Shared Chart Library localization helpers for editor and wizard consumers.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

/**
 * Class Admin
 *
 * Owns `prcChartBuilderLibrary` boot data for block editor and creation
 * wizard consumers. The Charts list screen lives on the shared
 * `prc-wp-admin-dataview` shell via Chart_List.
 */
class Admin {
	/**
	 * DataViews admin page slug (Charts → All Charts). Kept for URL stability
	 * and callers that still reference the constant.
	 *
	 * @var string
	 */
	public const ADMIN_PAGE_SLUG = 'prc-chart-builder-library';

	/**
	 * Chart CPT slug.
	 *
	 * @var string
	 */
	private const POST_TYPE = 'chart';

	/**
	 * Constructor.
	 *
	 * @param Loader $loader The loader.
	 */
	public function __construct( $loader ) {
		unset( $loader );
	}

	/**
	 * Shared localization payload for Chart Library and block editor consumers.
	 *
	 * @return array
	 */
	public static function get_library_localized_data() {
		$plugin_root = dirname( dirname( dirname( __FILE__ ) ) );
		$variation_images_url = plugins_url(
			'assets/variation-images/',
			$plugin_root . '/prc-chart-builder.php'
		);

		return array(
			'nonce'              => wp_create_nonce( 'wp_rest' ),
			'restUrl'            => esc_url_raw( rest_url() ),
			'chartTypeTerms'     => self::get_chart_type_terms(),
			'variationImagesUrl' => esc_url( $variation_images_url ),
			'newChartUrl'        => esc_url( admin_url( 'post-new.php?post_type=' . self::POST_TYPE ) ),
			// Nested object so the boolean survives wp_localize_script, which
			// stringifies top-level scalars (`true` → `"1"`).
			'newChartCreationUi' => array(
				'enabled' => Creation_UI_Settings::is_enabled(),
			),
		);
	}

	/**
	 * Build the chart type list for the React app directly from the canonical
	 * $known_chart_types map — no database query needed.
	 *
	 * @return array Array of {slug, label} objects, sorted alphabetically by label.
	 */
	public static function get_chart_type_terms() {
		$types = array();
		foreach ( Content_Type::$known_chart_types as $slug => $label ) {
			$types[] = array(
				'slug'  => $slug,
				'label' => $label,
			);
		}
		usort(
			$types,
			static function ( $a, $b ) {
				return strcmp( $a['label'], $b['label'] );
			}
		);
		return $types;
	}
}
