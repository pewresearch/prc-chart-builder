import { mergeWithDefaults } from './helpers';
const columnTemplate = [
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
				orientation: 'vertical',
				width: 240,
				height: 160,
				padding: {
					left: 20,
					bottom: 30,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Column Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: '',
			},
			independentAxis: {
				tickCount: null,
				domainPadding: 16,
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: false,
				headerValue: 'independentValue',
				format: '{{column}}: {{value}}',
			},
			labels: {
				active: false,
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
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default columnTemplate;
