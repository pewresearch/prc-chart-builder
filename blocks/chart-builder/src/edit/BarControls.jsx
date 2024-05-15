/**
 * External dependencies
 */
import styled from 'styled-components';

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

// const PanelDescription = styled.div`
// 	grid-column: span 2;
// `;
const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

function BarControls({ attributes, setAttributes, clientId }) {
	const { chartType, barPadding, barGroupPadding, explodedBarColumnGap } =
		attributes;
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
							value={parseFloat(barGroupPadding, 10)}
							onChange={(value) => {
								setAttributes({
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
						value={parseFloat(barPadding, 10)}
						onChange={(value) => {
							setAttributes({
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
							value={parseInt(explodedBarColumnGap, 10)}
							onChange={(value) => {
								setAttributes({
									explodedBarColumnGap: formatNum(
										value,
										'integer'
									),
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
