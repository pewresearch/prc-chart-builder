import { mergeWithDefaults } from './helpers';

/**
 * Build demo rows for the beeswarm variation template.
 * Heavy clustering at round ages produces tall vertical dodge stacks.
 */
function buildDemoRows() {
	let id = 1;
	const nextLabel = () => `R-${String(id++).padStart(3, '0')}`;

	/**
	 * @param {number}   value
	 * @param {number}   count
	 * @param {string}   group
	 * @param {number[]} sizes
	 */
	const stack = (value, count, group, sizes) =>
		Array.from({ length: count }, (_, index) => ({
			value,
			label: nextLabel(),
			group,
			size: sizes[index % sizes.length],
		}));

	const rows = [
		// Hero stack — 14 respondents all exactly age 35
		...stack(
			35,
			14,
			'30–44',
			[8, 14, 6, 16, 10, 12, 7, 18, 9, 11, 15, 8, 13, 6]
		),
		// Second mega stack at 25
		...stack(25, 11, '18–29', [7, 12, 5, 14, 9, 16, 8, 11, 6, 13, 10]),
		// Third mega stack at 40 — mixed age groups at boundary
		...stack(40, 10, '30–44', [10, 15, 8, 12, 17, 9, 14, 7, 11, 16]),
		...stack(40, 4, '45–64', [8, 13, 10, 12]),
		// Strong stacks at other round ages
		...stack(30, 9, '18–29', [6, 11, 8, 14, 7, 12, 9, 15, 10]),
		...stack(30, 3, '30–44', [9, 13, 11]),
		...stack(45, 9, '45–64', [8, 14, 10, 16, 7, 12, 11, 15, 9]),
		...stack(50, 8, '45–64', [9, 13, 11, 17, 8, 14, 10, 12]),
		...stack(55, 6, '45–64', [10, 14, 8, 12, 16, 9]),
		...stack(60, 7, '65+', [7, 12, 9, 15, 8, 13, 11]),
		// Sparse singles — breathing room between stacks
		{ value: 22, label: nextLabel(), group: '18–29', size: 5 },
		{ value: 27, label: nextLabel(), group: '18–29', size: 7 },
		{ value: 32, label: nextLabel(), group: '30–44', size: 6 },
		{ value: 38, label: nextLabel(), group: '30–44', size: 9 },
		{ value: 42, label: nextLabel(), group: '45–64', size: 8 },
		{ value: 47, label: nextLabel(), group: '45–64', size: 10 },
		{ value: 52, label: nextLabel(), group: '45–64', size: 7 },
		{ value: 57, label: nextLabel(), group: '65+', size: 6 },
		{ value: 63, label: nextLabel(), group: '65+', size: 8 },
		{ value: 68, label: nextLabel(), group: '65+', size: 5 },
	];

	return rows;
}

const DEMO_ROWS = buildDemoRows();

const tableBody = DEMO_ROWS.map((row) => ({
	cells: [
		{ content: row.label, tag: 'td' },
		{ content: String(row.value), tag: 'td' },
		{ content: row.group, tag: 'td' },
		{ content: String(row.size), tag: 'td' },
	],
}));

const beeSwarmTemplate = [
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
						{ content: 'Respondent', tag: 'th' },
						{ content: 'Age', tag: 'th' },
						{ content: 'Age group', tag: 'th' },
						{ content: 'Weight', tag: 'th' },
					],
				},
			],
			body: tableBody,
		},
	],
	[
		'prc-chart-builder/chart',
		mergeWithDefaults({
			_version: 'v2',
			lock: {
				move: true,
				remove: true,
			},
			layout: {
				type: 'bee-swarm',
				width: 640,
				height: 380,
				padding: {
					left: 48,
					bottom: 52,
					top: 28,
					right: 28,
				},
			},
			metadata: {
				active: true,
				title: 'Respondent ages in a national survey sample',
				subtitle:
					'91 respondents; tall vertical stacks appear wherever many share the same age',
				source: 'Source: Illustrative sample data for chart builder demo',
				note: 'Note: 14 respondents are exactly age 35 — swarm spread lets dodge form pill-shaped clusters instead of single-file vertical stacks. Dot size reflects survey weight.',
				tag: '',
			},
			dataRender: {
				x: 'x',
				categories: ['Age'],
				groupBreaksActive: true,
				groupBreaksCategory: 'Age group',
				groupBreaksCategoryValues: [],
				sortOrder: 'none',
			},
			independentAxis: {
				tickMarks: {
					active: true,
				},
				domain: [20, 70],
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: true,
				offsetX: 30,
				offsetY: 70,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			nodes: {
				pointSize: 6,
				sizeCategory: 'Weight',
				minPointSize: 5,
				maxPointSize: 16,
			},
			beeSwarm: {
				layoutMode: 'dodge',
				groupBy: null,
				forceStrength: 0.1,
				swarmSpread: 28,
			},
			legend: {
				active: true,
				markerStyle: 'circle',
			},
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default beeSwarmTemplate;
