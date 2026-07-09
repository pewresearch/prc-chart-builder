/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button, Placeholder as WPComPlaceholder } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { chartArea } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import CreateNewChartModal from '../../includes/admin/src/components/create-new-chart-modal.jsx';
import { applyControllerTemplateContent } from './utils/apply-controller-template';
import '../../includes/admin/src/style.scss';

export default function Placeholder({ clientId, setAttributes }) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const { replaceInnerBlocks } = useDispatch(blockEditorStore);
	const blockProps = useBlockProps();

	const handleOpenCreate = useCallback(() => setIsCreateOpen(true), []);
	const handleCloseCreate = useCallback(() => setIsCreateOpen(false), []);
	const handleAfterCreate = useCallback(
		async (_postId, result) => {
			const content = result?.content?.raw ?? result?.content;
			if (!content) {
				throw new Error('No content returned from chart creation.');
			}

			const applied = applyControllerTemplateContent({
				content,
				clientId,
				setAttributes,
				replaceInnerBlocks,
			});
			if (!applied) {
				throw new Error(
					'Failed to apply chart template — no controller block found in content.'
				);
			}
		},
		[clientId, replaceInnerBlocks, setAttributes]
	);

	return (
		<div {...blockProps}>
			<WPComPlaceholder
				instructions={__(
					'Choose a chart type, pattern, or import path to build your chart.',
					'prc-chart-builder'
				)}
				label={__('Chart Builder Controller', 'prc-chart-builder')}
				icon={chartArea}
			>
				<Button variant="primary" onClick={handleOpenCreate}>
					{__('Choose Chart Type', 'prc-chart-builder')}
				</Button>
			</WPComPlaceholder>
			<CreateNewChartModal
				isOpen={isCreateOpen}
				onOpen={handleOpenCreate}
				onClose={handleCloseCreate}
				hideTrigger
				mode="inline"
				afterCreate={handleAfterCreate}
			/>
		</div>
	);
}
