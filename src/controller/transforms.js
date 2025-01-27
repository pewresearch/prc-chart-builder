/**
 * WordPress Dependencies
 */
import { createBlock } from '@wordpress/blocks';

export default {
	from: [
		{
			type: 'block',
			blocks: ['core/table', 'core/table'],
			transform: (attributes) => {
				attributes.className = 'chart-builder-data-table';
				return createBlock(
					'prc-block/chart-builder-controller',
					{
						transformed: true,
						isConvertedChart: true,
						tableHead: attributes.head,
						tableBody: attributes.body,
					},
					[
						createBlock('core/table', {
							...attributes,
						}),
						createBlock('prc-block/chart-builder', {
							isConvertedChart: true,
						}),
					]
				);
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: ['core/table'],
			transform: (attributes, innerBlocks) => {
				const table = innerBlocks.filter(
					(block) => 'core/table' === block.name
				)[0];
				return createBlock('core/table', table.attributes);
			},
		},
	],
};
