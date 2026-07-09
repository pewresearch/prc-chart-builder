/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { Warning } from '@wordpress/block-editor';
import { SyncedEntityEdit } from '@prc/components';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import Placeholder from './placeholder';
import { DEFAULT_CHART_WIDTH, findChartWidth } from './flatten';

const CHART_PRESENCE_MESSAGES = {
	/* translators: %s: display name of the user currently editing the chart */
	singular: __('%s is currently editing this chart.', 'prc-chart-builder'),
	/* translators: 1: comma-separated list of names, 2: last name in the list */
	plural: __(
		'%1$s and %2$s are currently editing this chart.',
		'prc-chart-builder'
	),
};

export default function SyncedChartEdit(props) {
	return (
		<SyncedEntityEdit
			{...props}
			postType="chart"
			presenceMessages={CHART_PRESENCE_MESSAGES}
			presenceNoticeClassName="synced-chart-presence__notice"
			resolveEffectiveRef={(base) =>
				base?.meta?._prc_active_fork || undefined
			}
			getShrinkWrapWidth={(blocks) =>
				findChartWidth(blocks) || DEFAULT_CHART_WIDTH
			}
			renderNotices={({ isForkActive }) =>
				isForkActive ? (
					<Notice status="warning" isDismissible={false}>
						{__('Editing future revision', 'prc-chart-builder')}
					</Notice>
				) : null
			}
			renderBeforePreview={({ canEdit }) =>
				canEdit === false ? (
					<Warning>
						{__(
							'You do not have permission to edit this chart.',
							'prc-chart-builder'
						)}
					</Warning>
				) : null
			}
			labels={{
				recursionWarning: __(
					'Chart cannot be rendered inside itself.',
					'prc-chart-builder'
				),
				deletedWarning: __(
					'Chart has been deleted or is unavailable.',
					'prc-chart-builder'
				),
				emptyLabel: __('Empty Chart', 'prc-chart-builder'),
			}}
			Controls={Controls}
			Placeholder={Placeholder}
		/>
	);
}
