import { mergeWithDefaults } from './helpers';
const divergingBarTemplate = [
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
						{ content: '20', tag: 'td' },
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
				type: 'diverging-bar',
				width: 640,
				height: 200,
				padding: {
					top: 46,
					left: 80,
				},
			},
			metadata: {
				active: true,
				title: 'Diverging Bar Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			independentAxis: {
				domainPadding: 16,
				axis: {
					stroke: '#fff',
				},
				tickLabels: {
					textAnchor: 'end',
					verticalAnchor: 'middle',
					dx: -5,
				},
			},
			dependentAxis: {
				active: false,
				domain: [-60, 100],
			},
			tooltip: {
				active: false,
				headerValue: 'independentValue',
				format: '{{column}}: {{value}}',
				absoluteValue: true,
			},
			labels: {
				active: true,
				labelPositionDY: 2,
				labelCutoff: 11,
				color: 'contrast',
				absoluteValue: true,
			},
			legend: {
				active: true,
				markerStyle: 'rect',
			},
			divergingBar: {
				positiveCategories: ['Agree'],
				negativeCategories: ['Disagree'],
				neutralBar: {
					active: true,
					category: 'Neither',
					offsetX: -70,
					separator: true,
					separatorOffsetX: -10,
				},
			},
			dataRender: {
				sortOrder: 'descending',
				sortKey: 'Agree',
			},
			io: {
				isConvertedChart: false,
				independentVariable: 'Independent variable',
				availableCategories: ['Agree', 'Disagree', 'Neither'],
				colorValue: 'orange-spectrum',
				customColors: [
					'#EA9E2C',
					'#F1C37F',
					'#F9EAD4',
					'#F5D6A9',
					'#BB792A',
					'#7C5220',
				],
			},
		}),
	],
];

export default divergingBarTemplate;
