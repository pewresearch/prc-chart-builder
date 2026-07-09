const legacyBarTemplate = [
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
		'prc-chart-builder/chart',
		{
			_version: 'v2',
			chartType: 'bar',
			chartOrientation: 'horizontal',
			layout: {
				type: 'bar',
				orientation: 'horizontal',
				width: 640,
				height: 400,
				padding: {
					left: 100,
				},
			},
			metadata: {
				active: true,
				tag: '',
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
				active: false,
				headerValue: 'independentValue',
				format: '{{column}}: {{value}}',
			},
			labels: {
				active: true,
				labelPositionDX: 0,
			},
			bar: {
				barWidth: 24,
				barGroupOffset: 28,
			},
			dataRender: {
				sortOrder: 'reverse',
			},
			io: {
				isConvertedChart: true,
				colorValue: 'journalism-main',
			},
		},
	],
];

export default legacyBarTemplate;
