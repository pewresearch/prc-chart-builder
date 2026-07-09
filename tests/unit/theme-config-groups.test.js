/**
 * Curated theme.config attribute groups (slice 5).
 */
import { describe, test, expect } from '@jest/globals';
import { CURATED_THEME_CONFIG_GROUPS } from '../../src/chart/utils/theme-config-groups';
import blockMetadata from '../../src/chart/block.json';

describe('CURATED_THEME_CONFIG_GROUPS', () => {
	test('lists only object-type presentation groups from block.json', () => {
		const excluded = new Set([
			'_version',
			'id',
			'mobile',
			'tablet',
			'colors',
			'drawings',
			'customTickLabels',
			'customLegendLabels',
			'customTooltips',
			'dataRender',
			'io',
			'animate',
			'animation',
			'_legacy',
			'_v1Original',
			'_migrationMeta',
		]);

		for (const group of CURATED_THEME_CONFIG_GROUPS) {
			expect(excluded.has(group)).toBe(false);
			expect(blockMetadata.attributes[group]?.type).toBe('object');
		}
	});

	test('includes legend for per-role fontFamily defaults', () => {
		expect(CURATED_THEME_CONFIG_GROUPS).toContain('legend');
		expect(blockMetadata.attributes.legend.default).toHaveProperty(
			'fontFamily'
		);
	});
});
