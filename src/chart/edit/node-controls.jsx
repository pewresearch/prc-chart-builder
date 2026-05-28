// V2
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelColorSettings } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './use-viewport-attributes';
import { useFocusedPanel } from './inspector-focus-context';

const NodeControls = ({ attributes, setAttributes }) => {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('nodes');
	const pointStroke = getCurrentValue('nodes', 'pointStroke') ?? 'inherit';
	const strokePreset =
		pointStroke === 'inherit'
			? 'inherit'
			: pointStroke === 'white'
				? 'white'
				: 'custom';

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Node Styles')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<NumberControl
					min={1}
					label={__('Node Size')}
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
				<SelectControl
					label={__('Node Stroke')}
					options={[
						{ label: __('Series color'), value: 'inherit' },
						{ label: __('White'), value: 'white' },
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
										: '#ffffff'
									: value,
						});
					}}
					help={__(
						'Series color uses each category color (including highlight styling). White is a common outline for filled dots.'
					)}
				/>
				{strokePreset === 'custom' && (
					<PanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Custom Node Stroke')}
						colorSettings={[
							{
								value: pointStroke,
								onChange: (value) => {
									const currentNodes =
										getCurrentValue('nodes') || {};
									updateAttributeForDevice('nodes', {
										...currentNodes,
										pointStroke: value ?? '#ffffff',
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
