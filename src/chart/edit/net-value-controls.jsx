/* eslint-disable max-lines-per-function */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	SelectControl,
	Button,
	Flex,
	FlexItem,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalNumberControl as NumberControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
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
	StyledLabel,
	Help,
} from './control-ui';

const NET_VALUE_PREFIX = '__net_';

/**
 * Renders the full set of controls for one net value side (positive or negative).
 */
function NetValueSideControls({
	side,
	clientId,
	getCurrentValue,
	updateAttributeForDevice,
}) {
	const sideLabel =
		side === 'positive' ? __('Positive Side') : __('Negative Side');
	const sideData = getCurrentValue('netValues', side) || {};

	const updateSide = (patch) => {
		updateAttributeForDevice('netValues', {
			[side]: { ...sideData, ...patch },
		});
	};

	return (
		<>
			<WidePanelItem
				hasValue={() => true}
				label={sideLabel}
				isShownByDefault
				panelId={clientId}
			>
				<PanelDescription>
					<StyledLabel>{sideLabel}</StyledLabel>
				</PanelDescription>
				<TextControl
					label={__('Label Unit')}
					value={sideData.labelUnit || ''}
					onChange={(value) => updateSide({ labelUnit: value })}
					help={__('Add a unit to the label, e.g. % or $')}
				/>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={sideData.labelUnitPosition ?? 'end'}
					label={__('Label Unit Position')}
					onChange={(value) =>
						updateSide({ labelUnitPosition: value })
					}
				>
					<ToggleGroupControlOption
						label={__('Start')}
						value="start"
					/>
					<ToggleGroupControlOption label={__('End')} value="end" />
				</ToggleGroupControl>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() => !!sideData.fontSize && sideData.fontSize !== 12}
				label={`${sideLabel} — ${__('Font Size')}`}
				panelId={clientId}
				isShownByDefault
			>
				<ToggleGroupControl
					__nextHasNoMarginBottom
					isBlock
					value={sideData.fontSize ?? 12}
					label={__('Font Size')}
					onChange={(value) => updateSide({ fontSize: value })}
				>
					<ToggleGroupControlOption label="10px" value={10} />
					<ToggleGroupControlOption label="12px" value={12} />
					<ToggleGroupControlOption label="14px" value={14} />
					<ToggleGroupControlOption label="16px" value={16} />
				</ToggleGroupControl>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() =>
					!!sideData.fontWeight && sideData.fontWeight !== 700
				}
				label={`${sideLabel} — ${__('Font Weight')}`}
				panelId={clientId}
				isShownByDefault
			>
				<SelectControl
					label={__('Font Weight')}
					value={sideData.fontWeight ?? 700}
					onChange={(value) =>
						updateSide({ fontWeight: formatNum(value, 'integer') })
					}
					options={[
						{ label: __('Normal'), value: 400 },
						{ label: __('Semi-Bold'), value: 600 },
						{ label: __('Bold'), value: 700 },
					]}
				/>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() => !!sideData.margin && sideData.margin !== 5}
				label={`${sideLabel} — ${__('Offset from bar')}`}
				panelId={clientId}
				isShownByDefault
			>
				<NumberControl
					label={__('Offset from bar (px)')}
					withInputField
					min={0}
					value={sideData.margin ?? 5}
					onChange={(value) =>
						updateSide({ margin: formatNum(value, 'integer') })
					}
				/>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() =>
					!!sideData.labelPositionDX || !!sideData.labelPositionDY
				}
				label={`${sideLabel} — ${__('Label Positioning')}`}
				panelId={clientId}
				isShownByDefault
			>
				<PanelDescription>
					<StyledLabel>{__('Label Positioning')}</StyledLabel>
				</PanelDescription>
				<Flex>
					<FlexItem>
						<NumberControl
							label={__('DX')}
							value={sideData.labelPositionDX ?? 0}
							onChange={(value) =>
								updateSide({
									labelPositionDX: formatNum(
										value,
										'integer'
									),
								})
							}
						/>
					</FlexItem>
					<FlexItem>
						<NumberControl
							label={__('DY')}
							value={sideData.labelPositionDY ?? 0}
							onChange={(value) =>
								updateSide({
									labelPositionDY: formatNum(
										value,
										'integer'
									),
								})
							}
						/>
					</FlexItem>
				</Flex>
				<PanelDescription>
					<Help>
						{__(
							'Fine-tune the label position relative to the bar end.'
						)}
					</Help>
				</PanelDescription>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() => !!sideData.abbreviateValue}
				label={`${sideLabel} — ${__('Abbreviate Value')}`}
				panelId={clientId}
				isShownByDefault
			>
				<ToggleControl
					label={__('Abbreviate Value')}
					checked={sideData.abbreviateValue || false}
					onChange={(value) => updateSide({ abbreviateValue: value })}
					help={__('Abbreviate large numbers (e.g. 1200 → 1.2K).')}
				/>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() => !!sideData.absoluteValue}
				label={`${sideLabel} — ${__('Absolute Value')}`}
				panelId={clientId}
				isShownByDefault
			>
				<ToggleControl
					label={__('Absolute Value')}
					checked={sideData.absoluteValue || false}
					onChange={(value) => updateSide({ absoluteValue: value })}
					help={__(
						'Always show the label as a positive number. Useful on diverging charts.'
					)}
				/>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() => !!sideData.toLocaleString}
				label={`${sideLabel} — ${__('Format Value')}`}
				panelId={clientId}
				isShownByDefault
			>
				<ToggleControl
					label={__('Format Value to Locale String')}
					checked={sideData.toLocaleString || false}
					onChange={(value) => updateSide({ toLocaleString: value })}
					help={__(
						'Formats number into locale string (e.g. 100000 → 100,000).'
					)}
				/>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() => !!sideData.truncateDecimal}
				label={`${sideLabel} — ${__('Truncate Trailing Decimals')}`}
				panelId={clientId}
				isShownByDefault
			>
				<ToggleControl
					label={__('Truncate Trailing Decimals')}
					checked={sideData.truncateDecimal || false}
					onChange={(value) => updateSide({ truncateDecimal: value })}
					help={__(
						'Removes extraneous trailing decimals (e.g. 1.6000 → 1.6).'
					)}
				/>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() => !!sideData.toFixedDecimal}
				label={`${sideLabel} — ${__('Decimal Places')}`}
				panelId={clientId}
				isShownByDefault
			>
				<NumberControl
					label={__('Decimal Places')}
					value={sideData.toFixedDecimal ?? 0}
					min={0}
					max={100}
					onChange={(value) =>
						updateSide({
							toFixedDecimal: formatNum(value, 'integer'),
						})
					}
				/>
			</WidePanelItem>

			<WidePanelItem
				hasValue={() => true}
				label={`${sideLabel} — ${__('Label Color')}`}
				isShownByDefault
				panelId={clientId}
			>
				<SelectControl
					label={__('Label Color')}
					value={sideData.color || 'black'}
					onChange={(value) => updateSide({ color: value })}
					options={[
						{ label: __('Black'), value: 'black' },
						{ label: __('White'), value: 'white' },
					]}
				/>
			</WidePanelItem>
		</>
	);
}

