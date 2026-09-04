/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button, Placeholder as WPComPlaceholder } from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { chartBar } from '@wordpress/icons';

/**
 * Internal Dependencies
 */
import CreateNewChartModal from '../../includes/admin/src/components/create-new-chart-modal.jsx';
import { prefetchChartPatternsLibrary } from '../shared/select-chart-step';
import { applyControllerTemplateContent } from './utils/apply-controller-template';
import '../../includes/admin/src/style.scss';

/**
 * Classic Chart Builder Controller placeholder (trunk flow).
 *
 * Shows the Choose Chart Type button and opens the shared create-chart modal.
 * Used when the new chart creation UI rollout flag is disabled.
 *
 * @param {Object}   props
 * @param {string}   props.clientId      Controller block client id.
 * @param {Function} props.setAttributes Update controller attributes.
 */
export default function Placeholder({ clientId, setAttributes }) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const { replaceInnerBlocks } = useDispatch(blockEditorStore);
	const blockProps = useBlockProps();

	useEffect(() => {
		prefetchChartPatternsLibrary();
	}, []);

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
					'Choose a chart type and template to get started.',
					'prc-chart-builder'
				)}
				label={__('Chart Builder Controller', 'prc-chart-builder')}
				icon={chartBar}
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
