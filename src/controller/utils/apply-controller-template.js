/**
 * WordPress Dependencies
 */
import { parse } from '@wordpress/blocks';

const CHART_BLOCK = 'prc-chart-builder/chart';

/**
 * Keep direct child chart block ids aligned with the live controller id.
 *
 * @param {import('@wordpress/blocks').Block[]} innerBlocks  Controller inner blocks.
 * @param {string}                              controllerId Live controller attribute id.
 * @return {import('@wordpress/blocks').Block[]} Inner blocks with chart ids aligned to the controller.
 */
function syncDirectChildChartIds(innerBlocks, controllerId) {
	if (!controllerId || !innerBlocks?.length) {
		return innerBlocks;
	}
	const chartId = `${controllerId}-chart`;
	return innerBlocks.map((block) =>
		block.name === CHART_BLOCK
			? {
					...block,
					attributes: {
						...(block.attributes || {}),
						id: chartId,
					},
				}
			: block
	);
}

/**
 * Apply serialized controller block markup to an in-editor controller instance.
 *
 * @param {Object}   options
 * @param {string}   options.content              Serialized controller block markup.
 * @param {Function} options.setAttributes        Controller block setAttributes().
 * @param {Function} options.replaceInnerBlocks   block editor replaceInnerBlocks().
 * @param {string}   options.clientId             Controller block clientId.
 * @param {string[]} [options.preserveAttributes] Attribute keys to keep from the live block.
 * @param {string}   [options.controllerId]       Live controller `id`. When preserving `id`, incoming chart blocks are re-keyed to `${controllerId}-chart`.
 * @return {boolean} Whether a controller block was found and applied.
 */
export function applyControllerTemplateContent({
	content,
	setAttributes,
	replaceInnerBlocks,
	clientId,
	preserveAttributes = ['id'],
	controllerId = '',
}) {
	const blocks = parse(content, { __unstableSkipMigrationLogs: true });
	const controller = blocks.find(
		(block) => block.name === 'prc-chart-builder/controller'
	);

	if (!controller) {
		return false;
	}

	const incomingAttributes = { ...(controller.attributes || {}) };
	preserveAttributes.forEach((key) => {
		delete incomingAttributes[key];
	});

	if (Object.keys(incomingAttributes).length) {
		setAttributes(incomingAttributes);
	}

	if (controller.innerBlocks?.length) {
		const innerBlocks =
			preserveAttributes.includes('id') && controllerId
				? syncDirectChildChartIds(controller.innerBlocks, controllerId)
				: controller.innerBlocks;
		replaceInnerBlocks(clientId, innerBlocks, true);
	}

	return true;
}
