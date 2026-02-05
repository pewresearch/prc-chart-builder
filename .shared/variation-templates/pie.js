import { mergeWithDefaults } from './helpers';

const pieTemplate = [
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
				type: 'pie',
				width: 420,
				height: 350,
				padding: {
					left: 20,
					bottom: 20,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Pie Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			independentAxis: {
				tickCount: null,
				domainPadding: 16,
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
				labelPositionDX: -20,
				color: 'contrast',
			},
			legend: {
				active: true,
				markerStyle: 'circle',
			},
			dataRender: {
				sortOrder: 'reverse',
			},
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default pieTemplate;
