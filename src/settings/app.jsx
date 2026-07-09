import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import {
	TabPanel,
	Spinner,
	Notice,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';
import { SettingsAccordion } from '@prc/components';

import './style.scss';
import './store';
import { fetchTheme } from './api';
import { CURATED_CONFIG_GROUPS, TEXT_DOMAIN } from './constants';
import { formatGroupLabel } from './utils';
import { getFieldsForGroup } from './field-registry';
import PaletteDesigner from './components/palette-designer';
import ConfigGroupGrid from './components/config-group-grid';
import GlobalSaveBar from './components/global-save-bar';

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
										TEXT_DOMAIN
									)
								: __(
										'No fields yet — add this group to the editor schema (schema.mjs) and rebuild settings.',
										TEXT_DOMAIN
									)
						}
						textDomain={TEXT_DOMAIN}
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
		title: __('Chart Settings', TEXT_DOMAIN),
		className: 'prc-chart-theme-settings__tab',
	},
	{
		name: 'color',
		title: __('Color Settings', TEXT_DOMAIN),
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
		<div className="prc-settings prc-chart-theme-settings">
			<GlobalSaveBar />
			<VStack spacing={2} className="prc-settings__header">
				<h1>{__('Chart Theme', TEXT_DOMAIN)}</h1>
				<Text className="prc-settings__header-description">
					{__(
						'Configure chart defaults for this site. Base config applies to newly inserted charts; existing charts keep their saved attributes unless they reference a themed palette by name.',
						TEXT_DOMAIN
					)}
				</Text>
			</VStack>
			{error && (
				<Notice status="error" isDismissible={false}>
					<VStack spacing={2}>
						<span>
							{__('Error loading settings:', TEXT_DOMAIN)} {error}
						</span>
						<span>
							{__(
								'Confirm you have permission to manage theme options and try again.',
								TEXT_DOMAIN
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
						{(tab) =>
							tab.name === 'color' ? (
								<PaletteDesigner />
							) : (
								<ChartSettingsTab />
							)
						}
					</TabPanel>
				)
			)}
		</div>
	);
}
