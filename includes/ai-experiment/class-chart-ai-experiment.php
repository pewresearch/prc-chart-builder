<?php
/**
 * Chart AI Experiment.
 *
 * Registers the Chart AI Create experiment with the WordPress AI Experiments
 * plugin. When enabled, this experiment registers the prc-chart-builder/generate
 * ability, exposes a REST endpoint for the gallery admin, and signals the React
 * modal to show the "Chart Wizard (Experimental)" tab.
 *
 * @package PRC\Platform\Chart_Builder
 */

namespace PRC\Platform\Chart_Builder;

use WordPress\AI\Abstracts\Abstract_Feature;
use WordPress\AI\Experiments\Experiment_Category;

// If this file is called directly, abort.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Chart AI Experiment class.
 *
 * @since 1.0.0
 */
class Chart_AI_Experiment extends Abstract_Feature {

	/**
	 * Feature identifier.
	 *
	 * @since 1.0.0
	 */
	public static function get_id(): string {
		return 'chart-ai-create';
	}

	/**
	 * Loads feature metadata.
	 *
	 * @since 1.0.0
	 *
	 * @return array{label: string, description: string, category: string} Feature metadata.
	 */
	protected function load_metadata(): array {
		return array(
			'label'       => __( 'Chart AI Create', 'prc-chart-builder' ),
			'description' => __( 'Uses Gemini 2.5 Flash to generate chart block markup from an image, CSV data, and/or a text description. Adds a "Chart Wizard (Experimental)" option to the Add New Chart modal in the Chart Library admin.', 'prc-chart-builder' ),
			'category'    => Experiment_Category::ADMIN,
		);
	}

	/**
	 * Registers the experiment's hooks and functionality.
	 *
	 * This method is only called when the experiment is enabled.
	 *
	 * @since 1.0.0
	 */
	public function register(): void {
		// Register the AI ability with the WordPress Abilities API.
		$ability = new Chart_AI_Ability();
		add_action( 'wp_abilities_api_init', array( $ability, 'register_ability' ) );

		// Register the REST endpoint that the admin gallery calls directly.
		// We use a separate REST endpoint (not the Abilities API JS client) because
		// the gallery admin page is not inside the block editor context.
		add_action( 'rest_api_init', array( $ability, 'register_rest_route' ) );

		// Localize the experiment enabled state into editor scripts that host
		// the create-chart modal (controller / synced-chart placeholders).
		add_action( 'admin_enqueue_scripts', array( $this, 'localize_experiment_data' ), 20 );
	}

	/**
	 * Adds aiEnabled flag for create-chart modal consumers.
	 *
	 * @hook admin_enqueue_scripts, priority 20
	 * @since 1.0.0
	 */
	public function localize_experiment_data(): void {
		$handles = array(
			'prc-chart-builder-controller-editor-script',
			'prc-chart-builder-synced-chart-editor-script',
		);

		// Editor bundles are registered on init but enqueued later on
		// enqueue_block_editor_assets. Attach while registered (same pattern as
		// theme delivery) so aiEnabled is present when the modal loads.
		foreach ( $handles as $handle ) {
			if ( ! wp_script_is( $handle, 'registered' ) ) {
				continue;
			}

			wp_add_inline_script(
				$handle,
				'window.prcChartBuilderLibrary = window.prcChartBuilderLibrary || {}; window.prcChartBuilderLibrary.aiEnabled = true;',
				'before'
			);
		}
	}
}
