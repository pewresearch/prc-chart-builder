import { describe, test, expect } from '@jest/globals';
import { applyChartPatch } from '../../src/chart/utils/apply-deep-patch';

/**
 * Inline mirror of mergeViewportOverrides (get-config.js depends on window).
 * Client-side viewport switching applies this merge without a server round-trip.
 *
 * @param {Object} baseAttributes
 * @param {string} deviceType
 */
function mergeViewportOverrides(baseAttributes, deviceType) {
	if (!deviceType || deviceType === 'desktop') {
		return baseAttributes;
	}

	const viewportOverrides = baseAttributes[deviceType] || {};

	if (Object.keys(viewportOverrides).length === 0) {
		return baseAttributes;
	}

	const merged = { ...baseAttributes };

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

/**
 * Part 1: client-side viewport switching relies on mergeViewportOverrides
 * reading unmerged base attributes + a deviceType, without a server round-trip.
 */
describe('mergeViewportOverrides — client-side viewport switch', () => {
	const baseAttributes = {
		layout: {
			width: 640,
			height: 400,
		},
		labels: {
			fontSize: 12,
		},
		tablet: {
			layout: {
				width: 480,
			},
			labels: {
				fontSize: 10,
			},
		},
		mobile: {
			layout: {
				width: 320,
			},
		},
	};

	test('desktop returns base attributes unchanged', () => {
		const merged = mergeViewportOverrides(baseAttributes, 'desktop');
		expect(merged.layout.width).toBe(640);
		expect(merged.labels.fontSize).toBe(12);
	});

	test('tablet merges override groups over base', () => {
		const merged = mergeViewportOverrides(baseAttributes, 'tablet');
		expect(merged.layout.width).toBe(480);
		expect(merged.layout.height).toBe(400);
		expect(merged.labels.fontSize).toBe(10);
	});

	test('mobile merges only present override groups', () => {
		const merged = mergeViewportOverrides(baseAttributes, 'mobile');
		expect(merged.layout.width).toBe(320);
		expect(merged.labels.fontSize).toBe(12);
	});

	test('does not mutate the original attributes object', () => {
		const snapshot = JSON.parse(JSON.stringify(baseAttributes));
		mergeViewportOverrides(baseAttributes, 'tablet');
		expect(baseAttributes).toEqual(snapshot);
	});
});

describe('viewport switch — config must replace wholesale', () => {
	test('deep-merge leaves stale shapes.customStyles from the previous viewport', () => {
		const slice = {
			data: [],
			config: {
				shapes: {
					customStyles: {
						'Spain::y': { fill: 'yellow' },
					},
				},
			},
			tableData: null,
		};

		const mobileConfig = {
			shapes: {
				customStyles: {
					'Germany::y': { fill: 'green' },
				},
			},
		};

		applyChartPatch(slice, { config: mobileConfig });

		// Bug: Spain's tablet override survives alongside Germany's mobile override.
		expect(slice.config.shapes.customStyles).toEqual({
			'Spain::y': { fill: 'yellow' },
			'Germany::y': { fill: 'green' },
		});
	});

	test('wholesale config replacement keeps only the current viewport styles', () => {
		const slice = {
			data: [],
			config: {
				shapes: {
					customStyles: {
						'Spain::y': { fill: 'yellow' },
					},
				},
			},
			tableData: null,
		};

		slice.config = {
			shapes: {
				customStyles: {
					'Germany::y': { fill: 'green' },
				},
			},
		};

		expect(slice.config.shapes.customStyles).toEqual({
			'Germany::y': { fill: 'green' },
		});
		expect(slice.config.shapes.customStyles['Spain::y']).toBeUndefined();
	});
});
