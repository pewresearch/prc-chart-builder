import { useCallback, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	DropdownMenu,
	FormFileUpload,
	MenuGroup,
	MenuItem,
	Modal,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

import { TEXT_DOMAIN } from '../constants';
import { store } from '../store';
import { downloadThemeJson, parseThemeJsonText } from '../import-export';

export default function ThemeImportExport({ disabled = false }) {
	const theme = useSelect((select) => select(store).getSettings(), []);
	const { replaceTheme } = useDispatch(store);
	const { createErrorNotice } = useDispatch(noticesStore);
	const [pendingTheme, setPendingTheme] = useState(null);

	const handleDownload = useCallback(() => {
		downloadThemeJson(theme);
	}, [theme]);

	const handleUpload = useCallback(
		(event) => {
			const file = event.currentTarget.files?.[0];
			event.currentTarget.value = '';
			if (!file) {
				return;
			}

			const reader = new window.FileReader();
			reader.onload = () => {
				const result = parseThemeJsonText(String(reader.result ?? ''));
				if ('error' in result) {
					createErrorNotice(result.error, { type: 'snackbar' });
					setPendingTheme(null);
					return;
				}
				setPendingTheme(result.theme);
			};
			reader.onerror = () => {
				createErrorNotice(
					__('Could not read the selected file.', TEXT_DOMAIN),
					{ type: 'snackbar' }
				);
				setPendingTheme(null);
			};
			reader.readAsText(file);
		},
		[createErrorNotice]
	);

	const confirmReplace = useCallback(() => {
		if (!pendingTheme) {
			return;
		}
		replaceTheme(pendingTheme);
		setPendingTheme(null);
	}, [pendingTheme, replaceTheme]);

	const cancelReplace = useCallback(() => {
		setPendingTheme(null);
	}, []);

	return (
		<>
			<FormFileUpload
				accept=".json,application/json"
				onChange={handleUpload}
				render={({ openFileDialog }) => (
					<DropdownMenu
						icon={moreVertical}
						label={__('More options', TEXT_DOMAIN)}
						toggleProps={{ disabled }}
						className="prc-chart-theme-settings__import-export"
					>
						{() => (
							<MenuGroup label={__('Theme JSON', TEXT_DOMAIN)}>
								<MenuItem
									info={__(
										'Upload a JSON file to replace the draft',
										TEXT_DOMAIN
									)}
									onClick={openFileDialog}
									disabled={disabled}
								>
									{__('Import', TEXT_DOMAIN)}
								</MenuItem>
								<MenuItem
									info={__(
										'Download the current theme draft as JSON',
										TEXT_DOMAIN
									)}
									onClick={handleDownload}
									disabled={disabled}
								>
									{__('Export', TEXT_DOMAIN)}
								</MenuItem>
							</MenuGroup>
						)}
					</DropdownMenu>
				)}
			/>
			{pendingTheme ? (
				<Modal
					title={__('Replace theme draft', TEXT_DOMAIN)}
					onRequestClose={cancelReplace}
				>
					<VStack spacing={4}>
						<p>
							{__(
								'Replace the current chart theme draft with the uploaded JSON? Unsaved changes will be lost. Save afterward to persist.',
								TEXT_DOMAIN
							)}
						</p>
						<HStack justify="flex-end" spacing={2}>
							<Button variant="tertiary" onClick={cancelReplace}>
								{__('Cancel', TEXT_DOMAIN)}
							</Button>
							<Button variant="primary" onClick={confirmReplace}>
								{__('Replace draft', TEXT_DOMAIN)}
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) : null}
		</>
	);
}
