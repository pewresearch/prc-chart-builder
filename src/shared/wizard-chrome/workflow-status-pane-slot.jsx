/**
 * Host slot for the publish-workflows status pane on Preview Chart.
 */
import { createSlotFill } from '@wordpress/components';

// Must match publish-workflows' createSlotFill name. The two plugins cannot
// share a module, so the string is the contract.
const { Slot } = createSlotFill('prcPublishWorkflows.StatusPane');

export const WorkflowStatusPaneSlot = Slot;
