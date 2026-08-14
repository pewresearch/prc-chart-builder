/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * WordPress Dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal Dependencies
 */
import { DesignSlugStatusInfo } from './design-slug-panel';
import { ReferencingPostsPanel } from './referencing-posts-panel';
import { ChartFlowHandoffBanner } from './chart-flow-handoff-banner';

/**
 * Styles
 */
import './editor.scss';

/**
 * Combined Panels Component
 */
function ChartEditorPanels() {
	return (
		<>
			<ChartFlowHandoffBanner />
			<DesignSlugStatusInfo />
			<ReferencingPostsPanel />
		</>
	);
}

// Register the plugin
registerPlugin('prc-chart-builder-inspector-panel', {
	render: ChartEditorPanels,
});
