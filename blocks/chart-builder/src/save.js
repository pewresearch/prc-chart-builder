/* eslint-disable react/jsx-no-useless-fragment */
/**
 * WordPress dependencies
 */

import { Fragment } from '@wordpress/element';
import { InnerBlocks } from '@wordpress/block-editor';

/** Returns a server side block callback */
const save = () => {
	return (
		<Fragment>
			<InnerBlocks.Content />
		</Fragment>
	);
};

export default save;
