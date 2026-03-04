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
	SelectControl,
	RangeControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';

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

function SankeyControls({ attributes, setAttributes, clientId }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const sankey = getCurrentValue('sankey') || {};
	const io = attributes.io || {};
	const { availableCategories = [], independentVariable } = io;

	// All columns: independent variable (x) + available categories
	const allColumns = [
		...(independentVariable ? [independentVariable] : []),
		...availableCategories,
	];
	const columnOptions = allColumns.map((col) => ({
		value: col,
		label: col,
	}));

	return (
		<PanelBody title={__('Sankey Configuration')} initialOpen={false}>
			<ToolsPanel
				label={__('Attributes')}
				panelId={clientId}
				style={{
					paddingLeft: '0',
					paddingRight: '0',
				}}
			>
				{/* Node Alignment */}
				<WidePanelItem
					hasValue={() => true}
					label={__('Node Alignment')}
					isShownByDefault
					panelId={clientId}
				>
					<SelectControl
						label={__('Node Alignment')}
						help={__(
							'Controls how nodes are aligned within the diagram. "Justify" spreads nodes evenly, "Left" aligns to the start, "Right" to the end, and "Center" centers them.'
						)}
						value={sankey.nodeAlign ?? 'justify'}
						options={[
							{
								value: 'justify',
								label: 'Justify (Recommended)',
							},
							{ value: 'left', label: 'Left' },
							{ value: 'right', label: 'Right' },
							{ value: 'center', label: 'Center' },
						]}
						onChange={(value) => {
							updateAttributeForDevice('sankey', {
								nodeAlign: value,
							});
						}}
					/>
				</WidePanelItem>

				{/* Node Section */}
				<PanelDescription>
					<StyledLabel>Nodes</StyledLabel>
				</PanelDescription>

				<WidePanelItem
					hasValue={() => true}
					label={__('Node Width')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Node Width (px)')}
						help={__(
							'Width of the rectangular node bars.'
						)}
						withInputField
						min={2}
						max={60}
						step={1}
						value={sankey.nodeWidth ?? 12}
						onChange={(value) => {
							updateAttributeForDevice('sankey', {
								nodeWidth: formatNum(value, 'integer'),
							});
						}}
					/>
				</WidePanelItem>

				<WidePanelItem
					hasValue={() => true}
					label={__('Node Padding')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Node Padding (px)')}
						help={__(
							'Vertical spacing between nodes.'
						)}
						withInputField
						min={0}
						max={60}
						step={1}
						value={sankey.nodePadding ?? 10}
						onChange={(value) => {
							updateAttributeForDevice('sankey', {
								nodePadding: formatNum(value, 'integer'),
							});
						}}
					/>
				</WidePanelItem>

				<WidePanelItem
					hasValue={() => true}
					label={__('Node Border Radius')}
					isShownByDefault
					panelId={clientId}
				>
					<NumberControl
						label={__('Border Radius (px)')}
						help={__(
							'Corner rounding for node rectangles.'
						)}
						withInputField
						min={0}
						max={20}
						step={1}
						value={sankey.nodeRadius ?? 0}
						onChange={(value) => {
							updateAttributeForDevice('sankey', {
								nodeRadius: formatNum(value, 'integer'),
							});
						}}
					/>
				</WidePanelItem>

				{/* Link Section */}
				<PanelDescription>
					<StyledLabel>Links</StyledLabel>
				</PanelDescription>

				<WidePanelItem
					hasValue={() => true}
					label={__('Link Opacity')}
					isShownByDefault
					panelId={clientId}
				>
					<RangeControl
						label={__('Link Opacity')}
						help={__(
							'Opacity of the connecting bands between nodes.'
						)}
						min={0.05}
						max={1}
						step={0.05}
						value={sankey.linkOpacity ?? 0.5}
						onChange={(value) => {
							updateAttributeForDevice('sankey', {
								linkOpacity: value,
							});
						}}
					/>
				</WidePanelItem>

				{/* Data Column Mapping */}
				<PanelDescription>
					<StyledLabel>Data Column Mapping</StyledLabel>
				</PanelDescription>

				<WidePanelItem
					hasValue={() => true}
					label={__('Source Column')}
					isShownByDefault={false}
					panelId={clientId}
				>
					<SelectControl
						label={__('Source Column')}
						help={__(
							'The column in your data table that defines the source node for each flow.'
						)}
						value={sankey.sourceKey ?? 'x'}
						options={columnOptions}
						onChange={(value) => {
							updateAttributeForDevice('sankey', {
								sourceKey: value,
							});
						}}
					/>
				</WidePanelItem>

				<WidePanelItem
					hasValue={() => true}
					label={__('Target Column')}
					isShownByDefault={false}
					panelId={clientId}
				>
					<SelectControl
						label={__('Target Column')}
						help={__(
							'The column in your data table that defines the target node for each flow.'
						)}
						value={sankey.targetKey ?? 'target'}
						options={columnOptions}
						onChange={(value) => {
							updateAttributeForDevice('sankey', {
								targetKey: value,
							});
						}}
					/>
				</WidePanelItem>

				<WidePanelItem
					hasValue={() => true}
					label={__('Value Column')}
					isShownByDefault={false}
					panelId={clientId}
				>
					<SelectControl
						label={__('Value Column')}
						help={__(
							'The column in your data table that defines the numeric value (flow size) for each link.'
						)}
						value={sankey.valueKey ?? 'value'}
						options={columnOptions}
						onChange={(value) => {
							updateAttributeForDevice('sankey', {
								valueKey: value,
							});
						}}
					/>
				</WidePanelItem>
			</ToolsPanel>
		</PanelBody>
	);
}

export default SankeyControls;
