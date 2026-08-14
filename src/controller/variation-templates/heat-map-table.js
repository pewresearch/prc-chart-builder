import { mergeWithDefaults } from './helpers';

const PLATFORMS = [
	'YouTube',
	'TikTok',
	'Instagram',
	'Snapchat',
	'Facebook',
	'Twitter',
];

/**
 * Pew-inspired teen social media usage (% who say they ever use each platform).
 * `section` drives Group By / break lines (section titles use annotations).
 */
const DEMO_ROWS = [
	{
		label: 'Total',
		section: '',
		values: [93, 63, 59, 60, 33, 20],
	},
	{
		label: 'Boys',
		section: 'Gender',
		values: [95, 58, 52, 55, 28, 22],
	},
	{
		label: 'Girls',
		section: 'Gender',
		values: [91, 68, 66, 65, 38, 18],
	},
	{
		label: 'White',
		section: 'Race/Ethnicity',
		values: [94, 60, 58, 58, 30, 21],
	},
	{
		label: 'Black',
		section: 'Race/Ethnicity',
		values: [89, 72, 65, 62, 40, 15],
	},
	{
		label: 'Hispanic',
		section: 'Race/Ethnicity',
		values: [92, 68, 61, 61, 35, 17],
	},
	{
		label: 'Ages 13–14',
		section: 'Age',
		values: [88, 55, 48, 52, 25, 12],
	},
	{
		label: 'Ages 15–17',
		section: 'Age',
		values: [95, 68, 66, 65, 38, 24],
	},
	{
		label: 'Urban',
		section: 'Community type',
		values: [91, 70, 62, 63, 36, 19],
	},
	{
		label: 'Suburban',
		section: 'Community type',
		values: [94, 62, 60, 59, 32, 21],
	},
	{
		label: 'Rural',
		section: 'Community type',
		values: [90, 58, 55, 57, 30, 18],
	},
	{
		label: '< $30,000',
		section: 'Household income',
		values: [88, 70, 58, 61, 42, 16],
	},
	{
		label: '$30K–$74,999',
		section: 'Household income',
		values: [93, 64, 60, 60, 34, 19],
	},
	{
		label: '$75,000+',
		section: 'Household income',
		values: [95, 58, 61, 58, 28, 23],
	},
];

const tableBody = DEMO_ROWS.map((row) => ({
	cells: [
		{ content: row.label, tag: 'td' },
		{ content: row.section, tag: 'td' },
		...row.values.map((value) => ({
			content: String(value),
			tag: 'td',
		})),
	],
}));

const heatMapTableTemplate = [
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
						{ content: 'Demographic', tag: 'th' },
						{ content: 'Section', tag: 'th' },
						...PLATFORMS.map((platform) => ({
							content: platform,
							tag: 'th',
						})),
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
				type: 'heat-map-table',
				width: 720,
				height: 560,
				padding: {
					top: 20,
					left: 20,
					bottom: 20,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Teens and social media platform use',
				subtitle:
					'Share of U.S. teens ages 13 to 17 who say they ever use each platform',
				source: 'Source: Pew Research Center survey of U.S. teens, Sept. 26–Oct. 23, 2023',
				note: 'Note: Illustrative sample data for chart builder demo',
				tag: '',
			},
			independentAxis: {
				active: true,
			},
			dependentAxis: {
				active: true,
			},
			tooltip: {
				active: true,
				headerValue: 'independentValue',
				format: '{{row}} · {{column}}: {{value}}%',
			},
			legend: {
				active: true,
				orientation: 'row',
				markerStyle: 'rect',
			},
			labels: {
				active: true,
				color: 'contrast',
				toFixedDecimal: 0,
			},
			dataRender: {
				categories: PLATFORMS,
				sortOrder: 'none',
				mapScale: 'linear',
				mapScaleDomain: [0, 100],
				groupBreaksActive: true,
				groupBreaksCategory: 'Section',
				groupBreaksCategoryValues: [
					'',
					'Gender',
					'Race/Ethnicity',
					'Age',
					'Community type',
					'Household income',
				],
				groupBreaks: {
					breakStyles: {
						height: 14,
					},
					labelStyles: {
						fontStyle: 'italic',
						fill: '#2a2a2a',
					},
				},
			},
			heatMapTable: {
				cellGap: 0,
				cellRadius: 0,
				showValues: true,
				emptyFill: '#F5F5F5',
				rowLabelWidth: 0,
				columnHeaderHeight: 48,
				minCellWidth: 40,
				minCellHeight: 28,
			},
			io: {
				isConvertedChart: false,
				chartFamily: 'chart',
				colorValue: 'blue-spectrum',
			},
		}),
	],
];

export default heatMapTableTemplate;
