import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { saveTheme } from '../api';
import { TEXT_DOMAIN } from '../constants';

/**
 * Shared save handler — any Save button POSTs the full theme draft.
 */
export function useThemeSave() {
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState(null);

	const save = useCallback(() => {
		setIsSaving(true);
		return saveTheme()
			.then(() => setError(null))
			.catch((saveError) =>
				setError(
					saveError instanceof Error
						? saveError.message
						: __('Unable to save chart theme.', TEXT_DOMAIN)
				)
			)
			.finally(() => setIsSaving(false));
	}, []);

	return {
		save,
		isSaving,
		error,
		clearError: () => setError(null),
	};
}
