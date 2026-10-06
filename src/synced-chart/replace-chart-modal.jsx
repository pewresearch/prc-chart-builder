/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import ChartSearch from './chart-search';

export default function ReplaceChartModal({
	chartRef,
	setAttributes,
	onClose,
}) {
	return (
		<Modal
			title={__('Replace chart', 'prc-chart-builder')}
			onRequestClose={onClose}
			size="medium"
		>
			<ChartSearch
				setAttributes={setAttributes}
				entityId={chartRef}
				onSelect={onClose}
			/>
		</Modal>
	);
}
