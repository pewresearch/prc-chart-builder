/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/no-unsafe-wp-apis */

/**
 * External dependencies
 */
import { useMemo, useState } from 'react';

/**
 * WordPress dependencies
 */
import { __experimentalPublishDateTimePicker as DateTimePicker } from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	Dropdown,
	FlexBlock,
	FlexItem,
	FontSizePicker,
	__experimentalHStack as HStack,
	__experimentalNumberControl as NumberControl,
	PanelBody,
	SelectControl,
	__experimentalSpacer as Spacer,
	TextControl,
	ToggleControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { dateI18n, getDate } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, plus, trash } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import presidentPlotBands from '../utils/president-plot-bands';
import ChartPanelColorSettings from './chart-panel-color-settings';
import { Help, StyledLabel } from './control-ui';
import { useFocusedPanel } from './hooks/inspector-focus-context';
import { useViewportAttributes } from './hooks/use-viewport-attributes';

const NEW_PLOT_BAND = {
	x: [null, null],
	y: [0, 100],
	label: null,
	style: {
		band: {
			stroke: 'transparent',
			fill: '#F0F0E6',
			fillOpacity: 0.1,
		},
		label: {
			fontSize: 10,
			fill: '#2a2a2a',
			orientation: 'horizontal',
			align: 'top',
			dx: 0,
			dy: 0,
		},
	},
};

const FONT_SIZES = [
	{ name: __('12'), slug: 'small', size: 12 },
	{ name: __('14'), slug: 'medium', size: 14 },
	{ name: __('16'), slug: 'large', size: 16 },
	{ name: __('18'), slug: 'xl', size: 18 },
	{ name: __('20'), slug: 'xxl', size: 20 },
];

function getPlotBandTitle(plotBand, index) {
	const label = (plotBand.label ?? '').trim();
	if (label !== '') {
		return label;
	}
	return sprintf(
		/* translators: %d: plot band number. */
		__('Plot Band %d', 'prc-chart-builder'),
		index + 1
	);
}

function PostScheduleToggle({ id, fieldLabel, isOpen, onClick, value }) {
	const label = value
		? dateI18n('F j, Y g:i a', getDate(value))
		: __('Choose date', 'prc-chart-builder');
	const ariaLabel = sprintf(
		/* translators: 1: range field label, e.g. "From". 2: selected date. */
		__('%1$s: %2$s', 'prc-chart-builder'),
		fieldLabel,
		label
	);

	return (
		<Button
			__next40pxDefaultSize
			id={id}
			className="edit-post-post-schedule__toggle"
			variant="secondary"
			aria-expanded={isOpen}
			aria-label={ariaLabel}
			onClick={onClick}
		>
			{label}
		</Button>
	);
}

function RangePicker({ label, value, onChange, scale }) {
	const id = useInstanceId(RangePicker, 'prc-chart-plot-band-range');
	const [popoverAnchor, setPopoverAnchor] = useState(null);
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ({ anchor: popoverAnchor, placement: 'bottom-end' }),
		[popoverAnchor]
	);

	if (scale !== 'time') {
		return (
			<NumberControl label={label} value={value} onChange={onChange} />
		);
	}

	return (
		<BaseControl __nextHasNoMarginBottom id={id} label={label}>
			<div ref={setPopoverAnchor}>
				<Dropdown
					popoverProps={popoverProps}
					contentClassName="edit-post-post-schedule__dialog"
					focusOnMount
					renderToggle={({ isOpen, onToggle }) => (
						<PostScheduleToggle
							id={id}
							fieldLabel={label}
							isOpen={isOpen}
							onClick={onToggle}
							value={value}
						/>
					)}
					renderContent={({ onClose }) => (
						<DateTimePicker
							currentDate={value}
							onChange={onChange}
							is12Hour={true}
							onClose={onClose}
						/>
					)}
				/>
			</div>
		</BaseControl>
	);
}

