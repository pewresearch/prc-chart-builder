import { useState } from '@wordpress/element';
import {
	Button,
	Modal,
	TextControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { TEXT_DOMAIN } from '../constants';

/**
 * Delete confirmation: user must type the palette slug to proceed.
 *
 * @param {{
 *   slug: string,
 *   label: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export default function PaletteDeleteDialog({
	slug,
	label,
	onConfirm,
	onCancel,
}) {
	const [confirmSlug, setConfirmSlug] = useState('');
	const canDelete = confirmSlug === slug;

	return (
		<Modal
			title={__('Delete palette', TEXT_DOMAIN)}
			onRequestClose={onCancel}
			className="prc-palette-designer__delete-modal"
		>
			<VStack spacing={4}>
				<p>
					{sprintf(
						// translators: %s: palette display name.
						__(
							'This will permanently remove the “%s” palette from the theme. Charts that reference it by slug will fall back to the general theme colors.',
							TEXT_DOMAIN
						),
						label || slug
					)}
				</p>
				<p>
					{__('Type', TEXT_DOMAIN)} <code>{slug}</code>{' '}
					{__('below to confirm deletion.', TEXT_DOMAIN)}
				</p>
				<TextControl
					label={__('Palette slug', TEXT_DOMAIN)}
					value={confirmSlug}
					onChange={setConfirmSlug}
					__nextHasNoMarginBottom
				/>
				<div className="prc-palette-designer__delete-modal-actions">
					<Button variant="tertiary" onClick={onCancel}>
						{__('Cancel', TEXT_DOMAIN)}
					</Button>
					<Button
						variant="primary"
						isDestructive
						disabled={!canDelete}
						onClick={() => {
							if (canDelete) {
								onConfirm();
							}
						}}
					>
						{__('Delete palette', TEXT_DOMAIN)}
					</Button>
				</div>
			</VStack>
		</Modal>
	);
}
