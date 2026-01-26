/**
 * Block Deprecation Integration Tests
 *
 * Tests the migration logic for chart blocks from v1 (flat attributes) to v2 (nested attributes).
 * Uses fixture files to validate migration correctness, data integrity, and backward compatibility.
 *
 * Test Strategy:
 * 1. Load fixtures from tests/fixtures/chart-block/
 * 2. Extract v1 flat attributes from fixtures
 * 3. Run migration function
 * 4. Verify migrated attributes match expected structure
 * 5. Check for data loss
 *
 * @see specs/issue-1386/contracts/fixture-format-schema.json
 */

import { describe, test, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Import the migration function directly
import v1Deprecation from '../../src/chart/deprecations/v1';

/**
 * Load all fixture files from the fixtures directory (synchronous)
 *
 * @returns {Array} Array of fixture objects
 */
function loadFixtures() {
	const fixturesDir = path.join(__dirname, '../fixtures/chart-block');

	try {
		const files = fs.readdirSync(fixturesDir);
		const jsonFiles = files.filter((f) => f.endsWith('.json'));

		const fixtures = jsonFiles.map((file) => {
			const content = fs.readFileSync(
				path.join(fixturesDir, file),
				'utf-8'
			);
			const fixture = JSON.parse(content);
			fixture.filename = file;
			return fixture;
		});

		return fixtures;
	} catch (error) {
		console.error('Error loading fixtures:', error);
		throw error;
	}
}

/**
 * Deep comparison of objects
 */
function deepEqual(obj1, obj2, path = '') {
	if (obj1 === obj2) return { equal: true, differences: [] };

	if (typeof obj1 !== typeof obj2) {
		return {
			equal: false,
			differences: [
				`Type mismatch at ${path}: ${typeof obj1} !== ${typeof obj2}`,
			],
		};
	}

	if (obj1 === null || obj2 === null) {
		return {
			equal: false,
			differences: [`Null mismatch at ${path}`],
		};
	}

	if (typeof obj1 !== 'object') {
		return {
			equal: false,
			differences: [`Value mismatch at ${path}: ${obj1} !== ${obj2}`],
		};
	}

	if (Array.isArray(obj1) !== Array.isArray(obj2)) {
		return {
			equal: false,
			differences: [`Array mismatch at ${path}`],
		};
	}

	const differences = [];

	if (Array.isArray(obj1)) {
		if (obj1.length !== obj2.length) {
			differences.push(
				`Array length mismatch at ${path}: ${obj1.length} !== ${obj2.length}`
			);
		}

		const maxLength = Math.max(obj1.length, obj2.length);
		for (let i = 0; i < maxLength; i++) {
			const result = deepEqual(obj1[i], obj2[i], `${path}[${i}]`);
			if (!result.equal) {
				differences.push(...result.differences);
			}
		}
	} else {
		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);
		const allKeys = new Set([...keys1, ...keys2]);

		for (const key of allKeys) {
			const newPath = path ? `${path}.${key}` : key;

			if (!(key in obj1)) {
				differences.push(`Missing key in obj1: ${newPath}`);
			} else if (!(key in obj2)) {
				differences.push(`Extra key in obj1: ${newPath}`);
			} else {
				const result = deepEqual(obj1[key], obj2[key], newPath);
				if (!result.equal) {
					differences.push(...result.differences);
				}
			}
		}
	}

	return {
		equal: differences.length === 0,
		differences,
	};
}

/**
 * Check for data loss during migration
 */
function checkDataLoss(flatAttributes, migratedAttributes) {
	const lostData = [];
	const ignoredKeys = new Set(['_version']); // Keys that are expected to change

	// Check that all non-ignored flat attributes are present somewhere in migrated structure
	Object.keys(flatAttributes).forEach((key) => {
		if (ignoredKeys.has(key)) return;

		// Check if key exists directly in migrated (shouldn't, but just in case)
		if (key in migratedAttributes) return;

		// Check if it's been mapped to a nested object
		// Convert both to JSON strings for deep searching
		const flatValue = JSON.stringify(flatAttributes[key]);
		const migratedJson = JSON.stringify(migratedAttributes);

		if (migratedJson.includes(flatValue)) {
			return; // Found it somewhere
		}

		// Special case: check if it's a simple value transformation
		// (e.g., string to number, array reordering, etc.)
		const simpleValue = flatAttributes[key];
		if (
			typeof simpleValue === 'string' ||
			typeof simpleValue === 'number' ||
			typeof simpleValue === 'boolean'
		) {
			// For simple values, also check if the value itself appears
			if (migratedJson.includes(String(simpleValue))) {
				return;
			}
		}

		// If we get here, the data appears to be lost
		lostData.push({
			key,
			value: flatAttributes[key],
		});
	});

	return lostData;
}

// Load fixtures at module level
const fixtures = loadFixtures();

