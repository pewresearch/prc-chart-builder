import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { Page } from '@wordpress/admin-ui';
import {
	TabPanel,
	Spinner,
	Notice,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { SettingsAccordion } from '@prc/components';

import './style.scss';
import { fetchTheme } from './store';
import { CURATED_CONFIG_GROUPS } from './constants';
import { formatGroupLabel } from './model';
import { getFieldsForGroup } from './field-registry';
import {
	PaletteDesigner,
	ConfigGroupGrid,
	CreationUiSetting,
	GlobalSaveBar,
	ScreenshotSettingsTab,
	ThemeImportExport,
} from './components';

const ID_PREFIX = 'prc-chart-builder-theme-settings';

/**
 * Chart Settings tab: the curated theme.config groups as an accordion list
 * (unchanged behavior — just relocated under the tab shell).
 */
function ChartSettingsTab() {
	return (
		<ul className="prc-settings__list">
			{CURATED_CONFIG_GROUPS.map((group) => (
				<li key={group} className="prc-settings__list-item">
					<SettingsAccordion
						slug={group}
						title={formatGroupLabel(group)}
						description={
							getFieldsForGroup(group)
								? __(
										'Chart default overrides for this attribute group (new charts only).',
										'prc-chart-builder'
									)
								: __(
										'No fields yet — add this group to the editor schema (schema.mjs) and rebuild settings.',
										'prc-chart-builder'
									)
						}
						textDomain={'prc-chart-builder'}
						contentId={`${ID_PREFIX}-config-${group}`}
						headingId={`${ID_PREFIX}-config-${group}-heading`}
						descriptionId={`${ID_PREFIX}-config-${group}-description`}
					>
						<ConfigGroupGrid groupKey={group} />
					</SettingsAccordion>
				</li>
			))}
		</ul>
	);
}

const TABS = [
	{
		name: 'chart',
		title: __('Chart Settings', 'prc-chart-builder'),
		className: 'prc-chart-theme-settings__tab',
	},
	{
		name: 'color',
		title: __('Color Settings', 'prc-chart-builder'),
		className: 'prc-chart-theme-settings__tab',
	},
	{
		name: 'screenshot',
		title: __('Screenshot Settings', 'prc-chart-builder'),
		className: 'prc-chart-theme-settings__tab',
	},
];

export default function ThemeSettingsApp() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Load the theme once for both tabs. Loading per-tab would re-fetch on every
	// tab switch and clobber the in-progress draft.
	useEffect(() => {
		fetchTheme()
			.then(() => setError(null))
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	}, []);

	return (
		<Page
			className="prc-settings prc-chart-theme-settings"
			title={__('Settings', 'prc-chart-builder')}
			subTitle={__(
				'Configure chart defaults for this site. Base config applies to newly inserted charts; existing charts keep their saved attributes unless they reference a themed palette by name.',
				'prc-chart-builder'
			)}
			actions={<ThemeImportExport disabled={loading || !!error} />}
			hasPadding
			headingLevel={1}
		>
			<GlobalSaveBar />
			{!loading && !error && (
				<VStack
					spacing={2}
					className="prc-chart-theme-settings__feature-previews"
				>
					<h2>{__('Feature previews', 'prc-chart-builder')}</h2>
					<Text className="prc-settings__header-description">
						{__(
							'Temporary rollout controls for unfinished chart editor experiences.',
							'prc-chart-builder'
						)}
					</Text>
					<CreationUiSetting />
				</VStack>
			)}
			{error && (
				<Notice status="error" isDismissible={false}>
					<VStack spacing={2}>
						<span>
							{__('Error loading settings:', 'prc-chart-builder')}{' '}
							{error}
						</span>
						<span>
							{__(
								'Confirm you have permission to manage theme options and try again.',
								'prc-chart-builder'
							)}
						</span>
					</VStack>
				</Notice>
			)}
			{loading ? (
				<div className="prc-settings__loading">
					<Spinner />
				</div>
			) : (
				!error && (
					<TabPanel
						className="prc-chart-theme-settings__tabs"
						tabs={TABS}
					>
						{(tab) => {
							if (tab.name === 'color') {
								return <PaletteDesigner />;
							}
							if (tab.name === 'screenshot') {
								return <ScreenshotSettingsTab />;
							}
							return <ChartSettingsTab />;
						}}
					</TabPanel>
				)
			)}
		</Page>
	);
}
