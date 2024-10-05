/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { register } from '@wordpress/data';
import { addAction } from '@wordpress/hooks';

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
addAction('editor.savePost', 'editor', async (edits) => {
	console.log({ edits });
	throw { message: 'This is the error message.' };
});
