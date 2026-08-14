import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import {
	areaIcon,
	barIcon,
	columnIcon,
	dotPlotIcon,
	lineIcon,
	scatterIcon,
	beeSwarmIcon,
	stackedBarIcon,
	stackedColumnIcon,
	pieIcon,
	treemapIcon,
	sankeyIcon,
	waffleIcon,
	heatMapTableIcon,
	USAMap,
	USACBSAMap,
	USABlockMap,
	USAHexMap,
	worldMap,
	worldGlobe,
	freeformIcon,
} from './icons';

import {
	areaTemplate,
	barTemplate,
	columnTemplate,
	dotPlotTemplate,
	lineTemplate,
	stackedAreaTemplate,
	scatterTemplate,
	beeSwarmTemplate,
	smallMultiplesTemplate,
	stackedBarTemplate,
	stackedColumnTemplate,
	pieTemplate,
	explodedBarTemplate,
	divergingBarTemplate,
	treemapTemplate,
	sankeyTemplate,
	waffleTemplate,
	heatMapTableTemplate,
	// imageTemplate,
	mapUsaTemplate,
	mapUsaCountyTemplate,
	mapUsaCbsaTemplate,
	mapUsaBlockTemplate,
	mapUsaHexTemplate,
	mapWorldTemplate,
	mapWorldOrthographicTemplate,
	freeformTemplate,
} from './variation-templates';

