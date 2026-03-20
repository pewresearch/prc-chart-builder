<?php
/**
 * PHPUnit bootstrap file for PRC Chart Builder plugin
 *
 * @package PRC\Platform\Chart_Builder
 */

// Composer autoloader — loads wp-phpunit and phpunit-polyfills.
require_once dirname( __DIR__ ) . '/vendor/autoload.php';

// Load WordPress test environment.
$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

// Forward custom PHPUnit Polyfills path if set.
$_phpunit_polyfills_path = getenv( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' );
if ( false !== $_phpunit_polyfills_path ) {
	define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', $_phpunit_polyfills_path );
}

if ( ! file_exists( "{$_tests_dir}/includes/functions.php" ) ) {
	echo "Could not find {$_tests_dir}/includes/functions.php\n";
	echo "Please run: bash bin/install-wp-tests.sh wordpress_test root '' localhost latest\n";
	exit( 1 );
}

require_once "{$_tests_dir}/includes/functions.php";

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	// Load the root platform composer autoloader so the ScreenshotOne SDK
	// and other shared vendor packages are available.
	$root_autoloader = dirname( __DIR__, 3 ) . '/client-mu-plugins/vendor/autoload.php';
	if ( file_exists( $root_autoloader ) ) {
		require_once $root_autoloader;
	}

	require dirname( __DIR__ ) . '/prc-chart-builder.php';
}

tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment.
require "{$_tests_dir}/includes/bootstrap.php";
