import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	Button,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { SettingsSectionFooter } from '@prc/components';

import { TEXT_DOMAIN } from '../constants';
import { getFieldsForGroup } from '../field-registry';
import { getShippedGroupDefault } from '../shipped-defaults';
import { getAtPath, isFieldOverridden } from '../path-utils';
import { store } from '../store';
import { useThemeSave } from '../hooks/use-theme-save';
import ConfigFieldControl from './config-field-control';
import { formatShippedDefaultValue } from '../format-shipped-default';
import {
	buildConfigGridRows,
	configGridNamePadding,
} from '../field-grid-layout';

/**
 * @param {{ groupKey: string }} props
 */
export default function ConfigGroupGrid({ groupKey }) {
	const fields = getFieldsForGroup(groupKey);
	const { setConfigField, resetConfigField } = useDispatch(store);
	const { save, isSaving, error, clearError } = useThemeSave();

	const { group, shippedGroup } = useSelect(
		(select) => {
			const settings = select(store).getSettings();
			const groupValue = settings?.config?.[groupKey];
			return {
				group:
					groupValue &&
					typeof groupValue === 'object' &&
					!Array.isArray(groupValue)
						? groupValue
						: {},
				shippedGroup: getShippedGroupDefault(groupKey),
			};
		},
		[groupKey]
	);

	if (!fields?.length) {
		return (
			<p className="prc-chart-theme-settings__empty">
				{__(
					'No fields for this group yet. Add it to the editor schema (src/settings/field-registry/schema.mjs), then rebuild settings (npm run build:settings -w @prc/chart-builder).',
					TEXT_DOMAIN
				)}
			</p>
		);
	}

	const rows = buildConfigGridRows(fields);

	return (
		<VStack spacing={4}>
			<Text className="prc-settings__accordion-description">
				{__(
					'Defaults apply to newly inserted charts only. Clear a value to inherit the shipped default.',
					TEXT_DOMAIN
				)}
			</Text>

			<div className="prc-chart-theme-settings__table-wrap">
				<table className="prc-chart-theme-settings__config-table">
					<thead>
						<tr>
							<th scope="col">{__('Attribute', TEXT_DOMAIN)}</th>
							<th scope="col">{__('Value', TEXT_DOMAIN)}</th>
							<th scope="col">{__('Default', TEXT_DOMAIN)}</th>
							<th scope="col">{__('Type', TEXT_DOMAIN)}</th>
							<th scope="col">
								{__('Description', TEXT_DOMAIN)}
							</th>
							<th scope="col" className="screen-reader-text">
								{__('Actions', TEXT_DOMAIN)}
							</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => {
							if (row.kind === 'group') {
								return (
									<tr
										key={`group-${row.key}`}
										className="prc-chart-theme-settings__config-row is-group-header"
									>
										<td
											className="prc-chart-theme-settings__config-name"
											style={{
												paddingLeft: `${configGridNamePadding(0)}px`,
											}}
											colSpan={6}
										>
											<code>{row.label}</code>
										</td>
									</tr>
								);
							}

							const { field, depth, attributeLabel, pathLabel } =
								row;
							const shippedValue = getAtPath(
								shippedGroup,
								field.path
							);
							const storedValue = getAtPath(group, field.path);
							const overridden = isFieldOverridden(
								group,
								field.path,
								shippedValue
							);
							const defaultLabel = formatShippedDefaultValue(
								shippedValue,
								field.type
							);
							const displayValue =
								field.type === 'boolean' &&
								storedValue === undefined
									? shippedValue
									: storedValue;

							return (
								<tr
									key={pathLabel}
									className={
										overridden
											? 'prc-chart-theme-settings__config-row is-overridden'
											: 'prc-chart-theme-settings__config-row'
									}
								>
									<td
										className="prc-chart-theme-settings__config-name"
										style={{
											paddingLeft: `${configGridNamePadding(depth)}px`,
										}}
									>
										<code title={pathLabel}>
											{attributeLabel}
										</code>
									</td>
									<td className="prc-chart-theme-settings__config-value">
										<ConfigFieldControl
											field={field}
											value={displayValue}
											shippedValue={shippedValue}
											onChange={(nextValue) => {
												if (nextValue === undefined) {
													resetConfigField(
														groupKey,
														field.path
													);
													return;
												}
												setConfigField(
													groupKey,
													field.path,
													nextValue,
													{
														unsetOnShippedMatch:
															!field.enum
																?.length &&
															field.type !==
																'font',
													}
												);
											}}
										/>
									</td>
									<td className="prc-chart-theme-settings__config-default">
										<Text className="prc-chart-theme-settings__default-value">
											{defaultLabel}
										</Text>
									</td>
									<td className="prc-chart-theme-settings__config-type">
										{field.type}
									</td>
									<td className="prc-chart-theme-settings__config-description">
										{field.description}
									</td>
									<td className="prc-chart-theme-settings__config-actions">
										{field.themeable && overridden ? (
											<Button
												variant="link"
												onClick={() =>
													resetConfigField(
														groupKey,
														field.path
													)
												}
											>
												{__('Reset', TEXT_DOMAIN)}
											</Button>
										) : null}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			<SettingsSectionFooter
				onSave={save}
				isBusy={isSaving}
				error={error}
				onDismissError={clearError}
				saveLabel={__('Save changes', TEXT_DOMAIN)}
				savingLabel={__('Saving…', TEXT_DOMAIN)}
			/>
		</VStack>
	);
}