const variations = [
	{
		name: 'cbarea',
		title: __('Area'),
		keywords: [__('area'), __('chart'), __('area chart')],
		description: __('Create an area chart.'),
		icon: areaIcon,
		attributes: { chartType: 'area' },
		innerBlocks: areaTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbBar',
		title: 'Bar',
		keywords: [__('bar'), __('chart'), __('bar chart'), __('single bar')],
		description: __('Create a bar chart.'),
		icon: barIcon,
		attributes: { chartType: 'bar' },
		innerBlocks: barTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbColumn',
		title: 'Column',
		keywords: [
			__('column'),
			__('chart'),
			__('column chart'),
			__('single column'),
		],
		description: __('Create a column chart.'),
		icon: columnIcon,
		attributes: { chartType: 'column' },
		innerBlocks: columnTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbDotPlot',
		title: __('Dot Plot'),
		keywords: [__('dot'), __('chart'), __('dot plot'), __('plot')],
		description: __('Create a dot plot chart.'),
		icon: dotPlotIcon,
		attributes: { chartType: 'dot-plot' },
		innerBlocks: dotPlotTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbExplodedBar',
		title: 'Exploded Bar',
		keywords: [__('bar'), __('chart'), __('bar chart'), __('exploded bar')],
		description: __('Create an exploded bar chart.'),
		icon: barIcon,
		attributes: { chartType: 'exploded-bar' },
		innerBlocks: explodedBarTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbDivergingBar',
		title: 'Diverging Bar Chart',
		keywords: [
			__('bar'),
			__('chart'),
			__('bar chart'),
			__('diverging bar'),
		],
		description: __('Create a diverging bar chart.'),
		icon: barIcon,
		attributes: { chartType: 'diverging-bar' },
		innerBlocks: divergingBarTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbLine',
		title: __('Line'),
		keywords: [__('line'), __('chart'), __('line chart')],
		description: __('Create a line chart.'),
		icon: lineIcon,
		attributes: { chartType: 'line' },
		innerBlocks: lineTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbScatter',
		title: __('Scatter Plot'),
		keywords: [__('scatter'), __('chart'), __('scatter plot'), __('plot')],
		description: __('Create a scatter plot chart.'),
		icon: scatterIcon,
		attributes: { chartType: 'scatter' },
		innerBlocks: scatterTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbBeeSwarm',
		title: __('Beeswarm'),
		keywords: [
			__('beeswarm'),
			__('bee swarm'),
			__('chart'),
			__('distribution'),
			__('dot'),
		],
		description: __('Create a beeswarm chart.'),
		icon: beeSwarmIcon,
		attributes: { chartType: 'bee-swarm' },
		innerBlocks: beeSwarmTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbStackedArea',
		title: 'Stacked Area Chart',
		keywords: [__('area'), __('chart'), __('stacked area')],
		description: __('Create a stacked area chart.'),
		icon: areaIcon,
		attributes: { chartType: 'stacked-area' },
		innerBlocks: stackedAreaTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbStackedBar',
		title: 'Stacked Bar',
		keywords: [__('bar'), __('chart'), __('stacked bar')],
		description: __('Create a stacked bar chart.'),
		icon: stackedBarIcon,
		attributes: { chartType: 'stacked-bar' },
		innerBlocks: stackedBarTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbStackedColumn',
		title: 'Stacked Column',
		keywords: [__('column'), __('chart'), __('stacked column')],
		description: __('Create a stacked column chart.'),
		icon: stackedColumnIcon,
		attributes: { chartType: 'stacked-column' },
		innerBlocks: stackedColumnTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbPie',
		title: 'Pie',
		keywords: [__('chart'), __('pie')],
		description: __('Create a pie chart.'),
		icon: pieIcon,
		attributes: { chartType: 'pie' },
		innerBlocks: pieTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbTreemap',
		title: 'Treemap (BETA)',
		keywords: [__('chart'), __('treemap'), __('hierarchy'), __('area')],
		description: __('Create a treemap chart for hierarchical data.'),
		icon: treemapIcon,
		attributes: { chartType: 'treemap' },
		innerBlocks: treemapTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbSankey',
		title: 'Sankey (BETA)',
		keywords: [__('chart'), __('sankey'), __('flow'), __('diagram')],
		description: __(
			'Create a Sankey diagram to visualize flows between nodes.'
		),
		icon: sankeyIcon,
		attributes: { chartType: 'sankey' },
		innerBlocks: sankeyTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbWaffle',
		title: __('Waffle'),
		keywords: [
			__('waffle'),
			__('chart'),
			__('grid'),
			__('percentage'),
			__('portion'),
			__('small multiples'),
		],
		description: __(
			'Create a waffle chart with one grid or portion mini-grids per category.'
		),
		icon: waffleIcon,
		attributes: { chartType: 'waffle' },
		innerBlocks: waffleTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbHeatMapTable',
		title: __('Heat Map Table'),
		keywords: [
			__('heat map'),
			__('heatmap'),
			__('table'),
			__('matrix'),
			__('grid'),
			__('percentage'),
		],
		description: __(
			'Create a heat map table with colored cells for row-by-column values.'
		),
		icon: heatMapTableIcon,
		attributes: { chartType: 'heat-map-table' },
		innerBlocks: heatMapTableTemplate,
		scope: ['transform'],
	},
	// {
	// 	name: 'cbstatic',
	// 	title: __('Image with Data Table'),
	// 	keywords: [
	// 		__('chart'),
	// 		__('image'),
	// 		__('data table'),
	// 		__('static'),
	// 		__('static chart'),
	// 	],
	// 	description: __(
	// 		'Create a static chart image with a data table and share tabs.'
	// 	),
	// 	icon: barIcon,
	// 	attributes: { chartType: 'static', isStatic: true },
	// 	innerBlocks: imageTemplate,
	// 	scope: ['transform'],
	// },
	{
		name: 'cbUSAMap',
		title: __('USA Map'),
		keywords: [__('map'), __('USA'), __('US')],
		description: __('Create a map of the United States.'),
		icon: USAMap,
		attributes: { chartType: 'map-usa' },
		innerBlocks: mapUsaTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbUSACountyMap',
		title: __('USA County Map'),
		keywords: [__('map'), __('USA'), __('US'), __('county')],
		description: __(
			'Create a map of the United States, with county borders.'
		),
		icon: USAMap,
		attributes: { chartType: 'map-usa-counties' },
		innerBlocks: mapUsaCountyTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbUSACBSAMap',
		title: __('USA CBSA Map'),
		keywords: [
			__('map'),
			__('USA'),
			__('US'),
			__('CBSA'),
			__('metro'),
			__('metropolitan'),
		],
		description: __(
			'Create a map of the United States by Core-Based Statistical Area (CBSA).'
		),
		icon: USACBSAMap,
		attributes: { chartType: 'map-usa-cbsa' },
		innerBlocks: mapUsaCbsaTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbUSABlockMap',
		title: __('USA Block Map'),
		keywords: [__('map'), __('USA'), __('US')],
		description: __('Create a block map of the United States.'),
		icon: USABlockMap,
		attributes: { chartType: 'map-usa-block' },
		innerBlocks: mapUsaBlockTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbUSAHexMap',
		title: __('USA Hex Map (BETA)'),
		keywords: [__('map'), __('USA'), __('US'), __('hex'), __('hexagon')],
		description: __('Create a hexagonal tile map of the United States.'),
		icon: USAHexMap,
		attributes: { chartType: 'map-usa-hex' },
		innerBlocks: mapUsaHexTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbWorldMap',
		title: __('World Map'),
		keywords: [__('map'), __('world')],
		description: __('Create a map of the world.'),
		icon: worldMap,
		attributes: { chartType: 'map-world' },
		innerBlocks: mapWorldTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbWorldOrthographicMap',
		title: __('World Globe Map'),
		keywords: [__('map'), __('world'), __('globe'), __('orthographic')],
		description: __('Create an orthographic globe map of the world.'),
		icon: worldGlobe,
		attributes: { chartType: 'map-world-orthographic' },
		innerBlocks: mapWorldOrthographicTemplate,
		scope: ['transform'],
	},
	{
		name: 'cbSmallMultiples',
		title: __('Small Multiples (BETA)'),
		keywords: [
			__('small multiples'),
			__('facets'),
			__('panel'),
			__('sparkline'),
			__('grid'),
		],
		description: __(
			'Create a small-multiples chart: one panel per data column, shared scale and chrome.'
		),
		// Create-chart modal uses assets/variation-images/small-multiples.png;
		// this icon is only the block-transform fallback.
		icon: lineIcon,
		attributes: { chartType: 'small-multiples' },
		innerBlocks: smallMultiplesTemplate,
		scope: ['transform'],
	},
	{
		name: 'freeform',
		title: __('Freeform'),
		keywords: [__('freeform'), __('chart'), __('freeform chart')],
		description: __(
			'Create a freeform chart. Any block can be used in the chart view.'
		),
		icon: freeformIcon,
		attributes: {
			chartType: 'freeform',
			isFreeform: true,
		},
		innerBlocks: freeformTemplate,
		scope: ['transform'],
	},
];

