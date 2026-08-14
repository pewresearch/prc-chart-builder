/**
 * DataStep — the wizard's data-editing step (PRC-527).
 *
 * Hosts a single editable `prc-block/table` block inside a bare
 * BlockEditorProvider. The table block self-registers (its editor script is
 * enqueued by class-admin.php across the whole block registry), so cell
 * editing, typed columns (cell context menu), inline add/remove row/col, and
 * CSV drop all work here without a full post editor.
 */
import {
	BlockEditorProvider,
	BlockList,
	WritingFlow,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Button,
	Flex,
	FlexItem,
	Popover,
	SlotFillProvider,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { chevronLeft } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import CsvDataInput from '../../../../src/shared/data-step/csv-data-input';
import { csvToTableAttributes } from '../../../../src/shared/utils/csv';
import ChartPreviewPane from './chart-preview-pane';

const EDITOR_SETTINGS = {
	hasFixedToolbar: true,
	templateLock: 'all',
};

/**
 * Select the table block on mount so the editor affordances (bordered cells,
 * .ftb-* control buttons) render — the table's editor styles only apply to the
 * selected block. Renders nothing.
 *
 * @param {Object} props
 * @param {string} [props.clientId] The table block clientId to select.
 * @return {null} Nothing.
 */
function SelectBlockOnMount({ clientId }) {
	const { selectBlock } = useDispatch(blockEditorStore);

	useEffect(() => {
		if (clientId) {
			selectBlock(clientId);
		}
	}, [clientId, selectBlock]);

	return null;
}

/**
 * @param {Object}        props
 * @param {Array}         props.tableBlocks       BlockEditorProvider value (single table block).
 * @param {Function}      props.onTableChange     Persist edited blocks to modal state.
 * @param {Function}      props.onBack            Back handler.
 * @param {Function}      props.onNext            Next handler.
 * @param {string}        [props.layout]          'full' hides inline nav (the wizard action bar owns it).
 * @param {Object}        [props.chartAttributes] Seeded/edited chart attributes for the live preview.
 * @param {string|number} [props.previewKey]      Preview remount key.
 */
export default function DataStep({
	tableBlocks,
	onTableChange,
	onBack,
	onNext,
	layout = 'compact',
	chartAttributes,
	previewKey,
}) {
	const showInlineNav = layout !== 'full';
	const hasTableBlock = Boolean(tableBlocks[0]);

	const handleCsvUpload = useCallback(
		(csvText) => {
			const tableBlock = tableBlocks[0];
			if (!tableBlock) {
				return;
			}
			const { head, body } = csvToTableAttributes(csvText);
			onTableChange([
				{
					...tableBlock,
					attributes: {
						...tableBlock.attributes,
						head,
						body,
					},
				},
			]);
		},
		[onTableChange, tableBlocks]
	);

	/*
	 * Two ancestor classes are required for the embedded table to look right:
	 * - `editor-styles-wrapper`: the power table's editor stylesheet is scoped
	 *   to `.editor-styles-wrapper .wp-block-prc-block-table` (cell borders,
	 *   selection outline, .ftb-* control buttons).
	 * - `wp-block-prc-chart-builder-controller`: the chart-specific table layout
	 *   (`.chart-builder-data-table > table` alignment / width, Franklin
	 *   typography) lives in the controller stylesheet scoped under this class.
	 */
	const tableEditor = (
		<div className="prc-chart-modal__data-table editor-styles-wrapper wp-block-prc-chart-builder-controller">
			<SlotFillProvider>
				<BlockEditorProvider
					value={tableBlocks}
					onInput={onTableChange}
					onChange={onTableChange}
					settings={EDITOR_SETTINGS}
				>
					<SelectBlockOnMount clientId={tableBlocks[0]?.clientId} />
					<WritingFlow>
						<BlockList />
					</WritingFlow>
					<Popover.Slot />
				</BlockEditorProvider>
			</SlotFillProvider>
		</div>
	);

	const preview = chartAttributes ? (
		<ChartPreviewPane
			chartAttributes={chartAttributes}
			previewKey={previewKey}
		/>
	) : null;

	return (
		<div className="prc-chart-modal__create-step">
			{layout !== 'full' && (
				<p className="prc-chart-modal__step-label">
					{__('Add your data', 'prc-chart-builder')}
				</p>
			)}

			{/* full: preview (left) | table (right); compact: table then preview stacked. */}
			<CsvDataInput
				variant="upload-button"
				csvText=""
				onCsvChange={handleCsvUpload}
				disabled={!hasTableBlock}
			/>
			<div className="prc-chart-wizard__data" data-layout={layout}>
				{tableEditor}
				{preview}
			</div>

			{showInlineNav && (
				<Flex
					justify="flex-start"
					gap={3}
					style={{ marginTop: '16px' }}
				>
					<FlexItem>
						<Button variant="primary" onClick={onNext}>
							{__(
								'Next: Configure & Preview',
								'prc-chart-builder'
							)}
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="secondary"
							onClick={onBack}
							icon={chevronLeft}
						>
							{__('Back', 'prc-chart-builder')}
						</Button>
					</FlexItem>
				</Flex>
			)}
		</div>
	);
}
