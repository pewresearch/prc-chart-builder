/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { registerPlugin } from '@wordpress/plugins';
import { register } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import metadata from './block.json';
import edit from './edit';
import icon from './icon';
import ConvertToSyncedChartBlockSettingMenuItem from './convert-to-synced-chart';
import controllerStore from '../controller/store';
// import registerChartLibraryMediaPanel from './__wip__media-inserter-panel';
import './editor.scss';
import './style.scss';
import '../../includes/admin/src/style.scss';

// Ensure controller store is registered for table visibility controls
register(controllerStore);

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
