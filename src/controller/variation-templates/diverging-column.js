import { mergeWithDefaults } from './helpers';

const divergingColumnTemplate = [
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
				type: 'diverging-bar',
				orientation: 'vertical',
				width: 480,
				height: 420,
				padding: {
					top: 20,
					right: 16,
					bottom: 48,
					left: 36,
				},
			},
			metadata: {
				active: true,
				title: 'Diverging Column Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: '',
			},
			independentAxis: {
				domainPadding: 16,
				tickLabels: {
					textAnchor: 'middle',
					verticalAnchor: 'start',
					dx: 0,
					dy: 8,
				},
			},
			dependentAxis: {
				active: true,
				domain: [-70, 70],
			},
			tooltip: {
				active: true,
				headerValue: 'independentValue',
				format: '{{column}}: {{value}}',
				absoluteValue: true,
			},
			labels: {
				active: true,
				labelPositionDY: 0,
				labelCutoff: 11,
				color: 'contrast',
				absoluteValue: true,
			},
			legend: {
				active: true,
				markerStyle: 'rect',
				clickToHide: true,
			},
			divergingBar: {
				positiveCategories: ['Agree'],
				negativeCategories: ['Disagree'],
				neutralBar: {
					active: false,
				},
			},
			dataRender: {
				sortKey: 'Agree',
				sortOrder: 'none',
			},
			io: {
				isConvertedChart: false,
				independentVariable: 'Independent variable',
				availableCategories: ['Agree', 'Disagree'],
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

export default divergingColumnTemplate;
