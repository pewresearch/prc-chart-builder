/**
 * Series Paint Panel Component
 *
 * Panel for customizing one series: fill, stroke, strokeWidth, pointSize, opacity, and dash array.
 * Fields the author leaves empty fall through to the chart defaults.
 */

/* eslint-disable @wordpress/no-unsafe-wp-apis */

import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Button,
	ColorPalette,
	Dropdown,
	PanelBody,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import {
	getPatternEditorOption,
	getPatternType,
	isHatchingPattern,
	patternFromEditorOption,
	patternPrimaryPaintField,
	patternSupportsStrokeWidth,
	readPatternPrimaryPaint,
	readPatternStrokeWidth,
	withPatternPrimaryPaint,
	withPatternStrokeWidth,
} from '@prc/charting-utilities';
import { PATTERN_OPTIONS, STROKE_DASHARRAY_OPTIONS } from '../utils';
import {
	getSeriesStyleFields,
	SERIES_STYLE_FAMILIES,
	strokeIsSeriesColor,
} from '../../../utils/series-style-fields';
import { TextStyleControls } from './TextStyleControls';

const PAINT_FIELDS = [
	...SERIES_STYLE_FAMILIES.identityFill,
	...SERIES_STYLE_FAMILIES.filledMark,
	...SERIES_STYLE_FAMILIES.stroke,
	...SERIES_STYLE_FAMILIES.fade,
	...SERIES_STYLE_FAMILIES.points,
];

function offersField(chartType, mapScale, field) {
	if (!chartType) {
		return true;
	}

	return getSeriesStyleFields(chartType, { mapScale }).includes(field);
}

function nextLabelBag(style, field, value) {
	const next = { ...(style.label ?? {}) };

	if (
		value === '' ||
		value === undefined ||
		value === null ||
		Number.isNaN(value)
	) {
		delete next[field];
	} else {
		next[field] = value;
	}

	return Object.keys(next).length ? next : undefined;
}

/**
 * One color field: a swatch that opens the palette, plus the current value.
 *
 * @param {Object}   props
 * @param {string}   props.label       - Field label.
 * @param {string}   props.value       - Current color, if the series sets one.
 * @param {string}   props.placeholder - Color the series falls back to.
 * @param {Object[]} props.colors      - Palette groups (`{ name, colors }`) for ColorPalette.
 * @param {Function} props.onChange    - Receives the picked color, or undefined.
 * @param {string}   [props.className] - Extra class for the field row.
 */
function SeriesColorField({
	label,
	value,
	placeholder,
	colors,
	onChange,
	className,
}) {
	return (
		<div
			className={
				className
					? `${className} prc-chart-series-paint__color-field`
					: 'prc-chart-series-paint__color-field'
			}
		>
			<span className="prc-chart-series-paint__label">{label}</span>
			<Dropdown
				popoverProps={{ placement: 'left-start' }}
				renderToggle={({ isOpen, onToggle }) => (
					<button
						type="button"
						className="prc-chart-series-paint__color-toggle"
						aria-expanded={isOpen}
						aria-label={label}
						onClick={onToggle}
					>
						<span
							className="prc-chart-series-style-list__swatch"
							style={{ backgroundColor: value ?? placeholder }}
						/>
						<span className="prc-chart-series-paint__color-value">
							{value ?? __('Default', 'prc-chart-builder')}
						</span>
					</button>
				)}
				renderContent={() => (
					<ColorPalette
						className="prc-chart-series-style-list__palette"
						colors={colors}
						value={value}
						clearable
						onChange={onChange}
					/>
				)}
			/>
		</div>
	);
}

/**
 * SeriesPaintPanel Component
 *
 * @param {Object}   props
 * @param {string}   props.category       - Color domain key.
 * @param {Object}   props.style          - Current style for this category.
 * @param {string}   props.paletteSlot    - Color the category falls back to.
 * @param {Object[]} props.paletteOptions - Palette groups (`{ name, colors }`) for the pickers.
 * @param {string}   [props.chartType]    - Block chart type for field gating.
 * @param {string}   [props.mapScale]     - Active map value scale, for field gating.
 * @param {Function} props.onFillChange   - Receives the picked fill, or undefined to clear.
 * @param {Function} props.onFieldChange  - Receives a field name and value.
 * @param {Function} props.onReset        - Hands the category back to the chart defaults.
 */
