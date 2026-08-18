/**
 * Gutenberg preview-window contract for the chart view link.
 *
 * @param {Object}        props
 * @param {number|string} props.postId
 * @param {string}        [props.previewLink]
 * @param {string}        [props.currentPostLink]
 * @param {boolean}       props.isSaveable
 * @param {string}        [props.postStatus]
 * @return {{ href: string, target: string, disabled: boolean }} Link props.
 */
export function assembleChartViewLink({
	postId,
	previewLink,
	currentPostLink,
	isSaveable,
	postStatus,
}) {
	if (getChartViewLinkMode(postStatus) === 'view') {
		const href = currentPostLink || '';
		return {
			href,
			target: '_blank',
			disabled: !href,
		};
	}
	return {
		href: previewLink || currentPostLink || '',
		target: `wp-preview-${postId}`,
		disabled: !isSaveable,
	};
}

/**
 * @param {string} [postStatus]
 * @return {'preview'|'view'} Unpublished charts preview; published charts view.
 */
export function getChartViewLinkMode(postStatus) {
	return postStatus === 'publish' ? 'view' : 'preview';
}

/**
 * Published charts open the live permalink. Unpublished charts autosave a
 * preview snapshot first, matching Gutenberg's PostPreviewButton.
 *
 * @param {string} [postStatus]
 * @return {boolean} Whether click should save for preview.
 */
export function shouldSaveChartForPreview(postStatus) {
	return getChartViewLinkMode(postStatus) === 'preview';
}
