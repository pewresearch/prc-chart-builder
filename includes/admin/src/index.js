/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ChartLibrary from './chart-library';
import './style.scss';
/**
 * Mount the DataViews component in the admin container.
 */
const adminRoot = document.getElementById('prc-chart-dataviews-admin');
if (adminRoot) {
	createRoot(adminRoot).render(<ChartLibrary />);
}
