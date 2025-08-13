const legacyColumnTemplate = [
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
			isConvertedChart: true,
			chartType: 'bar',
			chartOrientation: 'vertical',
			width: 640,
			height: 400,
			paddingLeft: 20,
			paddingRight: 20,
			metaTag: 'PEW RESEARCH CENTER',
			colorValue: 'social-trends-spectrum',
			xDomainPadding: 20,
			xTickNum: null,
			yAxisActive: true,
			yTickLabelTextAnchor: 'end',
			yTickLabelVerticalAnchor: 'middle',
			yMaxDomain: '100',
			barWidth: 24,
			barGroupOffset: 28,
			labelsActive: true,
			labelPositionDX: -20,
			tooltipActive: true,
			tooltipHeaderValue: 'independentValue',
			tooltipFormat: '{{column}}: {{value}}',
		},
	],
];

export default legacyColumnTemplate;
