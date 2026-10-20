/**
 * Slim color UI for the Style Chart Appearance tab: palette sources and one
 * style row per series.
 */
import {
	FormTokenField,
	ToggleControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import SeriesStyleList from '../../chart/edit/series-style-list';
import SmallMultiplesPanelColors from '../../chart/edit/small-multiples-panel-colors';
import { effectiveChartTypeForControls } from '../../chart/utils/chart-types';
import {
	getSeriesColorKeys,
	getSeriesColorSlotKeys,
} from '../../chart/utils/get-series-color-keys';
import {
	getResolvedPalettes,
	resolveChartSeriesColors,
} from '../../chart/utils/resolve-defaults';
import { stampPaletteFills } from '../../chart/utils/stamp-palette-fills';
import PaletteSuggestion from './palette-suggestion';
import useKeepSuggestionScroll from './use-keep-suggestion-scroll';

/**
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 */
export default function CuratedColorControls({ attributes, setAttributes }) {
	const io = attributes.io ?? {};
	const { colorValue, colorPaletteSources, customColors } = io;

	// getResolvedPalettes returns a new object every call; resolve once so
	// it can sit in hook deps.
	const { colors, colorNames } = useMemo(() => getResolvedPalettes(), []);
	const paletteFieldRef = useKeepSuggestionScroll();

	const labelBySlug = useMemo(
		() => new Map(colorNames.map(({ label, value }) => [value, label])),
		[colorNames]
	);
	const slugByLabel = useMemo(
		() => new Map(colorNames.map(({ label, value }) => [label, value])),
		[colorNames]
	);

	// Charts saved before multi-palette sources existed only carry colorValue.
	// Treat a missing attribute as that legacy source without writing on open.
	// An explicit empty array means the author cleared every palette — do not
	// re-seed from colorValue.
	const selectedSources = useMemo(() => {
		if (Array.isArray(colorPaletteSources)) {
			return colorPaletteSources;
		}
		return colorValue ? [colorValue] : [];
	}, [colorPaletteSources, colorValue]);

	const legendCategories = useMemo(
		() => getSeriesColorKeys(attributes),
		[attributes]
	);
	const slotKeys = useMemo(
		() => getSeriesColorSlotKeys(attributes),
		[attributes]
	);

	// Legacy charts keep rendering from their picked customColors until the
	// author changes palettes.
	const seriesPalette = useMemo(
		() => resolveChartSeriesColors(customColors, colorValue, colors),
		[customColors, colorValue, colors]
	);
	const rowDefaults = legendCategories.map((key) => {
		const slot = slotKeys.indexOf(key);
		return slot >= 0 && seriesPalette.length
			? seriesPalette[slot % seriesPalette.length]
			: undefined;
	});

	const smallMultiples = attributes.smallMultiples ?? {};
	const offersPanelColors =
		attributes.layout?.type === 'small-multiples' &&
		!['pie', 'waffle'].includes(smallMultiples.panelType);
	const usesPanelColors =
		offersPanelColors && smallMultiples.colorMode === 'panel';

	const onChangeSources = (tokens) => {
		const nextSources = tokens
			.map((token) => (typeof token === 'string' ? token : token?.value))
			.map((token) => {
				if (slugByLabel.has(token)) {
					return slugByLabel.get(token);
				}
				// Legacy slugs without a catalog entry render as their own
				// label; keep them selectable instead of dropping them.
				return token in colors ? token : null;
			})
			.filter(Boolean);

		const [firstSource] = nextSources;

		setAttributes({
			io: {
				...io,
				colorPaletteSources: nextSources,
				customColors: [],
				...(firstSource ? { colorValue: firstSource } : {}),
			},
			...(firstSource && {
				seriesStyles: stampPaletteFills(
					slotKeys,
					attributes.seriesStyles ?? {},
					resolveChartSeriesColors([], firstSource, colors)
				),
			}),
		});
	};

	return (
		<VStack spacing={3} className="prc-chart-modal__curated-colors">
			<div ref={paletteFieldRef}>
				<FormTokenField
					label={__('Color palettes', 'prc-chart-builder')}
					value={selectedSources.map(
						(slug) => labelBySlug.get(slug) ?? slug
					)}
					suggestions={colorNames.map(({ label }) => label)}
					onChange={onChangeSources}
					help={__(
						'Series take the first palette by default. Every selected palette is offered when you set a series color.',
						'prc-chart-builder'
					)}
					__experimentalRenderItem={({ item }) => (
						<PaletteSuggestion
							label={item}
							colors={colors[slugByLabel.get(item) ?? item]}
						/>
					)}
					__experimentalExpandOnFocus
					__experimentalShowHowTo={false}
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</div>
			{offersPanelColors && (
				<ToggleControl
					label={__(
						'Color each panel separately',
						'prc-chart-builder'
					)}
					help={__(
						'Adds a color section per panel. Panels you leave alone keep the shared series colors.',
						'prc-chart-builder'
					)}
					checked={usesPanelColors}
					onChange={(checked) =>
						setAttributes({
							smallMultiples: {
								...smallMultiples,
								colorMode: checked ? 'panel' : 'shared',
							},
						})
					}
					__nextHasNoMarginBottom
				/>
			)}
			{usesPanelColors && (
				<h3 className="prc-chart-controls__label">
					{__('Shared series colors', 'prc-chart-builder')}
				</h3>
			)}
			<SeriesStyleList
				categories={legendCategories}
				seriesStyles={attributes.seriesStyles ?? {}}
				palette={seriesPalette}
				fallbackColors={rowDefaults}
				paletteSources={selectedSources}
				chartType={
					effectiveChartTypeForControls(attributes) ||
					attributes.layout?.type
				}
				mapScale={
					attributes.dataRender?.mapStyle === 'bubble'
						? undefined
						: attributes.dataRender?.mapScale
				}
				onChange={(next) => setAttributes({ seriesStyles: next })}
			/>
			{usesPanelColors && (
				<SmallMultiplesPanelColors
					attributes={attributes}
					palette={seriesPalette}
					paletteSources={selectedSources}
					chartType={effectiveChartTypeForControls(attributes)}
					onChange={(panelStyles) =>
						setAttributes({
							smallMultiples: { ...smallMultiples, panelStyles },
						})
					}
				/>
			)}
		</VStack>
	);
}
