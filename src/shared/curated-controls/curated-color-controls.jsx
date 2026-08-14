/**
 * Slim color UI for the Style Chart Appearance tab: palette sources + swatches + sorter.
 */
import {
	FormTokenField,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import ColorSorter from '../../chart/edit/color-sorter';
import { getColorSorterLabels } from '../../chart/utils/get-color-sorter-labels';
import { getResolvedPalettes } from '../../chart/utils/resolve-defaults';
import PaletteSwatchPicker from './palette-swatch-picker';
import {
	buildSwatchGroups,
	pruneCustomColors,
	toggleSwatchColor,
} from './swatch-utils';

/**
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 */
export default function CuratedColorControls({ attributes, setAttributes }) {
	const io = attributes.io ?? {};
	const { colorValue, colorPaletteSources, customColors } = io;

	// Resolve palettes once per mount identity of the theme payload — do not
	// put the raw `colors` object in hook deps (getResolvedPalettes returns a
	// new object every call and would remount ColorSorter every render).
	const palettes = useMemo(() => getResolvedPalettes(), []);
	const { colors, colorNames } = palettes;

	const labelBySlug = useMemo(
		() => new Map(colorNames.map(({ label, value }) => [value, label])),
		[colorNames]
	);
	const slugByLabel = useMemo(
		() => new Map(colorNames.map(({ label, value }) => [label, value])),
		[colorNames]
	);

	// Charts saved before multi-palette sources existed only carry colorValue.
	// Treat a missing attribute as that legacy source so the modal shows its
	// swatches without writing on open. An explicit empty array means the
	// author cleared every palette — do not re-seed from colorValue.
	const selectedSources = useMemo(() => {
		if (Array.isArray(colorPaletteSources)) {
			return colorPaletteSources;
		}
		return colorValue ? [colorValue] : [];
	}, [colorPaletteSources, colorValue]);

	const swatchGroups = useMemo(
		() => buildSwatchGroups(selectedSources, palettes),
		[selectedSources, palettes]
	);

	const legendCategories = useMemo(
		() => getColorSorterLabels(attributes),
		[attributes]
	);

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

		const nextPool = buildSwatchGroups(nextSources, palettes).flatMap(
			(group) => group.colors
		);

		setAttributes({
			io: {
				...io,
				colorPaletteSources: nextSources,
				customColors: pruneCustomColors(customColors, nextPool),
				...(nextSources.length > 0
					? { colorValue: nextSources[0] }
					: {}),
			},
		});
	};

	const onToggleSwatch = (hex) => {
		setAttributes({
			io: {
				...io,
				customColors: toggleSwatchColor(customColors, hex),
			},
		});
	};

	return (
		<VStack spacing={3} className="prc-chart-modal__curated-colors">
			<FormTokenField
				label={__('Color palettes', 'prc-chart-builder')}
				value={selectedSources.map(
					(slug) => labelBySlug.get(slug) ?? slug
				)}
				suggestions={colorNames.map(({ label }) => label)}
				onChange={onChangeSources}
				help={__(
					'Select palettes, click colors to use them, then drag to set series order.',
					'prc-chart-builder'
				)}
				__experimentalExpandOnFocus
				__experimentalShowHowTo={false}
				__nextHasNoMarginBottom
				__next40pxDefaultSize
			/>
			<PaletteSwatchPicker
				groups={swatchGroups}
				selectedColors={customColors}
				onToggle={onToggleSwatch}
			/>
			<ColorSorter
				colors={customColors}
				categories={legendCategories}
				setAttributes={setAttributes}
				io={io}
			/>
		</VStack>
	);
}
