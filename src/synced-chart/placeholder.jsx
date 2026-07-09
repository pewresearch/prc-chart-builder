/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { SyncedEntityPlaceholder } from '@prc/components';

/**
 * Internal Dependencies
 */
import ChartSearch from './chart-search';
import CreateNewChartModal from '../../includes/admin/src/components/create-new-chart-modal.jsx';

export default function Placeholder({ setAttributes, isNew, isResolving }) {
	return (
		<SyncedEntityPlaceholder
			setAttributes={setAttributes}
			isNew={isNew}
			isResolving={isResolving}
			label={__('Synced Chart', 'prc-chart-builder')}
			instructions={__(
				'Search for an existing chart or create a new one.',
				'prc-chart-builder'
			)}
			icon="chart-area"
			loadingLabel={__('Loading Chart…', 'prc-chart-builder')}
			createButtonLabel={__('Create New Chart', 'prc-chart-builder')}
			renderSearch={() => <ChartSearch setAttributes={setAttributes} />}
			renderCreateModal={(modalProps) => (
				<CreateNewChartModal {...modalProps} hideTrigger />
			)}
		/>
	);
}
