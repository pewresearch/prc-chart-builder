const dotPlotTemplate = [
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
						{ content: '30', tag: 'td' },
						{ content: '60', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Spain', tag: 'td' },
						{ content: '50', tag: 'td' },
						{ content: '70', tag: 'td' },
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
			isConvertedChart: false,
			chartType: 'dot-plot',
			metaTitle: 'Dot Plot Chart',
			metaSubtitle: 'A subtitle for the chart',
			metaSource: 'Source: Add source note here',
			metaNote: 'Note: Add note about the chart',
			metaTag: 'PEW RESEARCH CENTER',

			width: 420,
			height: 200,
			paddingTop: 36,
			paddingLeft: 100,
			paddingBottom: 36,
			paddingRight: 20,
			xDomainPadding: 28,
			xTickLabelTextAnchor: 'end',
			xTickLabelVerticalAnchor: 'middle',
			xAxisStroke: '#756f6b00',
			xGridStroke: '#d1d1d1',
			yAxisStroke: '#756f6b',
			yGridStroke: '#00000000',
			showYMinDomainLabel: true,
			yTickMarksActive: true,
			yTickExact: '0,50,100',
			yTickLabelTextAnchor: 'end',
			yTickLabelVerticalAnchor: 'middle',
			yMultiLineTickLabelsBreak: 3,
			lineStrokeWidth: 4,
			lineNodes: true,
			nodeSize: 4,
			nodeStroke: 1,
			tooltipActive: false,
			tooltipCategoryActive: false,
			labelsActive: true,
			labelPositionDX: 0,
			labelPositionDY: -8,
			legendActive: true,
			legendMarkerStyle: 'circle',
			legendBorderStroke: '#24202100',
			tooltipHeaderValue: 'categoryValue',
			tooltipFormat: '{{row}}: {{value}}',
		},
	],
];

export default dotPlotTemplate;
