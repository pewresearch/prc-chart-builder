/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalNumberControl as NumberControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import { useViewportAttributes } from './hooks/use-viewport-attributes';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import {
	PanelDescription,
	WidePanelItem,
} from './control-ui';

function SmallMultiplesControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('smallMultiples');

	const smallMultiples = getCurrentValue('smallMultiples') || {};
	const panelType = smallMultiples.panelType || 'line';
	const columns = smallMultiples.columns ?? 3;
	const panelHeight = smallMultiples.panelHeight ?? 184;
	const minPanelWidth = smallMultiples.minPanelWidth ?? 120;
	const sharedScale = smallMultiples.sharedScale ?? true;
	const axisTreatment = smallMultiples.axisTreatment || 'minimal';
	const emphasisMode = smallMultiples.emphasisMode || 'own-series';
	const panelTitleActive = smallMultiples.panelTitle?.active ?? true;

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Small Multiples')}
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
						label={__('Panel Type')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							label={__('Panel Type')}
							help={__(
								'Chart mark drawn in each panel. Line supports highlight/ghost; column and bar use bar settings; pie uses a shared legend.'
							)}
							value={panelType}
							options={[
								{ label: __('Line'), value: 'line' },
								{ label: __('Column'), value: 'column' },
								{ label: __('Bar (horizontal)'), value: 'bar' },
								{ label: __('Pie'), value: 'pie' },
								{ label: __('Waffle'), value: 'waffle' },
							]}
							onChange={(value) => {
								updateAttributeForDevice('smallMultiples', {
									panelType: value,
								});
							}}
						/>
					</WidePanelItem>

					<WidePanelItem
						hasValue={() => true}
						label={__('Columns')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Columns')}
							help={__(
								'Desktop column count. Viewport overrides and narrow containers can restack to fewer columns.'
							)}
							withInputField
							min={1}
							max={8}
							step={1}
							value={columns}
							onChange={(value) => {
								updateAttributeForDevice('smallMultiples', {
									columns: formatNum(value, 'integer') || 1,
								});
							}}
						/>
					</WidePanelItem>

					{panelType !== 'bar' &&
						panelType !== 'pie' &&
						panelType !== 'waffle' && (
							<WidePanelItem
								hasValue={() => true}
								label={__('Panel Height')}
								isShownByDefault
								panelId={clientId}
							>
								<NumberControl
									label={__('Panel Height (px)')}
									help={__(
										'Locked cell height across viewports. Horizontal bars derive height from category count instead.'
									)}
									withInputField
									min={80}
									max={600}
									step={1}
									value={panelHeight}
									onChange={(value) => {
										updateAttributeForDevice(
											'smallMultiples',
											{
												panelHeight:
													formatNum(
														value,
														'integer'
													) || 184,
											}
										);
									}}
								/>
							</WidePanelItem>
						)}

					<WidePanelItem
						hasValue={() => true}
						label={__('Min Panel Width')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Min Panel Width (px)')}
							help={__(
								'When the chart is too narrow for the requested columns, restack until each panel is at least this wide. Lower it (e.g. 80) to fit more columns on a 640px chart.'
							)}
							withInputField
							min={40}
							max={400}
							step={1}
							value={minPanelWidth}
							onChange={(value) => {
								updateAttributeForDevice('smallMultiples', {
									minPanelWidth:
										formatNum(value, 'integer') || 120,
								});
							}}
						/>
					</WidePanelItem>

					{panelType !== 'pie' && panelType !== 'waffle' && (
						<>
							<WidePanelItem
								hasValue={() => true}
								label={__('Shared Scale')}
								isShownByDefault
								panelId={clientId}
							>
								<ToggleControl
									label={__('Shared Scale')}
									help={__(
										'Use one value domain across all panels. Turn off for per-panel domains.'
									)}
									checked={sharedScale}
									onChange={() => {
										updateAttributeForDevice(
											'smallMultiples',
											{
												sharedScale: !sharedScale,
											}
										);
									}}
								/>
							</WidePanelItem>

							<WidePanelItem
								hasValue={() => true}
								label={__('Axis Treatment')}
								isShownByDefault
								panelId={clientId}
							>
								<SelectControl
									label={__('Axis Treatment')}
									value={axisTreatment}
									options={[
										{
											label: __('Minimal'),
											value: 'minimal',
										},
										{ label: __('Full'), value: 'full' },
									]}
									onChange={(value) => {
										updateAttributeForDevice(
											'smallMultiples',
											{
												axisTreatment: value,
											}
										);
									}}
								/>
								<PanelDescription>
									{__(
										'Minimal densifies edge axes; full draws complete axes on every panel.'
									)}
								</PanelDescription>
							</WidePanelItem>
						</>
					)}

					{panelType === 'line' && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Emphasis')}
							isShownByDefault
							panelId={clientId}
						>
							<SelectControl
								label={__('Emphasis Mode')}
								help={__(
									'Highlight ghosts sibling series using Colors → Deselected (line panels only).'
								)}
								value={emphasisMode}
								options={[
									{
										label: __('Own series'),
										value: 'own-series',
									},
									{
										label: __('Highlight'),
										value: 'highlight',
									},
								]}
								onChange={(value) => {
									updateAttributeForDevice('smallMultiples', {
										emphasisMode: value,
									});
								}}
							/>
						</WidePanelItem>
					)}

					<WidePanelItem
						hasValue={() => true}
						label={__('Panel Titles')}
						isShownByDefault
						panelId={clientId}
					>
						<ToggleControl
							label={__('Show panel titles')}
							help={__(
								'Column or group name above each panel. Click a title to edit text; drag to reposition.'
							)}
							checked={panelTitleActive}
							onChange={() => {
								updateAttributeForDevice('smallMultiples', {
									panelTitle: {
										...(smallMultiples.panelTitle || {}),
										active: !panelTitleActive,
									},
								});
							}}
						/>
					</WidePanelItem>
				</ToolsPanel>
			</PanelBody>
		</div>
	);
}

export default SmallMultiplesControls;
