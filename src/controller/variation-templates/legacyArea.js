const legacyAreaTemplate = [
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
		'prc-chart-builder/chart',
		{
			_version: 'v2',
			chartType: 'area',
			layout: {
				type: 'area',
				width: 640,
				height: 300,
				padding: {
					left: 30,
					bottom: 20,
					right: 20,
				},
			},
			metadata: {
				active: true,
				tag: 'PEW RESEARCH CENTER',
			},
			independentAxis: {
				domain: {
					min: 2000,
					max: 2020,
				},
				tickMarks: {
					active: true,
				},
				scale: 'time',
			},
			dependentAxis: {
				showMinLabel: true,
				tickMarks: {
					active: true,
				},
				tickLabels: {
					verticalAnchor: 'middle',
				},
			},
			tooltip: {
				active: false,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			line: {
				strokeWidth: 4,
				showNodes: false,
			},
			legend: {
				active: true,
				offsetX: 200,
				offsetY: 10,
			},
			io: {
				isConvertedChart: true,
			},
		},
	],
];

export default legacyAreaTemplate;
