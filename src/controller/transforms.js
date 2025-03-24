/**
 * WordPress Dependencies
 */
import { createBlock } from '@wordpress/blocks';

export default {
	from: [
		{
			type: 'block',
			blocks: ['core/table', 'flexible-table-block/table'],
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
						createBlock('flexible-table-block/table', {
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
			blocks: ['flexible-table-block/table'],
			transform: (attributes, innerBlocks) => {
				const table = innerBlocks.filter(
					(block) => 'flexible-table-block/table' === block.name
				)[0];
				return createBlock(
					'flexible-table-block/table',
					table.attributes
				);
			},
		},
	],
};
