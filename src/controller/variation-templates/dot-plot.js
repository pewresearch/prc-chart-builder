import { mergeWithDefaults } from './helpers';

const dotPlotTemplate = [
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
						{ content: '30', tag: 'td' },
						{ content: '60', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Spain', tag: 'td' },
						{ content: '50', tag: 'td' },
						{ content: '70', tag: 'td' },
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
				type: 'dot-plot',
				width: 420,
				height: 200,
				padding: {
					top: 36,
					left: 100,
					bottom: 36,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Dot Plot Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: '',
			},
			independentAxis: {
				domainPadding: 28,
				stroke: '#756f6b00',
				tickLabels: {
					textAnchor: 'end',
					verticalAnchor: 'middle',
					dx: -5,
				},
				grid: {
					stroke: '#d1d1d1',
					strokeDasharray: '3,1',
				},
				axis: {
					stroke: '',
					strokeWidth: 1,
				},
			},
			dependentAxis: {
				stroke: '#756f6b',
				showZero: true,
				tickMarksActive: true,
				tickLabels: {
					verticalAnchor: 'end',
					textAnchor: 'middle',
				},
				tickValues: '0,50,100',
				multiLineTickLabelsBreak: 3,
				grid: {
					stroke: '#00000000',
				},
			},
			tooltip: {
				active: false,
				categoryActive: false,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				active: false,
				labelPositionDX: 0,
				labelPositionDY: -8,
				color: 'inherit',
			},
			line: {
				strokeWidth: 4,
				showNodes: true,
			},
			nodes: {
				size: 4,
				stroke: 1,
			},
			legend: {
				active: true,
				markerStyle: 'circle',
			},
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default dotPlotTemplate;
