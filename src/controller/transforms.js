/**
 * WordPress Dependencies
 */
import { createBlock } from '@wordpress/blocks';

export default {
	from: [
		{
			type: 'block',
			blocks: ['core/table', 'prc-block/table'],
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
						createBlock('prc-block/table', {
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
			blocks: ['prc-block/table'],
			transform: (attributes, innerBlocks) => {
				const table = innerBlocks.filter(
					(block) => 'prc-block/table' === block.name
				)[0];
				return createBlock('prc-block/table', table.attributes);
			},
		},
	],
};
