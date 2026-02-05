/**
 * WordPress Dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Filter that controls when the controller block can be inserted.
 * Controllers are only insertable when inside a freeform chart context
 * (i.e., when an ancestor controller has isFreeform: true).
 *
 * This allows nested chart controllers inside freeform charts while
 * keeping them out of the main inserter elsewhere.
 */
addFilter(
	'blockEditor.__unstableCanInsertBlockType',
	'prc-chart-builder/controller-freeform-only',
	(canInsert, blockType, rootClientId) => {
		// Only filter the controller block
		if (blockType.name !== 'prc-chart-builder/controller') {
			return canInsert;
		}

		// If there's no insertion context (root level), don't allow
		if (!rootClientId) {
			return false;
		}

		const { getBlock, getBlockParentsByBlockName } =
			select(blockEditorStore);

		// Get parent controller blocks directly
		const controllerParentIds = getBlockParentsByBlockName(
			rootClientId,
			'prc-chart-builder/controller',
			true
		);

		// Check if any ancestor controller has isFreeform: true
		for (const parentId of controllerParentIds) {
			const block = getBlock(parentId);
			if (block?.attributes?.isFreeform === true) {
				return true;
			}
		}

		// Not inside a freeform chart, don't allow insertion
		return false;
	}
);
