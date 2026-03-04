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

use WordPress\AI\Abstracts\Abstract_Experiment;

// If this file is called directly, abort.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Chart AI Experiment class.
 *
 * @since 1.0.0
 */
class Chart_AI_Experiment extends Abstract_Experiment {

	/**
	 * Loads experiment metadata.
	 *
	 * @since 1.0.0
	 *
	 * @return array{id: string, label: string, description: string} Experiment metadata.
	 */
	protected function load_experiment_metadata(): array {
		return array(
			'id'          => 'chart-ai-create',
			'label'       => __( 'Chart AI Create', 'prc-chart-builder' ),
			'description' => __( 'Uses Gemini 2.5 Flash to generate chart block markup from an image, CSV data, and/or a text description. Adds a "Chart Wizard (Experimental)" option to the Add New Chart modal in the Chart Library admin.', 'prc-chart-builder' ),
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

		// Localize the experiment enabled state into the gallery admin script.
		add_action( 'admin_enqueue_scripts', array( $this, 'localize_experiment_data' ), 20 );
	}

	/**
	 * Adds aiEnabled flag to the gallery admin's localized script data.
	 *
	 * The gallery script is already enqueued and localized by Admin::enqueue_assets().
	 * We add a second wp_localize_script call — WordPress merges multiple calls for
	 * the same handle/object name when the second call uses the same object key.
	 *
	 * @hook admin_enqueue_scripts, priority 20
	 * @since 1.0.0
	 */
	public function localize_experiment_data(): void {
		if ( ! isset( $_GET['page'] ) || 'prc-chart-builder-library' !== $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$handle = 'prc-chart-builder-library';

		if ( ! wp_script_is( $handle, 'enqueued' ) ) {
			return;
		}

		// wp_add_inline_script is the safest way to append data after the initial
		// localization without risking object key collisions.
		wp_add_inline_script(
			$handle,
			'window.prcChartBuilderLibrary = window.prcChartBuilderLibrary || {}; window.prcChartBuilderLibrary.aiEnabled = true;',
			'before'
		);
	}
}