/**
 * Map variation names to their corresponding chart layout.type values.
 * This is used to determine which variation is active by checking the inner chart block's layout.type.
 */
const VARIATION_TO_LAYOUT_TYPE = {
	cbarea: 'area',
	cbBar: 'bar',
	cbColumn: 'bar', // Column uses bar layout with vertical orientation
	cbDotPlot: 'dot-plot',
	cbExplodedBar: 'exploded-bar',
	cbDivergingBar: 'diverging-bar',
	cbLine: 'line',
	cbScatter: 'scatter',
	cbBeeSwarm: 'bee-swarm',
	cbStackedArea: 'stacked-area',
	cbStackedBar: 'stacked-bar',
	cbStackedColumn: 'stacked-bar', // Uses stacked-bar layout with vertical orientation
	cbPie: 'pie',
	cbSmallMultiples: 'small-multiples',
	cbTreemap: 'treemap',
	cbSankey: 'sankey',
	cbWaffle: 'waffle',
	cbHeatMapTable: 'heat-map-table',
	cbUSAMap: 'map-usa',
	cbUSACountyMap: 'map-usa-counties',
	cbUSACBSAMap: 'map-usa-cbsa',
	cbUSABlockMap: 'map-usa-block',
	cbUSAHexMap: 'map-usa-hex',
	cbWorldMap: 'map-world',
	cbWorldOrthographicMap: 'map-world-orthographic',
	freeform: 'freeform',
};

/**
 * Determine if a variation is active by checking the controller's chartType attribute.
 * The chartType is set when a chart is created or transformed, and then synced to the
 * chart block's layout.type via useEffect in the Edit component.
 *
 * This approach:
 * 1. Variation selection sets chartType on controller (WordPress handles this)
 * 2. isActive checks chartType (simple and reliable)
 * 3. Edit component's useEffect syncs chartType to chart block's layout.type (actual rendering)
 */
variations.forEach((variation) => {
	if (variation.isActive) return;
	// eslint-disable-next-line no-param-reassign, consistent-return
	variation.isActive = (blockAttributes, variationAttributes) => {
		// Check if controller has chartType matching this variation's chartType
		if (blockAttributes.chartType) {
			return blockAttributes.chartType === variationAttributes.chartType;
		}
		return false;
	};
});

export default variations;
