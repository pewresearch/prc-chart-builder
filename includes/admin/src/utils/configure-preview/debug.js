/**
 * Dev-only console helpers for the PRC-527 configure/preview pipeline.
 *
 * Attached to window.prcChartBuilderLibrary.configurePreviewDebug on the
 * Chart Library admin page so each helper can be smoke-tested in the browser
 * before (and after) the modal UI wires it up.
 */

import { createElement, createRoot } from '@wordpress/element';

import ChartPreviewPane from '../../components/chart-preview-pane';
import {
	prepareChartAttributesForPreview,
	refreshPreviewData,
	seedChartAttributes,
} from './chart-attributes';
import { csvToChartData, tableAttributesToChartData } from './chart-data';

/**
 * Mount ChartPreviewPane into the page for browser smoke testing.
 *
 * @param {Object}        chartAttributes       Seeded chart block attributes.
 * @param {Object}        [options]
 * @param {string}        [options.containerId] DOM id for the mount node.
 * @param {string|number} [options.previewKey]  Remount key passed to the pane.
 * @return {HTMLElement} The container element.
 */
function mountChartPreviewPane(chartAttributes, options = {}) {
	const { containerId = 'prc-chart-preview-debug', previewKey = Date.now() } =
		options;

	let container = document.getElementById(containerId);
	if (!container) {
		container = document.createElement('div');
		container.id = containerId;
		container.style.cssText =
			'width:640px;height:400px;border:1px solid #ddd;margin:1em';
		document.body.appendChild(container);
	}

	if (!container._prcPreviewRoot) {
		container._prcPreviewRoot = createRoot(container);
	}

	container._prcPreviewRoot.render(
		createElement(ChartPreviewPane, {
			chartAttributes: prepareChartAttributesForPreview(chartAttributes),
			previewKey,
		})
	);

	return container;
}

/**
 * Register configure-preview debug helpers on the global Chart Library object.
 */
export function registerConfigurePreviewDebug() {
	if (typeof window === 'undefined') {
		return;
	}

	window.prcChartBuilderLibrary = window.prcChartBuilderLibrary ?? {};
	window.prcChartBuilderLibrary.configurePreviewDebug = {
		...window.prcChartBuilderLibrary.configurePreviewDebug,
		csvToChartData,
		tableAttributesToChartData,
		seedChartAttributes,
		refreshPreviewData,
		prepareChartAttributesForPreview,
		mountChartPreviewPane,
	};
}
