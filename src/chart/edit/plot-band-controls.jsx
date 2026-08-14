/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @wordpress/i18n-no-variables */
/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
/* eslint-disable @wordpress/no-unsafe-wp-apis */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	Button,
	Card,
	CardHeader,
	CardBody,
	CardFooter,
	TextControl,
	Dropdown,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	FontSizePicker,
	FlexBlock,
	FlexItem,
	Tip,
} from '@wordpress/components';
import { useState, useMemo } from 'react';
import {
	__experimentalPublishDateTimePicker as DateTimePicker,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { getDate, dateI18n } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { formatNum } from '../utils/helpers';
import presidentPlotBands from '../utils/president-plot-bands';
import { useViewportAttributes } from './hooks/use-viewport-attributes';

function PlotBandControls({ attributes, setAttributes }) {
	// Viewport-aware attribute management
	const { getCurrentValue, updateAttributeForDevice } =
		useViewportAttributes(attributes, setAttributes);

	const plotBands = getCurrentValue('plotBands') || {};
	const bands = plotBands.bands || [];
	const active = plotBands.active;
	const independentAxis = getCurrentValue('independentAxis') || {};
	const scale = independentAxis.scale;

	// Helper function to update a specific band
	const updateBand = (index, updater) => {
		const currentBands = getCurrentValue('plotBands', 'bands') || [];
		updateAttributeForDevice('plotBands', {
			bands: currentBands.map((band, i) =>
				i === index ? updater(band) : band
			),
		});
	};

	return (
		<PanelBody title={__('Plot Bands')} initialOpen={false}>
			<ToggleControl
				label={__('Plot Bands Active')}
				checked={active}
				onChange={(newValue) =>
					updateAttributeForDevice('plotBands', {
						active: newValue,
					})
				}
			/>
			<Spacer height={10} />
			<Button
				variant="secondary"
				onClick={() => {
					updateAttributeForDevice('plotBands', {
						bands: presidentPlotBands,
					});
				}}
			>
				Add Presidential Terms
			</Button>
			<Spacer height={10} />
			<Tip>
				Quick add presidential terms to your chart. This will overwrite
				any existing plot bands. From Eisenhower to Biden, current as of
				August 16, 2023.
			</Tip>
			<Spacer height={20} />
			{bands.map((plotBand, index) => (
				<>
					<Card>
						<CardHeader>
							<TextControl
								placeholder={__('Plot Band') + ` ${index + 1}`}
								value={plotBand.label}
								onChange={(value) => {
									updateBand(index, (band) => ({
										...band,
										label: value,
									}));
								}}
							/>
						</CardHeader>
						<CardBody>
							<Heading level={2}>Range</Heading>
							<Text>From:</Text>
							<RangePicker
								value={plotBand.x[0]}
								scale={scale}
								onChange={(value) => {
									updateBand(index, (band) => ({
										...band,
										x: [value, band.x[1]],
									}));
								}}
							/>
							<Text>To:</Text>
							<RangePicker
								value={plotBand.x[1]}
								scale={scale}
								onChange={(value) => {
									updateBand(index, (band) => ({
										...band,
										x: [band.x[0], value],
									}));
								}}
							/>
						</CardBody>
						<CardBody>
							<StyleOptions
								index={index}
								style={plotBand.style}
								updateBand={updateBand}
							/>
						</CardBody>
						<CardBody>
							<Heading level={2}>Label Positioning</Heading>
							<SelectControl
								label={__('Orientation')}
								value={plotBand.style.label.orientation}
								options={[
									{
										label: __('Horizontal'),
										value: 'horizontal',
									},
									{
										label: __('Vertical'),
										value: 'vertical',
									},
								]}
								onChange={(value) => {
									updateBand(index, (band) => ({
										...band,
										style: {
											...band.style,
											label: {
												...band.style.label,
												orientation: value,
											},
										},
									}));
								}}
							/>
							<SelectControl
								label={__('Alignment')}
								value={plotBand.style.label.align}
								options={[
									{
										label: __('Top'),
										value: 'top',
									},
									{
										label: __('Bottom'),
										value: 'bottom',
									},
								]}
								onChange={(value) => {
									updateBand(index, (band) => ({
										...band,
										style: {
											...band.style,
											label: {
												...band.style.label,
												align: value,
											},
										},
									}));
								}}
							/>
							<FlexBlock>
								<FlexItem>
									<NumberControl
										label={__('X Offset')}
										value={plotBand.style.label.dx}
										onChange={(value) => {
											updateBand(index, (band) => ({
												...band,
												style: {
													...band.style,
													label: {
														...band.style.label,
														dx: formatNum(value, 'integer'),
													},
												},
											}));
										}}
									/>
								</FlexItem>
								<FlexItem>
									<NumberControl
										label={__('Y Offset')}
										value={plotBand.style.label.dy}
										onChange={(value) => {
											updateBand(index, (band) => ({
												...band,
												style: {
													...band.style,
													label: {
														...band.style.label,
														dy: formatNum(value, 'integer'),
													},
												},
											}));
										}}
									/>
								</FlexItem>
							</FlexBlock>
						</CardBody>
						<CardFooter>
							{/* Button to delete this card */}
							<Button
								isDestructive
								onClick={() => {
									const currentBands =
										getCurrentValue('plotBands', 'bands') || [];
									updateAttributeForDevice('plotBands', {
										bands: currentBands.filter(
											(band, i) => i !== index
										),
									});
								}}
							>
								Delete Plot Band
							</Button>
						</CardFooter>
					</Card>
					<Spacer height={10} />
				</>
			))}
			<Button
				onClick={() => {
					const currentBands = getCurrentValue('plotBands', 'bands') || [];
					updateAttributeForDevice('plotBands', {
						bands: [
							...currentBands,
							{
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
							},
						],
					});
				}}
			>
				Add Plot Band
			</Button>
		</PanelBody>
	);
}

const StyleOptions = ({ style, updateBand, index }) => {
	const { band, label } = style;
	return (
		<>
			<Heading level={2}>Styles</Heading>
			<FontSizePicker
				__nextHasNoMarginBottom
				value={label.fontSize}
				fontSizes={[
					{
						name: __('12'),
						slug: 'small',
						size: 12,
					},
					{
						name: __('14'),
						slug: 'medium',
						size: 14,
					},
					{
						name: __('16'),
						slug: 'large',
						size: 16,
					},
					{
						name: __('18'),
						slug: 'xl',
						size: 18,
					},
					{
						name: __('20'),
						slug: 'xxl',
						size: 20,
					},
				]}
				onChange={(newFontSize) => {
					updateBand(index, (b) => ({
						...b,
						style: {
							...b.style,
							label: {
								...b.style.label,
								fontSize: newFontSize,
							},
						},
					}));
				}}
			/>
			<PanelColorSettings
				__experimentalHasMultipleOrigins
				__experimentalIsRenderedInSidebar
				title={__('Fills')}
				initialOpen
				colorSettings={[
					{
						value: band.fill,
						onChange: (val) =>
							updateBand(index, (b) => ({
								...b,
								style: {
									...b.style,
									band: {
										...b.style.band,
										fill: val ?? '',
									},
								},
							})),
						label: __('Band Fill'),
					},
					{
						value: label.fill,
						onChange: (val) =>
							updateBand(index, (b) => ({
								...b,
								style: {
									...b.style,
									label: {
										...b.style.label,
										fill: val ?? '',
									},
								},
							})),
						label: __('Label Fill'),
					},
				]}
			/>
			<NumberControl
				label={__('Band Opacity')}
				value={band.fillOpacity}
				onChange={(val) =>
					updateBand(index, (b) => ({
						...b,
						style: {
							...b.style,
							band: {
								...b.style.band,
								fillOpacity: val,
							},
						},
					}))
				}
				min={0}
				max={1}
				step={0.1}
			/>
		</>
	);
};

const RangePicker = ({ value, onChange, scale }) => {
	const [popoverAnchor, setPopoverAnchor] = useState(null);
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ({ anchor: popoverAnchor, placement: 'bottom-end' }),
		[popoverAnchor]
	);

	if (scale === 'time') {
		return (
			<div ref={setPopoverAnchor}>
				<Dropdown
					popoverProps={popoverProps}
					contentClassName="edit-post-post-schedule__dialog"
					focusOnMount
					renderToggle={({ isOpen, onToggle }) => (
						<PostScheduleToggle
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
		);
	}
	return <NumberControl value={value} onChange={onChange} />;
};

function PostScheduleToggle({ isOpen, onClick, value }) {
	const label = value
		? dateI18n('F j, Y g:i a', getDate(value))
		: 'Choose date';

	return (
		<Button
			className="edit-post-post-schedule__toggle"
			variant="tertiary"
			label={label}
			showTooltip
			aria-expanded={isOpen}
			aria-label={`Change date: ${label}`}
			onClick={onClick}
		>
			{label}
		</Button>
	);
}

export default PlotBandControls;
