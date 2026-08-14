// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalNumberControl as NumberControl,
	ToggleControl,
	SelectControl,
} from '@wordpress/components';
import { ColorPalette } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import {
	PanelDescription,
	WidePanelItem,
	StyledLabel,
} from './control-ui';

function PieControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('pie');

	const pie = getCurrentValue('pie') || {};
	const dataRender = attributes.dataRender || {};
	const groupBreaksActive = dataRender.groupBreaksActive || false;

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Pie Configuration')}
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
						label={__('Category Labels')}
						isShownByDefault
						panelId={clientId}
					>
						<ToggleControl
							label={__('Show Category Labels')}
							help={__(
								'Display category labels outside the pie slices.'
							)}
							checked={pie.showCategoryLabels ?? true}
							onChange={() => {
								updateAttributeForDevice('pie', {
									showCategoryLabels: !pie.showCategoryLabels,
								});
							}}
						/>
					</WidePanelItem>

					<WidePanelItem
						hasValue={() => true}
						label={__('Stroke')}
						isShownByDefault
						panelId={clientId}
					>
						<ToggleControl
							label={__('Show Slice Stroke')}
							help={__(
								'Add a stroke around each pie slice for separation.'
							)}
							checked={pie.hasPathStroke ?? false}
							onChange={() => {
								updateAttributeForDevice('pie', {
									hasPathStroke: !pie.hasPathStroke,
								});
							}}
						/>
						{pie.hasPathStroke && (
							<>
								<NumberControl
									label={__('Stroke Width')}
									withInputField
									min={0}
									max={10}
									step={0.5}
									value={pie.pathStrokeWidth ?? 1}
									onChange={(value) => {
										updateAttributeForDevice('pie', {
											pathStrokeWidth: formatNum(
												value,
												'float'
											),
										});
									}}
								/>
							</>
						)}
					</WidePanelItem>

					{/* Group Breaks Section - only shown when group breaks is active */}
					{groupBreaksActive && (
						<>
							<PanelDescription>
								<StyledLabel>Slice Grouping</StyledLabel>
							</PanelDescription>
							<WidePanelItem
								hasValue={() => true}
								label={__('Explode Offset')}
								isShownByDefault
								panelId={clientId}
							>
								<NumberControl
									label={__('Explode Offset (pixels)')}
									help={__(
										'How far to push grouped slices outward from the center. Higher values create more separation between groups.'
									)}
									withInputField
									step={1}
									min={0}
									max={50}
									value={pie.groupGapAngle ?? 10}
									onChange={(value) => {
										updateAttributeForDevice('pie', {
											groupGapAngle: formatNum(
												value,
												'integer'
											),
										});
									}}
								/>
							</WidePanelItem>

							<WidePanelItem
								hasValue={() => true}
								label={__('Group Separator Arcs')}
								isShownByDefault
								panelId={clientId}
							>
								<ToggleControl
									label={__('Show Group Separator Arcs')}
									help={__(
										'Display arc lines tracing the circumference of each group.'
									)}
									checked={pie.showGroupArcs ?? false}
									onChange={() => {
										updateAttributeForDevice('pie', {
											showGroupArcs: !pie.showGroupArcs,
										});
									}}
								/>
								{pie.showGroupArcs && (
									<>
										<NumberControl
											label={__('Arc Stroke Width')}
											withInputField
											min={0.5}
											max={5}
											step={0.5}
											value={
												pie.groupArcStyle
													?.strokeWidth ?? 1
											}
											onChange={(value) => {
												updateAttributeForDevice(
													'pie',
													{
														groupArcStyle: {
															...pie.groupArcStyle,
															strokeWidth:
																formatNum(
																	value,
																	'float'
																),
														},
													}
												);
											}}
										/>
										<SelectControl
											label={__('Arc Line Style')}
											value={
												pie.groupArcStyle
													?.strokeDasharray || '4,4'
											}
											options={[
												{
													value: 'none',
													label: 'Solid',
												},
												{
													value: '4,4',
													label: 'Dashed',
												},
												{
													value: '2,2',
													label: 'Dotted',
												},
												{
													value: '8,4',
													label: 'Long Dash',
												},
											]}
											onChange={(value) => {
												updateAttributeForDevice(
													'pie',
													{
														groupArcStyle: {
															...pie.groupArcStyle,
															strokeDasharray:
																value,
														},
													}
												);
											}}
										/>
									</>
								)}
							</WidePanelItem>
						</>
					)}
				</ToolsPanel>
			</PanelBody>
		</div>
	);
}

export default PieControls;
