import { mergeWithDefaults } from './helpers';

const hemicycleTemplate = [
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
						{ content: 'Democrats', tag: 'td' },
						{ content: '215', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Republicans', tag: 'td' },
						{ content: '220', tag: 'td' },
					],
				},
			],
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
				type: 'hemicycle',
				width: 640,
				height: 400,
				padding: {
					top: 20,
					left: 20,
					bottom: 20,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'U.S. House of Representatives',
				subtitle: 'Seats held by each party',
				source: 'Source: Add source note here',
				note: 'Note: Each dot represents one seat',
				tag: '',
			},
			independentAxis: {
				active: false,
			},
			dependentAxis: {
				active: false,
			},
			tooltip: {
				active: false,
				headerValue: 'independentValue',
				format: '{{row}}: {{value}} seats',
			},
			labels: {
				active: false,
				color: 'inherit',
			},
			legend: {
				active: true,
				markerStyle: 'circle',
			},
			dataRender: {
				categories: ['y'],
				sortOrder: 'none',
			},
			hemicycle: {
				seatShape: 'circle',
				seatGap: 0.15,
				rows: null,
				innerRadiusRatio: 0.4,
				totalSeats: null,
				emptyFill: '#E6E7E8',
				stackedBar: {
					active: false,
					height: 16,
					gap: 24,
				},
			},
			io: {
				isConvertedChart: false,
				chartFamily: 'chart',
				colorValue: 'general',
			},
		}),
	],
];

export default hemicycleTemplate;
