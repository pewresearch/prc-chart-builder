/* eslint-disable max-lines-per-function */
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
	TextControl,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { formatNum } from '../utils/helpers';

// const PanelDescription = styled.div`
// 	grid-column: span 2;
// `;
const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

function DiffColumnControls({ attributes, setAttributes, clientId }) {
	const {
		diffColumnHeader,
		diffColumnWidth,
		diffColumnMarginLeft,
		diffColumnBackgroundColor,
		diffColumnHeightOffset,
		diffColumnAppearance,
	} = attributes;
	return (
		<PanelBody
			title={__('Difference Column Configuration')}
			initialOpen={false}
		>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<WidePanelItem
					hasValue={() => true}
					label={__('Column Header')}
					isShownByDefault
					panelId={clientId}
				>
					<TextControl
						label={__('Column Header')}
						value={diffColumnHeader}
						onChange={(value) => {
							setAttributes({
								diffColumnHeader: value,
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Column Width')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Column Width')}
						withInputField
						min={0}
						value={parseInt(diffColumnWidth, 10)}
						onChange={(value) => {
							setAttributes({
								diffColumnWidth: formatNum(value, 'integer'),
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Column Gap')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Column Gap')}
						withInputField
						step={1}
						value={parseInt(diffColumnMarginLeft, 10)}
						onChange={(value) => {
							setAttributes({
								diffColumnMarginLeft: formatNum(
									value,
									'integer'
								),
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Height Offset')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Height Offset')}
						withInputField
						min={0}
						value={parseInt(diffColumnHeightOffset, 10)}
						onChange={(value) => {
							setAttributes({
								diffColumnHeightOffset: formatNum(
									value,
									'integer'
								),
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Column Appearance')}
					isShownByDefault
					panelId={clientId}
				>
					<SelectControl
						label={__('Column Appearance')}
						value={diffColumnAppearance}
						options={[
							{
								label: __('Default'),
								value: 'default',
							},
							{
								label: __('Bold'),
								value: 'bold',
							},
							{
								label: __('Italic'),
								value: 'italic',
							},
							{
								label: __('Bold Italic'),
								value: 'bold-italic',
							},
						]}
						onChange={(value) => {
							setAttributes({
								diffColumnAppearance: value,
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Column Background Color')}
					isShownByDefault
					panelId={clientId}
				>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Column Background Color')}
						initialOpen
						colorSettings={[
							{
								value: diffColumnBackgroundColor,
								onChange: (value) =>
									setAttributes({
										diffColumnBackgroundColor: value,
									}),
								label: __('Background Color'),
							},
						]}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default DiffColumnControls;
