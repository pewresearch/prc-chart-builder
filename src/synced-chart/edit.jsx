/* eslint-disable @wordpress/no-unsafe-wp-apis */

/**
 * WordPress Dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, withNotices, KeyboardShortcuts } from '@wordpress/components';
import { useEntityBlockEditor, useEntityRecord } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCommand } from '@wordpress/commands';
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
import controllerStore from '../controller/store';

function SyncedChartEdit({ attributes, setAttributes, clientId, isSelected }) {
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

	// Get the controller block's id attribute for keyboard shortcuts
	const controllerId = useMemo(() => {
		const controllerBlock = blocks?.find(
			(block) => block.name === 'prc-chart-builder/controller'
		);
		return controllerBlock?.attributes?.id;
	}, [blocks]);

	const { set } = useDispatch('core/preferences');
	const { toggleAllTableVisibility } = useDispatch(controllerStore);

	const { userHidesThisTable, tempHideAllTables, hasChildSelected } =
		useSelect(
			(select) => {
				const { get } = select('core/preferences');
				const { getAllTableVisibility } = select(controllerStore);
				const { hasSelectedInnerBlock } = select('core/block-editor');
				const persistentHiddenTables = get(
					'prc-chart-builder/controller',
					'persistentHiddenTables'
				);

				return {
					userHidesThisTable:
						persistentHiddenTables &&
						controllerId &&
						persistentHiddenTables.includes(controllerId),
					tempHideAllTables: getAllTableVisibility(),
					hasChildSelected: hasSelectedInnerBlock(clientId, true),
				};
			},
			[controllerId, clientId]
		);

	// Register the command for hiding/showing all tables
	useCommand({
		name: 'prc-chart-builder/synced-chart-toggle-all-tables',
		label: tempHideAllTables
			? __('Show ALL Tables (Temporary)')
			: __('Hide ALL Tables (Temporary)'),
		callback: ({ close }) => {
			toggleAllTableVisibility();
			close();
		},
	});

	const handlePersistentTableVisibility = () => {
		if (!controllerId) {
			return;
		}

		const { get } = wp.data.select('core/preferences');
		const persistentHiddenTables = get(
			'prc-chart-builder/controller',
			'persistentHiddenTables'
		);

		if (userHidesThisTable) {
			// Show this table
			const newHiddenTables = persistentHiddenTables.filter(
				(tableId) => tableId !== controllerId
			);
			set('prc-chart-builder/controller', 'persistentHiddenTables', [
				...newHiddenTables,
			]);
		} else if (!persistentHiddenTables) {
			set('prc-chart-builder/controller', 'persistentHiddenTables', [
				controllerId,
			]);
		} else {
			const newHiddenTables = [...persistentHiddenTables, controllerId];
			set('prc-chart-builder/controller', 'persistentHiddenTables', [
				...newHiddenTables,
			]);
		}
	};

	const handleTemporaryTableVisibility = () => {
		toggleAllTableVisibility();
	};

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		value: blocks,
		onInput,
		onChange,
		allowedBlocks: ['prc-chart-builder/controller'],
		renderAppender: blocks?.length
			? undefined
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

	// Only bind keyboard shortcuts when the synced chart itself is selected,
	// not when a child block (like controller) is selected.
	// This allows the controller's own keyboard shortcuts to work.
	const keyboardShortcuts =
		isSelected && !hasChildSelected
			? {
					'option+shift+h': () => handlePersistentTableVisibility(),
					'option+h': () => handleTemporaryTableVisibility(),
				}
			: {};

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
				}}
			/>
			<KeyboardShortcuts bindGlobal shortcuts={keyboardShortcuts}>
				<div {...innerBlocksProps} />
			</KeyboardShortcuts>
		</RecursionProvider>
	);
}

export default withNotices(SyncedChartEdit);
