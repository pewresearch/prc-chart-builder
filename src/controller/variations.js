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
	stackedBarIcon,
	stackedColumnIcon,
	pieIcon,
	USAMap,
	USABlockMap,
	worldMap,
} from './icons';
// import { icons } from '@prc/icons';
// import { icons } from '@prc/icons';

import {
	areaTemplate,
	barTemplate,
	columnTemplate,
	dotPlotTemplate,
	lineTemplate,
	stackedAreaTemplate,
	scatterTemplate,
	stackedBarTemplate,
	stackedColumnTemplate,
	pieTemplate,
	explodedBarTemplate,
	divergingBarTemplate,
	imageTemplate,
	USAMapTemplate,
	USACountyMapTemplate,
	USABlockMapTemplate,
	WorldMapTemplate,
} from '../../.shared/variation-templates';

const variations = [
	{
		name: 'cbarea',
		title: __('Area Chart'),
		keywords: [__('area'), __('chart'), __('area chart')],
		description: __('Create an area chart.'),
		icon: areaIcon,
		attributes: { chartType: 'area' },
		innerBlocks: areaTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbBar',
		title: 'Bar Chart',
		keywords: [__('bar'), __('chart'), __('bar chart'), __('single bar')],
		description: __('Create a bar chart.'),
		icon: barIcon,
		isDefault: true,
		attributes: { chartType: 'bar' },
		innerBlocks: barTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbColumn',
		title: 'Column Chart',
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
		scope: ['block', 'transform'],
	},
	{
		name: 'cbDotPlot',
		title: __('Dot Plot Chart'),
		keywords: [__('dot'), __('chart'), __('dot plot'), __('plot')],
		description: __('Create a dot plot chart.'),
		icon: dotPlotIcon,
		attributes: { chartType: 'dot-plot' },
		innerBlocks: dotPlotTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbExplodedBar',
		title: 'Exploded Bar Chart',
		keywords: [__('bar'), __('chart'), __('bar chart'), __('exploded bar')],
		description: __('Create an exploded bar chart.'),
		icon: barIcon,
		attributes: { chartType: 'exploded-bar' },
		innerBlocks: explodedBarTemplate,
		scope: ['block', 'transform'],
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
		scope: ['block', 'transform'],
	},
	{
		name: 'cbLine',
		title: __('Line Chart'),
		keywords: [__('line'), __('chart'), __('line chart')],
		description: __('Create a line chart.'),
		icon: lineIcon,
		attributes: { chartType: 'line' },
		innerBlocks: lineTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbScatter',
		title: __('Scatter Plot Chart'),
		keywords: [__('scatter'), __('chart'), __('scatter plot'), __('plot')],
		description: __('Create a scatter plot chart.'),
		icon: scatterIcon,
		attributes: { chartType: 'scatter' },
		innerBlocks: scatterTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbStackedArea',
		title: 'Stacked Area Chart',
		keywords: [__('area'), __('chart'), __('stacked area')],
		description: __('Create a stacked area chart.'),
		icon: areaIcon,
		attributes: { chartType: 'stacked-area' },
		innerBlocks: stackedAreaTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbStackedBar',
		title: 'Stacked Bar Chart',
		keywords: [__('bar'), __('chart'), __('stacked bar')],
		description: __('Create a stacked bar chart.'),
		icon: stackedBarIcon,
		attributes: { chartType: 'stacked-bar' },
		innerBlocks: stackedBarTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbStackedColumn',
		title: 'Stacked Column Chart',
		keywords: [__('column'), __('chart'), __('stacked column')],
		description: __('Create a stacked column chart.'),
		icon: stackedColumnIcon,
		attributes: { chartType: 'stacked-bar' },
		innerBlocks: stackedColumnTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbPie',
		title: 'Pie Chart',
		keywords: [__('chart'), __('pie')],
		description: __('Create a pie chart.'),
		icon: pieIcon,
		attributes: { chartType: 'pie' },
		innerBlocks: pieTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbstatic',
		title: __('Chart Image with Data Table'),
		keywords: [
			__('chart'),
			__('image'),
			__('data table'),
			__('static'),
			__('static chart'),
		],
		description: __(
			'Create a static chart image with a data table and share tabs.'
		),
		icon: barIcon,
		attributes: { chartType: 'static' },
		innerBlocks: imageTemplate,
	},
	{
		name: 'cbUSAMap',
		title: __('USA Map'),
		keywords: [__('map'), __('USA'), __('US')],
		description: __('Create a map of the United States.'),
		icon: USAMap,
		attributes: { chartType: 'us-map' },
		innerBlocks: USAMapTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbUSACountyMap',
		title: __('USA County Map'),
		keywords: [__('map'), __('USA'), __('US'), __('county')],
		description: __(
			'Create a map of the United States, with county borders.'
		),
		icon: USAMap,
		attributes: { chartType: 'us-map-county' },
		innerBlocks: USACountyMapTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbUSABlockMap',
		title: __('USA Block Map'),
		keywords: [__('map'), __('USA'), __('US')],
		description: __('Create a block map of the United States.'),
		icon: USABlockMap,
		attributes: { chartType: 'us-map-block' },
		innerBlocks: USABlockMapTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbWorldMap',
		title: __('World Map'),
		keywords: [__('map'), __('world')],
		description: __('Create a map of the world.'),
		icon: worldMap,
		attributes: { chartType: 'world-map' },
		innerBlocks: WorldMapTemplate,
		scope: ['block', 'transform'],
	},
	{
		name: 'cbstatic',
		title: __('Chart Image with Data Table'),
		keywords: [
			__('chart'),
			__('image'),
			__('data table'),
			__('static'),
			__('static chart'),
		],
		description: __(
			'Create a static chart image with a data table and share tabs.'
		),
		icon: barIcon,
		attributes: { chartType: 'static' },
		innerBlocks: imageTemplate,
		scope: ['block', 'transform'],
	},
];

variations.forEach((variation) => {
	if (variation.isActive) return;
	// eslint-disable-next-line no-param-reassign, consistent-return
	variation.isActive = (blockAttributes, variationAttributes) => {
		if (blockAttributes.chartType) {
			return blockAttributes.chartType === variationAttributes.chartType;
		}
		return false;
	};
});

export default variations;
