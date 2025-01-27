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
			isConvertedChart: true,
			chartType: 'stacked-bar',
			chartOrientation: 'vertical',
			width: 640,
			height: 400,
			paddingLeft: 20,
			paddingRight: 20,
			metaTag: 'PEW RESEARCH CENTER',
			colorValue: 'social-trends-main',
			labelsActive: true,
			xDomainPadding: 20,
			xTickNum: null,
			yAxisActive: true,
			yTickLabelTextAnchor: 'end',
			yTickLabelVerticalAnchor: 'middle',
			yMaxDomain: '100',
			barWidth: 24,
			barGroupOffset: 28,
			labelPositionDX: -20,
			tooltipActive: true,
			tooltipHeaderValue: 'independentValue',
			tooltipFormat: '{{row}}: {{value}}',
		},
	],
];

export default stackedBarTemplate;
