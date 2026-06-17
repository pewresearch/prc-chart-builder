import { mergeWithDefaults } from './helpers';

const USACBSAMapTemplate = [
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
						{ content: 'CBSA Name', tag: 'th' },
						{ content: 'CBSA', tag: 'th' },
						{ content: 'Response', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: 'New York-Newark-Jersey City, NY-NJ-PA',
							tag: 'td',
						},
						{ content: '35620', tag: 'td' },
						{ content: '72', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Los Angeles-Long Beach-Anaheim, CA',
							tag: 'td',
						},
						{ content: '31080', tag: 'td' },
						{ content: '58', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Chicago-Naperville-Elgin, IL-IN-WI',
							tag: 'td',
						},
						{ content: '16980', tag: 'td' },
						{ content: '45', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Dallas-Fort Worth-Arlington, TX',
							tag: 'td',
						},
						{ content: '19100', tag: 'td' },
						{ content: '63', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Houston-The Woodlands-Sugar Land, TX',
							tag: 'td',
						},
						{ content: '26420', tag: 'td' },
						{ content: '38', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content:
								'Washington-Arlington-Alexandria, DC-VA-MD-WV',
							tag: 'td',
						},
						{ content: '47900', tag: 'td' },
						{ content: '81', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Miami-Fort Lauderdale-Pompano Beach, FL',
							tag: 'td',
						},
						{ content: '33100', tag: 'td' },
						{ content: '29', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content:
								'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD',
							tag: 'td',
						},
						{ content: '37980', tag: 'td' },
						{ content: '54', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Atlanta-Sandy Springs-Alpharetta, GA',
							tag: 'td',
						},
						{ content: '12060', tag: 'td' },
						{ content: '47', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Phoenix-Mesa-Chandler, AZ', tag: 'td' },
						{ content: '38060', tag: 'td' },
						{ content: '66', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Boston-Cambridge-Newton, MA-NH',
							tag: 'td',
						},
						{ content: '14460', tag: 'td' },
						{ content: '89', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'San Francisco-Oakland-Berkeley, CA',
							tag: 'td',
						},
						{ content: '41860', tag: 'td' },
						{ content: '74', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Riverside-San Bernardino-Ontario, CA',
							tag: 'td',
						},
						{ content: '40140', tag: 'td' },
						{ content: '33', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Seattle-Tacoma-Bellevue, WA', tag: 'td' },
						{ content: '42660', tag: 'td' },
						{ content: '61', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Minneapolis-St. Paul-Bloomington, MN-WI',
							tag: 'td',
						},
						{ content: '33460', tag: 'td' },
						{ content: '52', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'San Diego-Chula Vista-Carlsbad, CA',
							tag: 'td',
						},
						{ content: '41740', tag: 'td' },
						{ content: '44', tag: 'td' },
					],
				},
				{
					cells: [
						{
							content: 'Tampa-St. Petersburg-Clearwater, FL',
							tag: 'td',
						},
						{ content: '45300', tag: 'td' },
						{ content: '37', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Denver-Aurora-Lakewood, CO', tag: 'td' },
						{ content: '19740', tag: 'td' },
						{ content: '78', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'St. Louis, MO-IL', tag: 'td' },
						{ content: '41180', tag: 'td' },
						{ content: '41', tag: 'td' },
					],
				},
				{
					cells: [
						{ content: 'Baltimore-Columbia-Towson, MD', tag: 'td' },
						{ content: '12580', tag: 'td' },
						{ content: '55', tag: 'td' },
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
				type: 'map-usa-cbsa',
				width: 640,
				height: 400,
				padding: {
					left: 20,
					bottom: 30,
					right: 20,
				},
			},
			metadata: {
				active: true,
				title: 'USA CBSA Map',
				subtitle:
					'A subtitle for the chart. NOTE: 5-digit CBSA code required to match data to map.',
				source: 'Source: Add source note here',
				note: 'Note: Add note about the chart',
				tag: 'PEW RESEARCH CENTER',
			},
			colors: {
				value: 'blue-spectrum',
			},
			tooltip: {
				active: false,
				offsetX: 30,
				offsetY: 30,
				headerValue: 'categoryValue',
				format: '{{row}}: {{value}}',
			},
			labels: {
				color: 'contrast',
			},
			legend: {
				active: true,
				markerStyle: 'rect',
			},
			dataRender: {
				categories: ['Response'],
				mapScale: 'threshold',
				mapScaleDomain: [20, 40, 60, 80],
			},
			io: {
				isConvertedChart: false,
				chartFamily: 'map',
				colorValue: 'blue-spectrum',
			},
		}),
	],
];

export default USACBSAMapTemplate;
