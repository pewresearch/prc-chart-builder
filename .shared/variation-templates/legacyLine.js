const legacyLineTemplate = [
	[
		'core/table',
		{
			className: 'chart-builder-data-table',
			fontSize: 'small',
			fontFamily: 'sans-serif',
			head: [
				{
					cells: [
						{ content: 'Year', tag: 'th' },
						{ content: 'n1', tag: 'th' },
						{ content: 'n2', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: '2000', tag: 'td' },
						{ content: '20', tag: 'td' },
						{ content: '30', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2010', tag: 'td' },
						{ content: '40', tag: 'td' },
						{ content: '50', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2020', tag: 'td' },
						{ content: '70', tag: 'td' },
						{ content: '30', tag: 'td' },
					],
				},
			],
		},
	],
	[
		'prc-block/chart-builder',
		{
			isConvertedChart: true,
			chartType: 'line',
			paddingLeft: 35,
			paddingBottom: 30,
			paddingTop: 30,
			paddingRight: 20,
			width: 640,
			height: 370,
			xMinDomain: 2000,
			xMaxDomain: 2020,
			xTickMarksActive: true,
			xScale: 'time',
			metaTag: 'PEW RESEARCH CENTER',
			showYMinDomainLabel: true,
			yTickMarksActive: true,
			yTickLabelTextAnchor: 'end',
			yTickLabelVerticalAnchor: 'middle',
			lineStrokeWidth: 4,
			lineNodes: false,
			legendActive: true,
			legendMarkerStyle: 'line',
			legendOffsetX: 0,
			legendOffsetY: 0,
			tooltipActive: true,
			tooltipOffsetX: 40,
			tooltipOffsetY: 20,
			tooltipHeaderValue: 'categoryValue',
			tooltipFormat: '{{row}}: {{value}}',
		},
	],
];

export default legacyLineTemplate;
