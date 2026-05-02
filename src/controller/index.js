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
import './freeform-inserter-filter';
import registerChildToolbarFilter from './child-toolbar-filter';
import metadata from './block.json';
import edit from './Edit'; // @TODO: After ben merge, rename to lowercase edit.js, commit, change back to edit.jsx
import save from './Save'; // @TODO: After ben merge, rename to lowercase save.js, commit, change back to save.jsx
import store from './store';
import transforms from './transforms';
import variations from './variations';

registerChildToolbarFilter();

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
