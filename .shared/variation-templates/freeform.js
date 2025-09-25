const freeformTemplate = [
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
			isConvertedChart: false,
			isStaticChart: false,
			isFreeformChart: true,
			metaTextActive: false,
		},
		[
			[
				'core/group',
				{
					className: 'wp-chart-builder-freeform-chart',
					layout: { type: 'constrained' },
					// Prevent the group from being removed, but allow moving
					lock: {
						remove: true,
						move: false,
					},
				},
				[
					[
						'core/paragraph',
						{
							className: 'is-style-default',
							style: {
								elements: {
									link: {
										color: {
											text: 'var:preset|color|ui-link-color',
										},
									},
								},
								typography: {
									fontStyle: 'normal',
									fontWeight: '800',
									textDecoration: 'underline',
								},
								border: {
									width: '6px',
								},
							},
							backgroundColor: 'ui-white',
							textColor: 'ui-link-color',
							fontSize: 'small',
							fontFamily: 'sans-serif',
							borderColor: 'ui-error',
							content: 'This is a freeform chart!!',
						},
					],
					[
						'core/paragraph',
						{
							content:
								'This chart type is very useful if you want to combine multiple charts into one, all having a common table of data ...',
						},
					],
					[
						'core/paragraph',
						{
							content:
								'<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-ui-mustard-color">It can be anything!</mark>',
						},
					],
					[
						'core/paragraph',
						{
							content: 'Even another chart ...',
						},
					],
					[
						'core/button',
						{
							text: 'Or a button!',
						},
					],
				],
			],
		],
	],
];

export default freeformTemplate;
