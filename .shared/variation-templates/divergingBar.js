const divergingBarTemplate = [
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
		'prc-block/chart-builder',
		{
			isConvertedChart: false,
			chartType: 'diverging-bar',
			metaTitle: 'Diverging Bar Chart',
			metaSubtitle: 'A subtitle for the chart',
			metaSource: 'Source: Add source note here',
			metaNote: 'Note: Add note about the chart',
			metaTag: 'PEW RESEARCH CENTER',

			width: 640,
			height: 200,
			paddingTop: 46,
			paddingLeft: 80,
			sortOrder: 'descending',
			sortKey: 'Agree',
			colorValue: 'orange-spectrum',
			customColors: [
				'#EA9E2C',
				'#F1C37F',
				'#F9EAD4',
				'#F5D6A9',
				'#BB792A',
				'#7C5220',
			],
			xDomainPadding: 16,
			xTickLabelVerticalAnchor: 'middle',
			xTickLabelDX: -30,
			xAxisStroke: '#fff',
			yAxisActive: false,
			yMinDomain: -60,
			barWidth: 24,
			barGroupOffset: 28,
			barLabelPosition: 'center',
			barLabelCutoff: 11,
			labelsActive: true,
			labelPositionDY: 4,
			labelAbsoluteValue: true,
			tooltipAbsoluteValue: true,
			legendActive: true,
			legendBorderStroke: '#fff',
			independentVariable: 'Independent variable',
			positiveCategories: ['Agree'],
			negativeCategories: ['Disagree'],
			neutralCategory: 'Neither',
			neutralBarOffsetX: -70,
			neutralBarSeparatorOffsetX: -10,
			availableCategories: ['Agree', 'Disagree', 'Neither'],
			tooltipHeaderValue: 'independentValue',
			tooltipFormat: '{{column}}: {{value}}',
		},
	],
];

export default divergingBarTemplate;
