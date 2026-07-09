import { describe, test, expect } from '@jest/globals';
import {
	resolveViewportFromWidth,
	VIEWPORT_BREAKPOINTS,
	getViewportFromWidth,
} from '../../src/chart/utils/view-helpers';

describe('resolveViewportFromWidth — Gutenberg breakpoints', () => {
	test('exports Gutenberg mobile/medium thresholds', () => {
		expect(VIEWPORT_BREAKPOINTS.mobile).toBe(480);
		expect(VIEWPORT_BREAKPOINTS.medium).toBe(782);
	});

	test('mobile below 480px', () => {
		expect(resolveViewportFromWidth(479)).toBe('mobile');
		expect(resolveViewportFromWidth(375)).toBe('mobile');
	});

	test('tablet from 480px through 781px', () => {
		expect(resolveViewportFromWidth(480)).toBe('tablet');
		expect(resolveViewportFromWidth(640)).toBe('tablet');
		expect(resolveViewportFromWidth(781)).toBe('tablet');
	});

	test('desktop from 782px upward', () => {
		expect(resolveViewportFromWidth(782)).toBe('desktop');
		expect(resolveViewportFromWidth(1024)).toBe('desktop');
	});
});

describe('getViewportFromWidth', () => {
	test('returns desktop when window is unavailable', () => {
		expect(getViewportFromWidth()).toBe('desktop');
	});
});
