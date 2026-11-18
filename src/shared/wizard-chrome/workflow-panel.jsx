/**
 * Preview Chart Workflow panel: status dropdown, editor note, and preview.
 */
import {
	PanelBody,
	createSlotFill,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import AddEditorNoteButton from './add-editor-note-button';
import ChartViewLink from './chart-view-link';

// prc-publish-workflows fills this with its inline status dropdown, and
// leaves it empty on published posts. The two plugins cannot share a
// module, so the string is the contract.
const { Slot: WorkflowStatusSelectSlot } = createSlotFill(
	'prcPublishWorkflows.StatusSelect'
);

/**
 * @param {Object}      props
 * @param {string|null} props.chartClientId   Chart block to attach notes to.
 * @param {Function}    [props.onUnavailable] Forwarded to AddEditorNoteButton.
 * @return {import('react').ReactNode} The Workflow panel.
 */
export default function WorkflowPanel({ chartClientId, onUnavailable }) {
	return (
		<PanelBody
			title={__('Workflow status', 'prc-chart-builder')}
			initialOpen
		>
			<VStack spacing={4}>
				<WorkflowStatusSelectSlot />
				<AddEditorNoteButton
					chartClientId={chartClientId}
					onUnavailable={onUnavailable}
				/>
				<ChartViewLink />
			</VStack>
		</PanelBody>
	);
}
