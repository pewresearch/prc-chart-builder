// V2
/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

// const PanelDescription = styled.div`
// 	grid-column: span 2;
// `;
const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

function BarControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const layout = getCurrentValue('layout') || {};
	const { type: chartType } = layout;

	return (
		<PanelBody title={__('Bar Configuration')} initialOpen={false}>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				{chartType === 'bar' && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Bar Group Padding')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Bar Group Padding')}
							withInputField
							min={0}
							max={10}
							step={0.05}
							value={parseFloat(
								getCurrentValue('bar', 'barGroupPadding') || 0,
								10
							)}
							onChange={(value) => {
								updateAttributeForDevice('bar', {
									barGroupPadding: formatNum(value, 'float'),
								});
							}}
						/>
					</WidePanelItem>
				)}
				<WidePanelItem
					hasValue={() => true}
					label={__('Individual Bar Padding')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Individual Bar Padding')}
						withInputField
						min={0}
						max={10}
						step={0.05}
						value={parseFloat(
							getCurrentValue('bar', 'barPadding') || 0,
							10
						)}
						onChange={(value) => {
							updateAttributeForDevice('bar', {
								barPadding: formatNum(value, 'float'),
							});
						}}
					/>
				</WidePanelItem>
				{chartType === 'exploded-bar' && (
					<WidePanelItem
						hasValue={() => true}
						label={__('Exploded Bar Column Gap')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Exploded Bar Column Gap')}
							withInputField
							step={1}
							value={parseInt(
								getCurrentValue('explodedBar', 'columnGap') ||
									0,
								10
							)}
							onChange={(value) => {
								updateAttributeForDevice('explodedBar', {
									columnGap: formatNum(value, 'integer'),
								});
							}}
						/>
					</WidePanelItem>
				)}
			</ToolsPanel>
		</PanelBody>
	);
}

export default BarControls;
