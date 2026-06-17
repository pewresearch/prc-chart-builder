const tableTemplate = [
	'prc-block/table',
	{
		className: 'chart-builder-data-table',
		isScrollOnPc: true,
		isScrollOnMobile: true,
		sticky: 'first-column',
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
];
export default tableTemplate;
