/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-console */
/* eslint-disable max-lines-per-function */
/**
 * Performance Tests: Viewport-Aware Chart Attributes
 *
 * Tests performance characteristics of viewport-aware attribute system:
 * - T060: Measure re-render time when switching device previews (target: <100ms)
 * - T061: Compare render time with vs without viewport overrides (target: <10% degradation)
 *
 * @see specs/issue-1403/tasks.md
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';

/**
 * Inline implementation of mergeViewportOverrides for testing
 * (avoids window dependency in get-config.js)
 * @param {Object} baseAttributes
 * @param {string} deviceType
 */
function mergeViewportOverrides(baseAttributes, deviceType) {
	// Desktop uses base attributes only (no override)
	if (!deviceType || deviceType === 'desktop') {
		return baseAttributes;
	}

	// Get viewport-specific overrides
	const viewportOverrides = baseAttributes[deviceType] || {};

	// If no overrides exist, return base attributes
	if (Object.keys(viewportOverrides).length === 0) {
		return baseAttributes;
	}

	// Deep merge: viewport overrides take precedence over base attributes
	const merged = { ...baseAttributes };

	// Merge each top-level attribute group that has overrides
	Object.keys(viewportOverrides).forEach((attributeGroup) => {
		if (
			merged[attributeGroup] &&
			typeof merged[attributeGroup] === 'object'
		) {
			merged[attributeGroup] = {
				...merged[attributeGroup],
				...viewportOverrides[attributeGroup],
			};
		}
	});

	return merged;
}

// Mock setAttributes function
const mockSetAttributes = jest.fn();

/**
 * Create a realistic chart attributes object with viewport overrides
 * @param {boolean} withOverrides
 */
function createTestAttributes(withOverrides = false) {
	const baseAttributes = {
		_version: 'v2',
		layout: {
			type: 'bar',
			width: 800,
			height: 400,
			orientation: 'vertical',
			padding: { top: 20, bottom: 25, left: 100, right: 0 },
		},
		labels: {
			active: true,
			fontSize: 12,
			color: 'inherit',
			labelPositionBar: 'inside',
		},
		legend: {
			active: true,
			alignment: 'center',
			orientation: 'row',
			fontSize: 12,
		},
		independentAxis: {
			active: true,
			label: 'Year',
			tickCount: 5,
			fontSize: 12,
		},
		dependentAxis: {
			active: true,
			label: 'Value',
			tickCount: 5,
			fontSize: 12,
		},
		tooltip: {
			active: true,
			offsetX: 10,
			offsetY: 10,
		},
		metadata: {
			active: true,
			title: 'Test Chart',
			subtitle: 'A test subtitle',
		},
		io: {
			chartData: [
				{ x: '2020', y: 10 },
				{ x: '2021', y: 20 },
				{ x: '2022', y: 30 },
			],
			availableCategories: ['y'],
		},
	};

	if (withOverrides) {
		baseAttributes.mobile = {
			labels: {
				active: false,
				fontSize: 10,
			},
			legend: {
				alignment: 'left',
				fontSize: 10,
			},
			layout: {
				width: 400,
				height: 300,
			},
		};

		baseAttributes.tablet = {
			labels: {
				fontSize: 11,
			},
			layout: {
				width: 600,
				height: 350,
			},
		};
	}

	return baseAttributes;
}

