/**
 * WordPress Dependencies
 */
import { cloneBlock } from '@wordpress/blocks';

export const DEFAULT_CHART_WIDTH = 640;
export const SYNCED_CHART_NAME = 'prc-chart-builder/synced-chart';
export const CONTROLLER_NAME = 'prc-chart-builder/controller';

/**
 * Walk parsed blocks to find the configured width of the chart block, used as
 * the float (left/right) preview width since a floated wrapper collapses.
 *
 * @param {Array} list Parsed blocks to search.
 * @return {number} Chart layout width in px, or 0.
 */
export function findChartWidth(list) {
	for (const block of list || []) {
		if (block.name === 'prc-chart-builder/chart') {
			return block.attributes?.layout?.width || DEFAULT_CHART_WIDTH;
		}
		if (block.innerBlocks?.length) {
			const found = findChartWidth(block.innerBlocks);
			if (found) {
				return found;
			}
		}
	}
	return 0;
}

export function hasNestedSyncedCharts(list) {
	for (const block of list || []) {
		if (block.name === SYNCED_CHART_NAME) {
			return true;
		}
		if (
			block.innerBlocks?.length &&
			hasNestedSyncedCharts(block.innerBlocks)
		) {
			return true;
		}
	}
	return false;
}

export function collectSyncedChartRefs(list, acc = new Set()) {
	for (const block of list || []) {
		if (block.name === SYNCED_CHART_NAME && block.attributes?.ref) {
			acc.add(block.attributes.ref);
		}
		if (block.innerBlocks?.length) {
			collectSyncedChartRefs(block.innerBlocks, acc);
		}
	}
	return acc;
}

export function findControllerBlock(list) {
	for (const block of list || []) {
		if (block.name === CONTROLLER_NAME) {
			return block;
		}
		if (block.innerBlocks?.length) {
			const found = findControllerBlock(block.innerBlocks);
			if (found) {
				return found;
			}
		}
	}
	return null;
}

export function replaceSyncedCharts(list, controllerByRef) {
	const out = [];
	for (let block of list || []) {
		if (block.name === SYNCED_CHART_NAME) {
			const controller =
				block.attributes?.ref && controllerByRef[block.attributes.ref];
			out.push(controller ? cloneBlock(controller) : block);
			continue;
		}
		if (block.innerBlocks?.length) {
			block = {
				...block,
				innerBlocks: replaceSyncedCharts(
					block.innerBlocks,
					controllerByRef
				),
			};
		}
		out.push(block);
	}
	return out;
}
