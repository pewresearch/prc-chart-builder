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
import { useViewportAttributes } from './use-viewport-attributes';

// const PanelDescription = styled.div`
// 	grid-column: span 2;
// `;
const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

function DiffColumnControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
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
						value={getCurrentValue('diffColumn', 'columnHeader')}
						onChange={(value) => {
							updateAttributeForDevice('diffColumn', {
								columnHeader: value,
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
						value={parseInt(
							getCurrentValue('diffColumn', 'style')?.width || 0,
							10
						)}
						onChange={(value) => {
							const currentStyle =
								getCurrentValue('diffColumn', 'style') || {};
							updateAttributeForDevice('diffColumn', {
								style: {
									...currentStyle,
									width: formatNum(value, 'integer'),
								},
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
						value={parseInt(
							getCurrentValue('diffColumn', 'style')
								?.marginLeft || 0,
							10
						)}
						onChange={(value) => {
							const currentStyle =
								getCurrentValue('diffColumn', 'style') || {};
							updateAttributeForDevice('diffColumn', {
								style: {
									...currentStyle,
									marginLeft: formatNum(value, 'integer'),
								},
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
						value={parseInt(
							getCurrentValue('diffColumn', 'style')
								?.heightOffset || 0,
							10
						)}
						onChange={(value) => {
							const currentStyle =
								getCurrentValue('diffColumn', 'style') || {};
							updateAttributeForDevice('diffColumn', {
								style: {
									...currentStyle,
									heightOffset: formatNum(value, 'integer'),
								},
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
						value={
							getCurrentValue('diffColumn', 'style')
								?.fontAppearance
						}
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
							const currentStyle =
								getCurrentValue('diffColumn', 'style') || {};
							updateAttributeForDevice('diffColumn', {
								style: {
									...currentStyle,
									fontAppearance: value,
									fontWeight:
										value === 'bold' ||
										value === 'bold-italic'
											? 'bold'
											: 'normal',
									fontStyle:
										value === 'italic' ||
										value === 'bold-italic'
											? 'italic'
											: 'normal',
								},
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
								value: getCurrentValue('diffColumn', 'style')
									?.rectFill,
								onChange: (value) => {
									const currentStyle =
										getCurrentValue(
											'diffColumn',
											'style'
										) || {};
									updateAttributeForDevice('diffColumn', {
										style: {
											...currentStyle,
											rectFill: value ?? '',
										},
									});
								},
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
