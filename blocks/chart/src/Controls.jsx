/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { Fragment } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { Button, TextControl, PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import ConvertToDetachedChart from './ConvertToDetachedChart';

export default function Controls({ attributes, clientId, blocks }) {
	const { ref } = attributes;

	const [title, setTitle] = useEntityProp('postType', 'chart', 'title', ref);
	const [permalink] = useEntityProp('postType', 'chart', 'link', ref);

	return (
		<Fragment>
			<ConvertToDetachedChart {...{ blocks, clientId }} />
			<InspectorControls>
				<PanelBody>
					<div>
						<TextControl
							__nextHasNoMarginBottom
							label={__('Chart Title')}
							value={title}
							onChange={setTitle}
						/>
						<Button
							variant="secondary"
							onClick={() => {
								window.open(permalink, '_blank');
							}}
						>
							Open in new window
						</Button>
					</div>
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
}
