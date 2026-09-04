/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { register } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import './apply-theme-block-defaults-filter';
import metadata from './block.json';
import deprecated from './deprecations';
import edit from './edit';
import save from './save';
import store from './edit/store';

const { name } = metadata;
const settings = {
	/**
	 * @see ./edit/index.jsx
	 */
	edit,
	/**
	 * @see ./Save.jsx
	 */
	save,
	/**
	 * @see ./deprecations/
	 */
	deprecated,
};

register(store);

registerBlockType(name, { ...metadata, ...settings });

/**
 * @benwormald use our hooks
 * prc-platform.onIncrementalSave` Occurs often, whenever a post in a `draft` state is updated.
  - `prc-platform.onPublish` Occurs when a post transitions from `draft` to `publish` state.
  - `prc-platform.onUpdate` Occurs when a post is either in `draft` or `publish` state and is updated.
 */
// addAction('editor.savePost', 'editor', async (edits) => {
// 	console.log('async:savePost', { edits });
// 	const blockClientIds = select('core/block-editor').getBlocksByName(
// 		'prc-chart-builder/chart'
// 	);

// 	blockClientIds.forEach((blockClientId) => {
// 		createSVG(blockClientId);
// 	});

// 	// You can run actions, after the post has been saved, here.
// });
