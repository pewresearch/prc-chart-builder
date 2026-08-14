import { mergeWithDefaults } from './helpers';

const sharedTableBody = [
	{
		cells: [
			{ content: 'North America', tag: 'td' },
			{ content: '3200000', tag: 'td' },
		],
	},
	{
		cells: [
			{ content: 'Europe', tag: 'td' },
			{ content: '2800000', tag: 'td' },
		],
	},
	{
		cells: [
			{ content: 'Asia Pacific', tag: 'td' },
			{ content: '4500000', tag: 'td' },
		],
	},
	{
		cells: [
			{ content: 'Latin America', tag: 'td' },
			{ content: '1900000', tag: 'td' },
		],
	},
	{
		cells: [
			{ content: 'Middle East & Africa', tag: 'td' },
			{ content: '1600000', tag: 'td' },
		],
	},
];

const waffleTemplate = [
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
					],
				},
			],
			body: sharedTableBody,
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
				type: 'waffle',
				width: 640,
				height: 420,
				padding: {
					top: 20,
					left: 20,
					bottom: 20,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Waffle Chart',
				subtitle: 'One grid showing the full composition',
				source: 'Source: Add source note here',
				note: 'Note: Each cell represents one percentage point',
				tag: '',
			},
			independentAxis: {
				active: false,
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: true,
				headerValue: 'independentValue',
				format: '{{row}}: {{value}}',
			},
			legend: {
				active: true,
				markerStyle: 'rect',
			},
			dataRender: {
				categories: ['y'],
				sortOrder: 'descending',
			},
			waffle: {
				cellShape: 'square',
				cellGap: 0.1,
				cellRadius: 3,
				emptyFill: '#E6E7E8',
				columns: 10,
				rows: 10,
				max: null,
				cellSize: 14,
				cellSizeMode: 'clamp',
				displayMode: 'whole',
			},
			io: {
				isConvertedChart: false,
				chartFamily: 'chart',
				colorValue: 'blue-spectrum',
			},
		}),
	],
];

export default waffleTemplate;
