/**
 * Regression Line Panel Component
 *
 * Panel for customizing a regression line's stroke color, strokeWidth, and
 * strokeDasharray. Works for both combined mode (category = 'combined') and
 * per-category mode (category = the series key, e.g. 'y1').
 *
 * Styles are stored in regression.groupBreakStyles[groupKey] and fall back to
 * the shared regression defaults when not overridden.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	SelectControl,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Button,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

import { STROKE_DASHARRAY_OPTIONS } from '../utils';

/**
 * RegressionLinePanel Component
 *
 * @param {Object}   props
 * @param {string}   props.category              - The category key, or 'combined' for a single line
 * @param {string}   props.defaultColor          - The default stroke color (category color or shared default)
 * @param {Object}   props.currentCustomizations - Current regression attribute values
 * @param {Function} props.onUpdate              - Callback to update
 */
export function RegressionLinePanel({
	category,
	defaultColor,
	currentCustomizations = {},
	onUpdate,
}) {
	const currentStyles = currentCustomizations.groupBreakStyles?.[ category ] || {};

	const [stroke, setStroke] = useState(currentStyles.stroke || '');
	const [strokeWidth, setStrokeWidth] = useState(
		currentStyles.strokeWidth ?? currentCustomizations.strokeWidth ?? 2
	);
	const [strokeDasharray, setStrokeDasharray] = useState(
		currentStyles.strokeDasharray ?? currentCustomizations.strokeDasharray ?? ''
	);

	// Sync state when external customizations change (e.g. panel reopens)
	useEffect(() => {
		setStroke(currentStyles.stroke || '');
		setStrokeWidth(
			currentStyles.strokeWidth ?? currentCustomizations.strokeWidth ?? 2
		);
		setStrokeDasharray(
			currentStyles.strokeDasharray ?? currentCustomizations.strokeDasharray ?? ''
		);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [category]);

	const handleStyleChange = useCallback(
		(property, value) => {
			if (property === 'stroke') setStroke(value);
			if (property === 'strokeWidth') setStrokeWidth(value);
			if (property === 'strokeDasharray') setStrokeDasharray(value);

		const updatedGroupBreakStyles = {
			...currentCustomizations.groupBreakStyles,
		};
		const existing = { ...(updatedGroupBreakStyles[category] || {}) };

		// Remove the property if it's being reset to empty/falsy
		const isEmpty =
			(property === 'stroke' && (value === '' || value === null)) ||
			(property === 'strokeWidth' && value === 0) ||
			(property === 'strokeDasharray' && value === '');

		if (isEmpty) {
			delete existing[property];
		} else {
			existing[property] = value;
		}

		if (Object.keys(existing).length === 0) {
			delete updatedGroupBreakStyles[category];
		} else {
			updatedGroupBreakStyles[category] = existing;
		}

		onUpdate({ groupBreakStyles: updatedGroupBreakStyles });
		},
		[category, currentCustomizations.groupBreakStyles, onUpdate]
	);

	const handleReset = useCallback(() => {
		setStroke('');
		setStrokeWidth(currentCustomizations.strokeWidth ?? 2);
		setStrokeDasharray(currentCustomizations.strokeDasharray ?? '');

		const updatedGroupBreakStyles = {
			...currentCustomizations.groupBreakStyles,
		};
		delete updatedGroupBreakStyles[category];
		onUpdate({ groupBreakStyles: updatedGroupBreakStyles });
	}, [category, currentCustomizations, onUpdate]);

	const hasCustomizations =
		stroke !== '' || strokeDasharray !== (currentCustomizations.strokeDasharray ?? '');

	const label =
		category === 'combined'
			? __('Combined regression line', 'prc-chart-builder')
			: `${__('Regression line', 'prc-chart-builder')}: ${category}`;

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{label}
			</Text>

			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={__('Stroke Color', 'prc-chart-builder')}
				colorSettings={[
					{
						value: stroke || defaultColor,
						onChange: (val) => handleStyleChange('stroke', val ?? ''),
						label: __('Stroke', 'prc-chart-builder'),
					},
				]}
			/>

			<NumberControl
				label={__('Stroke Width', 'prc-chart-builder')}
				value={strokeWidth}
				onChange={(val) =>
					handleStyleChange('strokeWidth', parseFloat(val) || 0)
				}
				min={0}
				step={0.5}
			/>

			<SelectControl
				label={__('Line Style', 'prc-chart-builder')}
				value={strokeDasharray}
				options={STROKE_DASHARRAY_OPTIONS}
				onChange={(val) => handleStyleChange('strokeDasharray', val)}
				help={__('Dash pattern for the regression line', 'prc-chart-builder')}
			/>

			{hasCustomizations && (
				<Button
					variant="secondary"
					isDestructive
					onClick={handleReset}
					style={{ marginTop: '8px' }}
				>
					{__('Reset to defaults', 'prc-chart-builder')}
				</Button>
			)}
		</VStack>
	);
}

export default RegressionLinePanel;
