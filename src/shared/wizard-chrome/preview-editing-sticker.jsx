/**
 * Corner flag on the chart preview while a non-default viewport is selected
 * for editing. Desktop writes the base attributes, so the flag stays hidden.
 */
import { __, sprintf } from '@wordpress/i18n';

import { PREVIEW_VIEWPORTS } from './preview-viewport-toggle';

/**
 * @param {Object} props
 * @param {string} props.viewport `'desktop'` | `'tablet'` | `'mobile'`.
 * @return {import('react').ReactNode} The flag, or null on the base view.
 */
export default function PreviewEditingSticker({ viewport }) {
	const match = PREVIEW_VIEWPORTS.find((item) => item.value === viewport);
	if (!match || match.value === 'desktop') {
		return null;
	}

	return (
		<div className="prc-chart-wizard__viewport-sticker" role="status">
			{sprintf(
				// translators: %s: lowercase viewport name, such as tablet or mobile.
				__('Editing %s attributes', 'prc-chart-builder'),
				match.label.toLowerCase()
			)}
		</div>
	);
}
