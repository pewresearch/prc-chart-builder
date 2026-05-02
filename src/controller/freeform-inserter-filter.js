/**
 * WordPress Dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { select } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Filter that controls when the controller block can be inserted via the
 * inserter UI. Controllers are only shown in the inserter when inside a
 * freeform chart context (i.e., when an ancestor controller has
 * isFreeform: true).
 *
 * Root-level insertion is allowed on the "chart" post type (its native
 * home) and always allowed when no rootClientId is provided so that
 * paste and programmatic insertion are not blocked.
 */
addFilter(
	'blockEditor.__unstableCanInsertBlockType',
	'prc-chart-builder/controller-freeform-only',
	(canInsert, blockType, rootClientId) => {
		if (blockType.name !== 'prc-chart-builder/controller') {
			return canInsert;
		}

		// Root-level insertion: allow on chart post type and for
		// paste/programmatic operations (no rootClientId).
		if (!rootClientId) {
			try {
				const postType =
					select(editorStore).getCurrentPostType();
				if ('chart' === postType) {
					return true;
				}
			} catch (e) {
				// editorStore may not be available in all contexts
			}
			// Allow root-level insertion so paste works across post types
			return canInsert;
		}

		const { getBlock, getBlockParentsByBlockName } =
			select(blockEditorStore);

		const controllerParentIds = getBlockParentsByBlockName(
			rootClientId,
			'prc-chart-builder/controller',
			true
		);

		for (const parentId of controllerParentIds) {
			const block = getBlock(parentId);
			if (block?.attributes?.isFreeform === true) {
				return true;
			}
		}

		return false;
	}
);
