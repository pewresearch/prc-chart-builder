import { arrayToCSV } from '../../src/controller/utils/csv-export';

describe('csv-export sanitizeCsvField via arrayToCSV', () => {
	it('preserves less-than comparisons in metadata source', () => {
		const csv = arrayToCSV([['x', 'y']], {
			title: 'Title',
			subtitle: 'Subtitle',
			note: 'Note: Add note about the chart',
			source: 'Source: Add source <here <1% note note here',
			tag: 'PEW RESEARCH CENTER',
		});

		expect(csv).toContain('Note: Add note about the chart');
		expect(csv).toContain('Source: Add source <here <1% note note here');
		expect(csv).toContain('PEW RESEARCH CENTER');
	});

	it('strips real HTML tags but keeps comparison operators', () => {
		const csv = arrayToCSV([['a']], {
			title: 'T',
			subtitle: 'S',
			note: '<p>Note with <strong>bold</strong></p>',
			source: 'Share <10% say yes',
			tag: 'Tag',
		});

		expect(csv).toContain('Note with bold');
		expect(csv).toContain('Share <10% say yes');
	});

	it('decodes HTML entities in metadata', () => {
		const csv = arrayToCSV([['a']], {
			title: 'T',
			subtitle: 'S',
			note: 'Note',
			source: 'Source: Add source &lt;here &lt;1% note',
			tag: 'Tag',
		});

		expect(csv).toContain('Source: Add source <here <1% note');
	});

	it('preserves smart quotes and em dashes without character replacement', () => {
		const csv = arrayToCSV([['a']], {
			title: '“Survey Results”',
			subtitle: 'Q1 — overview',
			note: 'Note',
			source: 'Source',
			tag: 'Tag',
		});

		expect(csv).toContain('“Survey Results”');
		expect(csv).toContain('Q1 — overview');
	});
});
