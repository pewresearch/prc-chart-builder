const stackedBarTemplate = [
	[
		'prc-block/table',
		{
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
		'prc-block/chart-builder',
		{
			isConvertedChart: false,
			chartType: 'stacked-bar',
			chartOrientation: 'horizontal',
			metaTitle: 'Stacked Bar Chart',
			metaSubtitle: 'A subtitle for the chart',
			metaSource: 'Source: Add source note here',
			metaNote: 'Note: Add note about the chart',
			metaTag: 'PEW RESEARCH CENTER',

			width: 420,
			height: 160,
			paddingLeft: 100,
			sortOrder: 'reverse',
			colorValue: 'social-trends-main',
			xDomainPadding: 16,
			xTickLabelTextAnchor: 'end',
			xTickLabelVerticalAnchor: 'middle',
			xTickLabelDX: -10,
			yAxisActive: false,
			barWidth: 24,
			barGroupOffset: 28,
			barLabelPosition: 'center',
			labelsActive: true,
			labelPositionDY: 4,
			tooltipHeaderValue: 'independentValue',
			tooltipFormat: '{{column}}: {{value}}',
		},
	],
];

export default stackedBarTemplate;
