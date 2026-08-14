import { mergeWithDefaults } from './helpers';

const sharedTableBody = [
	{
		cells: [
			{ content: '2023', tag: 'td' },
			{ content: '35', tag: 'td' },
			{ content: '30', tag: 'td' },
			{ content: '35', tag: 'td' },
		],
	},
];

const wafflePortionTemplate = [
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
						{ content: 'Year', tag: 'th' },
						{ content: 'North America', tag: 'th' },
						{ content: 'Europe', tag: 'th' },
						{ content: 'Asia Pacific', tag: 'th' },
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
			mobile: {
				smallMultiples: {
					columns: 1,
				},
			},
			tablet: {
				smallMultiples: {
					columns: 2,
				},
			},
			layout: {
				type: 'small-multiples',
				orientation: 'vertical',
				width: 640,
				height: 420,
				padding: {
					top: 10,
					left: 20,
					bottom: 20,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Waffle Portion Chart',
				subtitle: 'One mini waffle per category',
				source: 'Source: Add source note here',
				note: 'Note: Each panel shows one share of the whole',
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
			smallMultiples: {
				panelType: 'waffle',
				columns: 3,
				panelHeight: 184,
				sharedScale: false,
				axisTreatment: 'minimal',
				panelTitle: {
					active: true,
				},
			},
			waffle: {
				cellShape: 'square',
				cellGap: 0.1,
				cellRadius: 3,
				emptyFill: '#E6E7E8',
				columns: 10,
				rows: 10,
				max: 100,
				cellSize: 14,
				cellSizeMode: 'clamp',
				displayMode: 'portion',
			},
			dataRender: {
				categories: ['North America', 'Europe', 'Asia Pacific'],
			},
			io: {
				isConvertedChart: false,
				chartFamily: 'chart',
				colorValue: 'blue-spectrum',
			},
		}),
	],
];

export default wafflePortionTemplate;
