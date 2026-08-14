/**
 * Freeform chart preview: detection helper + unavailable notice.
 */
import { __ } from '@wordpress/i18n';

/**
 * Whether chart attributes represent a freeform chart (no lean SVG preview).
 *
 * @param {Object|null|undefined} chartAttributes Chart block attributes.
 * @return {boolean} True when a freeform preview should be skipped.
 */
export function isFreeformChartPreview(chartAttributes) {
	if (!chartAttributes || typeof chartAttributes !== 'object') {
		return false;
	}

	return (
		chartAttributes.io?.isFreeformChart === true ||
		chartAttributes.layout?.type === 'freeform'
	);
}

/**
 * @return {import('react').ReactNode} Unavailable-preview notice.
 */
export default function FreeformPreviewUnavailable() {
	return (
		<div className="prc-chart-modal__preview-unavailable">
			<p className="prc-chart-modal__preview-unavailable-title">
				{__('Preview unavailable', 'prc-chart-builder')}
			</p>
			<p className="prc-chart-modal__preview-unavailable-text">
				{__(
					'Freeform charts can’t be previewed here. Continue to Style Chart to edit the canvas directly.',
					'prc-chart-builder'
				)}
			</p>
		</div>
	);
}
