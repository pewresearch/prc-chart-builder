import { __ } from '@wordpress/i18n';
import { createSettingsClient } from '@prc/components';

import { store } from './store';

export const { fetchSettings: fetchTheme, saveSettings: saveTheme } =
	createSettingsClient({
		restPath: '/prc-chart-builder/v1/theme',
		store,
		successMessage: __('Chart theme saved.', 'prc-chart-builder'),
	});
