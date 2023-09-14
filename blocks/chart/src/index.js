/**
 * WordPress Dependencies
 */
import { symbol as icon } from '@wordpress/icons';
import { registerBlockType } from '@wordpress/blocks';
import { registerPlugin } from '@wordpress/plugins';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal Dependencies
 */
import metadata from './block.json';
import Edit from './Edit';
import transforms from './transforms';
import ConvertToSyncedChartBlockSettingMenuItem from './ConvertToSyncedChart';
import './editor.scss';

const { name } = metadata;

const settings = {
	icon,
	/**
	 * @see ./Edit.jsx
	 */
	edit: Edit,
	/**
	 * @see ./transforms.js
	 */
	transforms,
};

/**
 * Every block starts by registering a new block type definition.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/#registering-a-block
 */
registerBlockType(name, { ...metadata, ...settings });

registerPlugin('block-settings-menu-synced-chart', {
	render: ConvertToSyncedChartBlockSettingMenuItem,
});

// setTimeout(() => {
// 	// if post type is chart then don't allow inserting the chart block.
// 	addFilter(
// 		'blocks.registerBlockType',
// 		'chart/disable-inserter-on-chart-post-type',
// 		(s, n) => {
// 			if (n === 'prc-block/chart') {
// 				const postType = window.prcEditorPostType;
// 				if (postType === 'chart') {
// 					s.supports = { ...s.supports, inserter: false };
// 				}
// 			}
// 			return s;
// 		}
// 	);
// }, 1000);
