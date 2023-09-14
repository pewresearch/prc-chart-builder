const barTemplate = [
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
			metaTitle: 'Bar Chart',
			metaSubtitle: 'A subtitle for the chart',
			metaSource: 'Source: Add source note here',
			metaNote: 'Note: Add note about the chart',
			metaTag: 'PEW RESEARCH CENTER',
			chartOrientation: 'horizontal',
			width: 420,
			height: 160,
			paddingLeft: 100,
			xDomainPadding: 16,
			xTickNum: null,
			xTickLabelDX: -5,
			xTickLabelTextAnchor: 'end',
			xTickLabelVerticalAnchor: 'middle',
			yAxisActive: false,
			barWidth: 24,
			barGroupOffset: 28,
			labelsActive: true,
			labelPositionDY: 3,
			sortOrder: 'descending',
			tooltipHeaderValue: 'independentValue',
			tooltipFormat: '{{column}}: {{value}}',
		},
	],
];

export default barTemplate;
