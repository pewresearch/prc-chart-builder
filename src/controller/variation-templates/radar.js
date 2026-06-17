import { mergeWithDefaults } from './helpers';

const radarTemplate = [
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
						{ content: 'Category', tag: 'th' },
						{ content: 'Speed', tag: 'th' },
						{ content: 'Strength', tag: 'th' },
						{ content: 'Durability', tag: 'th' },
						{ content: 'Endurance', tag: 'th' },
						{ content: 'Accuracy', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: 'Player A', tag: 'td' },
						{ content: '85', tag: 'td' },
						{ content: '70', tag: 'td' },
						{ content: '90', tag: 'td' },
						{ content: '75', tag: 'td' },
						{ content: '80', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Player B', tag: 'td' },
						{ content: '65', tag: 'td' },
						{ content: '90', tag: 'td' },
						{ content: '70', tag: 'td' },
						{ content: '85', tag: 'td' },
						{ content: '88', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Player C', tag: 'td' },
						{ content: '75', tag: 'td' },
						{ content: '80', tag: 'td' },
						{ content: '85', tag: 'td' },
						{ content: '70', tag: 'td' },
						{ content: '72', tag: 'td' },
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
				type: 'radar',
				width: 500,
				height: 420,
				padding: {
					top: 20,
					bottom: 20,
					left: 20,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Radar Chart',
				subtitle: 'Compare attributes across categories',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			independentAxis: {
				active: false,
			},
			dependentAxis: {
				active: false,
				domain: [0, 100],
			},
			tooltip: {
				active: false,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				active: true,
				color: '#2a2a2a',
			},
			legend: {
				active: true,
				markerStyle: 'rect',
			},
			dataRender: {
				sortOrder: 'none',
				x: 'Category',
				categories: ['Speed', 'Strength', 'Durability', 'Endurance', 'Accuracy'],
			},
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default radarTemplate;
