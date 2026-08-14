/**
 * CreateNewChartModal — the compact (modal) host for the chart-creation wizard.
 *
 * Thin shell: a trigger button + a `<Modal>` wrapping the container-agnostic
 * `ChartWizard` at `layout="compact"`. Still used by the classic controller
 * placeholder when the CPT creation UI is off.
 *
 * Synced-chart Create New Chart currently opens post-new.php in a new tab
 * instead of this modal (same as Chart Library). Keep this chrome available in
 * case we reactivate the synced-chart modal flow or remove it later.
 */
import { Button, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';

import ChartWizard from './chart-wizard';

/**
 * @param {Object}   props
 * @param {boolean}  props.isOpen        Whether the modal is open.
 * @param {Function} props.onOpen        Open the modal (trigger button).
 * @param {Function} props.onClose       Close/dismiss the modal.
 * @param {Function} [props.afterCreate] Inline insert handler `(postId, chart) => Promise<void>`.
 * @param {boolean}  [props.hideTrigger] Hide the built-in "Add New Chart" button.
 * @param {string}   [props.mode]        'create-post' or 'inline'.
 */
export default function CreateNewChartModal({
	isOpen,
	onOpen,
	onClose,
	afterCreate,
	hideTrigger = false,
	mode = 'create-post',
}) {
	const [title, setTitle] = useState(
		mode === 'inline'
			? __('Add Chart', 'prc-chart-builder')
			: __('Add New Chart', 'prc-chart-builder')
	);

	return (
		<>
			{!hideTrigger && (
				<Button
					variant="primary"
					onClick={onOpen}
					icon={plus}
					__next40pxDefaultSize
				>
					{__('Add New Chart', 'prc-chart-builder')}
				</Button>
			)}

			{isOpen && (
				<Modal
					title={title}
					onRequestClose={onClose}
					className="prc-chart-modal"
					size="large"
				>
					<ChartWizard
						mode={mode}
						layout="compact"
						afterCreate={afterCreate}
						onExit={onClose}
						onTitleChange={setTitle}
					/>
				</Modal>
			)}
		</>
	);
}
