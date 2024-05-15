/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { register } from '@wordpress/data';
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