describe('Chart Block v1 to v2 Migration', () => {
	test('should load test fixtures', () => {
		expect(fixtures.length).toBeGreaterThan(0);
	});

	describe('Migration Function', () => {
		fixtures.forEach((fixture) => {
			test(`${fixture.filename}: should migrate flat attributes to nested structure`, () => {
				// Extract attributes from serialized content (handles multiline JSON and /-->)
				const match = fixture.serializedContent.match(
					/<!-- wp:prc-chart-builder\/chart\s+({[\s\S]*?})\s+\/?-->/
				);
				if (!match) {
					throw new Error(
						`Could not extract attributes from ${fixture.filename}`
					);
				}

				const flatAttributes = JSON.parse(match[1]);

				// Run migration
				const migrated = v1Deprecation.migrate(flatAttributes);

				// Basic structure checks
				expect(migrated).toBeDefined();
				expect(migrated._version).toBe('v2');
				expect(typeof migrated.layout).toBe('object');
				expect(typeof migrated.metadata).toBe('object');
				expect(Array.isArray(migrated.colors)).toBe(true);

				// For production fixtures (minimal expectedMigratedAttributes),
				// do comprehensive structure validation
				const isProductionFixture =
					fixture.filename.includes('production');

				if (isProductionFixture) {
					// Validate all required nested objects exist
					expect(migrated.layout).toBeDefined();
					expect(migrated.metadata).toBeDefined();
					expect(migrated.colors).toBeDefined();
					expect(migrated.plotBands).toBeDefined();
					expect(migrated.independentAxis).toBeDefined();
					expect(migrated.dependentAxis).toBeDefined();
					expect(migrated.tooltip).toBeDefined();
					expect(migrated.legend).toBeDefined();
					expect(migrated.labels).toBeDefined();
					expect(migrated.bar).toBeDefined();
					expect(migrated.line).toBeDefined();
					expect(migrated.dotPlot).toBeDefined();
					expect(migrated.explodedBar).toBeDefined();
					expect(migrated.pie).toBeDefined();
					expect(migrated.nodes).toBeDefined();
					expect(migrated.map).toBeDefined();
					expect(migrated.divergingBar).toBeDefined();
					expect(migrated.diffColumn).toBeDefined();
					expect(migrated.annotations).toBeDefined();
					expect(migrated.dataRender).toBeDefined();
					expect(migrated.animate).toBeDefined();
					expect(migrated.io).toBeDefined();
					expect(migrated._legacy).toBeDefined();

					// Validate key attributes are in correct places
					if (flatAttributes.chartType) {
						expect(migrated.chartType).toBe(
							flatAttributes.chartType
						);
						expect(migrated.layout.type).toBe(
							flatAttributes.chartType
						);
					}

					if (flatAttributes.plotBandsActive) {
						expect(migrated.plotBands.active).toBe(
							flatAttributes.plotBandsActive
						);
					}

					if (flatAttributes.plotBands) {
						expect(migrated.plotBands.bands).toEqual(
							flatAttributes.plotBands
						);
					}

					if (flatAttributes.metaTitle) {
						expect(migrated.metadata.title).toBe(
							flatAttributes.metaTitle
						);
					}

					if (flatAttributes.colorValue) {
						expect(migrated.io.colorValue).toBe(
							flatAttributes.colorValue
						);
					}

					if (flatAttributes.chartData) {
						expect(migrated.io.chartData).toEqual(
							flatAttributes.chartData
						);
					}

					// Validate _legacy is empty (all attributes should be mapped)
					expect(Object.keys(migrated._legacy).length).toBe(0);
				} else {
					// For synthetic fixtures with full expectedMigratedAttributes
					const expected = fixture.expectedMigratedAttributes;

					// Layout
					if (expected.layout) {
						if (expected.layout.type)
							expect(migrated.layout.type).toBe(
								expected.layout.type
							);
						if (expected.layout.orientation)
							expect(migrated.layout.orientation).toBe(
								expected.layout.orientation
							);
						if (expected.layout.width)
							expect(migrated.layout.width).toBe(
								expected.layout.width
							);
						if (expected.layout.height)
							expect(migrated.layout.height).toBe(
								expected.layout.height
							);
					}

					// Metadata
					if (expected.metadata) {
						if (expected.metadata.active !== undefined)
							expect(migrated.metadata.active).toBe(
								expected.metadata.active
							);
						if (expected.metadata.title)
							expect(migrated.metadata.title).toBe(
								expected.metadata.title
							);
						if (expected.metadata.subtitle)
							expect(migrated.metadata.subtitle).toBe(
								expected.metadata.subtitle
							);
					}

					// Axes
					if (expected.independentAxis) {
						if (expected.independentAxis.active !== undefined)
							expect(migrated.independentAxis.active).toBe(
								expected.independentAxis.active
							);
						if (expected.independentAxis.label)
							expect(migrated.independentAxis.label).toBe(
								expected.independentAxis.label
							);
					}

					if (expected.dependentAxis) {
						if (expected.dependentAxis.active !== undefined)
							expect(migrated.dependentAxis.active).toBe(
								expected.dependentAxis.active
							);
						if (expected.dependentAxis.label)
							expect(migrated.dependentAxis.label).toBe(
								expected.dependentAxis.label
							);
					}
				}
			});

			test(`${fixture.filename}: should not lose data during migration`, () => {
				// Extract attributes from serialized content (handles multiline JSON and /-->)
				const match = fixture.serializedContent.match(
					/<!-- wp:prc-chart-builder\/chart\s+({[\s\S]*?})\s+\/?-->/
				);
				if (!match) {
					throw new Error(
						`Could not extract attributes from ${fixture.filename}`
					);
				}

				const flatAttributes = JSON.parse(match[1]);

				const migrated = v1Deprecation.migrate(flatAttributes);
				const lostData = checkDataLoss(flatAttributes, migrated);

				if (lostData.length > 0) {
					const details = lostData
						.map(
							(item) =>
								`${item.key}: ${JSON.stringify(item.value)}`
						)
						.join(', ');
					throw new Error(
						`Data loss in ${fixture.filename}: ${details}`
					);
				}

				expect(lostData.length).toBe(0);
			});
		});
	});

	describe('isEligible Function', () => {
		test('should identify v1 blocks (no _version)', () => {
			const v1Attributes = { chartType: 'bar', width: 640 };
			expect(v1Deprecation.isEligible(v1Attributes)).toBe(true);
		});

		test('should identify v1 blocks (explicit v1)', () => {
			const v1Attributes = { _version: 'v1', chartType: 'bar' };
			expect(v1Deprecation.isEligible(v1Attributes)).toBe(true);
		});

		test('should reject v2 blocks', () => {
			const v2Attributes = { _version: 'v2', layout: {} };
			expect(v1Deprecation.isEligible(v2Attributes)).toBe(false);
		});
	});

	describe('Specific Attribute Mappings', () => {
		test('should map chartType to layout.type', () => {
			const flat = { chartType: 'line', width: 640 };
			const migrated = v1Deprecation.migrate(flat);
			expect(migrated.layout.type).toBe('line');
			expect(migrated.chartType).toBe('line');
		});

		test('should preserve chartType as-is (transformations happen in get-config.js)', () => {
			const flat = { chartType: 'area', width: 640 };
			const migrated = v1Deprecation.migrate(flat);
			// Migration preserves original chartType - get-config.js handles transformation
			expect(migrated.chartType).toBe('area');
			expect(migrated.layout.type).toBe('area');
		});

		test('should map metadata attributes', () => {
			const flat = {
				metaTitle: 'Test Chart',
				metaSubtitle: 'A subtitle',
				metaTextActive: true,
			};
			const migrated = v1Deprecation.migrate(flat);
			expect(migrated.metadata.title).toBe('Test Chart');
			expect(migrated.metadata.subtitle).toBe('A subtitle');
			expect(migrated.metadata.active).toBe(true);
		});

		test('should map custom colors', () => {
			const flat = {
				customColors: ['#FF0000', '#00FF00', '#0000FF'],
			};
			const migrated = v1Deprecation.migrate(flat);
			expect(migrated.colors).toEqual(['#FF0000', '#00FF00', '#0000FF']);
		});

		test('should map WordPress-specific attributes to io', () => {
			const flat = {
				id: 'chart-123',
				colorValue: 'general',
				chartFamily: 'chart',
				isFreeformChart: true,
				staticImageUrl: 'https://example.com/image.png',
			};
			const migrated = v1Deprecation.migrate(flat);
			expect(migrated.io.id).toBe('chart-123');
			expect(migrated.io.colorValue).toBe('general');
			expect(migrated.io.chartFamily).toBe('chart');
			expect(migrated.io.isFreeformChart).toBe(true);
			expect(migrated.io.staticImageUrl).toBe(
				'https://example.com/image.png'
			);
		});

		test('should convert padding attributes to padding object', () => {
			const flat = {
				paddingTop: 10,
				paddingRight: 20,
				paddingBottom: 30,
				paddingLeft: 40,
			};
			const migrated = v1Deprecation.migrate(flat);
			expect(migrated.layout.padding).toEqual({
				top: 10,
				right: 20,
				bottom: 30,
				left: 40,
			});
		});

		test('should map axis attributes to independentAxis and dependentAxis', () => {
			const flat = {
				xLabel: 'Year',
				xScale: 'time',
				yLabel: 'Value',
				yScale: 'linear',
				xMinDomain: 2020,
				xMaxDomain: 2024,
				yMinDomain: 0,
				yMaxDomain: 100,
			};
			const migrated = v1Deprecation.migrate(flat);
			expect(migrated.independentAxis.label).toBe('Year');
			expect(migrated.independentAxis.scale).toBe('time');
			expect(migrated.independentAxis.domain).toEqual([2020, 2024]);
			expect(migrated.dependentAxis.label).toBe('Value');
			expect(migrated.dependentAxis.scale).toBe('linear');
			expect(migrated.dependentAxis.domain).toEqual([0, 100]);
		});
	});

	describe('Performance', () => {
		test('migration should complete in reasonable time', async () => {
			const flat = fixtures[0]?.flatAttributes || { chartType: 'bar' };

			const start = Date.now();
			for (let i = 0; i < 100; i++) {
				v1Deprecation.migrate(flat);
			}
			const duration = Date.now() - start;

			// 100 migrations should complete in < 1 second
			expect(duration).toBeLessThan(1000);
		});
	});
});
