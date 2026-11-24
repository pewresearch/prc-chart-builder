/**
 * The chart type templates, by template key.
 *
 * The key is the chart type slug in camelCase plus `Template`, for example
 * `map-usa-county` gives `mapUsaCountyTemplate`. The Select Chart step reads a
 * template from this map by its key. To add a chart type, import its template
 * and add it to the map.
 */
import areaTemplate from './area';
import barTemplate from './bar';
import columnTemplate from './column';
import divergingBarTemplate from './diverging-bar';
import divergingColumnTemplate from './diverging-column';
import dotPlotTemplate from './dot-plot';
import explodedBarTemplate from './exploded-bar';
import freeformTemplate from './freeform';
import lineTemplate from './line';
import mapUsaTemplate from './map-usa';
import mapUsaBlockTemplate from './map-usa-block';
import mapUsaCountyTemplate from './map-usa-county';
import mapUsaCbsaTemplate from './map-usa-cbsa';
import mapUsaHexTemplate from './map-usa-hex';
import mapWorldTemplate from './map-world';
import mapWorldOrthographicTemplate from './map-world-orthographic';
import pieTemplate from './pie';
import sankeyTemplate from './sankey';
import scatterTemplate from './scatter';
import beeSwarmTemplate from './bee-swarm';
import smallMultiplesTemplate from './small-multiples';
import stackedAreaTemplate from './stacked-area';
import stackedBarTemplate from './stacked-bar';
import stackedColumnTemplate from './stacked-column';
import treemapTemplate from './treemap';
import waffleTemplate from './waffle';
import wafflePortionTemplate from './waffle-portion';
import heatMapTableTemplate from './heat-map-table';
import hemicycleTemplate from './hemicycle';
import legacyBarTemplate from './legacyBar';
import legacyLineTemplate from './legacyLine';
import legacyColumnTemplate from './legacyColumn';
import legacyAreaTemplate from './legacyArea';
import legacyScatterTemplate from './legacyScatter';
import legacyStackedBarTemplate from './legacyStackedBar';
import legacyStackedColumnTemplate from './legacyStackedColumn';
import legacyStackedAreaTemplate from './legacyStackedArea';

export const VARIATION_TEMPLATES = {
	areaTemplate,
	barTemplate,
	columnTemplate,
	divergingBarTemplate,
	divergingColumnTemplate,
	dotPlotTemplate,
	explodedBarTemplate,
	freeformTemplate,
	lineTemplate,
	mapUsaTemplate,
	mapUsaBlockTemplate,
	mapUsaCountyTemplate,
	mapUsaCbsaTemplate,
	mapUsaHexTemplate,
	mapWorldTemplate,
	mapWorldOrthographicTemplate,
	pieTemplate,
	sankeyTemplate,
	scatterTemplate,
	beeSwarmTemplate,
	smallMultiplesTemplate,
	stackedAreaTemplate,
	stackedBarTemplate,
	stackedColumnTemplate,
	treemapTemplate,
	waffleTemplate,
	wafflePortionTemplate,
	heatMapTableTemplate,
	hemicycleTemplate,
	legacyBarTemplate,
	legacyLineTemplate,
	legacyColumnTemplate,
	legacyAreaTemplate,
	legacyScatterTemplate,
	legacyStackedBarTemplate,
	legacyStackedColumnTemplate,
	legacyStackedAreaTemplate,
};
