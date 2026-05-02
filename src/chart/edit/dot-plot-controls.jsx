/* eslint-disable max-lines-per-function */
/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	PanelBody,
	SelectControl,
	TextControl,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	RangeControl,
	ToggleControl,
} from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

const WidePanelItem = styled(ToolsPanelItem)`
	grid-column: span 2;
`;

const PanelDescription = styled.div`
	grid-column: span 2;
`;

const StyledLabel = styled.div`
	font-size: 11px;
	font-weight: 500;
	line-height: 1.4;
	text-transform: uppercase;
	display: inline-block;
	margin-bottom: calc(8px) !important;
	padding: 0px;
`;

function DotPlotControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const io = attributes.io || {};
	const dataRender = attributes.dataRender || {};
	const categories = dataRender.categories || [];
	const availableCategories = io.availableCategories || [];

	// Column options for the low/high dropdowns — all table headers except 'x'
	const columnOptions = useMemo(
		() => [
			{ value: '', label: __('— Select column —') },
			...availableCategories.map((col) => ({
				value: col,
				label: col,
			})),
		],
		[availableCategories]
	);

	return (
		<PanelBody title={__('Dot Plot')} initialOpen>
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
					label={__('Connecting Line')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label={__('Connect Points')}
						checked={getCurrentValue('dotPlot', 'connectPoints')}
						onChange={(newValue) =>
							updateAttributeForDevice('dotPlot', {
								connectPoints: newValue,
							})
						}
						help={__(
							'If active, a line will be drawn between the dots.'
						)}
					/>
					{getCurrentValue('dotPlot', 'connectPoints') && (
						<>
							<PanelColorSettings
								__experimentalHasMultipleOrigins
								__experimentalIsRenderedInSidebar
								title={__('Line Styles')}
								initialOpen
								colorSettings={[
									{
										value: getCurrentValue(
											'dotPlot',
											'connectingLine'
										)?.stroke,
										onChange: (value) => {
											const currentConnectingLine =
												getCurrentValue(
													'dotPlot',
													'connectingLine'
												) || {};
											updateAttributeForDevice(
												'dotPlot',
												{
													connectingLine: {
														...currentConnectingLine,
														stroke: value ?? '',
													},
												}
											);
										},
										label: __('Connecting line stroke'),
									},
								]}
							/>
							<NumberControl
								min={1}
								label={__('Line Stroke Width')}
								value={
									getCurrentValue('dotPlot', 'connectingLine')
										?.strokeWidth
								}
								onChange={(value) => {
									const currentConnectingLine =
										getCurrentValue(
											'dotPlot',
											'connectingLine'
										) || {};
									updateAttributeForDevice('dotPlot', {
										connectingLine: {
											...currentConnectingLine,
											strokeWidth: formatNum(
												value,
												'integer'
											),
										},
									});
								}}
							/>
							<TextControl
								label={__('Line Stroke Dash Array')}
								help={__(
									'A list of comma and/or white space separated <length>s and <percentage>s that specify the lengths of alternating dashes and gaps. If an odd number of values is provided, then the list of values is repeated to yield an even number of values. Thus, 5,3,2 is equivalent to 5,3,2,5,3,2.'
								)}
								value={
									getCurrentValue('dotPlot', 'connectingLine')
										?.strokeDasharray
								}
								placeholder=""
								onChange={(val) => {
									const currentConnectingLine =
										getCurrentValue(
											'dotPlot',
											'connectingLine'
										) || {};
									updateAttributeForDevice('dotPlot', {
										connectingLine: {
											...currentConnectingLine,
											strokeDasharray: val,
										},
									});
								}}
							/>
						</>
					)}
				</WidePanelItem>

				{/* Error Bars */}
				<WidePanelItem
					hasValue={() => true}
					label={__('Error Bars')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label={__('Enable Error Bars')}
						checked={
							getCurrentValue('errorBars', 'enabled') || false
						}
						onChange={(newValue) =>
							updateAttributeForDevice('errorBars', {
								enabled: newValue,
							})
						}
						help={__(
							'Display confidence interval / error bar lines around each dot.'
						)}
					/>
					{getCurrentValue('errorBars', 'enabled') && (
						<>
							{/* Column mappings per active category */}
							<PanelDescription>
								<StyledLabel>
									{__('Column Mappings')}
								</StyledLabel>
							</PanelDescription>
							<PanelDescription>
								{__(
									'For each data category, select the table columns that contain the low and high values for the error bars.'
								)}
							</PanelDescription>
							{categories.map((category) => {
								const currentMapping =
									getCurrentValue(
										'errorBars',
										'categories'
									)?.[category] || {};

								const updateCategoryField = (fields) => {
									const allCategories =
										getCurrentValue(
											'errorBars',
											'categories'
										) || {};
									updateAttributeForDevice('errorBars', {
										categories: {
											...allCategories,
											[category]: {
												...allCategories[category],
												category,
												...fields,
											},
										},
									});
								};

								const updateCategoryStyle = (
									styleField,
									value
								) => {
									const currentStyles =
										currentMapping.styles || {};
									updateCategoryField({
										styles: {
											...currentStyles,
											[styleField]: value,
										},
									});
								};

								return (
									<div
										key={category}
										style={{
											marginBottom: '16px',
											padding: '8px',
											border: '1px solid #e0e0e0',
											borderRadius: '4px',
										}}
									>
										<StyledLabel>{category}</StyledLabel>
										<SelectControl
											label={__('Low value column')}
											value={
												currentMapping.lowColumn || ''
											}
											options={columnOptions}
											onChange={(value) =>
												updateCategoryField({
													lowColumn: value,
												})
											}
										/>
										<SelectControl
											label={__('High value column')}
											value={
												currentMapping.highColumn || ''
											}
											options={columnOptions}
											onChange={(value) =>
												updateCategoryField({
													highColumn: value,
												})
											}
										/>
										<PanelColorSettings
											__experimentalHasMultipleOrigins
											__experimentalIsRenderedInSidebar
											title={__('Category Styles')}
											initialOpen={false}
											colorSettings={[
												{
													value:
														currentMapping.styles
															?.stroke || '',
													onChange: (value) =>
														updateCategoryStyle(
															'stroke',
															value ?? ''
														),
													label: __('Stroke color'),
												},
											]}
										/>
										<NumberControl
											min={1}
											label={__('Stroke Width')}
											value={
												currentMapping.styles
													?.strokeWidth ?? ''
											}
											placeholder={__(
												'Inherit from default'
											)}
											onChange={(value) =>
												updateCategoryStyle(
													'strokeWidth',
													value !== ''
														? formatNum(
																value,
																'integer'
														  )
														: undefined
												)
											}
										/>
										<RangeControl
											label={__('Stroke Opacity')}
											value={
												currentMapping.styles
													?.strokeOpacity ?? 1
											}
											onChange={(value) =>
												updateCategoryStyle(
													'strokeOpacity',
													value
												)
											}
											min={0}
											max={1}
											step={0.05}
										/>
									</div>
								);
							})}
						</>
					)}
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default DotPlotControls;
