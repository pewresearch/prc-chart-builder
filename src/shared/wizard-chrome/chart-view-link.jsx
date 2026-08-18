/**
 * Opens the Gutenberg view/preview URL for the current chart.
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';

import {
	assembleChartViewLink,
	shouldSaveChartForPreview,
} from './chart-view-link-props';

/**
 * @return {import('react').ReactNode} View/preview control, or null when the post type is not viewable.
 */
export default function ChartViewLink() {
	const {
		postId,
		currentPostLink,
		previewLink,
		isSaveable,
		isViewable,
		postStatus,
	} = useSelect((select) => {
		const editor = select(editorStore);
		const postType = select(coreStore).getPostType(
			editor.getCurrentPostType()
		);
		const viewable = postType?.viewable ?? false;
		if (!viewable) {
			return { isViewable: false };
		}
		return {
			postId: editor.getCurrentPostId(),
			currentPostLink: editor.getCurrentPostAttribute('link'),
			previewLink: editor.getEditedPostPreviewLink(),
			isSaveable: editor.isEditedPostSaveable(),
			isViewable: viewable,
			postStatus: editor.getEditedPostAttribute('status'),
		};
	}, []);
	const { __unstableSaveForPreview } = useDispatch(editorStore);

	if (!isViewable) {
		return null;
	}

	const { href, target, disabled } = assembleChartViewLink({
		postId,
		previewLink,
		currentPostLink,
		isSaveable,
		postStatus,
	});
	const isPreview = shouldSaveChartForPreview(postStatus);

	const handleClick = async (event) => {
		if (!isPreview) {
			if (disabled) {
				event.preventDefault();
			}
			return;
		}
		event.preventDefault();
		if (disabled) {
			return;
		}
		const previewWindow = window.open('', target);
		previewWindow?.focus();
		const link = await __unstableSaveForPreview();
		if (previewWindow && link) {
			previewWindow.location = link;
		}
	};

	return (
		<div className="prc-chart-wizard__view-chart">
			<Button
				variant={isPreview ? 'primary' : 'secondary'}
				href={href}
				target={target}
				rel="noreferrer"
				disabled={disabled}
				onClick={handleClick}
				icon={isPreview ? external : undefined}
				iconPosition="right"
				__next40pxDefaultSize
			>
				{isPreview
					? __('Preview in new tab', 'prc-chart-builder')
					: __('View Chart', 'prc-chart-builder')}
			</Button>
		</div>
	);
}
