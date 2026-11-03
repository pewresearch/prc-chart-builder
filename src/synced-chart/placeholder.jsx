/**
 * WordPress Dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { SyncedEntityPlaceholder } from '@prc/components';

/**
 * Internal Dependencies
 */
import ChartSearch from './chart-search';
import { createAndOpenChartDraft } from './create-chart-draft';

/**
 * Empty synced chart. Search for an existing chart, or create a draft and
 * open that draft's editor in a new tab.
 *
 * @param {Object}   props
 * @param {Function} props.setAttributes
 * @param {boolean}  props.isNew
 * @param {boolean}  props.isResolving
 */
export default function Placeholder(props) {
	const { setAttributes, isNew, isResolving } = props;
	const [status, setStatus] = useState('idle');
	const { saveEntityRecord } = useDispatch(coreStore);
	const { createSuccessNotice, createErrorNotice } =
		useDispatch(noticesStore);
	const isCreating = status === 'creating';

	function handleCreateChart() {
		if (isCreating) {
			return;
		}
		setStatus('creating');
		createAndOpenChartDraft({
			saveEntityRecord,
			setAttributes,
			notices: { createSuccessNotice, createErrorNotice },
		}).catch(() => {
			setStatus('idle');
		});
	}

	return (
		<SyncedEntityPlaceholder
			setAttributes={setAttributes}
			isNew={isNew}
			isResolving={isResolving}
			disableCreation
			label={__('Synced Chart', 'prc-chart-builder')}
			instructions={__(
				'Search for an existing chart or create a new one.',
				'prc-chart-builder'
			)}
			icon="chart-area"
			loadingLabel={__('Loading Chart…', 'prc-chart-builder')}
			createButtonLabel={__('Create New Chart', 'prc-chart-builder')}
			renderSearch={() => (
				<>
					<ChartSearch setAttributes={setAttributes} />
					<div style={{ marginTop: '1em' }}>
						<Button
							variant="primary"
							__next40pxDefaultSize
							isBusy={isCreating}
							disabled={isCreating}
							onClick={handleCreateChart}
						>
							{isCreating
								? __('Creating chart…', 'prc-chart-builder')
								: __('Create New Chart', 'prc-chart-builder')}
						</Button>
					</div>
				</>
			)}
		/>
	);
}
