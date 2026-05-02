<?php
/**
 * PRC Chart Builder
 *
 * @wordpress-plugin
 * Plugin Name:       PRC Chart Builder
 * Plugin URI:        https://github.com/pewresearch/prc-chart-builder
 * Description:       Chart Builder is a chart building tool for the PRC Platform. It allows you to create rich, highly interactive charts and data visualizations all from the block editor. Support for synced charts via the Synced Chart block is also possible, allowing you to place one chart in many places and have them all update when the original is updated.
 * Version:           3.8.1
 * Author:            Pew Research Center
 * Author URI:        https://pewresearch.org
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       prc-chart-builder
 * Requires at least: 6.7
 * Requires PHP:      8.2
 * Requires Plugins:  prc-scripts, prc-block-library, prc-post-publish-pipeline
 * @package           prc-chart-builder
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}
// Load the Jetpack Autoloader so runtime version-selection can pick the
// highest version across all plugins that ship the same library dep
// (see .cursor/plans/composer-shape-b-migration_0e4e9991.plan.md).
$prc_chart_builder_autoloader = __DIR__ . '/vendor/autoload_packages.php';
if ( file_exists( $prc_chart_builder_autoloader ) ) {
	require_once $prc_chart_builder_autoloader;
}
unset( $prc_chart_builder_autoloader );

define( 'PRC_CHART_BUILDER_VERSION', '3.8.0' );
define( 'PRC_CHART_BUILDER_DIR', __DIR__ );
define( 'PRC_CHART_BUILDER_DIR_MANIFEST_FILE', __DIR__ . '/build/block-manifest.php' );
define( 'PRC_CHART_BUILDER_NAMESPACE', 'prc-chart-builder' );

/**
 * The core plugin class that is used to define the hooks that initialize the various plugin components.
 */
require plugin_dir_path( __FILE__ ) . 'includes/class-plugin-bootstrap.php';

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
	$plugin = new \PRC\Platform\Chart_Builder\Plugin_Bootstrap();
	$plugin->run();
}
run_prc_platform_chart_builder();
