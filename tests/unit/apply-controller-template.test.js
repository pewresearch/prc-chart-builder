/**
 * @jest-environment jsdom
 */

import { parse } from '@wordpress/blocks';

import { applyControllerTemplateContent } from '../../src/controller/utils/apply-controller-template';

jest.mock('@wordpress/blocks', () => ({
	parse: jest.fn(),
}));

describe('applyControllerTemplateContent', () => {
	it('applies controller attributes and inner blocks without overwriting preserved keys', () => {
		const innerBlocks = [
			{
				name: 'prc-chart-builder/chart',
				attributes: {},
				innerBlocks: [],
			},
			{ name: 'prc-block/table', attributes: {}, innerBlocks: [] },
		];

		parse.mockReturnValue([
			{
				name: 'prc-chart-builder/controller',
				attributes: { chartType: 'bar', id: 'template-id' },
				innerBlocks,
			},
		]);

		const setAttributes = jest.fn();
		const replaceInnerBlocks = jest.fn();

		const applied = applyControllerTemplateContent({
			content: '<!-- serialized markup -->',
			clientId: 'controller-client-id',
			setAttributes,
			replaceInnerBlocks,
		});

		expect(applied).toBe(true);
		expect(parse).toHaveBeenCalledWith('<!-- serialized markup -->', {
			__unstableSkipMigrationLogs: true,
		});
		expect(setAttributes).toHaveBeenCalledWith({ chartType: 'bar' });
		expect(setAttributes).not.toHaveBeenCalledWith(
			expect.objectContaining({ id: 'template-id' })
		);
		expect(replaceInnerBlocks).toHaveBeenCalledWith(
			'controller-client-id',
			innerBlocks,
			true
		);
	});
});
