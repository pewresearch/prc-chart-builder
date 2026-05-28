// V2
/**
 * External dependencies
 */
import styled from '@emotion/styled';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { PanelColorSettings } from '@wordpress/block-editor';
import {
	PanelBody,
	ExternalLink,
	FormTokenField,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { colorNames, colors } from '../utils/colors';
import { HIGHLIGHTABLE_CHART_TYPES } from '../utils/chart-types';
import { getAvailableLegendCategories } from '../utils/get-available-legend-categories';
import ColorSorter from './color-sorter';
import { useFocusedPanel } from './inspector-focus-context';

const PanelDescription = styled.div`
	grid-column: span 2;
`;

function ColorControls({ attributes, setAttributes, clientId, chartType }) {
	// Content attribute - NOT viewport-aware (colors are consistent across all viewports)
	const { io, dataRender = {}, divergingBar, sankey } = attributes;
	const { chartFamily } = io;
	const { isOpen, panelRef, onToggle } = useFocusedPanel('colors');

	const highlightControlsVisible =
		HIGHLIGHTABLE_CHART_TYPES.includes(chartType);

	const categorySuggestions = useMemo(
		() =>
			getAvailableLegendCategories({
				chartType,
				chartFamily,
				io,
				dataRender,
				divergingBar,
				sankey,
			}),
		[chartType, chartFamily, io, dataRender, divergingBar, sankey]
	);

	const updateDataRender = (updates) => {
		setAttributes({
			dataRender: {
				...dataRender,
				...updates,
			},
		});
	};

	return (
		<div ref={panelRef}>
			<PanelBody title={__('Colors')} opened={isOpen} onToggle={onToggle}>
				<ToolsPanel
					panelId={clientId}
					style={{
						paddingLeft: '0',
						paddingRight: '0',
					}}
				>
					{' '}
					<PanelDescription>
						{__(
							'Use the Color Palette selector to choose a predefined color pallette for the chart. Use the Custom Colors input to define your own colors. The color sorter will allow you to reorder the colors in the color scale.'
						)}
					</PanelDescription>
					<ToolsPanelItem
						hasValue={() => io.colorValue}
						label={__('Color Pallette')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Color Palette')}
							value={io.colorValue}
							options={colorNames}
							onChange={(c) => {
								setAttributes({
									io: {
										...io,
										colorValue: c,
										customColors: [],
									},
								});
							}}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => io.customColors}
						label={__('Custom Colors')}
						panelId={clientId}
					>
						<FormTokenField
							label={__('Custom Colors')}
							value={io.customColors || []}
							placeholder="#000000"
							onChange={(c) => {
								setAttributes({
									io: {
										...io,
										customColors: c,
									},
								});
							}}
							help={__('Separate with commas or the Enter key.')}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={() => io.customColors}
						label={__('Color Sorter')}
						panelId={clientId}
						isShownByDefault
					>
						<ColorSorter
							colors={
								0 < (io.customColors || []).length
									? io.customColors
									: colors[io.colorValue]
							}
							setAttributes={setAttributes}
							io={io}
						/>
					</ToolsPanelItem>
					{highlightControlsVisible && (
						<>
							<ToolsPanelItem
								hasValue={() => dataRender.highlightColor}
								label={__('Highlight Color')}
								panelId={clientId}
								isShownByDefault
								onDeselect={() =>
									updateDataRender({
										highlightColor: '#ECDBAC',
									})
								}
							>
								<PanelColorSettings
									__experimentalHasMultipleOrigins
									__experimentalIsRenderedInSidebar
									title={__('Highlight Color')}
									colorSettings={[
										{
											value: dataRender.highlightColor,
											onChange: (value) =>
												updateDataRender({
													highlightColor: value ?? '',
												}),
											label: __('Highlight'),
										},
									]}
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								hasValue={() => dataRender.deselectedColor}
								label={__('Deselected Color')}
								panelId={clientId}
								isShownByDefault
								onDeselect={() =>
									updateDataRender({
										deselectedColor: '#EEECE4',
									})
								}
							>
								<PanelColorSettings
									__experimentalHasMultipleOrigins
									__experimentalIsRenderedInSidebar
									title={__('Deselected Color')}
									colorSettings={[
										{
											value: dataRender.deselectedColor,
											onChange: (value) =>
												updateDataRender({
													deselectedColor:
														value ?? '',
												}),
											label: __('Deselected'),
										},
									]}
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								hasValue={() =>
									dataRender.deselectedOpacity !==
										undefined &&
									dataRender.deselectedOpacity !== 1
								}
								label={__('Deselected Opacity')}
								panelId={clientId}
								isShownByDefault
								onDeselect={() =>
									updateDataRender({ deselectedOpacity: 1 })
								}
							>
								<RangeControl
									label={__('Deselected Opacity')}
									value={dataRender.deselectedOpacity ?? 1}
									onChange={(value) =>
										updateDataRender({
											deselectedOpacity: value ?? 1,
										})
									}
									min={0}
									max={1}
									step={0.05}
									help={__(
										'Opacity for categories that are not highlighted. Highlighted categories stay at full opacity.'
									)}
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								hasValue={() =>
									dataRender.highlightedCategories?.length
								}
								label={__('Highlighted Categories')}
								panelId={clientId}
								isShownByDefault
								onDeselect={() =>
									updateDataRender({
										highlightedCategories: [],
									})
								}
							>
								<FormTokenField
									label={__('Highlighted Categories')}
									value={
										dataRender.highlightedCategories || []
									}
									suggestions={categorySuggestions}
									onChange={(categories) =>
										updateDataRender({
											highlightedCategories: categories,
										})
									}
									help={__(
										'When set, highlighted categories use the highlight color and all others use the deselected color and opacity.'
									)}
								/>
							</ToolsPanelItem>
						</>
					)}
					<PanelDescription>
						<ExternalLink href="https://codepen.io/benjiwo/pen/GdBNPP">
							Pew Research Color Guide
						</ExternalLink>
					</PanelDescription>
				</ToolsPanel>
				{(chartType === 'pie' ||
					chartType === 'diverging-bar' ||
					chartType === 'stacked-bar' ||
					chartType === 'stacked-column') && (
					<ToolsPanel
						label={__('Stroke')}
						panelId={clientId}
						style={{
							paddingLeft: '0',
							paddingRight: '0',
						}}
					>
						<ToolsPanelItem
							hasValue={() => io.elementHasStroke}
							label={__('Stroke')}
							panelId={clientId}
							isShownByDefault
						>
							<ToggleControl
								label={__('Stroke')}
								checked={io.elementHasStroke || false}
								help="If selected, the slices of a pie or bar segements will have a stroke applied."
								onChange={(newValue) => {
									setAttributes({
										io: {
											...io,
											elementHasStroke: newValue,
										},
									});
								}}
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				)}
			</PanelBody>
		</div>
	);
}

export default ColorControls;
