// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { PanelColorSettings } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	Flex,
	FlexItem,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';

const NodeControls = ({ attributes, setAttributes, chartType }) => {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('nodes');
	const pointStroke = getCurrentValue('nodes', 'pointStroke') ?? 'inherit';
	const availableCategories = attributes?.io?.availableCategories;
	// Legacy `white` stroke was a dead template token; treat as series color.
	const strokePreset =
		pointStroke === 'inherit' || pointStroke === 'white'
			? 'inherit'
			: 'custom';

	const sizeCategory = getCurrentValue('nodes', 'sizeCategory') || '';
	const supportsVariableSize = ['scatter', 'bee-swarm'].includes(chartType);
	const hasVariableSize = supportsVariableSize && !!sizeCategory;

	const sizeCategoryOptions = useMemo(
		() => [
			{ value: '', label: __('— None (fixed size) —') },
			...(availableCategories || []).map((category) => ({
				label: category,
				value: category,
			})),
		],
		[availableCategories]
	);

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Node Styles')}
				opened={isOpen}
				onToggle={onToggle}
			>
				{supportsVariableSize && (
					<>
						<SelectControl
							label={__('Size by column')}
							help={__(
								'Scale each dot’s radius from values in a data column. Leave empty for a fixed node size.'
							)}
							value={sizeCategory}
							options={sizeCategoryOptions}
							onChange={(value) => {
								const currentNodes =
									getCurrentValue('nodes') || {};
								updateAttributeForDevice('nodes', {
									...currentNodes,
									sizeCategory: value || null,
								});
							}}
						/>
						{hasVariableSize && (
							<Flex>
								<FlexItem style={{ width: '50%' }}>
									<NumberControl
										min={1}
										label={__('Min radius (px)')}
										value={
											getCurrentValue(
												'nodes',
												'minPointSize'
											) ?? 4
										}
										onChange={(value) => {
											const currentNodes =
												getCurrentValue('nodes') || {};
											updateAttributeForDevice('nodes', {
												...currentNodes,
												minPointSize:
													formatNum(
														value,
														'integer'
													) || 4,
											});
										}}
									/>
								</FlexItem>
								<FlexItem style={{ width: '50%' }}>
									<NumberControl
										min={1}
										label={__('Max radius (px)')}
										value={
											getCurrentValue(
												'nodes',
												'maxPointSize'
											) ?? 24
										}
										onChange={(value) => {
											const currentNodes =
												getCurrentValue('nodes') || {};
											updateAttributeForDevice('nodes', {
												...currentNodes,
												maxPointSize:
													formatNum(
														value,
														'integer'
													) || 24,
											});
										}}
									/>
								</FlexItem>
							</Flex>
						)}
						{hasVariableSize && (
							<SelectControl
								label={__('Scale type')}
								help={__(
									'Area (sqrt) keeps perceived circle area proportional to the value, matching bubble maps.'
								)}
								value={
									getCurrentValue('nodes', 'sizeScale') ||
									'sqrt'
								}
								options={[
									{ label: __('Area (sqrt)'), value: 'sqrt' },
									{ label: __('Linear'), value: 'linear' },
									{ label: __('Log'), value: 'log' },
								]}
								onChange={(value) => {
									const currentNodes =
										getCurrentValue('nodes') || {};
									updateAttributeForDevice('nodes', {
										...currentNodes,
										sizeScale: value,
									});
								}}
							/>
						)}
					</>
				)}
				<NumberControl
					min={1}
					label={
						hasVariableSize
							? __('Fallback node size')
							: __('Node Size')
					}
					help={
						hasVariableSize
							? __(
									'Used when a row is missing a numeric size value.'
								)
							: undefined
					}
					value={getCurrentValue('nodes', 'pointSize')}
					onChange={(value) => {
						const currentNodes = getCurrentValue('nodes') || {};
						updateAttributeForDevice('nodes', {
							...currentNodes,
							pointSize: formatNum(value, 'integer'),
						});
					}}
				/>
				<NumberControl
					min={1}
					label={__('Node Stroke Width')}
					value={getCurrentValue('nodes', 'pointStrokeWidth')}
					onChange={(value) => {
						const currentNodes = getCurrentValue('nodes') || {};
						updateAttributeForDevice('nodes', {
							...currentNodes,
							pointStrokeWidth: formatNum(value, 'integer'),
						});
					}}
				/>
				<SelectControl
					label={__('Node Fill')}
					options={[
						{ label: 'Inherit', value: 'inherit' },
						{ label: 'White', value: 'white' },
					]}
					value={getCurrentValue('nodes', 'pointFill')}
					onChange={(value) => {
						const currentNodes = getCurrentValue('nodes') || {};
						updateAttributeForDevice('nodes', {
							...currentNodes,
							pointFill: value,
						});
					}}
				/>
				<NumberControl
					min={0}
					max={1}
					step={0.1}
					label={__('Node Fill Opacity')}
					value={getCurrentValue('nodes', 'pointFillOpacity') ?? 1}
					onChange={(value) => {
						const currentNodes = getCurrentValue('nodes') || {};
						updateAttributeForDevice('nodes', {
							...currentNodes,
							pointFillOpacity: formatNum(value, 'float') ?? 1,
						});
					}}
				/>
				<SelectControl
					label={__('Node Stroke')}
					options={[
						{ label: __('Series color'), value: 'inherit' },
						{ label: __('Custom'), value: 'custom' },
					]}
					value={strokePreset}
					onChange={(value) => {
						const currentNodes = getCurrentValue('nodes') || {};
						updateAttributeForDevice('nodes', {
							...currentNodes,
							pointStroke:
								value === 'custom'
									? !['inherit', 'white'].includes(
											currentNodes.pointStroke
										)
										? currentNodes.pointStroke
										: '#2a2a2a'
									: 'inherit',
						});
					}}
					help={__(
						'Series color uses each category color (including highlight styling). Pick Custom to set any stroke color, including white.'
					)}
				/>
				{strokePreset === 'custom' && (
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Custom Node Stroke')}
						colorSettings={[
							{
								value:
									pointStroke === 'white'
										? '#ffffff'
										: pointStroke,
								onChange: (value) => {
									const currentNodes =
										getCurrentValue('nodes') || {};
									updateAttributeForDevice('nodes', {
										...currentNodes,
										pointStroke: value ?? '#2a2a2a',
									});
								},
								label: __('Stroke'),
							},
						]}
					/>
				)}
			</PanelBody>
		</div>
	);
};

export default NodeControls;
