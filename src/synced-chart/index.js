/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal Dependencies
 */
import metadata from './block.json';
import edit from './edit';
import icon from './icon';
import ConvertToSyncedChartBlockSettingMenuItem from './convert-to-synced-chart';
// import registerChartLibraryMediaPanel from './__wip__media-inserter-panel';
import './editor.scss';

const { name } = metadata;

const settings = {
	icon,
	edit,
};

registerBlockType(name, { ...metadata, ...settings });

registerPlugin('block-settings-menu-synced-chart', {
	render: ConvertToSyncedChartBlockSettingMenuItem,
});

// registerChartLibraryMediaPanel();
