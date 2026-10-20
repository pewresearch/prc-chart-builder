// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	RangeControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { PanelDescription, StyledLabel } from './control-ui';

function SankeyControls({ attributes, setAttributes, curated = false }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('sankey');

	const sankey = getCurrentValue('sankey') || {};
	const io = attributes.io || {};
	const { availableCategories = [], independentVariable } = io;

	// Rows key the first table column as `x`, not by its header.
	const columnOptions = [
		{ value: 'x', label: independentVariable || __('First column') },
		...availableCategories.map((col) => ({
			value: col,
			label: col,
		})),
	];

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Sankey Configuration')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<VStack spacing={4}>
					{/* Node Alignment */}
					<VStack spacing={2}>
						<SelectControl
							__next40pxDefaultSize
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
					</VStack>

					{/* Node Section */}
					<PanelDescription>
						<StyledLabel>Nodes</StyledLabel>
					</PanelDescription>

					<VStack spacing={2}>
						<NumberControl
							label={__('Node Width (px)')}
							help={__('Width of the rectangular node bars.')}
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
					</VStack>

					<VStack spacing={2}>
						<NumberControl
							label={__('Node Padding (px)')}
							help={__('Vertical spacing between nodes.')}
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
					</VStack>

					<VStack spacing={2}>
						<NumberControl
							label={__('Border Radius (px)')}
							help={__('Corner rounding for node rectangles.')}
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
					</VStack>

					{/* Link Section */}
					<PanelDescription>
						<StyledLabel>Links</StyledLabel>
					</PanelDescription>

					<VStack spacing={2}>
						<RangeControl
							__next40pxDefaultSize
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
					</VStack>

					{!curated && (
						<>
							{/* Data Column Mapping */}
							<PanelDescription>
								<StyledLabel>Data Column Mapping</StyledLabel>
							</PanelDescription>

							<VStack spacing={2}>
								<SelectControl
									__next40pxDefaultSize
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
							</VStack>

							<VStack spacing={2}>
								<SelectControl
									__next40pxDefaultSize
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
							</VStack>

							<VStack spacing={2}>
								<SelectControl
									__next40pxDefaultSize
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
							</VStack>
						</>
					)}
				</VStack>
			</PanelBody>
		</div>
	);
}

export default SankeyControls;