function PlotBandDrawerItem({
	index,
	plotBand,
	scale,
	isOpen,
	onToggle,
	updateBand,
	updateBandStyle,
	deleteBand,
}) {
	const { band, label } = plotBand.style;

	return (
		<>
			<HStack
				className="prc-chart-controls__plot-band-drawer-header"
				alignment="center"
				style={{
					borderTop: '1px solid #e0e0e0',
				}}
			>
				<Button
					__next40pxDefaultSize
					className="components-button components-panel__body-toggle"
					aria-expanded={isOpen}
					onClick={onToggle}
					style={{ flex: 1 }}
					icon={isOpen ? chevronUp : chevronDown}
				>
					<span>{getPlotBandTitle(plotBand, index)}</span>
				</Button>
				<Button
					icon={trash}
					label={__('Delete plot band', 'prc-chart-builder')}
					size="small"
					isDestructive
					__next40pxDefaultSize
					onClick={() => deleteBand(index)}
				/>
			</HStack>
			{isOpen && (
				<div className="components-panel__body-content">
					<TextControl
						__next40pxDefaultSize
						label={__('Label')}
						placeholder={getPlotBandTitle({}, index)}
						value={plotBand.label ?? ''}
						onChange={(value) =>
							updateBand(index, { label: value })
						}
					/>

					<StyledLabel>
						{__('Range', 'prc-chart-builder')}
					</StyledLabel>
					<FlexBlock>
						<FlexItem>
							<RangePicker
								label={__('From')}
								value={plotBand.x[0]}
								scale={scale}
								onChange={(value) =>
									updateBand(index, {
										x: [value, plotBand.x[1]],
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<RangePicker
								label={__('To')}
								value={plotBand.x[1]}
								scale={scale}
								onChange={(value) =>
									updateBand(index, {
										x: [plotBand.x[0], value],
									})
								}
							/>
						</FlexItem>
					</FlexBlock>

					<StyledLabel>
						{__('Label Positioning', 'prc-chart-builder')}
					</StyledLabel>
					<SelectControl
						__next40pxDefaultSize
						label={__('Orientation')}
						value={label.orientation}
						options={[
							{ label: __('Horizontal'), value: 'horizontal' },
							{ label: __('Vertical'), value: 'vertical' },
						]}
						onChange={(value) =>
							updateBandStyle(index, 'label', {
								orientation: value,
							})
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						label={__('Alignment')}
						value={label.align}
						options={[
							{ label: __('Top'), value: 'top' },
							{ label: __('Bottom'), value: 'bottom' },
						]}
						onChange={(value) =>
							updateBandStyle(index, 'label', { align: value })
						}
					/>
					<FlexBlock>
						<FlexItem>
							<NumberControl
								label={__('X Offset')}
								value={label.dx}
								onChange={(value) =>
									updateBandStyle(index, 'label', {
										dx: formatNum(value, 'integer'),
									})
								}
							/>
						</FlexItem>
						<FlexItem>
							<NumberControl
								label={__('Y Offset')}
								value={label.dy}
								onChange={(value) =>
									updateBandStyle(index, 'label', {
										dy: formatNum(value, 'integer'),
									})
								}
							/>
						</FlexItem>
					</FlexBlock>

					<StyledLabel>
						{__('Text Properties', 'prc-chart-builder')}
					</StyledLabel>
					<FontSizePicker
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						value={label.fontSize}
						fontSizes={FONT_SIZES}
						onChange={(fontSize) =>
							updateBandStyle(index, 'label', { fontSize })
						}
					/>

					<StyledLabel>
						{__('Colors & Opacity', 'prc-chart-builder')}
					</StyledLabel>
					<ChartPanelColorSettings
						__experimentalHasMultipleOrigins
						__experimentalIsRenderedInSidebar
						title={__('Colors')}
						initialOpen
						colorSettings={[
							{
								value: band.fill,
								onChange: (val) =>
									updateBandStyle(index, 'band', {
										fill: val ?? '',
									}),
								label: __('Band Fill'),
								contrast: false,
							},
							{
								value: label.fill,
								onChange: (val) =>
									updateBandStyle(index, 'label', {
										fill: val ?? '',
									}),
								label: __('Label text color'),
								contrast: 'text',
							},
						]}
					/>
					<NumberControl
						label={__('Band Opacity')}
						value={band.fillOpacity}
						onChange={(val) =>
							updateBandStyle(index, 'band', { fillOpacity: val })
						}
						min={0}
						max={1}
						step={0.1}
					/>

					<Spacer marginTop={2} marginBottom={4}>
						<Button
							__next40pxDefaultSize
							isDestructive
							icon={trash}
							variant="secondary"
							onClick={() => deleteBand(index)}
						>
							{__('Delete Plot Band', 'prc-chart-builder')}
						</Button>
					</Spacer>
				</div>
			)}
		</>
	);
}

function PlotBandControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } = useViewportAttributes(
		attributes,
		setAttributes
	);
	const { isOpen, panelRef, onToggle } = useFocusedPanel('plotBands');
	const [openBandIndex, setOpenBandIndex] = useState(null);

	const plotBands = getCurrentValue('plotBands') || {};
	const plotBandsActive = Boolean(plotBands.active);
	const bands = plotBands.bands || [];
	const scale = getCurrentValue('independentAxis', 'scale');

	const setBands = (nextBands) =>
		updateAttributeForDevice('plotBands', { bands: nextBands });

	const getBands = () => getCurrentValue('plotBands', 'bands') || [];

	const updateBand = (index, updates) =>
		setBands(
			getBands().map((plotBand, i) =>
				i === index ? { ...plotBand, ...updates } : plotBand
			)
		);

	const updateBandStyle = (index, group, updates) =>
		setBands(
			getBands().map((plotBand, i) =>
				i === index
					? {
							...plotBand,
							style: {
								...plotBand.style,
								[group]: {
									...plotBand.style[group],
									...updates,
								},
							},
						}
					: plotBand
			)
		);

	const addBand = () => {
		const currentBands = getBands();
		setBands([...currentBands, NEW_PLOT_BAND]);
		setOpenBandIndex(currentBands.length);
	};

	const deleteBand = (index) => {
		setBands(getBands().filter((plotBand, i) => i !== index));
		if (openBandIndex === index) {
			setOpenBandIndex(null);
		} else if (openBandIndex > index) {
			setOpenBandIndex(openBandIndex - 1);
		}
	};

	return (
		<div ref={panelRef}>
			<PanelBody
				title={__('Plot Bands')}
				opened={isOpen}
				onToggle={onToggle}
			>
				<VStack spacing={2}>
					<ToggleControl
						label={__('Plot Bands Active')}
						checked={plotBandsActive}
						onChange={(newValue) =>
							updateAttributeForDevice('plotBands', {
								active: newValue,
							})
						}
					/>
				</VStack>
				{plotBandsActive && (
					<VStack spacing={4}>
						<VStack spacing={2}>
							<Button
								__next40pxDefaultSize
								variant="secondary"
								onClick={() => {
									setBands(presidentPlotBands);
									setOpenBandIndex(null);
								}}
							>
								{__(
									'Add Presidential Terms',
									'prc-chart-builder'
								)}
							</Button>
							<Help>
								{__(
									'Replaces any existing plot bands with presidential terms from Eisenhower to Biden (current as of August 16, 2023).',
									'prc-chart-builder'
								)}
							</Help>
						</VStack>

						{bands.map((plotBand, index) => (
							<PlotBandDrawerItem
								key={index}
								index={index}
								plotBand={plotBand}
								scale={scale}
								isOpen={openBandIndex === index}
								onToggle={() =>
									setOpenBandIndex(
										openBandIndex === index ? null : index
									)
								}
								updateBand={updateBand}
								updateBandStyle={updateBandStyle}
								deleteBand={deleteBand}
							/>
						))}

						<Button
							__next40pxDefaultSize
							icon={plus}
							variant="secondary"
							onClick={addBand}
						>
							{__('Add Plot Band', 'prc-chart-builder')}
						</Button>
					</VStack>
				)}
			</PanelBody>
		</div>
	);
}

export default PlotBandControls;
