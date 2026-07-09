import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Notice,
	__experimentalHStack as HStack,
} from '@wordpress/components';

import { TEXT_DOMAIN } from '../constants';
import { store } from '../store';
import { useThemeSave } from '../hooks/use-theme-save';

export default function GlobalSaveBar() {
	const isDirty = useSelect((select) => select(store).isDirty(), []);
	const isLoaded = useSelect((select) => select(store).isLoaded(), []);
	const { save, isSaving, error, clearError } = useThemeSave();

	if (!isLoaded || !isDirty) {
		return null;
	}

	return (
		<div className="prc-chart-theme-settings__global-save">
			{error ? (
				<Notice status="error" isDismissible onRemove={clearError}>
					{error}
				</Notice>
			) : null}
			<HStack justify="space-between" alignment="center">
				<span>{__('You have unsaved changes.', TEXT_DOMAIN)}</span>
				<Button variant="primary" onClick={save} isBusy={isSaving}>
					{isSaving
						? __('Saving…', TEXT_DOMAIN)
						: __('Save changes', TEXT_DOMAIN)}
				</Button>
			</HStack>
		</div>
	);
}
