// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	SelectControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

const NodeControls = ({ attributes, setAttributes }) => {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	return (
		<PanelBody title={__('Node Styles')} initialOpen={false}>
			<NumberControl
				min={1}
				label={__('Node Size')}
				value={getCurrentValue('nodes', 'pointSize')}
				onChange={(value) => {
					const currentNodes = getCurrentValue('nodes') || {};
					updateAttributeForDevice('nodes', {
						...currentNodes,
						pointSize: formatNum(value, 'integer'),
					});
				}}
			/>
			<NumberControl
				min={1}
				label={__('Node Stroke Width')}
				value={getCurrentValue('nodes', 'pointStrokeWidth')}
				onChange={(value) => {
					const currentNodes = getCurrentValue('nodes') || {};
					updateAttributeForDevice('nodes', {
						...currentNodes,
						pointStrokeWidth: formatNum(value, 'integer'),
					});
				}}
			/>
			<SelectControl
				label={__('Node Fill')}
				options={[
					{ label: 'Inherit', value: 'inherit' },
					{ label: 'White', value: 'white' },
				]}
				value={getCurrentValue('nodes', 'pointFill')}
				onChange={(value) => {
					const currentNodes = getCurrentValue('nodes') || {};
					updateAttributeForDevice('nodes', {
						...currentNodes,
						pointFill: value,
					});
				}}
			/>
		</PanelBody>
	);
};

export default NodeControls;
