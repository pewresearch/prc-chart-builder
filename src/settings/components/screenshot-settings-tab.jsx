import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useDebounce } from '@wordpress/compose';
import {
	Notice,
	SelectControl,
	Spinner,
	TextControl,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { ConnectionBadge, SettingsAccordion } from '@prc/components';

import {
	fetchScreenshotSettings,
	saveScreenshotSettings,
} from '../store/screenshot-settings-api';

const ID_PREFIX = 'prc-chart-builder-screenshot-settings';

const NUMBER_FIELDS = [
	{
		id: 'delay_seconds',
		label: __('Render delay (seconds)', 'prc-chart-builder'),
		help: __(
			'Wait after the export page loads so the charting library can finish rendering.',
			'prc-chart-builder'
		),
		min: 0,
		max: 60,
	},
	{
		id: 'device_scale_factor',
		label: __('Device scale factor', 'prc-chart-builder'),
		help: __(
			'Retina multiplier for the captured PNG. Featured images default to 2.',
			'prc-chart-builder'
		),
		min: 1,
		max: 3,
	},
	{
		id: 'viewport_side_padding',
		label: __('Viewport side padding (px)', 'prc-chart-builder'),
		help: __(
			'Pixels added to each side of the chart layout so social whitespace is included.',
			'prc-chart-builder'
		),
		min: 0,
		max: 200,
	},
	{
		id: 'default_chart_width',
		label: __('Default chart width (px)', 'prc-chart-builder'),
		help: __(
			'Used when a chart block has no layout.width.',
			'prc-chart-builder'
		),
		min: 1,
		max: 2000,
	},
	{
		id: 'default_chart_height',
		label: __('Default chart height (px)', 'prc-chart-builder'),
		help: __(
			'Used when a chart block has no layout.height.',
			'prc-chart-builder'
		),
		min: 1,
		max: 2000,
	},
];

/**
 * Screenshot provider + capture-default pane for Charts → Settings.
 */
export default function ScreenshotSettingsTab() {
	const [payload, setPayload] = useState(null);
	const [draft, setDraft] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		let cancelled = false;

		fetchScreenshotSettings()
			.then((response) => {
				if (cancelled) {
					return;
				}
				setPayload(response);
				setDraft(response?.settings ?? null);
				setError(null);
			})
			.catch((loadError) => {
				if (cancelled) {
					return;
				}
				setError(
					loadError instanceof Error
						? loadError.message
						: __(
								'Unable to load screenshot settings.',
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

	const persist = useCallback((nextSettings) => {
		setSaving(true);
		setError(null);

		return saveScreenshotSettings(nextSettings)
			.then((response) => {
				setPayload(response);
				setDraft(response?.settings ?? nextSettings);
			})
			.catch((saveError) => {
				setError(
					saveError instanceof Error
						? saveError.message
						: __(
								'Unable to save screenshot settings.',
								'prc-chart-builder'
							)
				);
			})
			.finally(() => setSaving(false));
	}, []);

	const persistDebounced = useDebounce(persist, 800);

	// Flush pending capture-default saves before useDebounce cancels on unmount
	// (TabPanel only mounts the active tab).
	useEffect(() => {
		return () => {
			persistDebounced.flush();
		};
	}, [persistDebounced]);

	const updateField = useCallback(
		(key, value, immediate = false) => {
			if (!draft) {
				return;
			}

			const next = { ...draft, [key]: value };
			setDraft(next);

			if (immediate) {
				// Drop any queued full-draft save so it cannot overwrite this POST.
				persistDebounced.cancel();
				persist(next);
			} else {
				persistDebounced(next);
			}
		},
		[draft, persist, persistDebounced]
	);

	const providerOptions = useMemo(() => {
		const providers = payload?.providers ?? [];
		return [
			{
				label: __(
					'Auto-detect (first configured provider)',
					'prc-chart-builder'
				),
				value: '',
			},
			...providers.map((provider) => ({
				label: provider.configured
					? provider.label
					: `${provider.label} (${__('not configured', 'prc-chart-builder')})`,
				value: provider.slug,
			})),
		];
	}, [payload]);

	if (loading) {
		return (
			<div className="prc-settings__loading">
				<Spinner />
			</div>
		);
	}

	if (!draft || !payload) {
		return (
			<Notice status="error" isDismissible={false}>
				{error ||
					__(
						'Unable to load screenshot settings.',
						'prc-chart-builder'
					)}
			</Notice>
		);
	}

	const selectedProvider = (payload.providers ?? []).find(
		(provider) => provider.slug === draft.provider
	);
	const selectedNotConfigured =
		Boolean(draft.provider) &&
		selectedProvider &&
		!selectedProvider.configured;
	const isConfigured = Boolean(payload.resolved_provider);
	const credentialSlug = payload.provider_locked
		? payload.locked_provider
		: draft.provider || payload.resolved_provider || '';

	return (
		<VStack spacing={4} className="prc-chart-theme-settings__screenshot">
			{error ? (
				<Notice status="error" isDismissible={false}>
					{error}
				</Notice>
			) : null}
			<ul className="prc-settings__list">
				<li className="prc-settings__list-item">
					<SettingsAccordion
						slug="screenshot-provider"
						title={__('Provider', 'prc-chart-builder')}
						description={__(
							'Choose which screenshot backend captures chart featured images.',
							'prc-chart-builder'
						)}
						textDomain="prc-chart-builder"
						contentId={`${ID_PREFIX}-provider`}
						headingId={`${ID_PREFIX}-provider-heading`}
						descriptionId={`${ID_PREFIX}-provider-description`}
						badge={
							<ConnectionBadge
								connected={isConfigured}
								connectedLabel={__(
									'Configured',
									'prc-chart-builder'
								)}
								disconnectedLabel={__(
									'Not configured',
									'prc-chart-builder'
								)}
								textDomain="prc-chart-builder"
							/>
						}
						intro={
							<ProviderCredentialStatus
								providers={payload.providers ?? []}
								providerSlug={credentialSlug}
								providerLocked={payload.provider_locked}
								lockedProvider={payload.locked_provider}
							/>
						}
					>
						<VStack spacing={3}>
							<SelectControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={__(
									'Screenshot provider',
									'prc-chart-builder'
								)}
								help={
									payload.provider_locked
										? sprintf(
												/* translators: %s: VIP constant name and pinned slug */
												__(
													'Provider is pinned by %s and cannot be changed here.',
													'prc-chart-builder'
												),
												`PRC_PLATFORM_CHART_SCREENSHOT_PROVIDER (${payload.locked_provider})`
											)
										: __(
												'Auto-detect uses the first configured backend. Credentials still come from VIP constants.',
												'prc-chart-builder'
											)
								}
								value={
									payload.provider_locked
										? payload.locked_provider
										: draft.provider
								}
								options={providerOptions}
								disabled={payload.provider_locked || saving}
								onChange={(value) =>
									updateField('provider', value, true)
								}
							/>
							<Text variant="muted">
								{payload.resolved_provider
									? sprintf(
											/* translators: %s: active screenshot provider slug */
											__(
												'Active provider: %s',
												'prc-chart-builder'
											),
											payload.resolved_provider
										)
									: __(
											'No provider is configured yet. Set credentials or pick a configured backend.',
											'prc-chart-builder'
										)}
							</Text>
							{selectedNotConfigured ? (
								<Notice status="warning" isDismissible={false}>
									{__(
										'The selected provider is not configured. Featured-image capture will fail until its credentials are set.',
										'prc-chart-builder'
									)}
								</Notice>
							) : null}
						</VStack>
					</SettingsAccordion>
				</li>
				<li className="prc-settings__list-item">
					<SettingsAccordion
						slug="screenshot-defaults"
						title={__('Capture defaults', 'prc-chart-builder')}
						description={__(
							'These values replace the hardcoded defaults in the screenshot service. New captures use them immediately.',
							'prc-chart-builder'
						)}
						textDomain="prc-chart-builder"
						contentId={`${ID_PREFIX}-defaults`}
						headingId={`${ID_PREFIX}-defaults-heading`}
						descriptionId={`${ID_PREFIX}-defaults-description`}
					>
						<VStack spacing={3}>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={__(
									'Chart selector',
									'prc-chart-builder'
								)}
								help={__(
									'CSS selector the provider captures on the export page.',
									'prc-chart-builder'
								)}
								value={draft.selector}
								disabled={saving}
								onChange={(value) =>
									updateField('selector', value)
								}
							/>
							{NUMBER_FIELDS.map((field) => (
								<TextControl
									key={field.id}
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									type="number"
									min={field.min}
									max={field.max}
									label={field.label}
									help={field.help}
									value={String(draft[field.id] ?? '')}
									disabled={saving}
									onChange={(value) =>
										updateField(
											field.id,
											value === ''
												? payload.defaults[field.id]
												: Number(value)
										)
									}
								/>
							))}
						</VStack>
					</SettingsAccordion>
				</li>
			</ul>
		</VStack>
	);
}

/**
 * Lists VIP API key constants for the selected provider.
 *
 * @param {Object}  props
 * @param {Array}   props.providers
 * @param {string}  props.providerSlug
 * @param {boolean} props.providerLocked
 * @param {string}  props.lockedProvider
 */
function ProviderCredentialStatus({
	providers,
	providerSlug,
	providerLocked,
	lockedProvider,
}) {
	const selected = providers.find(
		(provider) => provider.slug === providerSlug
	);
	const constants = selected?.constants ?? [];

	return (
		<VStack spacing={2}>
			{providerLocked ? (
				<Text size={12} color="#757575">
					{sprintf(
						/* translators: %s: VIP constant name and pinned slug */
						__('Provider is pinned by %s.', 'prc-chart-builder'),
						`PRC_PLATFORM_CHART_SCREENSHOT_PROVIDER (${lockedProvider})`
					)}
				</Text>
			) : null}
			{constants.map((item) => (
				<Text
					key={item.name}
					size={12}
					color={item.set ? '#757575' : '#d63638'}
				>
					<code>{item.name}</code>{' '}
					{item.set
						? __('is set.', 'prc-chart-builder')
						: __('is not set.', 'prc-chart-builder')}
				</Text>
			))}
		</VStack>
	);
}
