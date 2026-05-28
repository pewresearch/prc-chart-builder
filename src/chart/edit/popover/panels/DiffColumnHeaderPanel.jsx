/**
 * Diff column header popover — uses shared TextStyleControls.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __ } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

import { useDiffColumnHeaderCustomizations } from '../hooks';
import { TextStyleControls } from './TextStyleControls';

/**
 * @param {Object}   props
 * @param {Object}   props.diffColumn - Current diffColumn attribute
 * @param {Function} props.onUpdate   - Merges updates into diffColumn
 */
export function DiffColumnHeaderPanel({ diffColumn = {}, onUpdate }) {
	const { values, hasCustomizations, handleChange, handleReset } =
		useDiffColumnHeaderCustomizations(diffColumn, onUpdate);

	return (
		<VStack spacing={4}>
			<Text size="12px" color="#757575">
				{__('Difference column header', 'prc-chart-builder')}
			</Text>

			<TextStyleControls
				values={values}
				onChange={handleChange}
				textLabel={__('Header text', 'prc-chart-builder')}
				showFontWeightDefault
				showFontStyleDefault
				showFontFamily
				showTextOutline
				colorPanelTitle={__('Header Text Color', 'prc-chart-builder')}
				hasCustomizations={hasCustomizations}
				onReset={handleReset}
			/>
		</VStack>
	);
}

export default DiffColumnHeaderPanel;
