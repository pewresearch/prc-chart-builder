import { mergeWithDefaults } from './helpers';

const stackedBarTemplate = [
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
						{ content: 'Independent variable', tag: 'th' },
						{ content: 'n1', tag: 'th' },
						{ content: 'n2', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: 'Germany', tag: 'td' },
						{ content: '40', tag: 'td' },
						{ content: '60', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Spain', tag: 'td' },
						{ content: '50', tag: 'td' },
						{ content: '50', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'France', tag: 'td' },
						{ content: '60', tag: 'td' },
						{ content: '40', tag: 'td' },
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
				type: 'stacked-bar',
				orientation: 'vertical',
				width: 240,
				height: 320,
				padding: {
					top: 10,
					left: 20,
					right: 20,
					bottom: 30,
				},
			},
			metadata: {
				active: true,
				title: 'Stacked Column Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			colors: {
				value: 'social-trends-main',
			},
			independentAxis: {
				domainPadding: 30,
				"axis": {
					"stroke": "",
					"strokeWidth": 1
				},
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: false,
				headerValue: 'independentValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				active: true,
				color: 'contrast',
				labelPositionDY: 3,
			},
			legend: {
				active: true,
				markerStyle: 'rect',
			},
			bar: {
				barWidth: 24,
				barGroupOffset: 28,
			},
			io: {
				isConvertedChart: false,
				colorValue: 'social-trends-main',
			},
		}),
	],
];

export default stackedBarTemplate;
