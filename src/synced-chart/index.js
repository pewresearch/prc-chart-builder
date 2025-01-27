/**
 * WordPress Dependencies
 */
import { symbol as icon } from '@wordpress/icons';
import { registerBlockType } from '@wordpress/blocks';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal Dependencies
 */
import metadata from './block.json';
import edit from './Edit';
import ConvertToSyncedChartBlockSettingMenuItem from './ConvertToSyncedChart';
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
