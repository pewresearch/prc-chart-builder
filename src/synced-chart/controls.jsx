/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';
import {
	Button,
	Notice,
	TextControl,
	PanelBody,
	PanelRow,
} from '@wordpress/components';

export default function Controls({
	attributes,
	clientId,
	blocks,
	effectiveRef,
	isForkActive,
	isLocked = false,
}) {
	const { ref } = attributes;
	const displayRef = effectiveRef ?? ref;

	const [title, setTitle] = useEntityProp(
		'postType',
		'chart',
		'title',
		displayRef
	);
	const [permalink] = useEntityProp('postType', 'chart', 'link', displayRef);
	const editLink = useMemo(() => {
		if (!displayRef) return '';
		const url = new URL(window.location.href);
		url.searchParams.set('post', displayRef);
		return url.toString();
	}, [displayRef]);

	return (
		<>
			<InspectorControls>
				<PanelBody>
					{isForkActive && (
						<Notice status="warning" isDismissible={false}>
							{__(
								'Preview and edit links will open the future revision.',
								'prc-chart-builder'
							)}
						</Notice>
					)}
					<div>
						<TextControl
							__nextHasNoMarginBottom
							label={__('Chart Title')}
							value={title}
							onChange={setTitle}
							disabled={isLocked}
						/>
						<PanelRow>
							<Button
								variant="secondary"
								onClick={() => {
									window.open(permalink, '_blank');
								}}
							>
								{__('Preview chart in isolation')}
							</Button>
						</PanelRow>
						<PanelRow>
							<Button
								variant="secondary"
								onClick={() => {
									window.open(editLink, '_blank');
								}}
							>
								{isLocked
									? __('View chart in isolation')
									: __('Edit chart in isolation')}
							</Button>
						</PanelRow>
					</div>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
