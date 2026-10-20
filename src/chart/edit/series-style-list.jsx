/**
 * WordPress Dependencies
 */
import { ColorPalette, Dropdown } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import {
	clearCategoryFill,
	clearCategoryStyleField,
	clearCategoryStyles,
	setCategoryFill,
	setCategoryStyleField,
} from '../utils/series-styles';
import { strokeIsSeriesColor } from '../utils/series-style-fields';
import { SeriesPaintPanel } from './popover/panels/SeriesPaintPanel';
import useChartColorGroups from './hooks/use-chart-color-groups';
import {
	getSeriesColorGroups,
	getSourceColorGroups,
} from '../utils/get-palette-groups';

const NUMERIC_FIELDS = [
	'strokeWidth',
	'pointSize',
	'pointStrokeWidth',
	'pointFillOpacity',
	'opacity',
	'strokeOpacity',
];

function parseFieldValue(field, value) {
	if (value === '' || value === undefined || value === null) {
		return undefined;
	}

	if (!NUMERIC_FIELDS.includes(field)) {
		return value;
	}

	const parsed = parseFloat(value);
	return Number.isNaN(parsed) ? undefined : parsed;
}

function SeriesStyleRow({
	category,
	paletteSlot,
	paletteOptions,
	seriesStyles,
	chartType,
	mapScale,
	onChange,
}) {
	const style = seriesStyles?.[category] ?? {};
	const strokeIsColor = strokeIsSeriesColor(chartType, { mapScale });
	const color =
		(strokeIsColor ? (style.stroke ?? style.fill) : style.fill) ??
		paletteSlot;

	const handleFieldChange = (field, value) => {
		const parsed = parseFieldValue(field, value);

		onChange(
			parsed === undefined
				? clearCategoryStyleField(seriesStyles, category, field)
				: setCategoryStyleField(seriesStyles, category, field, parsed)
		);
	};

	const handleFillChange = (value) => {
		const base = strokeIsColor
			? clearCategoryStyleField(seriesStyles, category, 'stroke')
			: seriesStyles;

		onChange(
			value
				? setCategoryFill(base, category, value)
				: clearCategoryFill(base, category)
		);
	};

	return (
		<li
			data-category={category}
			className="prc-chart-series-style-list__row"
		>
			<div className="prc-chart-series-style-list__color">
				<Dropdown
					className="prc-chart-series-style-list__dropdown"
					popoverProps={{ placement: 'left-start' }}
					renderToggle={({ isOpen, onToggle }) => (
						<button
							type="button"
							className="prc-chart-series-style-list__toggle"
							aria-expanded={isOpen}
							aria-label={`${__(
								'Series color',
								'prc-chart-builder'
							)}: ${category}`}
							onClick={onToggle}
						>
							<span
								className="prc-chart-series-style-list__swatch"
								style={{ backgroundColor: color }}
							/>
							<span className="prc-chart-series-style-list__name">
								{category}
							</span>
						</button>
					)}
					renderContent={() => (
						<ColorPalette
							className="prc-chart-series-style-list__palette"
							colors={paletteOptions}
							value={style.fill}
							clearable
							onChange={handleFillChange}
						/>
					)}
				/>
			</div>
			<div className="prc-chart-series-style-list__edit-wrap">
				<Dropdown
					className="prc-chart-series-style-list__edit-dropdown"
					contentClassName="prc-chart-series-style-list__edit-popover"
					popoverProps={{ placement: 'left-start' }}
					renderToggle={({ isOpen, onToggle }) => (
						<button
							type="button"
							className="prc-chart-series-style-list__edit"
							aria-expanded={isOpen}
							aria-label={`${__(
								'Edit series',
								'prc-chart-builder'
							)}: ${category}`}
							onClick={onToggle}
						>
							{__('Edit series', 'prc-chart-builder')}
						</button>
					)}
					renderContent={() => (
						<SeriesPaintPanel
							category={category}
							style={style}
							paletteSlot={paletteSlot}
							paletteOptions={paletteOptions}
							chartType={chartType}
							mapScale={mapScale}
							onFillChange={handleFillChange}
							onFieldChange={handleFieldChange}
							onReset={() =>
								onChange(
									clearCategoryStyles(seriesStyles, category)
								)
							}
						/>
					)}
				/>
			</div>
		</li>
	);
}

/**
 * One row per color-domain category, showing the color that series paints.
 *
 * Rows are keyed by name, so a legend reorder never moves a color onto a
 * different series. A category without its own color shows the palette slot it
 * falls back to. The swatch opens a color picker. Edit series opens the full
 * paint settings.
 *
 * @param {Object}   props
 * @param {string[]} props.categories       Color domain keys, in slot order.
 * @param {Object}   props.seriesStyles     Current `seriesStyles` attribute.
 * @param {string[]} props.palette          Active palette colors.
 * @param {string[]} [props.fallbackColors] Per-row colors an unset row shows instead of its palette slot.
 * @param {string[]} [props.paletteSources] Selected palette slugs. When set, the pickers offer only these palettes and UI.
 * @param {string}   [props.chartType]      Block chart type for panel field gating.
 * @param {string}   [props.mapScale]       Active map value scale, for field gating.
 * @param {Function} props.onChange         Receives the next `seriesStyles`.
 */
export default function SeriesStyleList({
	categories = [],
	seriesStyles = {},
	palette = [],
	fallbackColors,
	paletteSources,
	chartType,
	mapScale,
	onChange,
}) {
	const { colors: colorGroups } = useChartColorGroups();
	const paletteOptions = useMemo(
		() =>
			paletteSources
				? getSourceColorGroups(colorGroups, paletteSources)
				: getSeriesColorGroups(palette, colorGroups),
		[paletteSources, palette, colorGroups]
	);

	if (!Array.isArray(categories) || categories.length === 0) {
		return (
			<p className="prc-chart-series-style-list__empty">
				{__(
					'No categories to style yet. Add data to the chart first.',
					'prc-chart-builder'
				)}
			</p>
		);
	}

	return (
		<ul className="prc-chart-series-style-list">
			{categories.map((category, index) => {
				const paletteSlot =
					fallbackColors?.[index] ??
					(palette.length
						? palette[index % palette.length]
						: undefined);

				return (
					<SeriesStyleRow
						key={category}
						category={category}
						paletteSlot={paletteSlot}
						paletteOptions={paletteOptions}
						seriesStyles={seriesStyles}
						chartType={chartType}
						mapScale={mapScale}
						onChange={onChange}
					/>
				);
			})}
		</ul>
	);
}
