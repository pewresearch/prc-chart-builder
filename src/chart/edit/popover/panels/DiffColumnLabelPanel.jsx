/**
 * Per-cell diff column popover — color, typography, textOutline, and custom text.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

import { useDiffColumnLabelCustomizations } from '../hooks';
import { generateElementKey } from '../utils';
import { TextStyleControls } from './TextStyleControls';

/**
 * @param {Object}      props
 * @param {Object}      props.dataPoint
 * @param {string}      props.category
 * @param {string}      props.defaultLabel
 * @param {string|null} props.groupValue
 * @param {Object}      props.currentCustomizations - diffColumn.customLabels
 * @param {Function}    props.onUpdate
 */
export function DiffColumnLabelPanel({
	dataPoint,
	category,
	defaultLabel,
	groupValue = null,
	currentCustomizations = {},
	onUpdate,
}) {
	const rowKey = generateElementKey(dataPoint.x, category, groupValue);
	const { values, hasCustomizations, handleChange, handleReset } =
		useDiffColumnLabelCustomizations(
			rowKey,
			currentCustomizations,
			onUpdate
		);

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{category}: {defaultLabel}
			</Text>

			<TextStyleControls
				values={values}
				onChange={handleChange}
				textLabel={__('Custom cell text', 'prc-chart-builder')}
				textPlaceholder={defaultLabel}
				textHelp={__(
					'Leave empty to use the default value',
					'prc-chart-builder'
				)}
				showFontWeightDefault
				showFontStyleDefault
				showFontFamily={false}
				fontSizeOptions={['10', '12', '14', '16']}
				fontSizeHelp={__(
					'Leave unselected to use column default',
					'prc-chart-builder'
				)}
				colorPanelTitle={__('Cell Text Color', 'prc-chart-builder')}
				showTextOutline
				hasCustomizations={hasCustomizations}
				onReset={handleReset}
			/>
		</VStack>
	);
}

export default DiffColumnLabelPanel;
