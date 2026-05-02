/* eslint-disable @wordpress/no-unsafe-wp-apis */

/**
 * WordPress Dependencies
 */
import { useMemo, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Notice, withNotices, Disabled } from '@wordpress/components';
import { useEntityBlockEditor, useEntityRecord } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useInnerBlocksProps,
	RecursionProvider,
	useHasRecursion,
	InnerBlocks,
	useBlockProps,
	Warning,
} from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */
import Controls from './controls';
import Placeholder from './placeholder';
import useChartPresence from './use-chart-presence';

/**
 * Maps stable panel ids from `useFocusedPanel(panelId)` to user-facing labels.
 * Unknown ids (including localized title-text fallbacks from panels that don't
 * use `useFocusedPanel`) are passed through unchanged.
 */
const PANEL_LABELS = {
	annotations: __('Annotations', 'prc-chart-builder'),
	bar: __('Bar', 'prc-chart-builder'),
	colors: __('Colors', 'prc-chart-builder'),
	dependentAxis: __('Dependent Axis', 'prc-chart-builder'),
	independentAxis: __('Independent Axis', 'prc-chart-builder'),
	labels: __('Labels', 'prc-chart-builder'),
	legend: __('Legend', 'prc-chart-builder'),
	line: __('Line', 'prc-chart-builder'),
	map: __('Map', 'prc-chart-builder'),
	netValues: __('Net Values', 'prc-chart-builder'),
	nodes: __('Nodes', 'prc-chart-builder'),
	pie: __('Pie', 'prc-chart-builder'),
	regression: __('Regression', 'prc-chart-builder'),
	sankey: __('Sankey', 'prc-chart-builder'),
	treemap: __('Treemap', 'prc-chart-builder'),
};

function panelLabel(id) {
	return PANEL_LABELS[id] || id;
}

function SyncedChartEdit({ attributes, setAttributes, clientId }) {
	const { ref } = attributes;
	const isNew = !ref;

	// Fetch base chart first to read meta; swap to fork if it has an active future revision.
	const { record: baseRecord } = useEntityRecord('postType', 'chart', ref);
	const effectiveRef = ref ? baseRecord?.meta?._prc_active_fork || ref : ref;
	const isForkActive = !!ref && effectiveRef !== ref;

	const hasAlreadyRendered = useHasRecursion(effectiveRef); // @TODO: Could this be an issue for realtime collab?
	const { record, hasResolved } = useEntityRecord(
		'postType',
		'chart',
		effectiveRef
	);
	const isResolving = !hasResolved;
	const isMissing = hasResolved && !record && !isNew;

	const [blocks, onInput, onChange] = useEntityBlockEditor(
		'postType',
		'chart',
		{ id: effectiveRef }
	);

	const { isLocked, editors } = useChartPresence(effectiveRef);

	// Resolve the controller's clientId so we can apply the editing mode to it
	// (and its descendants) rather than to the synced-chart wrapper itself.
	// This keeps the wrapper selectable/deletable while locking the inner content.
	const controllerClientId = useSelect(
		(select) =>
			select('core/block-editor')
				.getBlocks(clientId)
				?.find((b) => b.name === 'prc-chart-builder/controller')
				?.clientId,
		[clientId]
	);

	const { setBlockEditingMode, unsetBlockEditingMode } =
		useDispatch('core/block-editor');

	useEffect(() => {
		if (!controllerClientId) return;
		if (isLocked) {
			setBlockEditingMode(controllerClientId, 'disabled');
		} else {
			unsetBlockEditingMode(controllerClientId);
		}
		return () => unsetBlockEditingMode(controllerClientId);
	}, [
		isLocked,
		controllerClientId,
		setBlockEditingMode,
		unsetBlockEditingMode,
	]);

	const lockMessage = useMemo(() => {
		if (!isLocked || !editors.length) return null;
		if (editors.length === 1) {
			const { displayName, data } = editors[0];

			// Panel-level granularity wins when we have it.
			if (data?.panel) {
				return sprintf(
					/* translators: 1: display name of the user editing, 2: inspector panel name */
					__(
						'%1$s is editing the %2$s panel. Changes are disabled.',
						'prc-chart-builder'
					),
					displayName,
					panelLabel(data.panel)
				);
			}

			// Fall back to coarse section-level labels.
			switch (data?.section) {
				case 'data':
					return sprintf(
						/* translators: %s: display name of the user currently editing the chart */
						__(
							'%s is editing the data table. Changes are disabled.',
							'prc-chart-builder'
						),
						displayName
					);
				case 'controls':
					return sprintf(
						/* translators: %s: display name of the user currently editing the chart */
						__(
							'%s is adjusting chart settings. Changes are disabled.',
							'prc-chart-builder'
						),
						displayName
					);
				case 'chart':
				default:
					return sprintf(
						/* translators: %s: display name of the user currently editing the chart */
						__(
							'%s is editing this chart. Changes are disabled.',
							'prc-chart-builder'
						),
						displayName
					);
			}
		}
		const names = editors.map((e) => e.displayName);
		const last = names.pop();
		return sprintf(
			/* translators: 1: comma-separated list of names, 2: last name in the list */
			__(
				'%1$s and %2$s are editing this chart. Changes are disabled.',
				'prc-chart-builder'
			),
			names.join(', '),
			last
		);
	}, [isLocked, editors]);

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		value: blocks,
		onInput: isLocked ? () => {} : onInput,
		onChange: isLocked ? () => {} : onChange,
		allowedBlocks: ['prc-chart-builder/controller'],
		renderAppender:
			!isLocked && blocks?.length
				? undefined
				: isLocked
					? false
					: InnerBlocks.ButtonBlockAppender,
	});

	if (hasAlreadyRendered) {
		return (
			<div {...blockProps}>
				<Warning>
					{__('Chart cannot be rendered inside itself.')}
				</Warning>
			</div>
		);
	}

	if (isMissing) {
		return (
			<div {...blockProps}>
				<Warning>
					{__('Chart has been deleted or is unavailable.')}
				</Warning>
			</div>
		);
	}

	if (isResolving || isNew) {
		return (
			<div {...blockProps}>
				<Placeholder
					{...{
						attributes,
						setAttributes,
						clientId,
						isResolving,
						isNew,
					}}
				/>
			</div>
		);
	}

	if (isLocked) {
		return (
			<RecursionProvider uniqueId={effectiveRef}>
				<Notice
					status="warning"
					isDismissible={false}
					className="synced-chart-presence-lock__notice"
				>
					{lockMessage}
				</Notice>
				<Controls
					{...{
						attributes,
						clientId,
						blocks,
						effectiveRef,
						isForkActive,
						isLocked,
					}}
				/>
				<Disabled>
					<div {...innerBlocksProps} />
				</Disabled>
			</RecursionProvider>
		);
	}

	return (
		<RecursionProvider uniqueId={effectiveRef}>
			{isForkActive && (
				<Notice status="warning" isDismissible={false}>
					{__('Editing future revision', 'prc-chart-builder')}
				</Notice>
			)}
			<Controls
				{...{
					attributes,
					clientId,
					blocks,
					effectiveRef,
					isForkActive,
					isLocked: false,
				}}
			/>
			<div {...innerBlocksProps} />
		</RecursionProvider>
	);
}

export default withNotices(SyncedChartEdit);
