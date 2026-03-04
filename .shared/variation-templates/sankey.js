import { mergeWithDefaults } from './helpers';

const sankeyTemplate = [
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
						{ content: 'source', tag: 'th' },
						{ content: 'target', tag: 'th' },
						{ content: 'value', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: 'Coal', tag: 'td' },
						{ content: 'Electricity', tag: 'td' },
						{ content: '25', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Natural gas', tag: 'td' },
						{ content: 'Electricity', tag: 'td' },
						{ content: '20', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Wind', tag: 'td' },
						{ content: 'Electricity', tag: 'td' },
						{ content: '15', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Solar', tag: 'td' },
						{ content: 'Electricity', tag: 'td' },
						{ content: '10', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Nuclear', tag: 'td' },
						{ content: 'Electricity', tag: 'td' },
						{ content: '18', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Electricity', tag: 'td' },
						{ content: 'Residential', tag: 'td' },
						{ content: '35', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Electricity', tag: 'td' },
						{ content: 'Commercial', tag: 'td' },
						{ content: '30', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Electricity', tag: 'td' },
						{ content: 'Industrial', tag: 'td' },
						{ content: '23', tag: 'td' },
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
				type: 'sankey',
				width: 640,
				height: 400,
				padding: {
					top: 10,
					bottom: 10,
					left: 10,
					right: 10,
				},
			},
			metadata: {
				active: true,
				title: 'Sankey Diagram',
				subtitle: 'Energy flow from source to end use',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			independentAxis: {
				active: false,
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: true,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				active: true,
				color: 'black',
			},
			legend: {
				active: false,
			},
			sankey: {
				nodeAlign: 'justify',
				nodeWidth: 12,
				nodePadding: 10,
				linkOpacity: 0.5,
				nodeRadius: 0,
				sourceKey: 'x',
				targetKey: 'target',
				valueKey: 'value',
			},
			dataRender: {
				sortOrder: 'none',
				categories: ['value'],
			},
		io: {
			isConvertedChart: false,
			preserveStringKeys: ['target'],
		},
		}),
	],
];

export default sankeyTemplate;
