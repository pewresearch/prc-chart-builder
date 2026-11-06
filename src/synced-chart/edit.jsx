/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Notice } from '@wordpress/components';
import { Warning } from '@wordpress/block-editor';
import { SyncedEntityEdit } from '@prc/components';
import { entityRecordArgs } from '@prc/functions';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import Placeholder from './placeholder';
import {
	DEFAULT_CHART_WIDTH,
	findChartWidth,
	findControllerBlock,
} from './flatten';

const CHART_PRESENCE_MESSAGES = {
	/* translators: %s: display name of the user currently editing the chart */
	singular: __('%s is currently editing this chart.', 'prc-chart-builder'),
	/* translators: 1: comma-separated list of names, 2: last name in the list */
	plural: __(
		'%1$s and %2$s are currently editing this chart.',
		'prc-chart-builder'
	),
};

/**
 * Parent chart ID when `ref` is a future-revision fork, else undefined.
 *
 * Merging a fork trashes it, so the block must store the parent chart.
 *
 * @param {number} ref Block ref.
 * @return {number|undefined} Parent chart ID.
 */
function useForkParentRef(ref) {
	return useSelect(
		(select) => {
			if (!ref) {
				return undefined;
			}
			const { getEntityRecord } = select(coreStore);
			const parentId = getEntityRecord(...entityRecordArgs('chart', ref))
				?.meta?._prc_fork_parent;
			if (!parentId || parentId === ref) {
				return undefined;
			}
			return getEntityRecord(...entityRecordArgs('chart', parentId))
				? parentId
				: undefined;
		},
		[ref]
	);
}

export default function SyncedChartEdit(props) {
	const { attributes, setAttributes } = props;
	const forkParentRef = useForkParentRef(attributes.ref);

	useEffect(() => {
		if (forkParentRef) {
			setAttributes({ ref: forkParentRef });
		}
	}, [forkParentRef, setAttributes]);

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
			isEmpty={(blocks) =>
				!findControllerBlock(blocks)?.innerBlocks?.length
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
				emptyLabel: __(
					'This chart is empty. Finish building it in the chart editor.',
					'prc-chart-builder'
				),
			}}
			Controls={Controls}
			controlsProps={{ setAttributes: props.setAttributes }}
			Placeholder={Placeholder}
		/>
	);
}
