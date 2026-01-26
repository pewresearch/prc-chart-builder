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
			_version: 'v2',
			chartType: 'stacked-bar',
			chartOrientation: 'horizontal',
			layout: {
				type: 'stacked-bar',
				orientation: 'horizontal',
				width: 640,
				height: 400,
				padding: {
					left: 100,
				},
			},
			metadata: {
				active: true,
				tag: 'PEW RESEARCH CENTER',
			},
			colors: {
				value: 'journalism-main',
			},
			independentAxis: {
				tickCount: null,
				domainPadding: 16,
				tickLabels: {
					textAnchor: 'end',
					verticalAnchor: 'middle',
				},
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: true,
				headerValue: 'independentValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				active: true,
				labelPositionDX: 0,
			},
			bar: {
				barWidth: 24,
				barGroupOffset: 28,
			},
			io: {
				isConvertedChart: true,
				colorValue: 'journalism-main',
			},
		},
	],
];

export default stackedBarTemplate;
