/**
 * WordPress Dependencies
 */
import { applyFilters } from '@wordpress/hooks';

export const WIZARD_SCREENS_FILTER = 'prc-chart-builder.wizardScreens';

/**
 * Screens other plugins add to the chart creation wizard (for example, an
 * importer). The chart-type picker links to each screen; the wizard renders
 * the screen's component in place of the picker.
 *
 * Entry shape:
 * - `slug`         Unique id.
 * - `title`        Wizard title while the screen is open.
 * - `label`        Link text under the chart-type rail.
 * - `prompt`       Intro sentence after "Choose a chart type to get started."
 * - `promptAction` Link text that follows `prompt`.
 * - `promptSuffix` Text after the link.
 * - `component`    Receives `{ onBack, postId, onApplyChart, onChartCreated }`:
 *   - `postId`         Chart open in the editor, or null in the Add New Chart modal.
 *   - `onApplyChart`   Editor only. `({ content, title, notice, noticeId })` puts
 *                      serialized controller markup into the open chart.
 *   - `onChartCreated` Modal only. `(postId)` opens a chart the screen created.
 *
 * @return {Object[]} Registered screens.
 */
export function getWizardScreens() {
	const screens = applyFilters(WIZARD_SCREENS_FILTER, []);
	if (!Array.isArray(screens)) {
		return [];
	}
	return screens.filter((screen) => screen?.slug && screen.component);
}