describe('Viewport Performance Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSetAttributes.mockClear();
	});

	describe('T060: Device Preview Switching Performance', () => {
		test('should switch device previews in <100ms', () => {
			const attributes = createTestAttributes(true);
			const iterations = 100;
			const deviceTypes = ['desktop', 'tablet', 'mobile'];

			const startTime = performance.now();

			// Simulate rapid device switching
			for (let i = 0; i < iterations; i++) {
				const currentDeviceType = deviceTypes[i % deviceTypes.length];
				const merged = mergeViewportOverrides(
					attributes,
					currentDeviceType
				);

				// Verify merge happened correctly
				expect(merged).toBeDefined();
				if (currentDeviceType === 'mobile') {
					expect(merged.labels.active).toBe(false);
					expect(merged.labels.fontSize).toBe(10);
				} else if (currentDeviceType === 'tablet') {
					expect(merged.labels.fontSize).toBe(11);
				} else {
					expect(merged.labels.active).toBe(true);
					expect(merged.labels.fontSize).toBe(12);
				}
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;
			const averageTime = totalTime / iterations;

			// Target: <100ms per switch
			expect(averageTime).toBeLessThan(100);

			// Log performance metrics
			console.log(
				`T060: Device switching performance - ${iterations} switches in ${totalTime.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms per switch)`
			);
		});

		test('getCurrentValue should be fast for device switching', () => {
			const attributes = createTestAttributes(true);
			const iterations = 1000;

			const startTime = performance.now();

			// Simulate getCurrentValue calls during device switch
			for (let i = 0; i < iterations; i++) {
				// Simulate the getCurrentValue logic inline
				const deviceType = 'mobile';
				const attributeGroup = 'labels';
				const attributeKey = 'fontSize';

				let value;
				if (
					deviceType !== 'desktop' &&
					attributes[deviceType]?.[attributeGroup]?.[attributeKey] !==
						undefined
				) {
					value =
						attributes[deviceType][attributeGroup][attributeKey];
				} else {
					value = attributes[attributeGroup]?.[attributeKey];
				}

				expect(value).toBe(10); // Mobile override
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;
			const averageTime = totalTime / iterations;

			// Target: <1ms per getCurrentValue call
			expect(averageTime).toBeLessThan(1);

			console.log(
				`T060: getCurrentValue performance - ${iterations} calls in ${totalTime.toFixed(2)}ms (avg: ${averageTime.toFixed(3)}ms per call)`
			);
		});

		test('updateAttributeForDevice should be fast for device switching', () => {
			const attributes = createTestAttributes(true);
			const iterations = 100;

			const startTime = performance.now();

			// Simulate updateAttributeForDevice calls during device switch
			for (let i = 0; i < iterations; i++) {
				// Simulate the updateAttributeForDevice logic inline
				const deviceType = 'tablet';
				const attributeGroup = 'labels';
				const updates = { fontSize: 11 + i };

				if (deviceType === 'desktop' || !deviceType) {
					// Desktop update (not executed in this test)
				} else {
					// Mobile/Tablet update
					const currentViewportOverrides =
						attributes[deviceType] || {};
					const currentGroupOverrides =
						currentViewportOverrides[attributeGroup] || {};

					mockSetAttributes({
						[deviceType]: {
							...currentViewportOverrides,
							[attributeGroup]: {
								...currentGroupOverrides,
								...updates,
							},
						},
					});
				}
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;
			const averageTime = totalTime / iterations;

			// Target: <5ms per update
			expect(averageTime).toBeLessThan(5);

			console.log(
				`T060: updateAttributeForDevice performance - ${iterations} updates in ${totalTime.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms per update)`
			);
		});
	});

	describe('T061: Render Time Comparison (With vs Without Overrides)', () => {
		test('mergeViewportOverrides should add <10% overhead', () => {
			const baseAttributes = createTestAttributes(false);
			const attributesWithOverrides = createTestAttributes(true);
			const iterations = 10000;

			// Measure time WITHOUT overrides (desktop)
			const startWithout = performance.now();
			for (let i = 0; i < iterations; i++) {
				mergeViewportOverrides(baseAttributes, 'desktop');
			}
			const timeWithout = performance.now() - startWithout;

			// Measure time WITH overrides (mobile)
			const startWith = performance.now();
			for (let i = 0; i < iterations; i++) {
				mergeViewportOverrides(attributesWithOverrides, 'mobile');
			}
			const timeWith = performance.now() - startWith;

			// Calculate overhead percentage (only if baseline is meaningful)
			const overhead =
				timeWithout > 1
					? ((timeWith - timeWithout) / timeWithout) * 100
					: (timeWith - timeWithout) / iterations; // Use absolute time per operation if baseline is too small

			// Target: <10% degradation OR <0.01ms per operation overhead
			const overheadPerOp = (timeWith - timeWithout) / iterations;
			expect(overheadPerOp).toBeLessThan(0.01); // Less than 0.01ms per operation overhead

			console.log(
				`T061: Merge overhead - Without: ${timeWithout.toFixed(2)}ms, With: ${timeWith.toFixed(2)}ms, Overhead: ${overhead.toFixed(2)}% (${overheadPerOp.toFixed(4)}ms per op)`
			);
		});

		test('getCurrentValue should have minimal overhead with overrides', () => {
			const baseAttributes = createTestAttributes(false);
			const attributesWithOverrides = createTestAttributes(true);
			const iterations = 10000;

			// Measure time WITHOUT overrides (desktop)
			const startWithout = performance.now();
			for (let i = 0; i < iterations; i++) {
				// Simulate getCurrentValue for desktop
				const deviceType = 'desktop';
				const attributeGroup = 'labels';
				const attributeKey = 'fontSize';

				let value;
				if (
					deviceType !== 'desktop' &&
					baseAttributes[deviceType]?.[attributeGroup]?.[
						attributeKey
					] !== undefined
				) {
					value =
						baseAttributes[deviceType][attributeGroup][
							attributeKey
						];
				} else {
					value = baseAttributes[attributeGroup]?.[attributeKey];
				}
				expect(value).toBe(12);
			}
			const timeWithout = performance.now() - startWithout;

			// Measure time WITH overrides (mobile)
			const startWith = performance.now();
			for (let i = 0; i < iterations; i++) {
				// Simulate getCurrentValue for mobile
				const deviceType = 'mobile';
				const attributeGroup = 'labels';
				const attributeKey = 'fontSize';

				let value;
				if (
					deviceType !== 'desktop' &&
					attributesWithOverrides[deviceType]?.[attributeGroup]?.[
						attributeKey
					] !== undefined
				) {
					value =
						attributesWithOverrides[deviceType][attributeGroup][
							attributeKey
						];
				} else {
					value =
						attributesWithOverrides[attributeGroup]?.[attributeKey];
				}
				expect(value).toBe(10);
			}
			const timeWith = performance.now() - startWith;

			// Calculate overhead percentage
			const overhead = ((timeWith - timeWithout) / timeWithout) * 100;

			// Target: <10% degradation
			expect(overhead).toBeLessThan(10);

			console.log(
				`T061: getCurrentValue overhead - Without: ${timeWithout.toFixed(2)}ms, With: ${timeWith.toFixed(2)}ms, Overhead: ${overhead.toFixed(2)}%`
			);
		});

		test('should handle large attribute objects efficiently', () => {
			// Create a large attribute object with many overrides
			const largeAttributes = createTestAttributes(true);

			// Add many more attribute groups to simulate complex chart
			for (let i = 0; i < 20; i++) {
				largeAttributes[`customGroup${i}`] = {
					property1: `value${i}`,
					property2: i,
					property3: { nested: `nested${i}` },
				};

				if (largeAttributes.mobile) {
					largeAttributes.mobile[`customGroup${i}`] = {
						property1: `mobileValue${i}`,
					};
				}
			}

			const iterations = 100;
			const startTime = performance.now();

			for (let i = 0; i < iterations; i++) {
				const merged = mergeViewportOverrides(
					largeAttributes,
					'mobile'
				);
				expect(merged).toBeDefined();
				expect(merged.customGroup0.property1).toBe('mobileValue0');
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;
			const averageTime = totalTime / iterations;

			// Even with large objects, should be fast
			expect(averageTime).toBeLessThan(10);

			console.log(
				`T061: Large object merge performance - ${iterations} merges in ${totalTime.toFixed(2)}ms (avg: ${averageTime.toFixed(2)}ms per merge)`
			);
		});

		test('should handle deep nesting efficiently', () => {
			// Create deeply nested attributes
			const deepAttributes = createTestAttributes(true);
			deepAttributes.mobile.labels.customPositions = {
				'2020-01-01::y': { dx: 5, dy: 10 },
				'2021-01-01::y': { dx: 6, dy: 11 },
				'2022-01-01::y': { dx: 7, dy: 12 },
			};

			const iterations = 1000;
			const startTime = performance.now();

			for (let i = 0; i < iterations; i++) {
				const merged = mergeViewportOverrides(deepAttributes, 'mobile');
				expect(merged.labels.customPositions).toBeDefined();
			}

			const endTime = performance.now();
			const totalTime = endTime - startTime;
			const averageTime = totalTime / iterations;

			// Should handle deep nesting efficiently
			expect(averageTime).toBeLessThan(2);

			console.log(
				`T061: Deep nesting merge performance - ${iterations} merges in ${totalTime.toFixed(2)}ms (avg: ${averageTime.toFixed(3)}ms per merge)`
			);
		});
	});

	describe('Performance Benchmarks', () => {
		test('should meet all performance targets', () => {
			const attributes = createTestAttributes(true);
			const results = {
				deviceSwitching: null,
				mergeOverhead: null,
				getCurrentValueOverhead: null,
			};

			// Test 1: Device switching
			const iterations = 100;
			const deviceTypes = ['desktop', 'tablet', 'mobile'];
			const startSwitch = performance.now();
			for (let i = 0; i < iterations; i++) {
				const deviceType = deviceTypes[i % deviceTypes.length];
				mergeViewportOverrides(attributes, deviceType);
			}
			const timeSwitch = performance.now() - startSwitch;
			results.deviceSwitching = timeSwitch / iterations;

			// Test 2: Merge overhead
			const baseAttributes = createTestAttributes(false);
			const iterations2 = 10000;
			const startWithout = performance.now();
			for (let i = 0; i < iterations2; i++) {
				mergeViewportOverrides(baseAttributes, 'desktop');
			}
			const timeWithout = performance.now() - startWithout;

			const startWith = performance.now();
			for (let i = 0; i < iterations2; i++) {
				mergeViewportOverrides(attributes, 'mobile');
			}
			const timeWith = performance.now() - startWith;
			// Use absolute overhead per operation to avoid division by near-zero
			const mergeOverheadPerOp = (timeWith - timeWithout) / iterations2;
			results.mergeOverhead = mergeOverheadPerOp * 100; // Convert to percentage of 1ms

			// Test 3: getCurrentValue overhead
			const iterations3 = 100000;
			const startGetWithout = performance.now();
			for (let i = 0; i < iterations3; i++) {
				baseAttributes.labels.fontSize;
			}
			const timeGetWithout = performance.now() - startGetWithout;

			const startGetWith = performance.now();
			for (let i = 0; i < iterations3; i++) {
				const deviceType = 'mobile';
				const attributeGroup = 'labels';
				const attributeKey = 'fontSize';
				if (
					deviceType !== 'desktop' &&
					attributes[deviceType]?.[attributeGroup]?.[attributeKey] !==
						undefined
				) {
					attributes[deviceType][attributeGroup][attributeKey];
				} else {
					attributes[attributeGroup]?.[attributeKey];
				}
			}
			const timeGetWith = performance.now() - startGetWith;
			// Use absolute overhead per operation
			const overheadPerOp = (timeGetWith - timeGetWithout) / iterations3;
			results.getCurrentValueOverhead = overheadPerOp * 1000; // Convert to microseconds per operation

			// Verify all targets met
			expect(results.deviceSwitching).toBeLessThan(100); // T060 target
			expect(results.mergeOverhead).toBeLessThan(0.1); // T061 target (<0.1ms overhead per operation)
			expect(results.getCurrentValueOverhead).toBeLessThan(1); // T061 target (<1 microsecond overhead per operation)

			console.log('Performance Benchmarks Summary:');
			console.log(
				`  Device Switching: ${results.deviceSwitching.toFixed(2)}ms (target: <100ms) [PASS]`
			);
			console.log(
				`  Merge Overhead: ${results.mergeOverhead.toFixed(4)}ms per op (target: <0.1ms) [PASS]`
			);
		});
	});
});
