import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Notice,
	Spinner,
	ToggleControl,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';

import {
	fetchCreationUiSetting,
	saveCreationUiSetting,
} from '../store/creation-ui-api';

/**
 * Independently persisted rollout toggle for the new chart creation UI.
 *
 * Kept outside the theme settings store so theme Save / import / export never
 * touch this short-term feature flag.
 */
export default function CreationUiSetting() {
	const [enabled, setEnabled] = useState(false);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [loadFailed, setLoadFailed] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		let cancelled = false;

		fetchCreationUiSetting()
			.then((response) => {
				if (cancelled) {
					return;
				}
				setEnabled(response?.enabled === true);
				setLoadFailed(false);
				setError(null);
			})
			.catch((loadError) => {
				if (cancelled) {
					return;
				}
				setLoadFailed(true);
				setError(
					loadError instanceof Error
						? loadError.message
						: __(
								'Unable to load the chart creation UI setting.',
								'prc-chart-builder'
							)
				);
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const onToggle = useCallback(
		(nextEnabled) => {
			const previous = enabled;
			setEnabled(nextEnabled);
			setSaving(true);
			setError(null);

			saveCreationUiSetting(nextEnabled)
				.then((response) => {
					setEnabled(response?.enabled === true);
				})
				.catch((saveError) => {
					setEnabled(previous);
					setError(
						saveError instanceof Error
							? saveError.message
							: __(
									'Unable to save the chart creation UI setting.',
									'prc-chart-builder'
								)
					);
				})
				.finally(() => setSaving(false));
		},
		[enabled]
	);

	if (loading) {
		return (
			<div className="prc-chart-theme-settings__creation-ui-loading">
				<Spinner />
			</div>
		);
	}

	return (
		<VStack spacing={3} className="prc-chart-theme-settings__creation-ui">
			{error ? (
				<Notice status="error" isDismissible={false}>
					{error}
				</Notice>
			) : null}
			<ToggleControl
				label={__('Enable new chart creation UI', 'prc-chart-builder')}
				help={__(
					'Replaces the classic chart-type picker with the guided chart creation wizard for new chart posts.',
					'prc-chart-builder'
				)}
				checked={enabled}
				disabled={saving || loadFailed}
				onChange={onToggle}
			/>
			<Text variant="muted">
				{__(
					'This is a temporary site-level rollout control. It is not part of the portable chart theme.',
					'prc-chart-builder'
				)}
			</Text>
		</VStack>
	);
}
