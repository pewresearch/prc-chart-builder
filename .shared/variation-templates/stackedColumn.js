const stackedBarTemplate = [
	[
		'core/table',
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
			chartOrientation: 'vertical',
			metaTitle: 'Stacked Column Chart',
			metaSubtitle: 'A subtitle for the chart',
			metaSource: 'Source: Add source note here',
			metaNote: 'Note: Add note about the chart',
			metaTag: 'PEW RESEARCH CENTER',

			width: 240,
			height: 320,
			paddingLeft: 20,
			paddingRight: 20,
			paddingBottom: 30,
			paddingTop: 10,
			colorValue: 'social-trends-main',
			xDomainPadding: 30,
			yAxisActive: false,
			yTickLabelTextAnchor: 'end',
			yTickLabelVerticalAnchor: 'middle',
			barWidth: 24,
			barGroupOffset: 28,
			labelsActive: true,
			tooltipHeaderValue: 'independentValue',
			tooltipFormat: '{{row}}: {{value}}',
		},
	],
];

export default stackedBarTemplate;
