import { mergeWithDefaults } from './helpers';

const explodedBarTemplate = [
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
						{ content: 'Agree', tag: 'th' },
						{ content: 'Disagree', tag: 'th' },
						{ content: 'Neither', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: 'Germany', tag: 'td' },
						{ content: '40', tag: 'td' },
						{ content: '60', tag: 'td' },
						{ content: '40', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Spain', tag: 'td' },
						{ content: '50', tag: 'td' },
						{ content: '50', tag: 'td' },
						{ content: '30', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'France', tag: 'td' },
						{ content: '60', tag: 'td' },
						{ content: '40', tag: 'td' },
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
				type: 'exploded-bar',
				width: 420,
				height: 160,
				padding: {
					left: 100,
				},
			},
			metadata: {
				active: true,
				title: 'Exploded Bar Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: '',
			},
			colors: {
				value: 'orange-spectrum',
				custom: [
					'#EA9E2C',
					'#F1C37F',
					'#F9EAD4',
					'#F5D6A9',
					'#BB792A',
					'#7C5220',
				],
			},
			independentAxis: {
				domainPadding: 16,
				axis: {
					stroke: '',
					strokeWidth: 1,
				},
				tickLabels: {
					textAnchor: 'end',
					verticalAnchor: 'middle',
					dx: -5,
				},
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
				active: true,
				color: 'contrast',
				labelPositionDY: 2,
				labelPositionDX: 5,
			},
			legend: {
				active: true,
				markerStyle: 'rect',
			},
			bar: {
				barWidth: 24,
				barGroupOffset: 28,
				labelPosition: 'center',
				labelCutoff: 11,
			},
			dataRender: {
				sortOrder: 'reverse',
			},
			io: {
				isConvertedChart: false,
				colorValue: 'orange-spectrum',
			},
		}),
	],
];

export default explodedBarTemplate;
