/* eslint-disable max-lines-per-function */
/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import {
	__experimentalNumberControl as NumberControl,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';
import { useFocusedPanel } from './inspector-focus-context';

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
	const { isOpen, panelRef, onToggle } = useFocusedPanel('diffColumn');

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Difference Column Configuration')}
				opened={isOpen}
				onToggle={onToggle}
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
							value={getCurrentValue(
								'diffColumn',
								'columnHeader'
							)}
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
								getCurrentValue('diffColumn', 'style')?.width ||
									0,
								10
							)}
							onChange={(value) => {
								const currentStyle =
									getCurrentValue('diffColumn', 'style') ||
									{};
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
									getCurrentValue('diffColumn', 'style') ||
									{};
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
									getCurrentValue('diffColumn', 'style') ||
									{};
								updateAttributeForDevice('diffColumn', {
									style: {
										...currentStyle,
										heightOffset: formatNum(
											value,
											'integer'
										),
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
									getCurrentValue('diffColumn', 'style') ||
									{};
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
						label={__('Column Colors')}
						isShownByDefault
						panelId={clientId}
					>
						<PanelColorSettings
							__experimentalHasMultipleOrigins
							__experimentalIsRenderedInSidebar
							title={__('Column Colors')}
							initialOpen
							colorSettings={[
								{
									value: getCurrentValue(
										'diffColumn',
										'style'
									)?.headerFill,
									onChange: (value) => {
										const currentStyle =
											getCurrentValue(
												'diffColumn',
												'style'
											) || {};
										updateAttributeForDevice('diffColumn', {
											style: {
												...currentStyle,
												headerFill: value ?? '',
											},
										});
									},
									label: __('Header Text Color'),
								},
								{
									value: getCurrentValue(
										'diffColumn',
										'style'
									)?.fill,
									onChange: (value) => {
										const currentStyle =
											getCurrentValue(
												'diffColumn',
												'style'
											) || {};
										updateAttributeForDevice('diffColumn', {
											style: {
												...currentStyle,
												fill: value ?? '',
											},
										});
									},
									label: __('Cell Text Color'),
								},
								{
									value: getCurrentValue(
										'diffColumn',
										'style'
									)?.rectFill,
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
					<WidePanelItem
						hasValue={() => true}
						label={__('Text Outline')}
						isShownByDefault
						panelId={clientId}
					>
						<ToggleControl
							label={__(
								'Header Text Outline',
								'prc-chart-builder'
							)}
							help={__(
								'Adds a contrasting outline behind the header text.',
								'prc-chart-builder'
							)}
							checked={
								getCurrentValue('diffColumn', 'style')
									?.headerTextOutline ?? false
							}
							onChange={(value) => {
								const currentStyle =
									getCurrentValue('diffColumn', 'style') ||
									{};
								updateAttributeForDevice('diffColumn', {
									style: {
										...currentStyle,
										headerTextOutline: value,
									},
								});
							}}
						/>
						<ToggleControl
							label={__('Cell Text Outline', 'prc-chart-builder')}
							help={__(
								'Adds a contrasting outline behind cell text to improve readability.',
								'prc-chart-builder'
							)}
							checked={
								getCurrentValue('diffColumn', 'style')
									?.textOutline ?? false
							}
							onChange={(value) => {
								const currentStyle =
									getCurrentValue('diffColumn', 'style') ||
									{};
								updateAttributeForDevice('diffColumn', {
									style: {
										...currentStyle,
										textOutline: value,
									},
								});
							}}
						/>
					</WidePanelItem>
				</ToolsPanel>
			</PanelBody>
		</div>
	);
}

export default DiffColumnControls;