export function SeriesPaintPanel({
	category,
	style = {},
	paletteSlot,
	paletteOptions = [],
	chartType,
	mapScale,
	onFillChange,
	onFieldChange,
	onReset,
}) {
	const hasCustomizations = Object.keys(style).some(
		(field) => field !== 'fillSource'
	);
	const show = (field) => offersField(chartType, mapScale, field);
	const strokeIsColor = strokeIsSeriesColor(chartType, { mapScale });
	const showPaint = PAINT_FIELDS.some(show);
	const showLabels = SERIES_STYLE_FAMILIES.labels.some(show);

	return (
		<VStack spacing={3} className="prc-chart-series-style-list__panel">
			<Text size="11px" color="#757575" weight={600} upperCase>
				{sprintf(
					/* translators: %s: series name. */
					__('%s — series settings', 'prc-chart-builder'),
					category
				)}
			</Text>

			{showPaint && (
				<PanelBody
					title={__('Paint', 'prc-chart-builder')}
					className="prc-chart-series-style-list__bin-paint"
					initialOpen={false}
				>
					<VStack spacing={3}>
						{show('fill') && (
							<SeriesColorField
								label={__('Fill', 'prc-chart-builder')}
								value={style.fill}
								placeholder={paletteSlot}
								colors={paletteOptions}
								onChange={onFillChange}
							/>
						)}

						{show('stroke') && (
							<SeriesColorField
								label={__('Stroke', 'prc-chart-builder')}
								value={
									strokeIsColor
										? (style.stroke ?? style.fill)
										: style.stroke
								}
								placeholder={
									strokeIsColor ? paletteSlot : undefined
								}
								colors={paletteOptions}
								onChange={
									strokeIsColor
										? onFillChange
										: (value) =>
												onFieldChange('stroke', value)
								}
							/>
						)}

						{show('pattern') && (
							<>
								<SelectControl
									__next40pxDefaultSize
									className="prc-chart-series-style-list__pattern"
									label={__('Pattern', 'prc-chart-builder')}
									value={getPatternEditorOption(
										style.pattern
									)}
									options={PATTERN_OPTIONS}
									onChange={(value) =>
										onFieldChange(
											'pattern',
											patternFromEditorOption(
												style.pattern,
												value
											)
										)
									}
								/>
								{isHatchingPattern(style.pattern) && (
									<>
										<SeriesColorField
											className="prc-chart-series-style-list__pattern-paint"
											label={
												patternPrimaryPaintField(
													getPatternType(
														style.pattern
													)
												) === 'fill'
													? __(
															'Pattern fill',
															'prc-chart-builder'
														)
													: __(
															'Pattern stroke',
															'prc-chart-builder'
														)
											}
											value={readPatternPrimaryPaint(
												style.pattern
											)}
											colors={paletteOptions}
											placeholder="#ffffff"
											onChange={(value) =>
												onFieldChange(
													'pattern',
													withPatternPrimaryPaint(
														style.pattern,
														value
													)
												)
											}
										/>
										{patternSupportsStrokeWidth(
											getPatternType(style.pattern)
										) && (
											<NumberControl
												__next40pxDefaultSize
												className="prc-chart-series-style-list__pattern-stroke-width"
												label={__(
													'Pattern stroke width',
													'prc-chart-builder'
												)}
												value={
													readPatternStrokeWidth(
														style.pattern
													) ?? ''
												}
												min={0}
												step={0.5}
												onChange={(value) => {
													const parsed =
														value === '' ||
														value === undefined
															? undefined
															: parseFloat(value);

													onFieldChange(
														'pattern',
														withPatternStrokeWidth(
															style.pattern,
															Number.isNaN(parsed)
																? undefined
																: parsed
														)
													);
												}}
											/>
										)}
									</>
								)}
							</>
						)}

						{show('strokeWidth') && (
							<NumberControl
								__next40pxDefaultSize
								className="prc-chart-series-style-list__stroke-width"
								label={__('Stroke width', 'prc-chart-builder')}
								value={style.strokeWidth ?? ''}
								min={0}
								step={0.5}
								onChange={(value) =>
									onFieldChange('strokeWidth', value)
								}
							/>
						)}

						{show('pointSize') && (
							<NumberControl
								__next40pxDefaultSize
								className="prc-chart-series-style-list__point-size"
								label={__('Node size', 'prc-chart-builder')}
								value={style.pointSize ?? ''}
								min={0}
								step={1}
								onChange={(value) =>
									onFieldChange('pointSize', value)
								}
							/>
						)}

						{show('pointStrokeWidth') && (
							<NumberControl
								__next40pxDefaultSize
								className="prc-chart-series-style-list__point-stroke-width"
								label={__(
									'Node stroke width',
									'prc-chart-builder'
								)}
								value={style.pointStrokeWidth ?? ''}
								min={0}
								step={0.5}
								onChange={(value) =>
									onFieldChange('pointStrokeWidth', value)
								}
							/>
						)}

						{show('pointFill') && (
							<SelectControl
								__next40pxDefaultSize
								className="prc-chart-series-style-list__point-fill"
								label={__('Node fill', 'prc-chart-builder')}
								value={style.pointFill ?? ''}
								options={[
									{
										label: __(
											'Default',
											'prc-chart-builder'
										),
										value: '',
									},
									{
										label: __(
											'Inherit',
											'prc-chart-builder'
										),
										value: 'inherit',
									},
									{
										label: __('White', 'prc-chart-builder'),
										value: 'white',
									},
								]}
								onChange={(value) =>
									onFieldChange('pointFill', value)
								}
							/>
						)}

						{show('pointFillOpacity') && (
							<NumberControl
								__next40pxDefaultSize
								className="prc-chart-series-style-list__point-fill-opacity"
								label={__(
									'Node fill opacity',
									'prc-chart-builder'
								)}
								value={style.pointFillOpacity ?? ''}
								min={0}
								max={1}
								step={0.1}
								onChange={(value) =>
									onFieldChange('pointFillOpacity', value)
								}
							/>
						)}

						{show('opacity') && (
							<NumberControl
								__next40pxDefaultSize
								className="prc-chart-series-style-list__opacity"
								label={__('Opacity', 'prc-chart-builder')}
								value={style.opacity ?? ''}
								min={0}
								max={1}
								step={0.1}
								onChange={(value) =>
									onFieldChange('opacity', value)
								}
							/>
						)}

						{show('strokeOpacity') && (
							<NumberControl
								__next40pxDefaultSize
								className="prc-chart-series-style-list__stroke-opacity"
								label={__(
									'Stroke opacity',
									'prc-chart-builder'
								)}
								value={style.strokeOpacity ?? ''}
								min={0}
								max={1}
								step={0.1}
								onChange={(value) =>
									onFieldChange('strokeOpacity', value)
								}
							/>
						)}

						{show('strokeDasharray') && (
							<SelectControl
								__next40pxDefaultSize
								className="prc-chart-series-style-list__stroke-dasharray"
								label={__('Dash array', 'prc-chart-builder')}
								value={style.strokeDasharray ?? ''}
								options={STROKE_DASHARRAY_OPTIONS}
								onChange={(value) =>
									onFieldChange('strokeDasharray', value)
								}
							/>
						)}
					</VStack>
				</PanelBody>
			)}

			{showLabels && (
				<PanelBody
					title={__('Labels', 'prc-chart-builder')}
					className="prc-chart-series-style-list__bin-labels"
					initialOpen={false}
				>
					<VStack spacing={3}>
						{show('labelsVisible') && (
							<div className="prc-chart-series-style-list__labels-visible">
								<ToggleControl
									__nextHasNoMarginBottom
									label={__(
										'Show labels',
										'prc-chart-builder'
									)}
									checked={style.labelsVisible !== false}
									onChange={(value) =>
										onFieldChange(
											'labelsVisible',
											value ? undefined : false
										)
									}
								/>
							</div>
						)}

						{show('label') && (
							<>
								<TextStyleControls
									showText={false}
									showTextOutline
									values={{
										fill: style.label?.color,
										fontWeight: style.label?.fontWeight,
										fontStyle: style.label?.fontStyle,
										fontFamily: style.label?.fontFamily,
										fontSize: style.label?.fontSize,
										textOutline: style.label?.textOutline,
									}}
									onChange={(field, value) =>
										onFieldChange(
											'label',
											nextLabelBag(
												style,
												field === 'fill'
													? 'color'
													: field,
												value
											)
										)
									}
									colorField="fill"
									colorPanelTitle={__(
										'Label Color',
										'prc-chart-builder'
									)}
									fontSizeOptions={['10', '12', '14', '16']}
									fontSizeHelp={__(
										'Leave unselected to use chart default',
										'prc-chart-builder'
									)}
								/>

								<NumberControl
									__next40pxDefaultSize
									className="prc-chart-series-style-list__label-max-width"
									label={__(
										'Label max width',
										'prc-chart-builder'
									)}
									value={style.label?.maxWidth ?? ''}
									min={0}
									step={1}
									onChange={(value) =>
										onFieldChange(
											'label',
											nextLabelBag(
												style,
												'maxWidth',
												value === ''
													? ''
													: parseFloat(value)
											)
										)
									}
								/>
							</>
						)}
					</VStack>
				</PanelBody>
			)}

			{hasCustomizations && (
				<Button
					__next40pxDefaultSize
					variant="secondary"
					isDestructive
					onClick={onReset}
				>
					{__('Reset to defaults', 'prc-chart-builder')}
				</Button>
			)}
		</VStack>
	);
}

export default SeriesPaintPanel;
