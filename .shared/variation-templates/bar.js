import { mergeWithDefaults } from './helpers';

const barTemplate = [
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
			body: [
				{
					cells: [
						{ content: 'Germany', tag: 'td' },
						{ content: '40', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Spain', tag: 'td' },
						{ content: '50', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'France', tag: 'td' },
						{ content: '60', tag: 'td' },
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
				type: 'bar',
				orientation: 'horizontal',
				width: 420,
				height: 160,
				padding: {
					left: 100,
				},
			},
			metadata: {
				active: true,
				title: 'Bar Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			independentAxis: {
				tickCount: null,
				domainPadding: 16,
				tickLabels: {
					textAnchor: 'end',
					verticalAnchor: 'middle',
					dx: -5,
				},
				"axis": {
					"stroke": "",
					"strokeWidth": 1
				},
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: true,
				headerValue: 'independentValue',
				format: '{{column}}: {{value}}',
			},
			labels: {
				active: true,
				labelPositionDY: 3,
				color: 'contrast',
			},
			legend: {
				active: true,
				markerStyle: 'rect',
			},
			bar: {
				barWidth: 24,
				barGroupOffset: 28,
			},
			dataRender: {
				sortOrder: 'descending',
			},
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default barTemplate;
