/**
 * Waffle chart inspector controls.
 */
import {
	__experimentalNumberControl as NumberControl,
	PanelBody,
	SelectControl,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { formatNum } from '../utils/helpers';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import {
	WidePanelItem,
} from './control-ui';

function resolveWaffleDisplayMode(attributes) {
	const layout = attributes.layout || {};
	const smallMultiples = attributes.smallMultiples || {};
	const waffle = attributes.waffle || {};

	if (waffle.displayMode) {
		return waffle.displayMode;
	}

	if (
		layout.type === 'small-multiples' &&
		smallMultiples.panelType === 'waffle'
	) {
		return 'portion';
	}

	return 'whole';
}

function WaffleControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('waffle');

	const waffle = getCurrentValue('waffle') || {};
	const layout = getCurrentValue('layout') || {};
	const smallMultiples = getCurrentValue('smallMultiples') || {};
	const displayMode = resolveWaffleDisplayMode({
		waffle,
		layout,
		smallMultiples,
	});
	const legacySize = waffle.gridSize;
	const cellShape = waffle.cellShape || 'square';
	const cellGap = waffle.cellGap ?? 0.1;
	const cellRadius = waffle.cellRadius ?? 3;
	const emptyFill = waffle.emptyFill || '#E6E7E8';
	const columns = waffle.columns ?? legacySize ?? 10;
	const rows = waffle.rows ?? legacySize ?? 10;
	const cellSize = waffle.cellSize ?? 14;
	const cellSizeMode = waffle.cellSizeMode || 'clamp';
	const max = waffle.max;

	const updateWaffle = (updates) => {
		updateAttributeForDevice('waffle', updates);
	};

	const applyDisplayMode = (nextDisplayMode) => {
		const nextLayout = { ...layout };
		const nextSmallMultiples = { ...smallMultiples };
		const nextWaffle = {
			...attributes.waffle,
			...waffle,
			displayMode: nextDisplayMode,
		};

		if (nextDisplayMode === 'portion') {
			nextLayout.type = 'small-multiples';
			nextSmallMultiples.panelType = 'waffle';
			if (nextWaffle.max === undefined || nextWaffle.max === null) {
				nextWaffle.max = 100;
			}
		} else {
			nextLayout.type = 'waffle';
		}

		setAttributes({
			waffle: nextWaffle,
			layout: nextLayout,
			smallMultiples: nextSmallMultiples,
		});
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Waffle Configuration')}
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
						label={__('Display Mode')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Display Mode')}
							help={__(
								'Whole shows one grid for the full composition. Portion shows one mini grid per category.'
							)}
							value={displayMode}
							options={[
								{
									label: __('Whole composition'),
									value: 'whole',
								},
								{
									label: __('Portion (small multiples)'),
									value: 'portion',
								},
							]}
							onChange={(value) => {
								applyDisplayMode(value);
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Grid Columns')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Grid Columns')}
							help={__(
								'Number of cells across. With clamp/auto, the grid still fits the chart width.'
							)}
							withInputField
							min={2}
							max={40}
							step={1}
							value={columns}
							onChange={(value) => {
								updateWaffle({
									columns: formatNum(value, 'integer') ?? 10,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Grid Rows')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Grid Rows')}
							help={__('Number of cells tall.')}
							withInputField
							min={2}
							max={40}
							step={1}
							value={rows}
							onChange={(value) => {
								updateWaffle({
									rows: formatNum(value, 'integer') ?? 10,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Cell Size Mode')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Cell Size Mode')}
							help={__(
								'Auto always fits the grid to the chart. Clamp keeps your cell size until it would overflow, then scales down. Fixed never scales.'
							)}
							value={cellSizeMode}
							options={[
								{
									label: __('Clamp to fit (recommended)'),
									value: 'clamp',
								},
								{
									label: __('Auto (always fit)'),
									value: 'auto',
								},
								{
									label: __('Fixed (may overflow)'),
									value: 'fixed',
								},
							]}
							onChange={(value) => {
								updateWaffle({ cellSizeMode: value });
							}}
						/>
					</WidePanelItem>
					{cellSizeMode !== 'auto' && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Cell Size')}
							isShownByDefault
							panelId={clientId}
						>
							<NumberControl
								label={__('Cell Size (px)')}
								help={
									cellSizeMode === 'clamp'
										? __(
												'Preferred cell size. Used when it fits; scaled down on smaller containers.'
											)
										: __(
												'Exact cell size. Grid may overflow narrow containers.'
											)
								}
								withInputField
								min={4}
								max={40}
								step={1}
								value={cellSize}
								onChange={(value) => {
									updateWaffle({
										cellSize:
											formatNum(value, 'integer') ?? 14,
									});
								}}
							/>
						</WidePanelItem>
					)}
					<WidePanelItem
						hasValue={() => max !== null && max !== undefined}
						label={__('Full Grid Represents')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Full Grid Represents (max)')}
							help={
								displayMode === 'portion'
									? __(
											'Domain ceiling. A value of 40 with max 100 fills 40% of the cells. Default 100.'
										)
									: __(
											'Domain ceiling. Leave empty to use the sum of values (no empty cells). Set higher than the sum for intentional empty space.'
										)
							}
							withInputField
							min={1}
							step={1}
							value={max ?? ''}
							placeholder={
								displayMode === 'portion'
									? '100'
									: __('Auto (sum)')
							}
							onChange={(value) => {
								if (value === '' || value === null) {
									updateWaffle({ max: null });
									return;
								}
								updateWaffle({
									max: formatNum(value, 'integer') ?? null,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Cell Shape')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Cell Shape')}
							value={cellShape}
							options={[
								{ label: __('Square'), value: 'square' },
								{ label: __('Circle'), value: 'circle' },
							]}
							onChange={(value) => {
								updateWaffle({ cellShape: value });
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Cell Gap')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Cell Gap')}
							help={__(
								'Padding between cells as a fraction of cell size (0–0.5).'
							)}
							withInputField
							min={0}
							max={0.5}
							step={0.01}
							value={cellGap}
							onChange={(value) => {
								updateWaffle({
									cellGap: formatNum(value, 'float') ?? 0.1,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Cell Radius')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Cell Radius (px)')}
							help={__('Corner radius for square cells.')}
							withInputField
							min={0}
							max={12}
							step={1}
							value={cellRadius}
							onChange={(value) => {
								updateWaffle({
									cellRadius:
										formatNum(value, 'integer') ?? 3,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Empty Fill')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Empty Cell Color')}
							value={emptyFill}
							options={[
								{ label: __('Light Gray'), value: '#E6E7E8' },
								{ label: __('White'), value: '#FFFFFF' },
								{ label: __('Medium Gray'), value: '#CCCCCC' },
							]}
							onChange={(value) => {
								updateWaffle({ emptyFill: value });
							}}
						/>
					</WidePanelItem>
				</ToolsPanel>
			</PanelBody>
		</div>
	);
}

export default WaffleControls;
