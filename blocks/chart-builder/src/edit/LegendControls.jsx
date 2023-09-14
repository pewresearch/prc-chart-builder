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
	TextControl,
	ToggleControl,
	SelectControl,
	Flex,
	FlexItem,
	__experimentalNumberControl as NumberControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { formatNum } from '../utils/helpers';

const PanelDescription = styled.div`
	grid-column: span 2;
`;
const WidePanelItem = styled(ToolsPanelItem)`
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
const Help = styled.div`
	margin-top: calc(8px);
	font-size: 12px;
	font-style: normal;
	color: rgb(117, 117, 117);
	margin-bottom: 0px;
`;

function LegendControls({ attributes, setAttributes, clientId }) {
	const {
		legendActive,
		legendOrientation,
		legendTitle,
		legendOffsetX,
		legendOffsetY,
		legendMarkerStyle,
		legendBorderStroke,
		legendFill,
	} = attributes;
	return (
		<PanelBody title={__('Legend')} initialOpen={false}>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				<ToolsPanelItem
					hasValue={() => true}
					label={__('Legend Active')}
					isShownByDefault
					panelId={clientId}
				>
					<ToggleControl
						label="Legend Active"
						checked={legendActive}
						onChange={() =>
							setAttributes({ legendActive: !legendActive })
						}
					/>
				</ToolsPanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Positioning')}
					panelId={clientId}
				>
					<PanelDescription>
						<StyledLabel>Legend Positioning</StyledLabel>
					</PanelDescription>
					<Flex>
						<FlexItem>
							<NumberControl
								label={__('DX')}
								value={legendOffsetX}
								onChange={(value) =>
									setAttributes({
										legendOffsetX: formatNum(
											value,
											'integer'
										),
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('DY')}
								value={legendOffsetY}
								onChange={(value) =>
									setAttributes({
										legendOffsetY: formatNum(
											value,
											'integer'
										),
									})
								}
							/>
						</FlexItem>
					</Flex>
					<PanelDescription>
						<Help>
							Determines the position of legend relative to the
							chart container
						</Help>
					</PanelDescription>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Title')}
					panelId={clientId}
				>
					<TextControl
						label={__('Legend Title')}
						value={legendTitle}
						onChange={(value) =>
							setAttributes({ legendTitle: value })
						}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Orientation')}
					panelId={clientId}
				>
					<SelectControl
						label={__('Orientation')}
						value={legendOrientation}
						options={[
							{
								value: 'row',
								label: 'Row',
							},
							{
								value: 'column',
								label: 'Column',
							},
							{
								value: 'row-reverse',
								label: 'Row reverse',
							},
							{
								value: 'column-reverse',
								label: 'Column reverse',
							},
						]}
						onChange={(type) => {
							setAttributes({
								legendOrientation: type,
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Marker Style')}
					panelId={clientId}
				>
					<SelectControl
						label={__('Marker Style')}
						value={legendMarkerStyle}
						options={[
							{
								value: 'rect',
								label: 'Square',
							},
							{
								value: 'circle',
								label: 'Circle',
							},
							{
								value: 'line',
								label: 'Line',
							},
						]}
						onChange={(type) => {
							setAttributes({
								legendMarkerStyle: type,
							});
						}}
					/>
				</WidePanelItem>
				<WidePanelItem
					hasValue={() => true}
					label={__('Fill and Stroke')}
					panelId={clientId}
				>
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Fill and Stroke')}
						style={{
							paddingLeft: '0',
							paddingRight: '0',
						}}
						colorSettings={[
							{
								value: legendBorderStroke,
								onChange: (value) =>
									setAttributes({
										legendBorderStroke: value,
									}),
								label: __('Stroke'),
							},
							{
								value: legendFill,
								onChange: (value) =>
									setAttributes({ legendFill: value }),
								label: __('Fill'),
							},
						]}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default LegendControls;
