<?php
/**
 * @wordpress-plugin
 * Plugin Name:       PRC Chart Builder
 * Plugin URI:        https://github.com/pewresearch/prc-religious-landscape-study
 * Description:       Chart Builder is a chart building tool for the PRC Platform. It allows you to create rich, highly interactive charts and data visualizations all from the block editor. Support for synced charts via the Synced Chart block is also possible, allowing you to place one chart in many places and have them all update when the original is updated.
 * Version:           3.0.0
 * Author:            Pew Research Center
 * Author URI:        https://pewresearch.org
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       prc-rls
 * Requires at least: 6.7
 * Requires PHP:      8.2
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}
define( 'PRC_CHART_BUILDER_VERSION', '3.0.0' );
define( 'PRC_CHART_BUILDER_DIR', __DIR__ );
define( 'PRC_CHART_BUILDER_DIR_MANIFEST_FILE', __DIR__ . '/build/block-manifest.php' );
define( 'PRC_CHART_BUILDER_NAMESPACE', 'prc-chart-builder' );

/**
 * The core plugin class that is used to define the hooks that initialize the various plugin components.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-plugin.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle and is therefore more performant.
 *
 * @since    3.0.0
 */
function run_prc_platform_chart_builder() {
	$plugin = new \PRC\Platform\Chart_Builder\Bootstrap();
	$plugin->run();
}
run_prc_platform_chart_builder();
