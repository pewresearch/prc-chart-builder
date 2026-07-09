import {
	Flex,
	FlexItem,
	SelectControl,
	__experimentalText as Text,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { TEXT_DOMAIN } from '../constants';
import {
	defaultNumberPair,
	formatNumberPairValue,
	parseNumberPairInput,
} from '../number-pair-utils';
import { getFontSelectOptions } from '../theme-fonts';

/**
 * @typedef {import('../field-registry/types').FieldDefinition} FieldDefinition
 */

/**
 * @param {string} value
 * @return {string}
 */
function normalizeColorInputValue(value) {
	if (typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)) {
		return value;
	}
	return '#2a2a2a';
}

/**
 * @param {{ field: FieldDefinition, value: unknown, shippedValue?: unknown, onChange: (value: unknown) => void, disabled?: boolean, placeholder?: string }} props
 */
export default function ConfigFieldControl({
	field,
	value,
	shippedValue,
	onChange,
	disabled = false,
	placeholder,
}) {
	if (!field.themeable) {
		const readonlyValue =
			field.type === 'numberPair'
				? formatNumberPairValue(value)
				: String(value ?? '');

		return (
			<Text className="prc-chart-theme-settings__readonly-value">
				{readonlyValue}
			</Text>
		);
	}

	if (field.type === 'boolean') {
		return (
			<ToggleControl
				__nextHasNoMarginBottom
				checked={Boolean(value)}
				onChange={(next) => onChange(next)}
				disabled={disabled}
			/>
		);
	}

	if (field.enum?.length) {
		return (
			<SelectControl
				__nextHasNoMarginBottom
				value={String(value ?? '')}
				options={[
					{
						label: __('Inherit default', TEXT_DOMAIN),
						value: '',
					},
					...field.enum.map((option) => ({
						label: option,
						value: option,
					})),
				]}
				onChange={(next) => {
					if (next === '') {
						onChange(undefined);
						return;
					}
					onChange(next);
				}}
				disabled={disabled}
			/>
		);
	}

	if (field.type === 'font') {
		return (
			<SelectControl
				__nextHasNoMarginBottom
				value={String(value ?? '')}
				options={getFontSelectOptions()}
				onChange={(next) => {
					if (next === '') {
						onChange(undefined);
						return;
					}
					onChange(next);
				}}
				disabled={disabled}
			/>
		);
	}

	if (field.type === 'font') {
		return (
			<SelectControl
				__nextHasNoMarginBottom
				value={String(value ?? '')}
				options={getFontSelectOptions()}
				onChange={(next) => {
					if (next === '') {
						onChange(undefined);
						return;
					}
					onChange(next);
				}}
				disabled={disabled}
			/>
		);
	}

	if (field.type === 'color') {
		const stringValue =
			value === undefined || value === null ? '' : String(value);

		return (
			<Flex
				className="prc-chart-theme-settings__color-control"
				align="center"
				gap={2}
			>
				<FlexItem isBlock>
					<TextControl
						__nextHasNoMarginBottom
						value={stringValue}
						placeholder={
							placeholder ?? __('Inherit default', TEXT_DOMAIN)
						}
						onChange={(next) => {
							if (next === '') {
								onChange(undefined);
								return;
							}
							onChange(next);
						}}
						disabled={disabled}
					/>
				</FlexItem>
				<FlexItem>
					<input
						type="color"
						className="prc-chart-theme-settings__color-swatch"
						value={normalizeColorInputValue(stringValue)}
						disabled={disabled}
						aria-label={__('Pick color', TEXT_DOMAIN)}
						onChange={(event) => onChange(event.target.value)}
					/>
				</FlexItem>
			</Flex>
		);
	}

	if (field.type === 'number') {
		return (
			<TextControl
				__nextHasNoMarginBottom
				type="number"
				value={
					value === undefined || value === null ? '' : String(value)
				}
				placeholder={placeholder}
				onChange={(next) => {
					if (next === '') {
						onChange(undefined);
						return;
					}
					onChange(Number(next));
				}}
				disabled={disabled}
			/>
		);
	}

	if (field.type === 'numberPair') {
		const shipped = defaultNumberPair(shippedValue);
		const stored = Array.isArray(value) ? value : null;
		const minDisplay =
			stored && typeof stored[0] === 'number' ? String(stored[0]) : '';
		const maxDisplay =
			stored && typeof stored[1] === 'number' ? String(stored[1]) : '';

		const commit = (minRaw, maxRaw) => {
			onChange(parseNumberPairInput(minRaw, maxRaw, shipped));
		};

		return (
			<Flex
				className="prc-chart-theme-settings__number-pair"
				align="center"
				gap={2}
			>
				<FlexItem>
					<TextControl
						__nextHasNoMarginBottom
						type="number"
						value={minDisplay}
						placeholder={String(shipped[0])}
						onChange={(next) => commit(next, maxDisplay)}
						disabled={disabled}
						aria-label={__('Domain minimum', TEXT_DOMAIN)}
					/>
				</FlexItem>
				<FlexItem>
					<Text className="prc-chart-theme-settings__number-pair-separator">
						–
					</Text>
				</FlexItem>
				<FlexItem>
					<TextControl
						__nextHasNoMarginBottom
						type="number"
						value={maxDisplay}
						placeholder={String(shipped[1])}
						onChange={(next) => commit(minDisplay, next)}
						disabled={disabled}
						aria-label={__('Domain maximum', TEXT_DOMAIN)}
					/>
				</FlexItem>
			</Flex>
		);
	}

	return (
		<TextControl
			__nextHasNoMarginBottom
			value={value === undefined || value === null ? '' : String(value)}
			placeholder={placeholder}
			onChange={(next) => {
				if (next === '') {
					onChange(undefined);
					return;
				}
				onChange(next);
			}}
			disabled={disabled}
		/>
	);
}
