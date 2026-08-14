import { mergeWithDefaults } from './helpers';

const smallMultiplesTemplate = [
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
						{ content: 'Chrome', tag: 'th' },
						{ content: 'IE', tag: 'th' },
						{ content: 'Firefox', tag: 'th' },
						{ content: 'Safari', tag: 'th' },
						{ content: 'Edge', tag: 'th' },
						{ content: 'Other', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: '2009', tag: 'td' },
						{ content: '5', tag: 'td' },
						{ content: '55', tag: 'td' },
						{ content: '28', tag: 'td' },
						{ content: '5', tag: 'td' },
						{ content: '0', tag: 'td' },
						{ content: '7', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2012', tag: 'td' },
						{ content: '25', tag: 'td' },
						{ content: '30', tag: 'td' },
						{ content: '22', tag: 'td' },
						{ content: '10', tag: 'td' },
						{ content: '0', tag: 'td' },
						{ content: '13', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2016', tag: 'td' },
						{ content: '45', tag: 'td' },
						{ content: '10', tag: 'td' },
						{ content: '12', tag: 'td' },
						{ content: '14', tag: 'td' },
						{ content: '3', tag: 'td' },
						{ content: '16', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2020', tag: 'td' },
						{ content: '60', tag: 'td' },
						{ content: '2', tag: 'td' },
						{ content: '6', tag: 'td' },
						{ content: '18', tag: 'td' },
						{ content: '6', tag: 'td' },
						{ content: '8', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: '2023', tag: 'td' },
						{ content: '65', tag: 'td' },
						{ content: '0', tag: 'td' },
						{ content: '4', tag: 'td' },
						{ content: '20', tag: 'td' },
						{ content: '5', tag: 'td' },
						{ content: '6', tag: 'td' },
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
			mobile: {
				smallMultiples: {
					columns: 1,
				},
			},
			tablet: {
				smallMultiples: {
					columns: 2,
				},
			},
			layout: {
				type: 'small-multiples',
				orientation: 'vertical',
				width: 640,
				// SVG height is derived from smallMultiples.panelHeight × rows.
				// Kept as a soft fallback for editor overlays that still read layout.height.
				height: 400,
				padding: {
					top: 10,
					left: 30,
					bottom: 30,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'Small Multiples',
				subtitle: 'One panel per data column',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: '',
			},
			independentAxis: {
				tickMarksActive: true,
				scale: 'time',
			},
			dependentAxis: {
				showZero: true,
				tickMarksActive: true,
			},
			tooltip: {
				active: true,
				headerValue: 'independentValue',
				format: '{{row}}: {{value}}',
			},
			legend: {
				active: false,
			},
			line: {
				strokeWidth: 2,
				showPoints: false,
			},
			smallMultiples: {
				panelType: 'line',
				columns: 3,
				panelHeight: 184,
				sharedScale: true,
				axisTreatment: 'minimal',
				emphasisMode: 'own-series',
			},
			dataRender: {
				sortOrder: 'ascending',
				xScale: 'time',
				xFormat: 'YYYY',
			},
			io: {
				isConvertedChart: false,
			},
		}),
	],
];

export default smallMultiplesTemplate;
