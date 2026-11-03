/**
 * WordPress Dependencies
 */
import { createBlock, serialize } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import { buildChartEditUrl } from '../shared/chart-flow-handoff';

const CHART_CONTROLLER = 'prc-chart-builder/controller';

/**
 * Markup for a new chart draft.
 *
 * setupEditor applies the chart CPT template only when the post status is
 * auto-draft. A REST draft with empty content opens with no Controller, so
 * the draft is seeded with the locked Controller the template would insert.
 *
 * @return {string} Serialized controller block.
 */
export function getSeededChartContent() {
	return serialize([
		createBlock(CHART_CONTROLLER, {
			lock: { move: true, remove: true },
		}),
	]);
}

/**
 * Save a draft chart and return its id.
 *
 * @param {Function} saveEntityRecord core-data saveEntityRecord.
 * @return {Promise<number>} New chart post id.
 */
export async function createChartDraft(saveEntityRecord) {
	const record = await saveEntityRecord(
		'postType',
		'chart',
		{
			title: __('Untitled Chart', 'prc-chart-builder'),
			status: 'draft',
			content: getSeededChartContent(),
		},
		{ throwOnError: true }
	);

	const id = Number(record?.id);
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error(__('Could not create the chart.', 'prc-chart-builder'));
	}

	return id;
}

function openBlankTab(url = '') {
	const tab = window.open(url, '_blank');
	if (tab) {
		tab.opener = null;
	}
	return tab;
}

/**
 * Create a draft, store its id on the block, and open the chart editor.
 *
 * Call this directly from the click handler. The tab opens before the first
 * await because browsers block window.open after an async gap.
 *
 * @param {Object}   args
 * @param {Function} args.saveEntityRecord
 * @param {Function} args.setAttributes
 * @param {Object}   args.notices
 * @return {Promise<number>} New chart post id.
 */
export async function createAndOpenChartDraft({
	saveEntityRecord,
	setAttributes,
	notices,
}) {
	const newTab = openBlankTab();

	try {
		const id = await createChartDraft(saveEntityRecord);
		const editUrl = buildChartEditUrl(id);
		setAttributes({ ref: id });
		if (newTab && !newTab.closed) {
			newTab.location.href = editUrl;
		} else {
			notices.createSuccessNotice(
				__('Chart created.', 'prc-chart-builder'),
				{
					type: 'snackbar',
					actions: [
						{
							label: __('Open chart', 'prc-chart-builder'),
							onClick: () => openBlankTab(editUrl),
						},
					],
				}
			);
		}
		return id;
	} catch (error) {
		newTab?.close();
		notices.createErrorNotice(
			error?.message ||
				__('Could not create the chart.', 'prc-chart-builder'),
			{ type: 'snackbar' }
		);
		throw error;
	}
}
