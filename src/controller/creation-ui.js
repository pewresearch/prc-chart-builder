/**
 * Pure helpers for the chart creation UI rollout flag.
 */

/**
 * Whether the localized library payload has the new creation UI enabled.
 *
 * Reads `newChartCreationUi.enabled` from the nested localization object so
 * the value remains a real boolean after `wp_localize_script` (top-level
 * scalars are stringified).
 *
 * @param {unknown} localizedData Window localization payload.
 * @return {boolean} True only for an explicit boolean `true`.
 */
export function isNewCreationUiEnabled(localizedData) {
	if (!localizedData || typeof localizedData !== 'object') {
		return false;
	}

	const features = localizedData.newChartCreationUi;
	return (
		!!features && typeof features === 'object' && features.enabled === true
	);
}

/**
 * Whether the controller should host the full chart CPT wizard.
 *
 * @param {Object}  args
 * @param {boolean} args.enabled       Site-level rollout flag.
 * @param {string}  args.postType      Current editor post type.
 * @param {boolean} args.isPreviewMode Whether the editor is in preview mode.
 * @return {boolean} True when the live chart CPT should host the wizard.
 */
export function shouldHostCptWizard({ enabled, postType, isPreviewMode }) {
	return enabled && postType === 'chart' && !isPreviewMode;
}
