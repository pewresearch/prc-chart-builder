/**
 * Internal Dependencies
 */
import { applyControllerTemplateContent } from './apply-controller-template';

/**
 * Apply serialized controller markup from a wizard screen to the chart open
 * in the editor.
 *
 * @param {Object}   chart                     Chart to apply.
 * @param {string}   chart.content             Serialized controller block markup.
 * @param {string}   [chart.title]             Title for an untitled chart.
 * @param {string}   [chart.notice]            Info notice to show after applying.
 * @param {string}   [chart.noticeId]          Notice id, so a repeat replaces it.
 * @param {Object}   editor
 * @param {string}   editor.clientId           Controller block clientId.
 * @param {string}   [editor.controllerId]     Live controller attribute id.
 * @param {Function} editor.setAttributes      Controller block setAttributes().
 * @param {Function} editor.replaceInnerBlocks block editor replaceInnerBlocks().
 * @param {Function} editor.createInfoNotice   core/notices createInfoNotice().
 * @param {Function} editor.editPost           core/editor editPost().
 * @param {string}   editor.currentTitle       The post title in the editor.
 * @return {boolean} Whether the chart was applied.
 */
export function applyChartContent(
	{ content, title, notice, noticeId },
	{
		clientId,
		setAttributes,
		replaceInnerBlocks,
		createInfoNotice,
		editPost,
		currentTitle,
		controllerId = '',
	}
) {
	const applied = applyControllerTemplateContent({
		content,
		clientId,
		setAttributes,
		replaceInnerBlocks,
		preserveAttributes: ['id', 'lock'],
		controllerId,
	});
	if (!applied) {
		return false;
	}
	if (title && !currentTitle) {
		editPost({ title });
	}
	if (notice) {
		createInfoNotice(notice, { id: noticeId, isDismissible: true });
	}
	return true;
}
