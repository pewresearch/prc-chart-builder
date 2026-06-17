import { mergeWithDefaults } from './helpers';

const treemapTemplate = [
	[
		'prc-block/table',
		{
			isScrollOnPc: true,
			isScrollOnMobile: true,
			sticky: 'first-column',
			className: 'chart-builder-data-table',
			fontSize: 'small',
			fontFamily: 'sans-serif',
			head: [
				{
					cells: [
						{ content: 'x', tag: 'th' },
						{ content: 'y', tag: 'th' },
						{ content: 'category', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: 'Waffles', tag: 'td' },
						{ content: '40', tag: 'td' },
						{ content: 'Breakfast', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Pancakes', tag: 'td' },
						{ content: '35', tag: 'td' },
						{ content: 'Breakfast', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Eggs', tag: 'td' },
						{ content: '25', tag: 'td' },
						{ content: 'Breakfast', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Salad', tag: 'td' },
						{ content: '30', tag: 'td' },
						{ content: 'Lunch', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Soup', tag: 'td' },
						{ content: '20', tag: 'td' },
						{ content: 'Lunch', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Sandwich', tag: 'td' },
						{ content: '45', tag: 'td' },
						{ content: 'Lunch', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Pasta', tag: 'td' },
						{ content: '50', tag: 'td' },
						{ content: 'Dinner', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Steak', tag: 'td' },
						{ content: '60', tag: 'td' },
						{ content: 'Dinner', tag: 'td' },
					],
				},
			],
		},
	],
	[
		'prc-chart-builder/chart',
		mergeWithDefaults({
			_version: 'v2',
			lock: {
				move: true,
				remove: true,
			},
			layout: {
				type: 'treemap',
				width: 640,
				height: 400,
				padding: {
					top: 10,
					bottom: 10,
					left: 10,
					right: 10,
				},
			},
			metadata: {
				active: true,
				title: 'Treemap Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			independentAxis: {
				active: false,
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: false,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				active: true,
				color: 'contrast',
			},
			legend: {
				active: true,
				markerStyle: 'rect',
			},
			treemap: {
				tile: 'squarify',
				rectStroke: '#ffffff',
				rectStrokeWidth: 2,
				labelMinArea: 1600,
				paddingInner: 2,
				paddingOuter: 4,
				scaleOpacity: false,
				opacityRange: [0.4, 1],
				borderRadius: 0,
			},
			dataRender: {
				sortOrder: 'descending',
				sortKey: 'y',
				categories: ['y'],
				groupBreaksActive: true,
				groupBreaksCategory: 'category',
			},
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default treemapTemplate;
