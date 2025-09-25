const stackedBarTemplate = [
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
		{
			isConvertedChart: true,
			chartType: 'stacked-bar',
			chartOrientation: 'horizontal',
			width: 640,
			height: 400,
			paddingLeft: 100,
			xDomainPadding: 16,
			xTickNum: null,
			xTickLabelTextAnchor: 'end',
			xTickLabelVerticalAnchor: 'middle',
			metaTag: 'PEW RESEARCH CENTER',
			yAxisActive: false,
			barWidth: 24,
			barGroupOffset: 28,
			labelsActive: true,
			labelPositionDX: 0,
			colorValue: 'journalism-main',
			tooltipActive: true,
			tooltipHeaderValue: 'independentValue',
			tooltipFormat: '{{row}}: {{value}}',
		},
	],
];

export default stackedBarTemplate;
