/* eslint-disable no-param-reassign */
/**
 * WordPress Dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import { dispatch, register } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal Dependencies
 */
import './style.scss';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import store from './store';
import transforms from './transforms';
import variations from './variations';

function initializeUserPreferences() {
	dispatch(preferencesStore).setDefaults('prc-chart-builder/controller', {
		persistentHiddenTables: [],
	});
	register(store);
}

const { name } = metadata;
const settings = {
	edit,
	save,
	variations,
	transforms,
};

initializeUserPreferences();

registerBlockType(name, { ...metadata, ...settings });
