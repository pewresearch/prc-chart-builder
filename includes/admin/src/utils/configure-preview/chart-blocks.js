/**
 * Serialize-time block-tree assembly for the Chart Creation wizard.
 *
 * These functions operate on already-parsed block trees (plain objects), so
 * they stay unit-testable without `@wordpress/blocks`. The modal is the only
 * boundary that calls `parse`/`serialize`; everything in between is pure tree
 * manipulation.
 */

const TABLE_BLOCK_NAME = 'prc-block/table';
const CHART_BLOCK_NAME = 'prc-chart-builder/chart';

/**
 * @param {Array} blocks Parsed block tree (controller is `blocks[0]`).
 * @return {Array} The controller's inner blocks.
 */
function getControllerInnerBlocks(blocks) {
	return blocks?.[0]?.innerBlocks ?? [];
}

/**
 * Find the pattern's editable power table block.
 *
 * @param {Array} blocks Parsed pattern block tree.
 * @return {Object|null} The `prc-block/table` block, or null.
 */
export function extractTableBlock(blocks) {
	return (
		getControllerInnerBlocks(blocks).find(
			(block) => block.name === TABLE_BLOCK_NAME
		) ?? null
	);
}

/**
 * Read the chart block's attributes as a deep clone (safe to edit in state).
 *
 * @param {Array} blocks Parsed pattern block tree.
 * @return {Object} Chart block attributes, or `{}` when absent.
 */
export function extractChartAttributes(blocks) {
	const chartBlock = getControllerInnerBlocks(blocks).find(
		(block) => block.name === CHART_BLOCK_NAME
	);
	return chartBlock?.attributes
		? JSON.parse(JSON.stringify(chartBlock.attributes))
		: {};
}

/**
 * Merge edited chart attributes into a chart block, preserving nested groups
 * (`io`, `dataRender`, `metadata`, `layout`) that the shallow spread would
 * otherwise clobber.
 *
 * @param {Object} chartBlock      A `prc-chart-builder/chart` block object.
 * @param {Object} chartAttributes Edited attributes from the configure step.
 * @return {Object} A new chart block with merged attributes.
 */
export function injectChartAttributes(chartBlock, chartAttributes) {
	if (!chartAttributes) {
		return chartBlock;
	}

	const prev = chartBlock.attributes ?? {};

	return {
		...chartBlock,
		attributes: {
			...prev,
			...chartAttributes,
			io: { ...(prev.io ?? {}), ...(chartAttributes.io ?? {}) },
			dataRender: {
				...(prev.dataRender ?? {}),
				...(chartAttributes.dataRender ?? {}),
			},
			metadata: {
				...(prev.metadata ?? {}),
				...(chartAttributes.metadata ?? {}),
			},
			layout: {
				...(prev.layout ?? {}),
				...(chartAttributes.layout ?? {}),
			},
		},
	};
}

/**
 * Build the final controller tree from the edited table + chart attributes,
 * ready to serialize and save. The chart title travels inside
 * `chartAttributes.metadata.title` — there is no separate title argument.
 *
 * @param {Array}  blocks                  Parsed pattern block tree.
 * @param {Object} [parts]
 * @param {Object} [parts.tableBlock]      Edited table block from the data step.
 * @param {Object} [parts.chartAttributes] Edited chart attributes.
 * @return {Array} A new block tree with the edits applied.
 */
export function assembleChartBlocks(
	blocks,
	{ tableBlock, chartAttributes } = {}
) {
	const controller = blocks?.[0];
	if (!controller) {
		return blocks;
	}

	const innerBlocks = (controller.innerBlocks ?? []).map((block) => {
		if (tableBlock && block.name === TABLE_BLOCK_NAME) {
			return tableBlock;
		}

		if (block.name === CHART_BLOCK_NAME && chartAttributes) {
			return injectChartAttributes(block, chartAttributes);
		}

		return block;
	});

	return [{ ...controller, innerBlocks }];
}
