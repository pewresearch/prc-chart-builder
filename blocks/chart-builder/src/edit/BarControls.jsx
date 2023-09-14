/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';

function BarControls({ attributes, setAttributes }) {
	const { barWidth, barGroupOffset } = attributes;
	return (
		<PanelBody
			title={__('Bar Chart Configuration')}
			initialOpen={false}
		></PanelBody>
	);
}

export default BarControls;
