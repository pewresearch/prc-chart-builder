/* eslint-disable @wordpress/no-unsafe-wp-apis */

/**
 * WordPress Dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withNotices } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useEntityBlockEditor, useEntityRecord } from '@wordpress/core-data';
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

function parseTable(tableString) {
	// check that tableString is a string
	if (typeof tableString !== 'string') {
		return false;
	}
	// eslint-disable-next-line no-undef
	const parser = new DOMParser();
	const doc = parser.parseFromString(tableString, 'text/html');
	const table = doc.querySelector('table');
	const head = [];
	const body = [];
	let isHead = true;
	for (const row of table.rows) {
		const cells = [];
		for (const cell of row.cells) {
			cells.push({
				content: cell.textContent.trim(),
				tag: cell.tagName.toLowerCase(),
			});
		}
		if (isHead) {
			head.push({ cells });
			isHead = false;
		} else {
			body.push({ cells });
		}
	}
	return { head, body };
}

function convertTableToBlock(tableMarkup) {
	const { head, body } = parseTable(tableMarkup);
	return createBlock('prc-block/table', {
		head,
		body,
	});
}

function SyncedChartEdit({
	attributes,
	setAttributes,
	clientId,
	noticeOperations,
	noticeUI,
}) {
	const { ref } = attributes;
	const isNew = !ref;
	const hasAlreadyRendered = useHasRecursion(ref);
	const { record, hasResolved } = useEntityRecord('postType', 'chart', ref);
	const isResolving = !hasResolved;
	const isMissing = hasResolved && !record && !isNew;

	const [blocks, onInput, onChange] = useEntityBlockEditor(
		'postType',
		'chart',
		{ id: ref }
	);

	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps(blockProps, {
		value: blocks,
		onInput,
		onChange,
		allowedBlocks: ['prc-block/chart-builder-controller'],
		renderAppender: blocks?.length
			? undefined
			: InnerBlocks.ButtonBlockAppender,
	});

	/**
	 * Handle "Classic Editor" block conversion.
	 */
	useEffect(() => {
		if (!blocks || !blocks.length) {
			return;
		}
		// check if the first block is a freeform "classic editor" block.
		const block = blocks[0];
		if ('core/freeform' === block.name) {
			const newTableBlock = convertTableToBlock(
				block.attributes?.content
			);
			if (newTableBlock) {
				const newBlocks = [newTableBlock];
				onChange(newBlocks, {
					selection: {
						start: 0,
						end: 1,
						focus: 0,
						anchor: 0,
					},
				});
			}
		}
	}, [blocks]);

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

	return (
		<RecursionProvider uniqueId={ref}>
			<Controls
				{...{
					attributes,
					clientId,
					blocks,
				}}
			/>
			<div {...innerBlocksProps} />
		</RecursionProvider>
	);
}

export default withNotices(SyncedChartEdit);
