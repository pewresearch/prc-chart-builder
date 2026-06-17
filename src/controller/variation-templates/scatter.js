import { mergeWithDefaults } from './helpers';

const scatterTemplate = [
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
						{ content: 'y1', tag: 'th' },
						{ content: 'y2', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: '5', tag: 'td' },
						{ content: '50', tag: 'td' },
						{ content: '', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '50', tag: 'td' },
						{ content: '40', tag: 'td' },
						{ content: '12', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '75', tag: 'td' },
						{ content: '', tag: 'td' },
						{ content: '33', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '100', tag: 'td' },
						{ content: '70', tag: 'td' },
						{ content: '80', tag: 'td' },
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
				type: 'scatter',
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
				title: 'A Scatterplot Chart',
				subtitle: 'A subtitle for the chart',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			dataRender: {
				groupBreaksActive: false,
				groupBreaksCategory: '',
				groupBreaksCategoryValues: [],
			},
			independentAxis: {
				tickMarks: {
					active: true,
				},
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
				offsetY: 70,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				labelPositionDY: -5,
			},
			line: {
				strokeWidth: 4,
				showNodes: true,
			},
			nodes: {
				size: 4,
				fill: 'inherit',
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

export default scatterTemplate;
