/**
 * WordPress Dependencies
 */
import { createBlock } from '@wordpress/blocks';

const transforms = {
	from: [
		{
			type: 'shortcode',
			tag: 'chart',
			transform({
				named: { id, slug, title, classes, width, titleDisable },
			}) {
				// ensure id is a number
				return createBlock('prc-block/chart', {
					ref: parseInt(id, 10),
					legacyChart: true,
				});
			},
			isMatch({ named: { id } }) {
				return !!id;
			},
		},
		{
			type: 'block',
			blocks: ['core/shortcode'],
			transform: ({ text }) => {
				const id = text.match(/\d+/)[0];
				return createBlock('prc-block/chart', {
					ref: parseInt(id, 10),
					legacyChart: true,
				});
			},
		},
		// {
		// 	type: 'raw',
		// 	pattern: /pewresearch\.org\/chart\/\d+/,
		// 	transform: ({ text }) => {
		// 		const id = text.match(/\d+/)[0];
		// 		return createBlock('prc-block/chart', {
		// 			ref: parseInt(id, 10),
		// 			legacyChart: true,
		// 		});
		// 	},
		// },
	],
};

// @TODO: add a transform to convert a link to a chart into a chart block...

export default transforms;
