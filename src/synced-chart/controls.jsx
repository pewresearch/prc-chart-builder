/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useCallback, useState } from '@wordpress/element';
import {
	Button,
	Notice,
	PanelRow,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { replace, ungroup } from '@wordpress/icons';
import { parse, serialize } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import apiFetch from '@wordpress/api-fetch';
import { SyncedEntityIsolationControls } from '@prc/components';

/**
 * Internal Dependencies
 */
import {
	collectSyncedChartRefs,
	findControllerBlock,
	hasNestedSyncedCharts,
	replaceSyncedCharts,
} from './flatten';
import ReplaceChartModal from './replace-chart-modal';

export default function Controls({
	attributes,
	setAttributes,
	entityTitle = '',
	permalink = '',
	effectiveRef,
	isForkActive,
	blocks = [],
	canEdit,
	invalidate,
}) {
	const { ref } = attributes;
	const displayRef = effectiveRef ?? ref;

	const { createSuccessNotice, createErrorNotice } =
		useDispatch(noticesStore);

	const [isFlattening, setIsFlattening] = useState(false);
	const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
	const replaceLabel = __('Replace chart', 'prc-chart-builder');

	const hasNestedSyncedChartBlocks = useMemo(
		() => hasNestedSyncedCharts(blocks),
		[blocks]
	);

	const canFlatten = canEdit !== false && hasNestedSyncedChartBlocks;

	const handleFlatten = useCallback(async () => {
		if (!effectiveRef || !blocks.length) {
			return;
		}

		setIsFlattening(true);
		try {
			const refs = [...collectSyncedChartRefs(blocks)];
			const records = await Promise.all(
				refs.map((chartRef) =>
					apiFetch({
						path: `/wp/v2/chart/${chartRef}?context=edit`,
					})
				)
			);
			const controllerByRef = {};
			records.forEach((record, index) => {
				const controller = findControllerBlock(
					parse(record?.content?.raw || '', {
						__unstableSkipMigrationLogs: true,
					})
				);
				if (controller) {
					controllerByRef[refs[index]] = controller;
				}
			});
			const flattened = replaceSyncedCharts(blocks, controllerByRef);
			await apiFetch({
				path: `/wp/v2/chart/${effectiveRef}`,
				method: 'POST',
				data: { content: serialize(flattened) },
			});
			invalidate?.();
			createSuccessNotice(
				__('Flattened nested synced charts.', 'prc-chart-builder'),
				{ type: 'snackbar' }
			);
		} catch (error) {
			createErrorNotice(
				error?.message ||
					__(
						'Failed to flatten nested synced charts.',
						'prc-chart-builder'
					),
				{ type: 'snackbar' }
			);
		} finally {
			setIsFlattening(false);
		}
	}, [
		effectiveRef,
		blocks,
		invalidate,
		createSuccessNotice,
		createErrorNotice,
	]);

	const editLink = useMemo(() => {
		if (!displayRef) {
			return '';
		}
		const url = new URL(window.location.href);
		url.searchParams.set('post', displayRef);
		return url.toString();
	}, [displayRef]);

	const extraToolbarItems = (
		<>
			<ToolbarGroup>
				<ToolbarButton
					aria-expanded={isReplaceModalOpen}
					aria-haspopup="dialog"
					label={replaceLabel}
					icon={replace}
					onClick={() => setIsReplaceModalOpen(true)}
					showTooltip
				/>
			</ToolbarGroup>
			{canFlatten && (
				<ToolbarGroup>
					<ToolbarButton
						icon={ungroup}
						label={__(
							'Flatten Incorrect Nesting',
							'prc-chart-builder'
						)}
						onClick={handleFlatten}
						isBusy={isFlattening}
						disabled={isFlattening}
						showTooltip
					>
						{__('Flatten Incorrect Nesting', 'prc-chart-builder')}
					</ToolbarButton>
				</ToolbarGroup>
			)}
		</>
	);

	const extraInspectorContent = isForkActive ? (
		<Notice status="warning" isDismissible={false}>
			{__(
				'Preview and edit links will open the future revision.',
				'prc-chart-builder'
			)}
		</Notice>
	) : null;

	return (
		<>
			<SyncedEntityIsolationControls
				attributes={attributes}
				panelTitle={__('Synced Chart', 'prc-chart-builder')}
				entityTitle={entityTitle}
				entityTitleLabel={__('Chart Title', 'prc-chart-builder')}
				editLink={editLink}
				previewLink={permalink}
				labels={{
					edit: __('Edit chart in isolation', 'prc-chart-builder'),
					preview: __(
						'Preview chart in isolation',
						'prc-chart-builder'
					),
				}}
				extraToolbarItems={extraToolbarItems}
				extraInspectorContent={extraInspectorContent}
				extraInspectorActions={
					<PanelRow>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							aria-haspopup="dialog"
							onClick={() => setIsReplaceModalOpen(true)}
						>
							{replaceLabel}
						</Button>
					</PanelRow>
				}
			/>
			{isReplaceModalOpen && (
				<ReplaceChartModal
					chartRef={ref}
					setAttributes={setAttributes}
					onClose={() => setIsReplaceModalOpen(false)}
				/>
			)}
		</>
	);
}
