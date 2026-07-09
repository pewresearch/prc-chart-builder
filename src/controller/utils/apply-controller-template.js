/**
 * WordPress Dependencies
 */
import { parse } from '@wordpress/blocks';

/**
 * Apply serialized controller block markup to an in-editor controller instance.
 *
 * @param {Object}   options
 * @param {string}   options.content            Serialized controller block markup.
 * @param {Function} options.setAttributes      Controller block setAttributes().
 * @param {Function} options.replaceInnerBlocks block editor replaceInnerBlocks().
 * @param {string}   options.clientId           Controller block clientId.
 * @param {string[]} [options.preserveAttributes] Attribute keys to keep from the live block.
 * @return {boolean} Whether a controller block was found and applied.
 */
export function applyControllerTemplateContent({
	content,
	setAttributes,
	replaceInnerBlocks,
	clientId,
	preserveAttributes = ['id'],
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
		replaceInnerBlocks(clientId, controller.innerBlocks, true);
	}

	return true;
}
