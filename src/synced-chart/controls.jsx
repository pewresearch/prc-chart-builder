/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import {
	Button,
	TextControl,
	PanelBody,
	PanelRow,
} from '@wordpress/components';

/**
 * Internal Dependencies
 */

export default function Controls({ attributes, clientId, blocks }) {
	const { ref } = attributes;

	const [title, setTitle] = useEntityProp('postType', 'chart', 'title', ref);
	const [permalink] = useEntityProp('postType', 'chart', 'link', ref);
	const editLink = useMemo(() => {
		const url = new URL(window.location.href);
		url.searchParams.set('post', ref);
		return url.toString();
	}, [ref]);

	return (
		<InspectorControls>
			<PanelBody>
				<div>
					<TextControl
						__nextHasNoMarginBottom
						label={__('Chart Title')}
						value={title}
						onChange={setTitle}
					/>
					<PanelRow>
						<Button
							variant="secondary"
							onClick={() => {
								window.open(permalink, '_blank');
							}}
						>
							Preview chart in isolation
						</Button>
					</PanelRow>
					<PanelRow>
						<Button
							variant="secondary"
							onClick={() => {
								window.open(editLink, '_blank');
							}}
						>
							Edit chart in isolation
						</Button>
					</PanelRow>
				</div>
			</PanelBody>
		</InspectorControls>
	);
}
