/**
 * WordPress Dependencies
 */

import {
	createNewPost,
	enablePageDialogAccept,
	insertBlock,
	getEditedPostContent,
	selectBlockByClientId,
	getAllBlocks,
	openPreviewPage,
	isThemeInstalled,
} from '@wordpress/e2e-test-utils';

/**
 * Internal Dependencies
 */

describe('Default Quiz Tests:', () => {
	beforeAll(async () => {
		await enablePageDialogAccept();
	});

	beforeEach(async () => {
		await createNewPost();
	});

	it('Sanity Check, is prc-parent theme installed?', async () => {
		// This has no real use, is just to test a condition that should fail because this runs in a minimal container through wp-env. 
		const isInstalled = await isThemeInstalled('prc-parent');
		expect(isInstalled).toBe(true);
	});

	it('1. "Knowledge Quiz" can be inserted into block editor and selected', async () => {
		await insertBlock('Knowledge Quiz');

		const blocks = await getAllBlocks();
		const firstBlock = blocks[0];
		const { type } = firstBlock.attributes;

		expect(type).toBe('quiz');
		expect(await getEditedPostContent()).not.toBeNull();
	});

	it('2. "Typology Quiz" can be inserted into block editor and selected', async () => {
		await insertBlock('Typology Quiz');

		const blocks = await getAllBlocks();
		const firstBlock = blocks[0];
		const { type } = firstBlock.attributes;

		expect(type).toBe('typology');
		expect(await getEditedPostContent()).not.toBeNull();
	});
});
