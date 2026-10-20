// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalNumberControl as NumberControl,
	ToggleControl,
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

function TreemapControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('treemap');

	const treemap = getCurrentValue('treemap') || {};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Treemap Configuration')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<VStack spacing={4}>
					{/* Tiling Algorithm */}
					<VStack spacing={2}>
						<SelectControl
							__next40pxDefaultSize
							label={__('Tiling Algorithm')}
							help={__(
								'Controls how the treemap rectangles are arranged.'
							)}
							value={treemap.tile ?? 'squarify'}
							options={[
								{
									value: 'squarify',
									label: 'Squarify (Recommended)',
								},
								{ value: 'binary', label: 'Binary' },
								{ value: 'dice', label: 'Dice (Horizontal)' },
								{ value: 'slice', label: 'Slice (Vertical)' },
								{
									value: 'sliceDice',
									label: 'Slice & Dice (Alternating)',
								},
								{ value: 'resquarify', label: 'Resquarify' },
							]}
							onChange={(value) => {
								updateAttributeForDevice('treemap', {
									tile: value,
								});
							}}
						/>
					</VStack>

					{/* Spacing Section */}
					<PanelDescription>
						<StyledLabel>Spacing</StyledLabel>
					</PanelDescription>

					<VStack spacing={2}>
						<NumberControl
							label={__('Inner Padding (px)')}
							help={__(
								'Spacing between sibling rectangles within a group.'
							)}
							withInputField
							min={0}
							max={20}
							step={1}
							value={treemap.paddingInner ?? 2}
							onChange={(value) => {
								updateAttributeForDevice('treemap', {
									paddingInner: formatNum(value, 'integer'),
								});
							}}
						/>
					</VStack>

					<VStack spacing={2}>
						<NumberControl
							label={__('Outer Padding (px)')}
							help={__('Spacing between parent and child nodes.')}
							withInputField
							min={0}
							max={20}
							step={1}
							value={treemap.paddingOuter ?? 4}
							onChange={(value) => {
								updateAttributeForDevice('treemap', {
									paddingOuter: formatNum(value, 'integer'),
								});
							}}
						/>
					</VStack>

					{/* Stroke Section */}
					<PanelDescription>
						<StyledLabel>Stroke</StyledLabel>
					</PanelDescription>

					<VStack spacing={2}>
						<NumberControl
							label={__('Stroke Width (px)')}
							help={__(
								'Width of the border around each rectangle.'
							)}
							withInputField
							min={0}
							max={10}
							step={0.5}
							value={treemap.rectStrokeWidth ?? 2}
							onChange={(value) => {
								updateAttributeForDevice('treemap', {
									rectStrokeWidth: formatNum(value, 'float'),
								});
							}}
						/>
					</VStack>

					<VStack spacing={2}>
						<NumberControl
							label={__('Border Radius (px)')}
							help={__('Corner rounding for treemap rectangles.')}
							withInputField
							min={0}
							max={20}
							step={1}
							value={treemap.borderRadius ?? 0}
							onChange={(value) => {
								updateAttributeForDevice('treemap', {
									borderRadius: formatNum(value, 'integer'),
								});
							}}
						/>
					</VStack>

					{/* Opacity Section */}
					<PanelDescription>
						<StyledLabel>Opacity</StyledLabel>
					</PanelDescription>

					<VStack spacing={2}>
						<ToggleControl
							label={__('Scale Opacity by Value')}
							help={__(
								'When enabled, rectangles within each group will have varying opacity based on their value — larger values appear more opaque.'
							)}
							checked={treemap.scaleOpacity ?? false}
							onChange={() => {
								updateAttributeForDevice('treemap', {
									scaleOpacity: !treemap.scaleOpacity,
								});
							}}
						/>
					</VStack>

					{treemap.scaleOpacity && (
						<>
							<VStack spacing={2}>
								<RangeControl
									__next40pxDefaultSize
									label={__('Min Opacity')}
									min={0}
									max={1}
									step={0.05}
									value={treemap.opacityRange?.[0] ?? 0.4}
									onChange={(value) => {
										updateAttributeForDevice('treemap', {
											opacityRange: [
												value,
												treemap.opacityRange?.[1] ?? 1,
											],
										});
									}}
								/>
							</VStack>

							<VStack spacing={2}>
								<RangeControl
									__next40pxDefaultSize
									label={__('Max Opacity')}
									min={0}
									max={1}
									step={0.05}
									value={treemap.opacityRange?.[1] ?? 1}
									onChange={(value) => {
										updateAttributeForDevice('treemap', {
											opacityRange: [
												treemap.opacityRange?.[0] ??
													0.4,
												value,
											],
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

export default TreemapControls;
