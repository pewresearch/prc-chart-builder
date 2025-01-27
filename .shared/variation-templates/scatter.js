const scatterTemplate = [
	[
		'core/table',
		{
			className: 'chart-builder-data-table',
			fontSize: 'small',
			fontFamily: 'sans-serif',
			head: [
				{
					cells: [
						{ content: 'x', tag: 'th' },
						{ content: 'y1', tag: 'th' },
						{ content: 'y2', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: '5', tag: 'td' },
						{ content: '50', tag: 'td' },
						{ content: '', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '50', tag: 'td' },
						{ content: '40', tag: 'td' },
						{ content: '12', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '75', tag: 'td' },
						{ content: '', tag: 'td' },
						{ content: '33', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '100', tag: 'td' },
						{ content: '70', tag: 'td' },
						{ content: '80', tag: 'td' },
					],
				},
			],
		},
	],
	[
		'prc-block/chart-builder',
		{
			isConvertedChart: false,
			chartType: 'scatter',
			metaTitle: 'Scatterplot Chart',
			metaSubtitle: 'A subtitle for the chart',
			metaSource: 'Source: Add source note here',
			metaNote: 'Note: Add note about the chart',
			metaTag: 'PEW RESEARCH CENTER',

			width: 420,
			height: 356,
			paddingLeft: 30,
			paddingBottom: 30,
			paddingRight: 20,
			xTickMarksActive: true,
			xTickLabelDY: -5,
			showYMinDomainLabel: true,
			yTickMarksActive: true,
			yTickLabelTextAnchor: 'end',
			yTickLabelVerticalAnchor: 'middle',
			lineStrokeWidth: 4,
			lineNodes: true,
			yTickLabelDX: -5,
			labelPositionDY: -5,
			nodeSize: 4,
			nodeStroke: 1,
			nodeFill: 'inherit',
			tooltipOffsetX: 30,
			tooltipOffsetY: 70,
			tooltipHeaderValue: 'categoryValue',
			tooltipFormat: '{{row}}: {{value}}',
		},
	],
];

export default scatterTemplate;
