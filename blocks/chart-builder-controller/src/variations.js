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
} from '../../../.shared/variation-templates';

const variations = [
	{
		name: 'cbarea',
		title: __('Area Chart'),
		keywords: [__('area'), __('chart'), __('area chart')],
		description: __('Create an area chart.'),
		icon: areaIcon,
		attributes: { chartType: 'area' },
		innerBlocks: areaTemplate,
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
	},
	{
		name: 'cbDotPlot',
		title: __('Dot Plot Chart'),
		keywords: [__('dot'), __('chart'), __('dot plot'), __('plot')],
		description: __('Create a dot plot chart.'),
		icon: dotPlotIcon,
		attributes: { chartType: 'dot-plot' },
		innerBlocks: dotPlotTemplate,
	},
	{
		name: 'cbExplodedBar',
		title: 'Exploded Bar Chart',
		keywords: [__('bar'), __('chart'), __('bar chart'), __('exploded bar')],
		description: __('Create an exploded bar chart.'),
		icon: barIcon,
		attributes: { chartType: 'exploded-bar' },
		innerBlocks: explodedBarTemplate,
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
	},
	{
		name: 'cbLine',
		title: __('Line Chart'),
		keywords: [__('line'), __('chart'), __('line chart')],
		description: __('Create a line chart.'),
		icon: lineIcon,
		attributes: { chartType: 'line' },
		innerBlocks: lineTemplate,
	},

	{
		name: 'cbScatter',
		title: __('Scatter Plot Chart'),
		keywords: [__('scatter'), __('chart'), __('scatter plot'), __('plot')],
		description: __('Create a scatter plot chart.'),
		icon: scatterIcon,
		attributes: { chartType: 'scatter' },
		innerBlocks: scatterTemplate,
	},
	{
		name: 'cbStackedArea',
		title: 'Stacked Area Chart',
		keywords: [__('area'), __('chart'), __('stacked area')],
		description: __('Create a stacked area chart.'),
		icon: areaIcon,
		attributes: { chartType: 'stacked-area' },
		innerBlocks: stackedAreaTemplate,
	},
	{
		name: 'cbStackedBar',
		title: 'Stacked Bar Chart',
		keywords: [__('bar'), __('chart'), __('stacked bar')],
		description: __('Create a stacked bar chart.'),
		icon: stackedBarIcon,
		attributes: { chartType: 'stacked-bar' },
		innerBlocks: stackedBarTemplate,
	},
	{
		name: 'cbStackedColumn',
		title: 'Stacked Column Chart',
		keywords: [__('column'), __('chart'), __('stacked column')],
		description: __('Create a stacked column chart.'),
		icon: stackedColumnIcon,
		attributes: { chartType: 'stacked-bar' },
		innerBlocks: stackedColumnTemplate,
	},
	{
		name: 'cbPie',
		title: 'Pie Chart',
		keywords: [__('chart'), __('pie')],
		description: __('Create a pie chart.'),
		icon: pieIcon,
		attributes: { chartType: 'pie' },
		innerBlocks: pieTemplate,
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