function NetValueControls({ attributes, setAttributes, clientId }) {
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('netValues');

	const layout = getCurrentValue('layout') || {};
	const { type: chartType } = layout;
	const isDiverging = chartType === 'diverging-bar';

	const customPositions = getCurrentValue('labels', 'customPositions') || {};
	const hasNetValueCustomPositions = Object.keys(customPositions).some(
		(key) => key.includes(NET_VALUE_PREFIX)
	);

	const handleResetNetValuePositions = () => {
		const filtered = Object.fromEntries(
			Object.entries(customPositions).filter(
				([key]) => !key.includes(NET_VALUE_PREFIX)
			)
		);
		updateAttributeForDevice('labels', { customPositions: filtered });
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Net Value Labels')}
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
					<NetValueSideControls
						side="positive"
						clientId={clientId}
						getCurrentValue={getCurrentValue}
						updateAttributeForDevice={updateAttributeForDevice}
					/>

					{isDiverging && (
						<NetValueSideControls
							side="negative"
							clientId={clientId}
							getCurrentValue={getCurrentValue}
							updateAttributeForDevice={updateAttributeForDevice}
						/>
					)}

					{hasNetValueCustomPositions && (
						<WidePanelItem
							hasValue={() => hasNetValueCustomPositions}
							label={__('Reset Custom Positions')}
							panelId={clientId}
						>
							<Button
								variant="secondary"
								isDestructive
								onClick={handleResetNetValuePositions}
							>
								{__('Reset Net Value Label Positions')}
							</Button>
							<PanelDescription>
								<Help>
									{__(
										'Remove all custom net value label positions and return to default positioning.'
									)}
								</Help>
							</PanelDescription>
						</WidePanelItem>
					)}
				</ToolsPanel>
			</PanelBody>
		</div>
	);
}

export default NetValueControls;
