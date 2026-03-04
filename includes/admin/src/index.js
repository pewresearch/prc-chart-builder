/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import ChartLibrary from './chart-library';
import './style.scss';

/**
 * Register core blocks before React renders.
 *
 * wp-block-library is enqueued by class-admin.php and ships registerCoreBlocks(),
 * but unlike the block editor or site editor, it does NOT auto-call the function
 * on a plain admin page. We call it here explicitly so that parse() and
 * BlockPreview can handle core block markup (paragraph, table, etc.) inside
 * saved chart patterns. Custom block scripts are enqueued separately via
 * the PHP block registry loop in class-admin.php — those self-register on load.
 */
registerCoreBlocks();

const adminRoot = document.getElementById('prc-chart-dataviews-admin');
if (adminRoot) {
	createRoot(adminRoot).render(<ChartLibrary />);
}
