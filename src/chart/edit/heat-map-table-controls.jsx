/**
 * Heat map table inspector controls.
 */
import {
	__experimentalNumberControl as NumberControl,
	PanelBody,
	SelectControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { formatNum } from '../utils/helpers';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { WidePanelItem } from './control-ui';

function HeatMapTableControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('heatMapTable');

	const heatMapTable = getCurrentValue('heatMapTable') || {};
	const cellGap = heatMapTable.cellGap ?? 0;
	const cellRadius = heatMapTable.cellRadius ?? 0;
	const showValues = heatMapTable.showValues ?? true;
	const emptyFill = heatMapTable.emptyFill || '#F5F5F5';
	const rowLabelWidth = heatMapTable.rowLabelWidth ?? 0;
	const columnHeaderHeight = heatMapTable.columnHeaderHeight ?? 48;
	const minCellWidth = heatMapTable.minCellWidth ?? 40;
	const minCellHeight = heatMapTable.minCellHeight ?? 28;

	const updateHeatMapTable = (updates) => {
		updateAttributeForDevice('heatMapTable', updates);
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Heat Map Table Configuration')}
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
						hasValue={() => showValues !== true}
						label={__('Show Values')}
						isShownByDefault
						panelId={clientId}
					>
						<ToggleControl
							label={__('Show cell values')}
							checked={showValues}
							onChange={(value) => {
								updateHeatMapTable({ showValues: value });
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => cellGap !== 0}
						label={__('Cell Gap')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Cell Gap (px)')}
							help={__('Space between cells.')}
							withInputField
							min={0}
							max={12}
							step={1}
							value={cellGap}
							onChange={(value) => {
								updateHeatMapTable({
									cellGap: formatNum(value, 'integer') ?? 0,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => cellRadius !== 0}
						label={__('Cell Radius')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Cell Radius (px)')}
							help={__('Corner radius for each cell.')}
							withInputField
							min={0}
							max={12}
							step={1}
							value={cellRadius}
							onChange={(value) => {
								updateHeatMapTable({
									cellRadius:
										formatNum(value, 'integer') ?? 0,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => emptyFill !== '#F5F5F5'}
						label={__('Empty Fill')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Empty Cell Color')}
							value={emptyFill}
							options={[
								{ label: __('Light Gray'), value: '#F5F5F5' },
								{ label: __('White'), value: '#FFFFFF' },
								{ label: __('Medium Gray'), value: '#E6E7E8' },
							]}
							onChange={(value) => {
								updateHeatMapTable({ emptyFill: value });
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => rowLabelWidth !== 0}
						label={__('Grid Inset')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Grid inset from y-axis (px)')}
							help={__(
								'Optional gap between the independent axis line and the heat grid. Row labels use the chart left padding, like horizontal bar charts.'
							)}
							withInputField
							min={0}
							max={240}
							step={4}
							value={rowLabelWidth}
							onChange={(value) => {
								updateHeatMapTable({
									rowLabelWidth:
										formatNum(value, 'integer') ?? 0,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => columnHeaderHeight !== 48}
						label={__('Column Header Height')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Column Header Height (px)')}
							help={__(
								'Height reserved for the dependent axis when it is active.'
							)}
							withInputField
							min={24}
							max={96}
							step={4}
							value={columnHeaderHeight}
							onChange={(value) => {
								updateHeatMapTable({
									columnHeaderHeight:
										formatNum(value, 'integer') ?? 48,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => minCellWidth !== 40}
						label={__('Minimum Cell Width')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Minimum Cell Width (px)')}
							withInputField
							min={20}
							max={120}
							step={4}
							value={minCellWidth}
							onChange={(value) => {
								updateHeatMapTable({
									minCellWidth:
										formatNum(value, 'integer') ?? 40,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => minCellHeight !== 28}
						label={__('Minimum Cell Height')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Minimum Cell Height (px)')}
							withInputField
							min={16}
							max={80}
							step={4}
							value={minCellHeight}
							onChange={(value) => {
								updateHeatMapTable({
									minCellHeight:
										formatNum(value, 'integer') ?? 28,
								});
							}}
						/>
					</WidePanelItem>
				</ToolsPanel>
			</PanelBody>
		</div>
	);
}

export default HeatMapTableControls;
