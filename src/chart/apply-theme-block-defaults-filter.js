/**
 * Register the chart theme default-injection filter before block registration.
 */
import { addFilter } from '@wordpress/hooks';
import { applyThemeBlockDefaults } from './utils/apply-theme-block-defaults';

addFilter(
	'blocks.registerBlockType',
	'prc-chart-builder/apply-theme-block-defaults',
	applyThemeBlockDefaults
);
