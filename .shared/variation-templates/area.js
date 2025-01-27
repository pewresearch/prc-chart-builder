const areaTemplate = [
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
					],
				},
			],
			body: [
				{
					cells: [
						{ content: '2000', tag: 'td' },
						{ content: '20', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2005', tag: 'td' },
						{ content: '28', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2010', tag: 'td' },
						{ content: '40', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2015', tag: 'td' },
						{ content: '44', tag: 'td' },
					],
				},

				{
					cells: [
						{ content: '2020', tag: 'td' },
						{ content: '30', tag: 'td' },
					],
				},
			],
		},
	],
	[
		'prc-block/chart-builder',
		{
			isConvertedChart: false,
			chartType: 'area',
			metaTitle: 'Area Chart',
			metaSubtitle: 'A subtitle for the chart',
			metaSource: 'Source: Add source note here',
			metaNote: 'Note: Add note about the chart',
			metaTag: 'PEW RESEARCH CENTER',
			width: 420,
			height: 356,
			paddingLeft: 30,
			paddingBottom: 30,
			paddingRight: 20,
			xMinDomain: 2000,
			xMaxDomain: 2020,
			xTickMarksActive: true,
			xTickLabelDY: -5,
			xScale: 'time',
			sortOrder: 'ascending',
			showYMinDomainLabel: true,
			yTickMarksActive: true,
			yTickLabelTextAnchor: 'end',
			yTickLabelVerticalAnchor: 'middle',
			yTickLabelDX: -5,
			lineStrokeWidth: 4,
			nodeSize: 4,
			nodeFill: 'white',
			nodeStroke: 1,
			tooltipOffsetX: 30,
			tooltipOffsetY: 30,
			tooltipHeaderValue: 'categoryValue',
			tooltipFormat: '{{row}}: {{value}}',
		},
	],
];

export default areaTemplate;
