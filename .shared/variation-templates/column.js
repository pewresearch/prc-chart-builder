const columnTemplate = [
	[
		'flexible-table-block/table',
		{
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
		'prc-block/chart-builder',
		{
			isConvertedChart: false,
			chartType: 'bar',
			chartOrientation: 'vertical',
			metaTitle: 'Column Chart',
			metaSubtitle: 'A subtitle for the chart',
			metaSource: 'Source: Add source note here',
			metaNote: 'Note: Add note about the chart',
			metaTag: 'PEW RESEARCH CENTER',

			width: 240,
			height: 160,
			paddingLeft: 20,
			paddingBottom: 30,
			paddingRight: 20,
			xDomainPadding: 16,
			xTickNum: null,
			yAxisActive: false,
			yTickLabelTextAnchor: 'end',
			yTickLabelVerticalAnchor: 'middle',
			barWidth: 24,
			barGroupOffset: 28,
			tooltipActive: false,
			labelsActive: true,
			tooltipHeaderValue: 'independentValue',
			tooltipFormat: '{{column}}: {{value}}',
		},
	],
];

export default columnTemplate;
