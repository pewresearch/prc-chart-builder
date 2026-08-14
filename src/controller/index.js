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
import metadata from './block.json';
import registerChildToolbarFilter from './child-toolbar-filter';
import edit from './Edit'; // @TODO: After ben merge, rename to lowercase edit.js, commit, change back to edit.jsx
import './freeform-inserter-filter';
import initializeChartFixedToolbar from './pin-fixed-toolbar';
import save from './Save'; // @TODO: After ben merge, rename to lowercase save.js, commit, change back to save.jsx
import store from './store';
import './style.scss';
import transforms from './transforms';
import variations from './variations';

registerChildToolbarFilter();

function initializeUserPreferences() {
	dispatch(preferencesStore).setDefaults('prc-chart-builder/controller', {
		persistentHiddenTables: [],
	});
	initializeChartFixedToolbar();
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
