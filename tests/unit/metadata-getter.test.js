import { describe, test, expect } from '@jest/globals';
import {
	resolveChartMetadata,
	resolveChartMetadataField,
} from '../../src/chart/utils/resolve-metadata';

describe('resolveChartMetadata', () => {
	const baseSlice = {
		currentViewport: 'desktop',
		attributes: {
			metadata: {
				title: 'Bar Chart (reg)',
				subtitle: 'A subtitle',
				note: 'Note text',
				source: 'Source text',
				tag: 'PEW RESEARCH CENTER',
			},
			mobile: {
				metadata: {
					title: 'Bar Chart (mobile)',
				},
			},
			tablet: {
				metadata: {
					title: 'Bar Chart (tablet)',
				},
			},
		},
	};

	test('returns base metadata on desktop', () => {
		expect(resolveChartMetadata(baseSlice).title).toBe('Bar Chart (reg)');
	});

	test('merges viewport metadata overrides on mobile', () => {
		const slice = { ...baseSlice, currentViewport: 'mobile' };
		const metadata = resolveChartMetadata(slice);
		expect(metadata.title).toBe('Bar Chart (mobile)');
		expect(metadata.subtitle).toBe('A subtitle');
	});

	test('prefers config.metadata over attributes when set', () => {
		const slice = {
			...baseSlice,
			config: {
				metadata: {
					title: 'Live update title',
				},
			},
		};
		expect(resolveChartMetadata(slice).title).toBe('Live update title');
	});

	test('config.metadata partial patch preserves sibling fields', () => {
		const slice = {
			...baseSlice,
			currentViewport: 'tablet',
			config: {
				metadata: {
					source: 'Updated source',
				},
			},
		};
		const metadata = resolveChartMetadata(slice);
		expect(metadata.title).toBe('Bar Chart (tablet)');
		expect(metadata.source).toBe('Updated source');
	});

	test('resolveChartMetadataField returns empty string for missing values', () => {
		expect(resolveChartMetadataField(baseSlice, 'missing')).toBe('');
	});

	test('resolveChartMetadataField allows safe HTML and strips scripts', () => {
		const slice = {
			...baseSlice,
			config: {
				metadata: {
					title: '<strong>bold</strong><script>alert(1)</script>',
				},
			},
		};
		expect(resolveChartMetadataField(slice, 'title')).toBe(
			'<strong>bold</strong>'
		);
	});
});
