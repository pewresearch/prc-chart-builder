/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { SyncedEntityPlaceholder } from '@prc/components';

/**
 * Internal Dependencies
 */
import ChartSearch from './chart-search';

const NEW_CHART_URL =
	window?.prcChartBuilderLibrary?.newChartUrl ||
	'post-new.php?post_type=chart';

/**
 * Synced Chart empty-state: search existing charts, or open post-new in a new
 * tab. The compact CreateNewChartModal wizard is intentionally unused here for
 * now — keep that component around in case we reactivate this flow or remove
 * it later after the controller/library paths settle.
 */
export default function Placeholder({ setAttributes, isNew, isResolving }) {
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
							href={NEW_CHART_URL}
							target="_blank"
							rel="noopener noreferrer"
						>
							{__('Create New Chart', 'prc-chart-builder')}
						</Button>
					</div>
				</>
			)}
		/>
	);
}
