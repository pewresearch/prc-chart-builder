/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { register } from '@wordpress/data';
import { addFilter, addAction } from '@wordpress/hooks';

/**
 * Internal Dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import './styles.scss';
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
};

register(store);

registerBlockType(name, { ...metadata, ...settings });

// TODO: test savePost filter for adding pngs and svgs
addFilter('editor.preSavePost', 'editor', (edits) => {
	console.log('preSavePost', { edits });
	// You must always in some form return the edits object. Even if you don't edit anything in it you must return it.
	// If you throw something here it will stop saving from occuring.
	// throw { message: 'This is an error' };
	return edits;
});
addFilter('editor.preSavePost', 'editor', async (edits) => {
	console.log('async:preSavePost', { edits });
	// You must always in some form return the edits object. Even if you don't edit anything in it you must return it.
	return edits;
});
addAction('editor.savePost', 'editor', (edits) => {
	console.log('savePost', { edits });
	// You can run actions, after the post has been saved, here.
	// You can return a promise reject here to be signaled as an error.
});
addAction('editor.savePost', 'editor', async (edits) => {
	console.log('async:savePost', { edits });
	// You can run actions, after the post has been saved, here.
});

