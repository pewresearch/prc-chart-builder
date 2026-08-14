/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import {
	PanelBody,
	SelectControl,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';

function BeeSwarmControls({ attributes, setAttributes }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);

	const io = attributes.io || {};
	const dataRender = attributes.dataRender || {};
	const availableCategories = io.availableCategories || [];
	const layoutMode = getCurrentValue('beeSwarm', 'layoutMode') || 'dodge';

	const columnOptions = useMemo(
		() => [
			{ value: '', label: __('— None —') },
			...availableCategories.map((col) => ({
				value: col,
				label: col,
			})),
		],
		[availableCategories]
	);

	return (
		<PanelBody title={__('Beeswarm')} initialOpen={false}>
			<SelectControl
				label={__('Layout')}
				value={layoutMode}
				options={[
					{ label: __('Dodge (precise)'), value: 'dodge' },
					{ label: __('Force (clustered)'), value: 'force' },
				]}
				onChange={(value) => {
					const current = getCurrentValue('beeSwarm') || {};
					updateAttributeForDevice('beeSwarm', {
						...current,
						layoutMode: value,
					});
				}}
				help={__(
					'Dodge keeps approximate x positions with configurable spread. Force clusters dots organically and supports group-by centers.'
				)}
			/>
			{layoutMode === 'dodge' && (
				<NumberControl
					label={__('Swarm spread')}
					value={getCurrentValue('beeSwarm', 'swarmSpread') ?? 24}
					min={0}
					max={80}
					step={1}
					onChange={(value) => {
						const current = getCurrentValue('beeSwarm') || {};
						updateAttributeForDevice('beeSwarm', {
							...current,
							swarmSpread: formatNum(value, 'integer'),
						});
					}}
					help={__(
						'How far dots may drift horizontally from their true x value. Higher values form wider pill-shaped clusters; 0 keeps strict vertical stacks.'
					)}
				/>
			)}
			{layoutMode === 'force' && (
				<>
					<SelectControl
						label={__('Group by')}
						value={getCurrentValue('beeSwarm', 'groupBy') || ''}
						options={columnOptions}
						onChange={(value) => {
							const current = getCurrentValue('beeSwarm') || {};
							updateAttributeForDevice('beeSwarm', {
								...current,
								groupBy: value || null,
							});
						}}
						help={__(
							'Optional column for vertical cluster centers. Defaults to the color-by-group column when set.'
						)}
					/>
					<NumberControl
						label={__('Force strength')}
						value={
							getCurrentValue('beeSwarm', 'forceStrength') ?? 0.1
						}
						min={0.01}
						max={1}
						step={0.01}
						onChange={(value) => {
							const current = getCurrentValue('beeSwarm') || {};
							updateAttributeForDevice('beeSwarm', {
								...current,
								forceStrength: formatNum(value, 'float'),
							});
						}}
					/>
				</>
			)}
			{dataRender.groupBreaksCategory && (
				<p
					style={{
						fontSize: '12px',
						color: '#757575',
						marginTop: '8px',
					}}
				>
					{__(
						'Color-by-group uses the Group column in Data settings.'
					)}
				</p>
			)}
		</PanelBody>
	);
}

export default BeeSwarmControls;
