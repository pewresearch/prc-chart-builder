import { mergeWithDefaults } from './helpers';
const areaTemplate = [
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
						{ content: 'n1', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: '2000', tag: 'td' },
						{ content: '20', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2005', tag: 'td' },
						{ content: '28', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2010', tag: 'td' },
						{ content: '40', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2015', tag: 'td' },
						{ content: '44', tag: 'td' },
					],
				},

				{
					cells: [
						{ content: '2020', tag: 'td' },
						{ content: '30', tag: 'td' },
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
				type: 'area',
				width: 420,
				height: 356,
				padding: {
					left: 30,
					bottom: 30,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Area Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			independentAxis: {
				domain: {
					min: 2000,
					max: 2020,
				},
				tickMarks: {
					active: true,
				},
				scale: 'time',
			},
			dependentAxis: {
				showMinLabel: true,
				tickMarks: {
					active: true,
				},
			},
			tooltip: {
				active: false,
				offsetX: 30,
				offsetY: 30,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				color: 'inherit',
			},
			line: {
				strokeWidth: 4,
			},
			nodes: {
				pointSize: 4,
				pointFill: 'white',
				pointStrokeWidth: 1,
				pointStroke: 'white',
			},
			legend: {
				active: true,
				markerStyle: 'line',
			},
			dataRender: {
				sortOrder: 'ascending',
				xScale: 'time',
				xFormat: 'YYYY',
			},
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default areaTemplate;
