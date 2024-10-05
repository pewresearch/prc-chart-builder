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
	ExternalLink,
	FormTokenField,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { colorNames, colors } from '../utils/colors';
import ColorSorter from './ColorSorter';

const PanelDescription = styled.div`
	grid-column: span 2;
`;

function ColorControls({ attributes, setAttributes, clientId, chartType }) {
	const { colorValue, customColors, elementHasStroke } = attributes;
	return (
		<PanelBody title={__('Colors')} initialOpen={false}>
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
					hasValue={() => colorValue}
					label={__('Color Pallette')}
					isShownByDefault
					panelId={clientId}
				>
					<SelectControl
						label={__('Color Palette')}
						value={colorValue}
						options={colorNames}
						onChange={(c) => {
							setAttributes({ colorValue: c, customColors: [] });
						}}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={() => customColors}
					label={__('Custom Colors')}
					panelId={clientId}
				>
					<FormTokenField
						label={__('Custom Colors')}
						value={customColors || []}
						placeholder="#000000"
						onChange={(c) => setAttributes({ customColors: c })}
						help={__('Separate with commas or the Enter key.')}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={() => customColors}
					label={__('Color Sorter')}
					panelId={clientId}
					isShownByDefault
				>
					<ColorSorter
						colors={
							0 < customColors.length
								? customColors
								: colors[colorValue]
						}
						setAttributes={setAttributes}
					/>
				</ToolsPanelItem>
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
						hasValue={() => elementHasStroke}
						label={__('Stroke')}
						panelId={clientId}
						isShownByDefault
					>
						<ToggleControl
							label={__('Stroke')}
							checked={elementHasStroke}
							help="If selected, the slices of a pie or bar segements will have a stroke applied."
							onChange={() =>
								setAttributes({
									elementHasStroke: !elementHasStroke,
								})
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			)}
		</PanelBody>
	);
}

export default ColorControls;
