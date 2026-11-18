/**
 * Election hemicycle (parliament) chart inspector controls.
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

const DEFAULT_STACKED_BAR = { active: false, height: 16, gap: 24 };

function HemicycleControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('hemicycle');

	const hemicycle = getCurrentValue('hemicycle') || {};
	const seatShape = hemicycle.seatShape || 'circle';
	const seatGap = hemicycle.seatGap ?? 0.15;
	const rows = hemicycle.rows ?? null;
	const innerRadiusRatio = hemicycle.innerRadiusRatio ?? 0.4;
	const totalSeats = hemicycle.totalSeats ?? null;
	const emptyFill = hemicycle.emptyFill || '#E6E7E8';
	const stackedBar = { ...DEFAULT_STACKED_BAR, ...hemicycle.stackedBar };

	const updateHemicycle = (updates) => {
		updateAttributeForDevice('hemicycle', updates);
	};

	const updateStackedBar = (updates) => {
		updateHemicycle({ stackedBar: { ...stackedBar, ...updates } });
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Hemicycle Configuration')}
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
						hasValue={() => totalSeats !== null}
						label={__('Total Seats')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Total Seats')}
							help={__(
								'Seats in the chamber. Leave empty to use the sum of party seats. Set higher than the sum to show vacant seats.'
							)}
							withInputField
							min={1}
							step={1}
							value={totalSeats ?? ''}
							placeholder={__('Auto (sum)')}
							onChange={(value) => {
								if (value === '' || value === null) {
									updateHemicycle({ totalSeats: null });
									return;
								}
								updateHemicycle({
									totalSeats:
										formatNum(value, 'integer') ?? null,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => rows !== null}
						label={__('Rows')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Rows')}
							help={__(
								'Number of semicircle rows. Leave empty to fit rows to the seat count.'
							)}
							withInputField
							min={1}
							max={40}
							step={1}
							value={rows ?? ''}
							placeholder={__('Auto')}
							onChange={(value) => {
								if (value === '' || value === null) {
									updateHemicycle({ rows: null });
									return;
								}
								updateHemicycle({
									rows: formatNum(value, 'integer') ?? null,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Inner Radius')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Inner Radius')}
							help={__(
								'Size of the empty center as a fraction of the outer radius (0–0.9).'
							)}
							withInputField
							min={0}
							max={0.9}
							step={0.05}
							value={innerRadiusRatio}
							onChange={(value) => {
								updateHemicycle({
									innerRadiusRatio:
										formatNum(value, 'float') ?? 0.4,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Seat Shape')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							__next40pxDefaultSize
							label={__('Seat Shape')}
							value={seatShape}
							options={[
								{ label: __('Circle'), value: 'circle' },
								{ label: __('Square'), value: 'square' },
							]}
							onChange={(value) => {
								updateHemicycle({ seatShape: value });
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Seat Gap')}
						isShownByDefault
						panelId={clientId}
					>
						<NumberControl
							label={__('Seat Gap')}
							help={__(
								'Space between seats as a fraction of seat size (0–0.9).'
							)}
							withInputField
							min={0}
							max={0.9}
							step={0.05}
							value={seatGap}
							onChange={(value) => {
								updateHemicycle({
									seatGap: formatNum(value, 'float') ?? 0.15,
								});
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => true}
						label={__('Vacant Seat Color')}
						isShownByDefault
						panelId={clientId}
					>
						<SelectControl
							__next40pxDefaultSize
							label={__('Vacant Seat Color')}
							value={emptyFill}
							options={[
								{ label: __('Light Gray'), value: '#E6E7E8' },
								{ label: __('White'), value: '#FFFFFF' },
								{ label: __('Medium Gray'), value: '#CCCCCC' },
							]}
							onChange={(value) => {
								updateHemicycle({ emptyFill: value });
							}}
						/>
					</WidePanelItem>
					<WidePanelItem
						hasValue={() => stackedBar.active}
						label={__('Stacked Bar')}
						isShownByDefault
						panelId={clientId}
					>
						<ToggleControl
							label={__('Show stacked bar')}
							help={__(
								'Draw a stacked bar under the arcs with the same seat totals.'
							)}
							checked={stackedBar.active}
							onChange={(value) => {
								updateStackedBar({ active: value });
							}}
						/>
					</WidePanelItem>
					{stackedBar.active && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Bar Height')}
							isShownByDefault
							panelId={clientId}
						>
							<NumberControl
								label={__('Bar Height (px)')}
								withInputField
								min={4}
								max={60}
								step={1}
								value={stackedBar.height}
								onChange={(value) => {
									updateStackedBar({
										height:
											formatNum(value, 'integer') ?? 16,
									});
								}}
							/>
						</WidePanelItem>
					)}
					{stackedBar.active && (
						<WidePanelItem
							hasValue={() => true}
							label={__('Bar Gap')}
							isShownByDefault
							panelId={clientId}
						>
							<NumberControl
								label={__('Space Above Bar (px)')}
								withInputField
								min={0}
								max={80}
								step={1}
								value={stackedBar.gap}
								onChange={(value) => {
									updateStackedBar({
										gap: formatNum(value, 'integer') ?? 24,
									});
								}}
							/>
						</WidePanelItem>
					)}
				</ToolsPanel>
			</PanelBody>
		</div>
	);
}

export default HemicycleControls;
